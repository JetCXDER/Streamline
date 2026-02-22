package downloader

import (
	"context"
	"fmt"
	"strings"

	//"io"
	"net/http"

	"google.golang.org/api/drive/v3"
)

// URLDownloader implements Downloader for direct HTTP/HTTPS URLs.
type URLDownloader struct {
    URL  string
    Name string // optional: desired filename in Drive
}

func (u *URLDownloader) DownloadAndUpload(ctx context.Context, svc *drive.Service, targetFolderID string) (string, error) {
    resp, err := http.Get(u.URL)
    if err != nil {
        return "", fmt.Errorf("failed to fetch URL: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return "", fmt.Errorf("bad status from URL: %s", resp.Status)
    }

    // Decide filename
    filename := u.Name
    if filename == "" {
        parts := strings.Split(u.URL, "/")
        filename = parts[len(parts)-1]
        if filename == "" {
            filename = "downloaded_file"
        }
    }

    // Prepare Drive file metadata
    f := &drive.File{
        Name:    filename,
        Parents: []string{targetFolderID},
    }

    // Upload directly from response body
    created, err := svc.Files.Create(f).Media(resp.Body).Do()
    if err != nil {
        return "", fmt.Errorf("upload to Drive failed: %w", err)
    }

    return created.Id, nil
}