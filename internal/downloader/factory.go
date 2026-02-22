package downloader

import (
	"context"

	"google.golang.org/api/drive/v3"
)

// Downloader defines a pluggable backend that can fetch a file
// from some source and upload it into Google Drive.
type Downloader interface {
    // DownloadAndUpload should fetch the file from its source
    // and upload it into the given Drive folder.
    // Returns the new Drive file ID on success.
    DownloadAndUpload(ctx context.Context, svc *drive.Service, targetFolderID string) (string, error)
}

// NewDownloaderFromFlags inspects CLI flags and returns the right Downloader.
func NewDownloaderFromFlags(urlFlag, torrentFlag, fileId, outDir string) Downloader {
    if urlFlag != "" {
        return &URLDownloader{URL: urlFlag}
    }
    if torrentFlag != "" {
        return &TorrentDownloader{MagnetURI: torrentFlag}
    }
    if fileId != "" && outDir != "" {
        return &DriveExtractor{FileID: fileId, OutDir: outDir}
    }
    return nil
}