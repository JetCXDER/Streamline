package downloader

import (
	"fmt"
	"testing"
)

func TestNewDownloaderFromFlags(t *testing.T) {
    tests := []struct {
        url      string
        torrent  string
        fileID   string
        outDir   string
        expected string // full type name
    }{
		{"https://example.com/file.zip", "", "", "/tmp", "*downloader.URLDownloader"},
		{"", "magnet:?xt=urn:btih:abc123", "", "/tmp", "*downloader.TorrentDownloader"},
		{"", "", "drive-file-id", "/tmp", "*downloader.DriveExtractor"},
		{"", "", "", "/tmp", "<nil>"},
	}

    for _, tt := range tests {
        d := NewDownloaderFromFlags(tt.url, tt.torrent, tt.fileID, tt.outDir)
        actual := "<nil>"
        if d != nil {
            actual = fmt.Sprintf("%T", d)
        }
        if actual != tt.expected {
            t.Errorf("NewDownloaderFromFlags(%q, %q, %q, %q) = %v; want %v",
                tt.url, tt.torrent, tt.fileID, tt.outDir, actual, tt.expected)
        }
    }
}
