package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// LoggingMiddleware logs HTTP requests and responses with performance metrics
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Start timing
		start := time.Now()

		// Create a custom response writer to capture status and body
		rw := &responseLogger{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
			body:           &bytes.Buffer{},
		}

		// Log request
		logRequest(r)

		// Call the next handler
		next.ServeHTTP(rw, r)

		// Log response
		duration := time.Since(start)
		logResponse(r, rw, duration)
	})
}

// responseLogger wraps http.ResponseWriter to capture status code and body
type responseLogger struct {
	http.ResponseWriter
	statusCode int
	body       *bytes.Buffer
}

// WriteHeader captures the status code
func (rw *responseLogger) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// Write captures the response body
func (rw *responseLogger) Write(b []byte) (int, error) {
	rw.body.Write(b)
	return rw.ResponseWriter.Write(b)
}

// logRequest logs incoming HTTP request details
func logRequest(r *http.Request) {
	// Extract useful request info
	method := r.Method
	path := r.RequestURI
	remoteAddr := r.RemoteAddr
	userAgent := r.UserAgent()
	contentType := r.Header.Get("Content-Type")
	authorization := "none"

	// Don't log the actual token for security
	if r.Header.Get("Authorization") != "" {
		authorization = "Bearer <token>"
	}

	log.Printf(
		"[REQUEST] %s %s | Remote: %s | Auth: %s | Content-Type: %s | User-Agent: %s",
		method,
		path,
		remoteAddr,
		authorization,
		contentType,
		userAgent,
	)

	// Log request body if it's JSON (for debugging)
	if r.Method == http.MethodPost || r.Method == http.MethodPut {
		if isJSONContent(contentType) {
			body, err := io.ReadAll(r.Body)
			if err == nil {
				// Restore body for handler to read
				r.Body = io.NopCloser(bytes.NewBuffer(body))

				// Log body (limit to 500 chars for safety)
				bodyStr := string(body)
				if len(bodyStr) > 500 {
					bodyStr = bodyStr[:500] + "..."
				}
				log.Printf("[REQUEST BODY] %s", bodyStr)
			}
		}
	}
}

// logResponse logs HTTP response details and performance metrics
func logResponse(r *http.Request, rw *responseLogger, duration time.Duration) {
	method := r.Method
	path := r.RequestURI
	statusCode := rw.statusCode
	statusText := http.StatusText(statusCode)
	durationMs := duration.Milliseconds()

	// Determine log level based on status code
	logLevel := "INFO"
	if statusCode >= 400 && statusCode < 500 {
		logLevel = "WARN"
	} else if statusCode >= 500 {
		logLevel = "ERROR"
	}

	// Format status code with color (in logs)
	statusStr := fmt.Sprintf("%d", statusCode)

	log.Printf(
		"[RESPONSE] %s | %s %s | Status: %s (%s) | Duration: %dms | Size: %d bytes",
		logLevel,
		method,
		path,
		statusStr,
		statusText,
		durationMs,
		rw.body.Len(),
	)

	// Log slow requests (> 1 second)
	if duration > 1*time.Second {
		log.Printf("[SLOW REQUEST] %s %s took %dms", method, path, durationMs)
	}

	// Log response body if it's an error (for debugging)
	if statusCode >= 400 && rw.body.Len() > 0 {
		bodyStr := rw.body.String()
		if len(bodyStr) > 500 {
			bodyStr = bodyStr[:500] + "..."
		}
		log.Printf("[ERROR RESPONSE] %s", bodyStr)
	}
}

// isJSONContent checks if content type is JSON
func isJSONContent(contentType string) bool {
	return contentType == "application/json" || 
	       contentType == "application/json; charset=utf-8"
}

// DetailedLoggingMiddleware provides more detailed logging with request/response bodies
func DetailedLoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Log detailed request info
		logDetailedRequest(r)

		rw := &responseLogger{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
			body:           &bytes.Buffer{},
		}

		next.ServeHTTP(rw, r)

		duration := time.Since(start)
		logDetailedResponse(r, rw, duration)
	})
}

// logDetailedRequest logs comprehensive request details
func logDetailedRequest(r *http.Request) {
	log.Println("════════════════════════════════════════════════════════════")
	log.Printf("REQUEST: %s %s", r.Method, r.RequestURI)
	log.Println("────────────────────────────────────────────────────────────")
	log.Printf("Protocol: %s", r.Proto)
	log.Printf("Remote Address: %s", r.RemoteAddr)
	log.Printf("Host: %s", r.Host)
	log.Printf("User-Agent: %s", r.UserAgent())
	log.Printf("Content-Type: %s", r.Header.Get("Content-Type"))
	log.Printf("Content-Length: %d", r.ContentLength)

	// Log headers (excluding sensitive ones)
	log.Println("Headers:")
	for key, values := range r.Header {
		// Skip sensitive headers
		if key == "Authorization" || key == "Cookie" {
			log.Printf("  %s: <redacted>", key)
		} else {
			for _, value := range values {
				log.Printf("  %s: %s", key, value)
			}
		}
	}

	// Log query parameters
	if r.URL.RawQuery != "" {
		log.Printf("Query Params: %s", r.URL.RawQuery)
	}

	// Log request body
	if r.Method == http.MethodPost || r.Method == http.MethodPut || r.Method == http.MethodPatch {
		if isJSONContent(r.Header.Get("Content-Type")) {
			body, err := io.ReadAll(r.Body)
			if err == nil {
				r.Body = io.NopCloser(bytes.NewBuffer(body))
				
				var prettyJSON bytes.Buffer
				if err := json.Indent(&prettyJSON, body, "", "  "); err == nil {
					log.Printf("Body:\n%s", prettyJSON.String())
				} else {
					log.Printf("Body: %s", string(body))
				}
			}
		}
	}
	log.Println("════════════════════════════════════════════════════════════")
}

// logDetailedResponse logs comprehensive response details
func logDetailedResponse(r *http.Request, rw *responseLogger, duration time.Duration) {
	log.Println("════════════════════════════════════════════════════════════")
	log.Printf("RESPONSE: %s %s", r.Method, r.RequestURI)
	log.Println("────────────────────────────────────────────────────────────")
	log.Printf("Status Code: %d (%s)", rw.statusCode, http.StatusText(rw.statusCode))
	log.Printf("Duration: %dms", duration.Milliseconds())
	log.Printf("Response Size: %d bytes", rw.body.Len())

	// Log response headers
	log.Println("Headers:")
	for key, values := range rw.Header() {
		for _, value := range values {
			log.Printf("  %s: %s", key, value)
		}
	}

	// Log response body
	if rw.body.Len() > 0 {
		bodyStr := rw.body.String()
		
		// Try to pretty-print JSON
		var prettyJSON bytes.Buffer
		if err := json.Indent(&prettyJSON, []byte(bodyStr), "", "  "); err == nil {
			log.Printf("Body:\n%s", prettyJSON.String())
		} else {
			// If not JSON, just log as-is (truncated if too long)
			if len(bodyStr) > 1000 {
				log.Printf("Body: %s...", bodyStr[:1000])
			} else {
				log.Printf("Body: %s", bodyStr)
			}
		}
	}

	// Summary
	if duration > 1*time.Second {
		log.Printf("⚠️  SLOW REQUEST: %dms", duration.Milliseconds())
	}
	if rw.statusCode >= 500 {
		log.Printf("🔴 SERVER ERROR: %d", rw.statusCode)
	} else if rw.statusCode >= 400 {
		log.Printf("🟡 CLIENT ERROR: %d", rw.statusCode)
	}

	log.Println("════════════════════════════════════════════════════════════")
}

// PerformanceMetrics tracks performance statistics
type PerformanceMetrics struct {
	TotalRequests  int64
	TotalErrors    int64
	TotalDuration  int64 // in milliseconds
	AverageDuration float64
	SlowestRequest  int64
}

// MetricsLogger tracks and logs performance metrics
type MetricsLogger struct {
	metrics PerformanceMetrics
}

// NewMetricsLogger creates a new MetricsLogger
func NewMetricsLogger() *MetricsLogger {
	return &MetricsLogger{
		metrics: PerformanceMetrics{},
	}
}

// LogMetrics returns middleware that tracks performance metrics
func (ml *MetricsLogger) LogMetrics(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		rw := &responseLogger{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
			body:           &bytes.Buffer{},
		}

		next.ServeHTTP(rw, r)

		duration := time.Since(start).Milliseconds()

		// Update metrics
		ml.metrics.TotalRequests++
		if rw.statusCode >= 400 {
			ml.metrics.TotalErrors++
		}
		ml.metrics.TotalDuration += duration
		ml.metrics.AverageDuration = float64(ml.metrics.TotalDuration) / float64(ml.metrics.TotalRequests)

		if duration > ml.metrics.SlowestRequest {
			ml.metrics.SlowestRequest = duration
		}

		// Log metrics periodically (every 100 requests)
		if ml.metrics.TotalRequests%100 == 0 {
			ml.LogPeriodicMetrics()
		}
	})
}

// LogPeriodicMetrics logs aggregated metrics
func (ml *MetricsLogger) LogPeriodicMetrics() {
	log.Println("────────────────────────────────────────────────────────────")
	log.Printf("📊 METRICS (Last 100 requests)")
	log.Printf("   Total Requests: %d", ml.metrics.TotalRequests)
	log.Printf("   Total Errors: %d", ml.metrics.TotalErrors)
	log.Printf("   Average Duration: %.2fms", ml.metrics.AverageDuration)
	log.Printf("   Slowest Request: %dms", ml.metrics.SlowestRequest)
	log.Println("────────────────────────────────────────────────────────────")
}