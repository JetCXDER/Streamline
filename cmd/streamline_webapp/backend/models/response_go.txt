package models

import "time"

// SuccessResponse is a wrapper for successful API responses
type SuccessResponse struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data,omitempty"`
	Message   string      `json:"message,omitempty"`
	Timestamp int64       `json:"timestamp"`
}

// NewSuccessResponse creates a new SuccessResponse
func NewSuccessResponse(data interface{}, message string) *SuccessResponse {
	return &SuccessResponse{
		Success:   true,
		Data:      data,
		Message:   message,
		Timestamp: time.Now().UnixMilli(),
	}
}

// ErrorResponse is a wrapper for error API responses
type ErrorResponse struct {
	Success   bool   `json:"success"`
	Error     string `json:"error"`
	Code      string `json:"code,omitempty"`
	Message   string `json:"message,omitempty"`
	Status    int    `json:"status"`
	Timestamp int64  `json:"timestamp"`
}

// NewErrorResponse creates a new ErrorResponse
func NewErrorResponse(message string, code string, status int) *ErrorResponse {
	return &ErrorResponse{
		Success:   false,
		Error:     message,
		Code:      code,
		Message:   message,
		Status:    status,
		Timestamp: time.Now().UnixMilli(),
	}
}

// ListZipResponse represents the response for listing files in a ZIP
type ListZipResponse struct {
	Files      []string `json:"files"`
	Count      int      `json:"count"`
	ZipPath    string   `json:"zipPath"`
	Timestamp  int64    `json:"timestamp"`
}

// NewListZipResponse creates a new ListZipResponse
func NewListZipResponse(files []string, zipPath string) *ListZipResponse {
	if files == nil {
		files = []string{}
	}
	return &ListZipResponse{
		Files:     files,
		Count:     len(files),
		ZipPath:   zipPath,
		Timestamp: time.Now().UnixMilli(),
	}
}

// ExtractZipResponse represents the initial response for extraction requests
type ExtractZipResponse struct {
	Status        string `json:"status"`
	ExtractionID  string `json:"extractionId"`
	Message       string `json:"message"`
	Timestamp     int64  `json:"timestamp"`
}

// NewExtractZipResponse creates a new ExtractZipResponse
func NewExtractZipResponse(extractionID string) *ExtractZipResponse {
	return &ExtractZipResponse{
		Status:       "started",
		ExtractionID: extractionID,
		Message:      "Extraction started. Streaming progress...",
		Timestamp:    time.Now().UnixMilli(),
	}
}

// CancelResponse represents the response for cancellation requests
type CancelResponse struct {
	Status       string `json:"status"`
	ExtractionID string `json:"extractionId"`
	Message      string `json:"message"`
	Timestamp    int64  `json:"timestamp"`
}

// NewCancelResponse creates a new CancelResponse
func NewCancelResponse(extractionID string) *CancelResponse {
	return &CancelResponse{
		Status:       "cancelled",
		ExtractionID: extractionID,
		Message:      "Extraction cancelled successfully",
		Timestamp:    time.Now().UnixMilli(),
	}
}

// HealthResponse represents the response for health check requests
type HealthResponse struct {
	Status        string            `json:"status"`
	Timestamp     int64             `json:"timestamp"`
	Uptime        int64             `json:"uptime"`
	Version       string            `json:"version"`
	Authenticated bool              `json:"authenticated"`
	UserEmail     string            `json:"userEmail,omitempty"`
	Memory        MemoryStats       `json:"memory"`
	Goroutines    int               `json:"goroutines"`
}

// MemoryStats represents memory statistics
type MemoryStats struct {
	AllocatedMB      float64 `json:"allocated_mb"`
	TotalAllocatedMB float64 `json:"total_allocated_mb"`
	SystemMB         float64 `json:"system_mb"`
	GCRuns           uint32  `json:"gc_runs"`
}

// NewHealthResponse creates a new HealthResponse
func NewHealthResponse(uptime int64, version string, authenticated bool, userEmail string, memory MemoryStats, goroutines int) *HealthResponse {
	return &HealthResponse{
		Status:        "healthy",
		Timestamp:     time.Now().UnixMilli(),
		Uptime:        uptime,
		Version:       version,
		Authenticated: authenticated,
		UserEmail:     userEmail,
		Memory:        memory,
		Goroutines:    goroutines,
	}
}

// VersionResponse represents the response for version requests
type VersionResponse struct {
	Version    string `json:"version"`
	BuildTime  string `json:"buildTime"`
	GoVersion  string `json:"goVersion"`
	Timestamp  int64  `json:"timestamp"`
}

// NewVersionResponse creates a new VersionResponse
func NewVersionResponse(version, goVersion string) *VersionResponse {
	return &VersionResponse{
		Version:   version,
		BuildTime: time.Now().Format(time.RFC3339),
		GoVersion: goVersion,
		Timestamp: time.Now().UnixMilli(),
	}
}

// ReadinessResponse represents the response for readiness checks
type ReadinessResponse struct {
	Ready     bool  `json:"ready"`
	Timestamp int64 `json:"timestamp"`
}

// NewReadinessResponse creates a new ReadinessResponse
func NewReadinessResponse(ready bool) *ReadinessResponse {
	return &ReadinessResponse{
		Ready:     ready,
		Timestamp: time.Now().UnixMilli(),
	}
}

// LivenessResponse represents the response for liveness checks
type LivenessResponse struct {
	Alive     bool  `json:"alive"`
	Timestamp int64 `json:"timestamp"`
}

// NewLivenessResponse creates a new LivenessResponse
func NewLivenessResponse(alive bool) *LivenessResponse {
	return &LivenessResponse{
		Alive:     alive,
		Timestamp: time.Now().UnixMilli(),
	}
}

// ExtractionCompleteEvent represents a completion event for SSE
type ExtractionCompleteEvent struct {
	Type             string             `json:"type"`
	Status           string             `json:"status"`
	FilesExtracted   int                `json:"filesExtracted"`
	FilesSkipped     int                `json:"filesSkipped"`
	Errors           []ExtractionError  `json:"errors,omitempty"`
	Message          string             `json:"message"`
	Timestamp        int64              `json:"timestamp"`
}

// NewExtractionCompleteEvent creates a new ExtractionCompleteEvent
func NewExtractionCompleteEvent(filesExtracted, filesSkipped int, errors []ExtractionError) *ExtractionCompleteEvent {
	return &ExtractionCompleteEvent{
		Type:           "complete",
		Status:         "finished",
		FilesExtracted: filesExtracted,
		FilesSkipped:   filesSkipped,
		Errors:         errors,
		Message:        "Extraction completed",
		Timestamp:      time.Now().UnixMilli(),
	}
}

// ExtractionErrorEvent represents an error event for SSE
type ExtractionErrorEvent struct {
	Type      string `json:"type"`
	Status    string `json:"status"`
	Error     string `json:"error"`
	Message   string `json:"message"`
	Timestamp int64  `json:"timestamp"`
}

// NewExtractionErrorEvent creates a new ExtractionErrorEvent
func NewExtractionErrorEvent(errorMsg string) *ExtractionErrorEvent {
	return &ExtractionErrorEvent{
		Type:      "error",
		Status:    "failed",
		Error:     errorMsg,
		Message:   "Extraction failed",
		Timestamp: time.Now().UnixMilli(),
	}
}

// PaginatedResponse represents a paginated response
type PaginatedResponse struct {
	Data      interface{} `json:"data"`
	Page      int         `json:"page"`
	PageSize  int         `json:"pageSize"`
	Total     int         `json:"total"`
	TotalPages int        `json:"totalPages"`
	Timestamp int64       `json:"timestamp"`
}

// NewPaginatedResponse creates a new PaginatedResponse
func NewPaginatedResponse(data interface{}, page, pageSize, total int) *PaginatedResponse {
	totalPages := (total + pageSize - 1) / pageSize
	if totalPages < 1 {
		totalPages = 1
	}

	return &PaginatedResponse{
		Data:       data,
		Page:       page,
		PageSize:   pageSize,
		Total:      total,
		TotalPages: totalPages,
		Timestamp:  time.Now().UnixMilli(),
	}
}

// BatchResponse represents a response for batch operations
type BatchResponse struct {
	Success      int          `json:"success"`
	Failed       int          `json:"failed"`
	Total        int          `json:"total"`
	Results      []interface{} `json:"results,omitempty"`
	Errors       []string     `json:"errors,omitempty"`
	Timestamp    int64        `json:"timestamp"`
}

// NewBatchResponse creates a new BatchResponse
func NewBatchResponse(success, failed, total int) *BatchResponse {
	return &BatchResponse{
		Success:   success,
		Failed:    failed,
		Total:     total,
		Results:   []interface{}{},
		Errors:    []string{},
		Timestamp: time.Now().UnixMilli(),
	}
}