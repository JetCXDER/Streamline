package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"Streamline/cmd/streamline_webapp/backend/handlers"
	"Streamline/cmd/streamline_webapp/backend/middleware"
)

func main() {
	// Load configuration from .env
	cfg, err := LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Setup logging
	if err := setupLogging(cfg); err != nil {
		log.Fatalf("Failed to setup logging: %v", err)
	}

	log.Println("╔════════════════════════════════════╗")
	log.Println("║     STREAMLINE BACKEND SERVER      ║")
	log.Println("╚════════════════════════════════════╝")

	// Log configuration (without exposing secrets)
	cfg.LogConfig()

	// Create HTTP server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      setupRoutes(cfg),
		ReadTimeout:  time.Duration(cfg.TimeoutSeconds) * time.Second,
		WriteTimeout: time.Duration(cfg.TimeoutSeconds) * time.Second,
		IdleTimeout:  time.Duration(cfg.TimeoutSeconds) * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("🚀 Server starting on http://localhost:%s", cfg.Port)
		log.Printf("📍 Allowed Origin: %s", cfg.AllowedOrigins)

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal (graceful shutdown)
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	sig := <-sigChan
	log.Printf("\n📌 Received signal: %v", sig)
	log.Println("🛑 Shutting down server gracefully...")

	// Create shutdown context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}

	log.Println("✅ Server stopped")
}

// setupRoutes configures all HTTP routes with middleware
func setupRoutes(cfg *Config) http.Handler {
	mux := http.NewServeMux()

	// Health check endpoint (public, no auth required)
	mux.HandleFunc("/health", wrapHandler(
		middleware.CORS(cfg.AllowedOrigins)(
			middleware.OptionalAuthMiddleware(
				http.HandlerFunc(handlers.HealthHandler)))))

	// ZIP endpoints (protected by auth)
	mux.HandleFunc("/api/listZip", wrapHandler(
		middleware.CORS(cfg.AllowedOrigins)(
			middleware.OptionalAuthMiddleware(
				http.HandlerFunc(handlers.ListZipHandler)))))

	mux.HandleFunc("/api/extractZip", wrapHandler(
		middleware.CORS(cfg.AllowedOrigins)(
			middleware.OptionalAuthMiddleware(
				http.HandlerFunc(handlers.ExtractZipHandler)))))

	mux.HandleFunc("/api/cancel", wrapHandler(
		middleware.CORS(cfg.AllowedOrigins)(
			middleware.OptionalAuthMiddleware(
				http.HandlerFunc(handlers.CancelHandler)))))

	return mux
}

// wrapHandler wraps an HTTP handler with logging and recovery middleware
func wrapHandler(h http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Log request
		start := time.Now()
		log.Printf("[%s] %s %s from %s", r.Method, r.RequestURI, r.UserAgent(), r.RemoteAddr)

		// Wrap response writer to capture status code
		rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		// Recovery middleware
		defer func() {
			if err := recover(); err != nil {
				log.Printf("❌ PANIC: %v", err)
				rw.WriteHeader(http.StatusInternalServerError)
				fmt.Fprintf(rw, `{"error": "Internal server error"}`)
			}

			// Log response
			duration := time.Since(start)
			log.Printf("✓ [%d] %s %s - %dms", rw.statusCode, r.Method, r.RequestURI, duration.Milliseconds())
		}()

		h.ServeHTTP(rw, r)
	}
}

// responseWriter wraps http.ResponseWriter to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// setupLogging configures the logger to write to both console and file
func setupLogging(cfg *Config) error {
	// Create log directory if it doesn't exist
	if err := os.MkdirAll(cfg.LogDir, 0o755); err != nil {
		return fmt.Errorf("failed to create log directory: %w", err)
	}

	// Create log file with timestamp
	logFile := fmt.Sprintf("%s/streamline_%s.log", cfg.LogDir, time.Now().Format("2006-01-02_15-04-05"))
	f, err := os.OpenFile(logFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		return fmt.Errorf("failed to open log file: %w", err)
	}

	// Log to both console and file
	log.SetOutput(f)
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	return nil
}