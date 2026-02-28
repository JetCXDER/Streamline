package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"runtime"
	"time"

	"Streamline/cmd/streamline_webapp/backend/middleware"
)

// HealthHandler handles health check requests
// This endpoint is used by monitoring systems to verify the server is running
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	// Only allow GET requests
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user email if authenticated (optional for health check)
	userEmail := middleware.GetUserEmail(r)

	// Get runtime stats
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	// Build health response
	health := map[string]interface{}{
		"status":        "healthy",
		"timestamp":     time.Now().Unix(),
		"uptime":        getUptime(),
		"version":       "v0.1.0",
		"authenticated": userEmail != "",
		"userEmail":     userEmail,
		"memory": map[string]interface{}{
			"allocated_mb":       float64(m.Alloc) / 1024 / 1024,
			"total_allocated_mb": float64(m.TotalAlloc) / 1024 / 1024,
			"system_mb":          float64(m.Sys) / 1024 / 1024,
			"gc_runs":            m.NumGC,
		},
		"goroutines": runtime.NumGoroutine(),
	}

	// Set response headers
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-cache")
	w.WriteHeader(http.StatusOK)

	// Encode response
	if err := json.NewEncoder(w).Encode(health); err != nil {
		log.Printf("Error encoding health response: %v", err)
		return
	}
}

// ReadinessHandler checks if the server is ready to accept requests
// More strict than health check - can be used for load balancer readiness probes
func ReadinessHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Simple readiness check
	readiness := map[string]interface{}{
		"ready":     true,
		"timestamp": time.Now().Unix(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(readiness); err != nil {
		log.Printf("Error encoding readiness response: %v", err)
		return
	}
}

// LivenessHandler checks if the server is still running
// Can be used for container orchestration liveness probes
func LivenessHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Simple liveness check
	liveness := map[string]interface{}{
		"alive":     true,
		"timestamp": time.Now().Unix(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(liveness); err != nil {
		log.Printf("Error encoding liveness response: %v", err)
		return
	}
}

// startTime tracks when the server started
var startTime = time.Now()

// getUptime returns the server uptime in seconds
func getUptime() int64 {
	return int64(time.Since(startTime).Seconds())
}

// VersionHandler returns version information
func VersionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	version := map[string]interface{}{
		"version":   "v0.1.0",
		"buildTime": time.Now().Format(time.RFC3339),
		"goVersion": runtime.Version(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(version); err != nil {
		log.Printf("Error encoding version response: %v", err)
		return
	}
}