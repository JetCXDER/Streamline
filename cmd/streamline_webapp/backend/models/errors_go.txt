package models

import "fmt"

// ValidationError represents a validation error
type ValidationError struct {
	Code    string
	Message string
	Details string
}

// Error implements the error interface
func (e *ValidationError) Error() string {
	if e.Details != "" {
		return fmt.Sprintf("Validation Error (%s): %s - %s", e.Code, e.Message, e.Details)
	}
	return fmt.Sprintf("Validation Error (%s): %s", e.Code, e.Message)
}

// NewValidationError creates a new ValidationError
func NewValidationError(code, message string, args ...interface{}) *ValidationError {
	var details string
	if len(args) > 0 {
		details = fmt.Sprintf(message, args...)
		message = fmt.Sprintf("validation failed: %s", message)
	}
	
	return &ValidationError{
		Code:    code,
		Message: message,
		Details: details,
	}
}

// AppError represents a general application error
type AppError struct {
	Code       string
	Message    string
	StatusCode int
	Err        error
}

// Error implements the error interface
func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("AppError (%s): %s - %v", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("AppError (%s): %s", e.Code, e.Message)
}

// NewAppError creates a new AppError
func NewAppError(code string, message string, statusCode int, err error) *AppError {
	return &AppError{
		Code:       code,
		Message:    message,
		StatusCode: statusCode,
		Err:        err,
	}
}

// Common errors
var (
	ErrZipNotFound      = NewAppError("zip_not_found", "ZIP file not found", 404, nil)
	ErrInvalidZip       = NewAppError("invalid_zip", "Invalid ZIP file", 400, nil)
	ErrExtractionFailed = NewAppError("extraction_failed", "Extraction failed", 500, nil)
	ErrUnauthorized     = NewAppError("unauthorized", "Unauthorized", 401, nil)
	ErrInternalServer   = NewAppError("internal_error", "Internal server error", 500, nil)
)