package downloader

import (
	"context"
	"fmt"

	"github.com/anacrolix/torrent"
	"google.golang.org/api/drive/v3"
)

// TorrentDownloader implements Downloader for magnet links or .torrent files.
type TorrentDownloader struct {
    MagnetURI string
    Name      string // optional override for Drive filename
}

func (t *TorrentDownloader) DownloadAndUpload(ctx context.Context, svc *drive.Service, targetFolderID string) (string, error) {
    // Configure torrent client
    cfg := torrent.NewDefaultClientConfig()
    cfg.DataDir = "" // no local storage, use memory

    client, err := torrent.NewClient(cfg)
    if err != nil {
        return "", fmt.Errorf("failed to create torrent client: %w", err)
    }
    defer client.Close()

    // Add torrent from magnet
    tor, err := client.AddMagnet(t.MagnetURI)
    if err != nil {
        return "", fmt.Errorf("failed to add magnet: %w", err)
    }

    <-tor.GotInfo() // wait for metadata
    tor.DownloadAll()

    // Pick filename
    filename := t.Name
    if filename == "" {
        filename = tor.Name()
    }

    // Create Drive file metadata
    f := &drive.File{
        Name:    filename,
        Parents: []string{targetFolderID},
    }

    // Stream torrent data into Drive upload
    reader := tor.NewReader()
    defer reader.Close()

    created, err := svc.Files.Create(f).Media(reader).Do()
    if err != nil {
        return "", fmt.Errorf("upload to Drive failed: %w", err)
    }

    return created.Id, nil
}