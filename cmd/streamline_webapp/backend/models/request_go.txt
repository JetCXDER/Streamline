package models

import "time"

// ListZipRequest represents a request to list files in a ZIP archive
type ListZipRequest struct {
	ZipPath string `json:"zip" validate:"required"`
}

// Validate checks if the ListZipRequest is valid
func (r *ListZipRequest) Validate() error {
	if r.ZipPath == "" {
		return NewValidationError("zip_path_required", "ZIP file path is required")
	}

	if len(r.ZipPath) > 1000 {
		return NewValidationError("zip_path_too_long", "ZIP file path is too long (max 1000 characters)")
	}

	return nil
}

// ExtractZipRequest represents a request to extract files from a ZIP archive
type ExtractZipRequest struct {
	ZipPath string   `json:"zip" validate:"required"`
	Files   []string `json:"files" validate:"required,min=1"`
	OutDir  string   `json:"outDir,omitempty"`
}

// Validate checks if the ExtractZipRequest is valid
func (r *ExtractZipRequest) Validate() error {
	if r.ZipPath == "" {
		return NewValidationError("zip_path_required", "ZIP file path is required")
	}

	if len(r.ZipPath) > 1000 {
		return NewValidationError("zip_path_too_long", "ZIP file path is too long (max 1000 characters)")
	}

	if len(r.Files) == 0 {
		return NewValidationError("files_required", "At least one file must be selected for extraction")
	}

	if len(r.Files) > 10000 {
		return NewValidationError("too_many_files", "Too many files selected (max 10000)")
	}

	// Validate each file path
	for i, file := range r.Files {
		if file == "" {
			return NewValidationError("empty_file_path", "File path cannot be empty")
		}

		if len(file) > 1000 {
			return NewValidationError("file_path_too_long", "File path is too long (max 1000 characters)")
		}

		// Check for path traversal attacks
		if containsPathTraversal(file) {
			return NewValidationError("invalid_file_path", "File path contains invalid characters (file #%d: %s)", i+1, file)
		}
	}

	return nil
}

// CancelRequest represents a request to cancel an ongoing extraction
// This request has no body, but we define it for consistency
type CancelRequest struct {
	// Empty - cancel uses extraction ID from context or global state
}

// Validate checks if the CancelRequest is valid
func (r *CancelRequest) Validate() error {
	// Cancel request has no required fields
	return nil
}

// HealthCheckRequest represents a request for health status
type HealthCheckRequest struct {
	// Empty - health check has no required fields
}

// Validate checks if the HealthCheckRequest is valid
func (r *HealthCheckRequest) Validate() error {
	// Health check has no required fields
	return nil
}

// FileInfo represents information about a file in a ZIP archive
type FileInfo struct {
	Name             string `json:"name"`
	Size             int64  `json:"size"`
	UncompressedSize int64  `json:"uncompressedSize"`
	IsDirectory      bool   `json:"isDirectory"`
}

// ExtractionProgress represents the progress of an extraction operation
type ExtractionProgress struct {
	Current   int    `json:"current"`
	Total     int    `json:"total"`
	Percent   int    `json:"percent"`
	Message   string `json:"message"`
	Timestamp int64  `json:"timestamp"`
}

// ExtractionError represents an error that occurred during extraction
type ExtractionError struct {
	File   string `json:"file"`
	Reason string `json:"reason"`
}

// Helper functions

// containsPathTraversal checks if a path contains characters that could be used for path traversal
func containsPathTraversal(path string) bool {
	// Check for common path traversal patterns
	dangerous := []string{
		"..",
		"~",
		"|",
		";",
		"`",
		"$",
		"&",
		">",
		"<",
	}

	for _, pattern := range dangerous {
		if contains(path, pattern) {
			return true
		}
	}

	return false
}

// contains checks if a string contains a substring
func contains(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// RequestMetadata contains metadata about a request
type RequestMetadata struct {
	RequestID string `json:"requestId"`
	UserEmail string `json:"userEmail"`
	Timestamp int64  `json:"timestamp"`
	IPAddress string `json:"ipAddress"`
}

// NewRequestMetadata creates a new RequestMetadata
func NewRequestMetadata(requestID, userEmail, ipAddress string) *RequestMetadata {
	return &RequestMetadata{
		RequestID: requestID,
		UserEmail: userEmail,
		Timestamp: getCurrentTimestamp(),
		IPAddress: ipAddress,
	}
}

// Helper to get current timestamp in milliseconds
func getCurrentTimestamp() int64 {
	return time.Now().UnixMilli()
}