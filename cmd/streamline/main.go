package main

import (
	"archive/zip"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"
	"time"

	streamline_core "Streamline/cmd/streamline_core"
	config "Streamline/internal"
	"Streamline/internal/auth"
	downloader "Streamline/internal/downloader"
	util "Streamline/internal/util"

	"github.com/joho/godotenv"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
)


var verbose bool

const Version = "v0.1.0"

type ExtractionError struct {
    File   string `json:"file"`
    Reason string `json:"reason"`
}

func init() {
    logDir := "logs"
    if err := os.MkdirAll(logDir, 0755); err != nil {
        fmt.Printf("Failed to create log directory: %v\n", err)
    }
}


func main() {

    _ = godotenv.Load()
    cfg := config.Load()

    logDir := cfg.LogDir
    if logDir == "" {
        logDir = "logs"
    }
    
    if err := os.MkdirAll(logDir, 0755); err != nil {
        fmt.Printf("Failed to create log directory: %v\n", err)
    }

    logFile := filepath.Join(logDir, time.Now().Format("2006-01-02_15-04-05") + ".log")
    f, err := os.OpenFile(logFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
    if err != nil {
    fmt.Printf("Failed to open log file: %v\n", err)
    } else {
    log.SetOutput(f)
    log.SetFlags(log.LstdFlags | log.Lshortfile)
    log.Println("🚀 Streamline started")
    }


    fileID := flag.String("fileId", "", "Google Drive File ID of the ZIP")
    outDir := flag.String("out", "", "Output directory for extraction")
    chunkMB := flag.Int("chunkMB", 16, "Chunk size in MB for caching (default 16)")
    skipErrors := flag.Bool("skip-errors", false, "Skip files that fail to extract instead of aborting")
    listMode := flag.Bool("list", false, "List archive contents without extracting")
    include := flag.String("include", "", "Glob pattern of files to include (e.g. *.pdf)")
    exclude := flag.String("exclude", "", "Glob pattern of files to exclude (e.g. *.exe)")
    boost := flag.Bool("boost", false, "Enable parallel extraction of files")
    workers := flag.Int("workers", 4, "Number of parallel workers for boost mode")
    showVersion := flag.Bool("version", false, "Print version and exit")
    urlFlag := flag.String("url", "", "Download a file from URL and upload to Drive")
    driveFolder := flag.String("driveFolder", "root", "Target Drive folder ID for uploads")
    torrentFlag := flag.String("torrent", "", "Download a file from a torrent magnet link and upload to Drive")

    flag.BoolVar(&verbose, "verbose", false, "Enable detailed debug logging")
    flag.Parse()

    if *showVersion {
        fmt.Printf("Streamline %s\n", Version)
        os.Exit(0)
    }

    // Downloader orchestration
    d := downloader.NewDownloaderFromFlags(*urlFlag, *torrentFlag, *fileID, *outDir)
    if d == nil {
        flag.Usage()
        os.Exit(1)
    }

    ctx := context.Background()
    httpClient, err := auth.GetClient(ctx)
    if err != nil {
        log.Fatalf("auth client: %v", err)
    }
    svc, err := drive.NewService(ctx, option.WithHTTPClient(httpClient))
    if err != nil {
        log.Fatalf("drive service: %v", err)
    }

    uploadedID, err := d.DownloadAndUpload(ctx, svc, *driveFolder)
    if err != nil {
        log.Fatalf("Download/Upload failed: %v", err)
    }
    log.Printf("✅ Operation complete. File ID: %s", uploadedID)

    // Extraction
    if *fileID == "" || *outDir == "" {
        log.Fatalf("Usage: %s -fileId <ID> -out <path> [-chunkMB N]", os.Args[0])
    }
    if err := os.MkdirAll(*outDir, 0o755); err != nil {
        log.Fatalf("create output dir: %v", err)
    }

    meta, err := svc.Files.Get(*fileID).Fields("name,size").Do()
    if err != nil {
        log.Fatalf("get file metadata: %v", err)
    }
    if meta.Size == 0 {
        log.Fatalf("file size is 0 or unknown; ensure it's a ZIP and accessible")
    }
    log.Printf("Extracting: %s (%d bytes)", meta.Name, meta.Size)

    readerAt := downloader.NewDriveReaderAt(svc, *fileID, meta.Size, int64(*chunkMB)*1024*1024)
    zr, err := zip.NewReader(readerAt, meta.Size)
    if err != nil {
        log.Fatalf("zip reader: %v", err)
    }

    if *listMode {
        log.Println("Archive contents:")
        for _, f := range zr.File {
            log.Printf(" - %s (%d bytes)", f.Name, f.UncompressedSize64)
        }
        return
    }

    totalFiles := len(zr.File)
    skippedCount := 0
    var errorList []ExtractionError
    var progressCount int32

    var wg sync.WaitGroup
    jobs := make(chan *zip.File, totalFiles)

    if *boost {
        for w := 0; w < *workers; w++ {
            wg.Add(1)
            go func() {
                defer wg.Done()
                for f := range jobs {
                    targetPath := filepath.Join(*outDir, f.Name)
                    if !streamline_core.IsPathWithinBase(*outDir, targetPath) {
                        log.Printf("[ERROR] Illegal file path: %s", targetPath)
                        continue
                    }
                    if err := streamline_core.ExtractFile(f, targetPath); err != nil {
                        log.Printf("[ERROR] Failed to extract %s: %v", f.Name, err)
                        if !*skipErrors {
                            errorList = append(errorList, ExtractionError{File: f.Name, Reason: err.Error()})
                        }
                    } else {
                        log.Printf("Extracted: %s", targetPath)
                    }
                    atomic.AddInt32(&progressCount, 1)
                    util.PrintProgress(int(progressCount), totalFiles)
                }
            }()
        }
    }

    if *boost {
        for _, f := range zr.File {
            if !streamline_core.ShouldExtract(f.Name, *include, *exclude) {
                log.Printf("Skipping (filtered): %s", f.Name)
                skippedCount++
                continue
            }
            jobs <- f
        }
        close(jobs)
        wg.Wait()
    } else {
        for i, f := range zr.File {
            log.Printf("Extracting file %d of %d: %s", i+1, totalFiles, f.Name)
            if !streamline_core.ShouldExtract(f.Name, *include, *exclude) {
                log.Printf("Skipping (filtered): %s", f.Name)
                skippedCount++
                continue
            }
            targetPath := filepath.Join(*outDir, f.Name)
            if !streamline_core.IsPathWithinBase(*outDir, targetPath) {
                log.Printf("[ERROR] Illegal file path: %s", targetPath)
                continue
            }
            if err := streamline_core.ExtractFile(f, targetPath); err != nil {
                log.Printf("[ERROR] Failed to extract %s: %v", f.Name, err)
                if !*skipErrors {
                    errorList = append(errorList, ExtractionError{File: f.Name, Reason: err.Error()})
                }
            } else {
                log.Printf("Extracted: %s", targetPath)
            }
            util.PrintProgress(i+1, totalFiles)
        }
    }

    log.Printf("Extraction complete. Total: %d, Skipped: %d, Errors: %d",
        totalFiles, skippedCount, len(errorList))

    //Error Reporting
    if len(errorList) > 0 {
        errFile := filepath.Join(*outDir, "errors.json")
        f, err := os.Create(errFile)
        if err != nil {
            log.Printf("[ERROR] Failed to write error log: %v", err)
        } else {
            enc := json.NewEncoder(f)
            enc.SetIndent("", "  ")
            if err := enc.Encode(errorList); err != nil {
                log.Printf("[ERROR] Failed to encode error log: %v", err)
            } else {
                log.Printf("❌ %d extraction errors written to %s", len(errorList), errFile)
            }
            f.Close()
        }
    }

}

