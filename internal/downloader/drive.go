package downloader

import (
	"archive/zip"
	"context"
	"fmt"
	"io"
	"path/filepath"
	"sync"

	"Streamline/cmd/streamline_core"

	"google.golang.org/api/drive/v3"
)

const defaultChunkSize = 1 << 20 // 1 MB 

// DriveReaderAt provides random-access reads for a Drive file using HTTP Range requests.
type DriveReaderAt struct {
    svc       *drive.Service
    fileID    string
    size      int64
    chunkSize int64

    mu    sync.Mutex
    cache map[int64][]byte // chunkIndex -> data
}

func NewDriveReaderAt(svc *drive.Service, fileID string, size int64, chunkSize int64) *DriveReaderAt {
    if chunkSize <= 0 {
        chunkSize = defaultChunkSize
    }
    return &DriveReaderAt{
        svc:       svc,
        fileID:    fileID,
        size:      size,
        chunkSize: chunkSize,
        cache:     make(map[int64][]byte),
    }
}

// ReadAt implements io.ReaderAt for DriveReaderAt.
func (d *DriveReaderAt) ReadAt(p []byte, off int64) (int, error) {
    if off < 0 {
        return 0, fmt.Errorf("negative offset")
    }
    if off >= d.size {
        return 0, io.EOF
    }

    n := 0
    remaining := len(p)
    pos := off

    for remaining > 0 && pos < d.size {
        chunkIdx := pos / d.chunkSize
        chunkStart := chunkIdx * d.chunkSize
        chunkEnd := chunkStart + d.chunkSize - 1
        if chunkEnd >= d.size {
            chunkEnd = d.size - 1
        }

        d.mu.Lock()
        buf, ok := d.cache[chunkIdx]
        d.mu.Unlock()

        if !ok {
            call := d.svc.Files.Get(d.fileID)
            call.Header().Set("Range", fmt.Sprintf("bytes=%d-%d", chunkStart, chunkEnd))
            resp, err := call.Download()
            if err != nil {
                return n, fmt.Errorf("range download failed: %w", err)
            }
            data, err := io.ReadAll(resp.Body)
            resp.Body.Close()
            if err != nil {
                return n, fmt.Errorf("read response failed: %w", err)
            }

            d.mu.Lock()
            d.cache[chunkIdx] = data
            d.mu.Unlock()
            buf = data
        }

        offsetInChunk := pos - chunkStart
        if offsetInChunk < 0 || offsetInChunk >= int64(len(buf)) {
            return n, fmt.Errorf("offset outside chunk")
        }

        toCopy := minInt64(int64(remaining), int64(len(buf))-offsetInChunk)
        copy(p[n:n+int(toCopy)], buf[offsetInChunk:offsetInChunk+toCopy])

        n += int(toCopy)
        remaining -= int(toCopy)
        pos += toCopy
    }

    if n < len(p) {
        return n, io.EOF
    }
    return n, nil
}

func minInt64(a, b int64) int64 {
    if a < b {
        return a
    }
    return b
}

// DriveExtractor implements Downloader for extracting a ZIP from Drive.
type DriveExtractor struct {
    FileID string
    OutDir string
}

func (d *DriveExtractor) DownloadAndUpload(ctx context.Context, svc *drive.Service, targetFolderID string) (string, error) {
    // Reuse your existing extraction logic from main()
    meta, err := svc.Files.Get(d.FileID).Fields("name,size").Do()
    if err != nil {
        return "", fmt.Errorf("get file metadata: %w", err)
    }
    if meta.Size == 0 {
        return "", fmt.Errorf("file size is 0 or unknown; ensure it's a ZIP and accessible")
    }

    readerAt := NewDriveReaderAt(svc, d.FileID, meta.Size, defaultChunkSize)
    zr, err := zip.NewReader(readerAt, meta.Size)
    if err != nil {
        return "", fmt.Errorf("zip reader: %w", err)
    }

    // Extract files into d.OutDir (reuse your existing loop logic)
    for _, f := range zr.File {
        targetPath := filepath.Join(d.OutDir, f.Name)
        if !streamline_core.IsPathWithinBase(d.OutDir, targetPath) {
            return "", fmt.Errorf("illegal file path: %s", targetPath)
        }
        if err := streamline_core.ExtractFile(f, targetPath); err != nil {
            return "", fmt.Errorf("extract %s: %w", f.Name, err)
        }
    }

    // Return the Drive file ID we just extracted from
    return d.FileID, nil
}