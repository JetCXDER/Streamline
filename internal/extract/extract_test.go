package extract_test

import (
	"archive/zip"
	"bytes"
	"os"
	"path/filepath"
	"testing"

	streamline_core "Streamline/cmd/streamline_core"
)

func TestIsPathWithinBase(t *testing.T) {
    base := "/tmp/output"

    tests := []struct {
        target   string
        expected bool
    }{
        {filepath.Join(base, "file.txt"), true},
        {filepath.Join(base, "..", "etc", "passwd"), false},
        {filepath.Join(base, "subdir", "file.txt"), true},
        {"/etc/passwd", false},
    }

    for _, tt := range tests {
        result := streamline_core.IsPathWithinBase(base, tt.target)
        if result != tt.expected {
            t.Errorf("IsPathWithinBase(%q, %q) = %v; want %v", base, tt.target, result, tt.expected)
        }
    }
}

func TestShouldExtract(t *testing.T) {
    tests := []struct {
        name     string
        include  string
        exclude  string
        expected bool
    }{
        {"report.pdf", "*.pdf", "", true},
        {"malware.exe", "", "*.exe", false},
        {"image.png", "*.png", "*.png", false},
        {"notes.txt", "*.txt", "*.exe", true},
        {"archive.zip", "", "", true}, // no filters
    }

    for _, tt := range tests {
        result := streamline_core.ShouldExtract(tt.name, tt.include, tt.exclude)
        if result != tt.expected {
            t.Errorf("ShouldExtract(%q, %q, %q) = %v; want %v",
                tt.name, tt.include, tt.exclude, result, tt.expected)
        }
    }
}

func TestExtractFile(t *testing.T) {
    // Create a fake ZIP file in memory
    buf := new(bytes.Buffer)
    zw := zip.NewWriter(buf)

    f, err := zw.Create("test.txt")
    if err != nil {
        t.Fatalf("Failed to create zip entry: %v", err)
    }
    _, err = f.Write([]byte("Hello, Streamline!"))
    if err != nil {
        t.Fatalf("Failed to write to zip entry: %v", err)
    }
    zw.Close()

    zr, err := zip.NewReader(bytes.NewReader(buf.Bytes()), int64(buf.Len()))
    if err != nil {
        t.Fatalf("Failed to read zip: %v", err)
    }

    tmpDir := t.TempDir()
    targetPath := filepath.Join(tmpDir, "test.txt")

    err = streamline_core.ExtractFile(zr.File[0], targetPath)
    if err != nil {
        t.Errorf("ExtractFile failed: %v", err)
    }

    data, err := os.ReadFile(targetPath)
    if err != nil {
        t.Errorf("Failed to read extracted file: %v", err)
    }

    if string(data) != "Hello, Streamline!" {
        t.Errorf("Extracted content mismatch: got %q", string(data))
    }
}
