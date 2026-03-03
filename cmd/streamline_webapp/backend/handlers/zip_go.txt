package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	streamline_core "Streamline/cmd/streamline_core"
	"Streamline/cmd/streamline_webapp/backend/middleware"
	"Streamline/cmd/streamline_webapp/backend/models"
)

// ExtractionManager manages ongoing extractions to prevent conflicts
type ExtractionManager struct {
	mu          sync.RWMutex
	extractions map[string]context.CancelFunc
}

// Global extraction manager
var extractionManager = &ExtractionManager{
	extractions: make(map[string]context.CancelFunc),
}

// ListZipHandler handles requests to list files in a ZIP archive
func ListZipHandler(w http.ResponseWriter, r *http.Request) {
	// Validate request method
	if r.Method != http.MethodGet && r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get authenticated user
	userEmail := middleware.GetUserEmail(r)
	log.Printf("ListZip requested by: %s", userEmail)

	// Parse query parameters or JSON body
	var req models.ListZipRequest

	if r.Method == http.MethodGet {
		// GET request - use query parameter
		zipPath := r.URL.Query().Get("zip")
		if zipPath == "" {
			sendErrorResponse(w, "Missing 'zip' query parameter", http.StatusBadRequest)
			return
		}
		req.ZipPath = zipPath
	} else {
		// POST request - use JSON body
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			sendErrorResponse(w, "Invalid JSON request body", http.StatusBadRequest)
			return
		}
	}

	// Validate request
	if err := req.Validate(); err != nil {
		sendErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	// List files in ZIP
	files, err := streamline_core.ListZipFiles(req.ZipPath)
	if err != nil {
		log.Printf("Error listing ZIP files: %v", err)
		sendErrorResponse(w, fmt.Sprintf("Failed to list ZIP files: %v", err), http.StatusInternalServerError)
		return
	}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	response := map[string]interface{}{
		"files": files,
		"count": len(files),
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding response: %v", err)
	}
}

// ExtractZipHandler handles requests to extract files from a ZIP archive
func ExtractZipHandler(w http.ResponseWriter, r *http.Request) {
	// Validate request method
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get authenticated user
	userEmail := middleware.GetUserEmail(r)
	log.Printf("ExtractZip requested by: %s", userEmail)

	// Parse JSON request
	var req models.ExtractZipRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendErrorResponse(w, "Invalid JSON request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if err := req.Validate(); err != nil {
		sendErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Set default output directory if not provided
	if req.OutDir == "" {
		req.OutDir = "./extracted_files"
	}

	// Create context with cancellation
	ctx, cancel := context.WithCancel(context.Background())
	
	// Generate extraction ID (use user email + timestamp)
	extractionID := fmt.Sprintf("%s_%d", userEmail, getCurrentTimestamp())
	
	// Store cancellation function
	extractionManager.mu.Lock()
	extractionManager.extractions[extractionID] = cancel
	extractionManager.mu.Unlock()

	// Cleanup on completion
	defer func() {
		extractionManager.mu.Lock()
		delete(extractionManager.extractions, extractionID)
		extractionManager.mu.Unlock()
	}()

	log.Printf("Starting extraction [%s]: %s -> %s (%d files)", extractionID, req.ZipPath, req.OutDir, len(req.Files))

	// Create log channel for streaming
	logChan := make(chan string, 100)

	// Start extraction in background
	go func() {
		defer close(logChan)

		// Perform extraction
		err := streamline_core.ExtractSelectedFiles(ctx, req.ZipPath, req.OutDir, req.Files, logChan)
		if err != nil {
			logChan <- fmt.Sprintf("ERROR: %v", err)
			log.Printf("Extraction [%s] failed: %v", extractionID, err)
		} else {
			log.Printf("Extraction [%s] completed successfully", extractionID)
		}
	}()

	// Setup SSE streaming
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Extraction-ID", extractionID)
	w.WriteHeader(http.StatusOK)

	// Flush headers
	flusher, ok := w.(http.Flusher)
	if !ok {
		sendErrorResponse(w, "Streaming not supported", http.StatusInternalServerError)
		return
	}
	flusher.Flush()

	// Stream logs to client
	lineCount := 0
	for logLine := range logChan {
		// Send as SSE message
		fmt.Fprintf(w, "data: %s\n\n", logLine)
		flusher.Flush()

		lineCount++
		if lineCount%10 == 0 {
			log.Printf("Streaming log line %d for extraction [%s]", lineCount, extractionID)
		}
	}

	log.Printf("Extraction [%s] stream completed (%d lines)", extractionID, lineCount)
}

// CancelHandler handles requests to cancel an ongoing extraction
func CancelHandler(w http.ResponseWriter, r *http.Request) {
	// Validate request method
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get authenticated user
	userEmail := middleware.GetUserEmail(r)
	log.Printf("Cancel requested by: %s", userEmail)

	// Get extraction ID from query parameter or body
	var req struct {
		ExtractionID string `json:"extractionId"`
	}

	extractionID := r.URL.Query().Get("extractionId")
	if extractionID == "" {
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil && req.ExtractionID != "" {
			extractionID = req.ExtractionID
		}
	}

	if extractionID == "" {
		sendErrorResponse(w, "Missing extractionId parameter", http.StatusBadRequest)
		return
	}

	// Find and cancel the extraction
	extractionManager.mu.Lock()
	cancel, exists := extractionManager.extractions[extractionID]
	extractionManager.mu.Unlock()

	if !exists {
		sendErrorResponse(w, fmt.Sprintf("Extraction not found: %s", extractionID), http.StatusNotFound)
		return
	}

	// Cancel the extraction
	log.Printf("Cancelling extraction: %s", extractionID)
	cancel()

	// Send success response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	response := map[string]interface{}{
		"status":        "cancelled",
		"extractionId":  extractionID,
		"message":       "Extraction cancelled successfully",
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding cancel response: %v", err)
	}
}

// Helper functions

// sendErrorResponse sends a JSON error response
func sendErrorResponse(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	errorResponse := map[string]interface{}{
		"error":  true,
		"status": statusCode,
		"message": message,
	}

	if err := json.NewEncoder(w).Encode(errorResponse); err != nil {
		log.Printf("Error encoding error response: %v", err)
	}
}

// getCurrentTimestamp returns current Unix timestamp in milliseconds
func getCurrentTimestamp() int64 {
	return time.Now().UnixMilli()
}