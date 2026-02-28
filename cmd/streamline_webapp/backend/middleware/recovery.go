package middleware

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"runtime"
	"runtime/debug"
	"strings"
	"time"
)

// RecoveryMiddleware catches panics and converts them to 500 error responses
// This prevents the server from crashing when a handler panics
func RecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				// Log the panic with full details
				logPanic(r, err)

				// Send error response to client
				sendPanicResponse(w)
			}
		}()

		// Call the next handler
		next.ServeHTTP(w, r)
	})
}

// SafeHandler wraps a handler function with panic recovery
// Useful for wrapping individual handlers
func SafeHandler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				logPanic(r, err)
				sendPanicResponse(w)
			}
		}()

		handler(w, r)
	}
}

// logPanic logs panic details with full stack trace
func logPanic(r *http.Request, panicValue interface{}) {
	log.Println("════════════════════════════════════════════════════════════")
	log.Println("🔴 PANIC OCCURRED")
	log.Println("════════════════════════════════════════════════════════════")

	// Log request info
	log.Printf("Time: %s", time.Now().Format(time.RFC3339))
	log.Printf("Method: %s", r.Method)
	log.Printf("Path: %s", r.RequestURI)
	log.Printf("Remote Address: %s", r.RemoteAddr)
	log.Printf("User-Agent: %s", r.UserAgent())

	// Log panic details
	log.Printf("Panic Value: %v", panicValue)
	log.Printf("Panic Type: %T", panicValue)

	// Log stack trace
	log.Println("────────────────────────────────────────────────────────────")
	log.Println("Stack Trace:")
	log.Println("────────────────────────────────────────────────────────────")
	log.Println(string(debug.Stack()))

	// Log goroutine info
	log.Println("────────────────────────────────────────────────────────────")
	log.Printf("Active Goroutines: %d", runtime.NumGoroutine())
	log.Println("────────────────────────────────────────────────────────────")

	// Log memory stats
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	log.Printf("Memory Allocated: %.2f MB", float64(m.Alloc)/1024/1024)
	log.Printf("Total Memory Allocated: %.2f MB", float64(m.TotalAlloc)/1024/1024)
	log.Printf("System Memory: %.2f MB", float64(m.Sys)/1024/1024)

	log.Println("════════════════════════════════════════════════════════════")
}

// sendPanicResponse sends a JSON error response for panic
func sendPanicResponse(w http.ResponseWriter) {
	// Only set status if headers haven't been written yet
	if !headerWritten(w) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
	}

	// Send error response
	response := map[string]interface{}{
		"success":   false,
		"error":     "Internal Server Error",
		"code":      "internal_error",
		"message":   "An unexpected error occurred. Please try again later.",
		"timestamp": time.Now().UnixMilli(),
		"status":    http.StatusInternalServerError,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to send panic response: %v", err)
	}
}

// headerWritten checks if response headers have been written
func headerWritten(w http.ResponseWriter) bool {
	// This is a simple check - we can't definitively know if headers were written
	// but we can try to write a header and see if it fails
	// For now, we assume headers haven't been written
	return false
}

// ValidateMiddleware validates request data and recovers from panics during validation
func ValidateMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("Validation panic: %v", err)
				sendBadRequestResponse(w, "Invalid request data")
			}
		}()

		next.ServeHTTP(w, r)
	})
}

// sendBadRequestResponse sends a JSON error response for bad request
func sendBadRequestResponse(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)

	response := map[string]interface{}{
		"success":   false,
		"error":     "Bad Request",
		"code":      "bad_request",
		"message":   message,
		"timestamp": time.Now().UnixMilli(),
		"status":    http.StatusBadRequest,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to send bad request response: %v", err)
	}
}

// PanicHandler is a custom panic handler that can be used with defer
type PanicHandler struct {
	w http.ResponseWriter
	r *http.Request
}

// NewPanicHandler creates a new PanicHandler
func NewPanicHandler(w http.ResponseWriter, r *http.Request) *PanicHandler {
	return &PanicHandler{w: w, r: r}
}

// Handle recovers from panic and sends error response
func (ph *PanicHandler) Handle() {
	if err := recover(); err != nil {
		logPanic(ph.r, err)
		sendPanicResponse(ph.w)
	}
}

// HandleWithMessage recovers from panic and sends custom error message
func (ph *PanicHandler) HandleWithMessage(message string) {
	if err := recover(); err != nil {
		logPanic(ph.r, err)
		sendCustomErrorResponse(ph.w, message, http.StatusInternalServerError)
	}
}

// sendCustomErrorResponse sends a custom JSON error response
func sendCustomErrorResponse(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := map[string]interface{}{
		"success":   false,
		"error":     http.StatusText(statusCode),
		"message":   message,
		"timestamp": time.Now().UnixMilli(),
		"status":    statusCode,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to send error response: %v", err)
	}
}

// RecoveryWithAlerts provides recovery with alerting capabilities
type RecoveryWithAlerts struct {
	alertChannels []chan string
}

// NewRecoveryWithAlerts creates a new RecoveryWithAlerts
func NewRecoveryWithAlerts(alertChannels ...chan string) *RecoveryWithAlerts {
	return &RecoveryWithAlerts{
		alertChannels: alertChannels,
	}
}

// Middleware returns a middleware that recovers from panics and sends alerts
func (rwa *RecoveryWithAlerts) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				logPanic(r, err)
				
				// Send alert to all alert channels
				alertMsg := fmt.Sprintf("PANIC: %v on %s %s", err, r.Method, r.RequestURI)
				for _, alertChan := range rwa.alertChannels {
					select {
					case alertChan <- alertMsg:
					default:
						log.Printf("Alert channel full, skipping alert: %s", alertMsg)
					}
				}

				sendPanicResponse(w)
			}
		}()

		next.ServeHTTP(w, r)
	})
}

// StackTrace represents a panic stack trace
type StackTrace struct {
	PanicValue string `json:"panicValue"`
	Frames     []Frame `json:"frames"`
	Timestamp  int64  `json:"timestamp"`
}

// Frame represents a single stack frame
type Frame struct {
	Function string `json:"function"`
	File     string `json:"file"`
	Line     int    `json:"line"`
}

// ParseStackTrace parses a stack trace from debug.Stack()
func ParseStackTrace(stackBytes []byte) StackTrace {
	trace := StackTrace{
		Timestamp: time.Now().UnixMilli(),
		Frames:    []Frame{},
	}

	lines := strings.Split(string(stackBytes), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Parse goroutine info
		if strings.HasPrefix(line, "goroutine") {
			trace.PanicValue = line
			continue
		}

		// Parse frame info
		if !strings.HasPrefix(line, "/") && !strings.HasPrefix(line, "C:\\") {
			continue
		}

		// Extract function and file:line
		parts := strings.Split(line, " ")
		if len(parts) >= 2 {
			frame := Frame{
				Function: parts[0],
				File:     parts[1],
			}

			// Try to parse line number
			if len(parts) >= 3 {
				fmt.Sscanf(parts[2], "%d", &frame.Line)
			}

			trace.Frames = append(trace.Frames, frame)
		}
	}

	return trace
}

// DeferRecover is a helper function for defer-based recovery
func DeferRecover(w http.ResponseWriter, r *http.Request) {
	if err := recover(); err != nil {
		logPanic(r, err)
		sendPanicResponse(w)
	}
}