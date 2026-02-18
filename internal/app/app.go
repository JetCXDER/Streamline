package app

import (
	"Streamline/internal/downloader"
	"context"
	"fmt"

	"google.golang.org/api/drive/v3"
)

type DownloadParams struct {
    URL        string
    Torrent    string
    FileID     string
    OutDir     string
    DriveFolder string
}

func RunDownload(ctx context.Context, svc *drive.Service, p DownloadParams) (string, error) {
    d := downloader.NewDownloaderFromFlags(p.URL, p.Torrent, p.FileID, p.OutDir)
    if d == nil {
        return "", fmt.Errorf("invalid params")
    }
    return d.DownloadAndUpload(ctx, svc, p.DriveFolder)
}
