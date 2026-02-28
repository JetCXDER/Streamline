package main

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the Streamline backend
type Config struct {
	// Server
	Port            string
	AllowedOrigins  string
	TimeoutSeconds  int
	MaxFileSize     int64
	MaxConcurrent   int

	// Google OAuth
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURI  string

	// Logging
	LogDir string
	Debug  bool

	// Application
	Version string
}

// LoadConfig loads configuration from environment variables and .env file
func LoadConfig() (*Config, error) {
	// Load .env file if it exists (won't fail if not found)
	// Option 1: Look in current directory
	_ = godotenv.Load()
	
	// Option 2: Look in backend directory
	_ = godotenv.Load("./cmd/streamline_webapp/backend/.env")
	
	// Option 3: Look in parent directories
	_ = godotenv.Load(".env")
	_ = godotenv.Load("cmd/streamline_webapp/backend/.env")
	_ = godotenv.Load("../../../.env")

	// Required environment variables
	requiredVars := []string{
		"GOOGLE_CLIENT_ID",
		"GOOGLE_CLIENT_SECRET",
		"GOOGLE_REDIRECT_URI",
	}

	for _, v := range requiredVars {
		if os.Getenv(v) == "" {
			return nil, fmt.Errorf("missing required environment variable: %s", v)
		}
	}

	cfg := &Config{
		// Server configuration
		Port:           getEnv("PORT", "8080"),
		AllowedOrigins: getEnv("ALLOWED_ORIGIN", "http://localhost:3000"),
		TimeoutSeconds: getEnvInt("TIMEOUT_SECONDS", 3600),
		MaxFileSize:    int64(getEnvInt("MAX_FILE_SIZE", 10*1024*1024*1024)), // 10GB default
		MaxConcurrent:  getEnvInt("MAX_CONCURRENT", 5),

		// Google OAuth
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURI:  os.Getenv("GOOGLE_REDIRECT_URI"),

		// Logging
		LogDir: getEnv("LOG_DIR", "logs"),
		Debug:  getEnvBool("DEBUG", false),

		// Application
		Version: "v0.1.0",
	}

	// Validate configuration
	if err := cfg.Validate(); err != nil {
		return nil, fmt.Errorf("config validation failed: %w", err)
	}

	return cfg, nil
}

// Validate checks if all configuration values are valid
func (c *Config) Validate() error {
	if c.Port == "" {
		return fmt.Errorf("PORT is required")
	}

	if c.GoogleClientID == "" {
		return fmt.Errorf("GOOGLE_CLIENT_ID is required")
	}

	if c.GoogleClientSecret == "" {
		return fmt.Errorf("GOOGLE_CLIENT_SECRET is required")
	}

	if c.GoogleRedirectURI == "" {
		return fmt.Errorf("GOOGLE_REDIRECT_URI is required")
	}

	if c.AllowedOrigins == "" {
		return fmt.Errorf("ALLOWED_ORIGIN is required")
	}

	if c.TimeoutSeconds <= 0 {
		return fmt.Errorf("TIMEOUT_SECONDS must be greater than 0")
	}

	if c.MaxFileSize <= 0 {
		return fmt.Errorf("MAX_FILE_SIZE must be greater than 0")
	}

	if c.MaxConcurrent <= 0 {
		return fmt.Errorf("MAX_CONCURRENT must be greater than 0")
	}

	return nil
}

// Helper functions for environment variable loading

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

// getEnvInt gets an environment variable as an integer with a default value
func getEnvInt(key string, defaultValue int) int {
	if value, exists := os.LookupEnv(key); exists {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
		log.Printf("Warning: Invalid integer value for %s, using default: %d", key, defaultValue)
	}
	return defaultValue
}

// getEnvBool gets an environment variable as a boolean with a default value
func getEnvBool(key string, defaultValue bool) bool {
	if value, exists := os.LookupEnv(key); exists {
		switch value {
		case "true", "1", "yes", "on":
			return true
		case "false", "0", "no", "off":
			return false
		default:
			log.Printf("Warning: Invalid boolean value for %s, using default: %v", key, defaultValue)
		}
	}
	return defaultValue
}

// LogConfig logs the current configuration (without sensitive data)
func (c *Config) LogConfig() {
	log.Println("=== Configuration Loaded ===")
	log.Printf("Port: %s", c.Port)
	log.Printf("Allowed Origins: %s", c.AllowedOrigins)
	log.Printf("Timeout: %d seconds", c.TimeoutSeconds)
	log.Printf("Max File Size: %d bytes (%.2f GB)", c.MaxFileSize, float64(c.MaxFileSize)/1024/1024/1024)
	log.Printf("Max Concurrent: %d", c.MaxConcurrent)
	log.Printf("Log Directory: %s", c.LogDir)
	log.Printf("Debug Mode: %v", c.Debug)
	log.Printf("Version: %s", c.Version)
	log.Println("===========================")
}