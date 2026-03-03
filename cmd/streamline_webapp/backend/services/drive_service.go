package services

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"golang.org/x/oauth2"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
)

func DownloadDriveFile(ctx context.Context, fileID string, accessToken string) (string, error) {
	tokenSource := oauth2.StaticTokenSource(&oauth2.Token{
		AccessToken: accessToken,
	})

	service, err := drive.NewService(ctx, option.WithTokenSource(tokenSource))
	if err != nil {
		return "", fmt.Errorf("create drive service: %w", err)
	}

	tempDir := "./tmp"
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return "", fmt.Errorf("create temp dir: %w", err)
	}

	tempPath := filepath.Join(tempDir, fileID+".zip")

	outFile, err := os.Create(tempPath)
	if err != nil {
		return "", fmt.Errorf("create temp file: %w", err)
	}
	defer outFile.Close()

	resp, err := service.Files.Get(fileID).Download()
	if err != nil {
		return "", fmt.Errorf("download file: %w", err)
	}
	defer resp.Body.Close()

	if _, err := io.Copy(outFile, resp.Body); err != nil {
		return "", fmt.Errorf("save file: %w", err)
	}

	return tempPath, nil
}