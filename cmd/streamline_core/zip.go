package streamline_core

import (
	"archive/zip"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

const BufferSize = 1 << 20 // 1 MB

func IsPathWithinBase(base, target string) bool {
    absBase, err := filepath.Abs(base)
    if err != nil {
        return false
    }
    absTarget, err := filepath.Abs(target)
    if err != nil {
        return false
    }
    return strings.HasPrefix(absTarget, absBase+string(os.PathSeparator))
}

func ExtractFile(f *zip.File, targetPath string) error {
    if f.FileInfo().IsDir() {
        return os.MkdirAll(targetPath, 0o755)
    }
    if err := os.MkdirAll(filepath.Dir(targetPath), 0o755); err != nil {
        return fmt.Errorf("mkdir parents: %w", err)
    }
    rc, err := f.Open()
    if err != nil {
        return fmt.Errorf("open zip entry: %w", err)
    }
    defer rc.Close()
    outF, err := os.Create(targetPath)
    if err != nil {
        return fmt.Errorf("create file: %w", err)
    }
    defer outF.Close()
    if _, err := io.CopyBuffer(outF, rc, make([]byte, BufferSize)); err != nil {
        return fmt.Errorf("write file: %w", err)
    }
    return nil
}

func ShouldExtract(name string, include, exclude string) bool {
    if include != "" {
        matched, _ := filepath.Match(include, filepath.Base(name))
        if !matched {
            return false
        }
    }
    if exclude != "" {
        matched, _ := filepath.Match(exclude, filepath.Base(name))
        if matched {
            return false
        }
    }
    return true
}

func ExtractZip(zipPath, outputDir, include, exclude string) error {
    r, err := zip.OpenReader(zipPath)
    if err != nil {
        return fmt.Errorf("open zip: %w", err)
    }
    defer r.Close()

    for _, f := range r.File {
        targetPath := filepath.Join(outputDir, f.Name)

        if !IsPathWithinBase(outputDir, targetPath) {
            return fmt.Errorf("illegal path: %s", targetPath)
        }
        if !ShouldExtract(f.Name, include, exclude) {
            continue
        }
        if err := ExtractFile(f, targetPath); err != nil {
            return fmt.Errorf("extract %s: %w", f.Name, err)
        }
    }
    return nil
}

// List files inside a ZIP without extracting
func ListZipFiles(zipPath string) ([]string, error) {
    r, err := zip.OpenReader(zipPath)
    if err != nil {
        return nil, fmt.Errorf("open zip: %w", err)
    }
    defer r.Close()

    var files []string
    for _, f := range r.File {
        files = append(files, f.Name)
    }
    return files, nil
}

// Extract only selected files, supports cancellation
func ExtractSelectedFiles(ctx context.Context, zipPath, outputDir string, selected []string, logChan chan<- string) error {
    r, err := zip.OpenReader(zipPath)
    if err != nil {
        return fmt.Errorf("open zip: %w", err)
    }
    defer r.Close()

    selectedSet := make(map[string]bool)
    for _, s := range selected {
        selectedSet[s] = true
    }

    for _, f := range r.File {
        select {
        case <-ctx.Done():
            logChan <- "Aborted"
            return ctx.Err()
        default:
        }

        if !selectedSet[f.Name] {
            continue
        }

        logChan <- fmt.Sprintf("Extracting %s...", f.Name)
        targetPath := filepath.Join(outputDir, f.Name)
        if err := ExtractFile(f, targetPath); err != nil {
            return fmt.Errorf("extract %s: %w", f.Name, err)
        }
    }

    logChan <- "Extraction complete."
    return nil
}
