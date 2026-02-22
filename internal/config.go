package config

import (
	"os"
)

type Config struct {
    ClientID     string
    ClientSecret string
    RedirectURI  string
    LogDir       string
}

func Load() *Config {
    return &Config{
        ClientID:     os.Getenv("STREAMLINE_CLIENT_ID"),
        ClientSecret: os.Getenv("STREAMLINE_CLIENT_SECRET"),
        RedirectURI:  os.Getenv("STREAMLINE_REDIRECT_URI"),
        LogDir:       "logs",
    }
}
