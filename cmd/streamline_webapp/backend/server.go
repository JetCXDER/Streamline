package main

import (
	streamline_core "Streamline/cmd/streamline_core"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

var currentCancel context.CancelFunc

// List files inside a ZIP
func listZipHandler(w http.ResponseWriter, r *http.Request) {
    zipPath := r.URL.Query().Get("zip")
    if zipPath == "" {
        http.Error(w, "zip parameter required", http.StatusBadRequest)
        return
    }

    files, err := streamline_core.ListZipFiles(zipPath)
    if err != nil {
        http.Error(w, fmt.Sprintf("Failed to list zip: %v", err), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string][]string{"files": files})
}

// Extract selected files with log streaming (SSE)
func extractZipHandler(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Zip   string   `json:"zip"`
        Files []string `json:"files"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid request", http.StatusBadRequest)
        return
    }

    ctx, cancel := context.WithCancel(context.Background())
    currentCancel = cancel
    logChan := make(chan string)

    go func() {
        err := streamline_core.ExtractSelectedFiles(ctx, req.Zip, "./output", req.Files, logChan)
        if err != nil {
            logChan <- fmt.Sprintf("Error: %v", err)
        }
        close(logChan)
    }()

    // SSE headers
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")

    // Stream logs to client
    flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
        return
    }

    for logLine := range logChan {
        fmt.Fprintf(w, "data: %s\n\n", logLine)
        flusher.Flush()
    }
}

// Cancel extraction
func cancelHandler(w http.ResponseWriter, r *http.Request) {
    if currentCancel != nil {
        currentCancel()
        fmt.Fprintln(w, "Aborted")
    } else {
        fmt.Fprintln(w, "No process to cancel")
    }
}

func main() {
    http.HandleFunc("/listZip", listZipHandler)
    http.HandleFunc("/extractZip", extractZipHandler)
    http.HandleFunc("/cancel", cancelHandler)

    fmt.Println("WebApp backend running on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
