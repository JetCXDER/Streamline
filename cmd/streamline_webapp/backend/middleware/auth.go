package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"

	"google.golang.org/api/oauth2/v1"
	"google.golang.org/api/option"
)

// AuthMiddleware validates Google OAuth tokens on incoming requests
// It extracts the token from the Authorization header and verifies it with Google
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract token from Authorization header
		token := extractToken(r)
		if token == "" {
			http.Error(w, "Missing authorization token", http.StatusUnauthorized)
			return
		}

		// Validate the token with Google
		valid, userEmail, err := validateGoogleToken(token)
		if !valid {
			if err != nil {
				log.Printf("Token validation error: %v", err)
			}
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		// Add user email to request context for later use
		ctx := context.WithValue(r.Context(), "userEmail", userEmail)
		r = r.WithContext(ctx)

		// Call the next handler
		next.ServeHTTP(w, r)
	})
}

// OptionalAuthMiddleware validates tokens but doesn't fail if missing
// Useful for endpoints that work with or without authentication
func OptionalAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := extractToken(r)

		if token != "" {
			// If token provided, validate it
			valid, userEmail, err := validateGoogleToken(token)
			if valid {
				// Add user email to context
				ctx := context.WithValue(r.Context(), "userEmail", userEmail)
				r = r.WithContext(ctx)
			} else {
				log.Printf("Token validation failed: %v", err)
				// Don't fail, just continue without user info
			}
		}

		// Call the next handler (with or without user info)
		next.ServeHTTP(w, r)
	})
}

// extractToken extracts the Bearer token from the Authorization header
func extractToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return ""
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return ""
	}

	return parts[1]
}

// validateGoogleToken verifies the token with Google's OAuth2 API
// Returns (isValid, userEmail, error)
func validateGoogleToken(token string) (bool, string, error) {
	ctx := context.Background()

	// Create OAuth2 service
	service, err := oauth2.NewService(ctx, option.WithoutAuthentication())
	if err != nil {
		return false, "", fmt.Errorf("failed to create oauth2 service: %w", err)
	}

	// Validate the token
	tokenInfo, err := service.Tokeninfo().AccessToken(token).Do()
	if err != nil {
		return false, "", fmt.Errorf("token validation failed: %w", err)
	}

	// Check if token is not expired
	if tokenInfo.ExpiresIn <= 0 {
		return false, "", fmt.Errorf("token has expired")
	}

	// Return valid with user's email
	return true, tokenInfo.Email, nil
}

// GetUserEmail retrieves the user email from the request context
// This is set by AuthMiddleware or OptionalAuthMiddleware
func GetUserEmail(r *http.Request) string {
	userEmail, ok := r.Context().Value("userEmail").(string)
	if !ok {
		return ""
	}
	return userEmail
}

// ValidateTokenWithClientID validates token and checks if it matches the expected client ID
// More secure than just checking expiry
func ValidateTokenWithClientID(token string, expectedClientID string) (bool, string, error) {
	ctx := context.Background()

	service, err := oauth2.NewService(ctx, option.WithoutAuthentication())
	if err != nil {
		return false, "", fmt.Errorf("failed to create oauth2 service: %w", err)
	}

	tokenInfo, err := service.Tokeninfo().AccessToken(token).Do()
	if err != nil {
		return false, "", fmt.Errorf("token validation failed: %w", err)
	}

	// Check expiry
	if tokenInfo.ExpiresIn <= 0 {
		return false, "", fmt.Errorf("token has expired")
	}

	// Check if client ID matches (ensures token is for your app)
	if tokenInfo.Audience != expectedClientID {
		return false, "", fmt.Errorf("token client ID mismatch: expected %s, got %s", expectedClientID, tokenInfo.Audience)
	}

	return true, tokenInfo.Email, nil
}