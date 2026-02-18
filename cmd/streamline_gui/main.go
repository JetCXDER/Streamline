package main

import (
	"Streamline/internal/app"
	"context"

	"fyne.io/fyne/v2"
	fyneApp "fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/layout"
	"fyne.io/fyne/v2/widget"
	"google.golang.org/api/drive/v3"
)

func main() {
    

    a := fyneApp.New()
    w := a.NewWindow("Streamline v.0.2.0")

    // --- Download tab widgets ---
    downloadURL := widget.NewEntry()
    downloadURL.SetPlaceHolder("Enter file URL or ID")

    outDir := widget.NewEntry()
    outDir.SetPlaceHolder("Output directory")

    progress := widget.NewProgressBar()

    logOutput := widget.NewMultiLineEntry()
    logOutput.SetPlaceHolder("Logs will appear here...")
    logOutput.Disable() // read-only

    var startBtn, cancelBtn *widget.Button
    var cancelFunc context.CancelFunc

    startBtn = widget.NewButton("Start Download", func() {
        logOutput.SetText(logOutput.Text + "\nStarting download...")

        startBtn.Disable()
        cancelBtn.Enable() 

        go func() {
            ctx, cancel := context.WithCancel(context.Background())
            cancelFunc = cancel // store it for Cancel button

            // TODO: initialize Drive service (reuse your auth code)
            var svc *drive.Service // placeholder for now

            _, err := app.RunDownload(ctx, svc, app.DownloadParams{
                URL:    downloadURL.Text,
                Torrent:    "",
                FileID: "", // or parse from input
                OutDir: outDir.Text,
                DriveFolder: "",
            })

            if err != nil {
                logOutput.SetText(logOutput.Text + "\nError: " + err.Error())
            } else {
                logOutput.SetText(logOutput.Text + "\nDownload complete.")
                progress.SetValue(1)
            }

            // reset buttons
            startBtn.Enable()
            cancelBtn.Disable()

            // Force redraw so UI updates immediately
            w.Canvas().Refresh(logOutput)
            w.Canvas().Refresh(progress)

        }()
    })          

    cancelBtn = widget.NewButton("Cancel", func() {
        if cancelFunc != nil {
            cancelFunc() // stop the download
            logOutput.SetText(logOutput.Text + "\nDownload cancelled.")
            progress.SetValue(0)

            startBtn.Enable()
            cancelBtn.Disable()

            cancelFunc = nil // reset
        } else {
            logOutput.SetText(logOutput.Text + "\nNo active download to cancel.")
        }
    })


    downloadTab := container.NewVBox(
        widget.NewLabel("Download a file"),
        downloadURL,
        outDir,
        container.NewHBox(startBtn, cancelBtn),
        progress,
        logOutput,
    )

    // --- Extract tab (placeholder for now) ---
    extractTab := container.NewVBox(
        widget.NewLabel("Extract a file"),
        widget.NewEntry(), // Output dir / File ID
        widget.NewButton("Start Extraction", func() {
            // TODO: app.RunExtract(ctx, params)
        }),
    )

    // --- Auth tab (placeholder for now) ---
    authTab := container.NewVBox(
        widget.NewLabel("Authentication"),
        widget.NewButton("Sign in with Google", func() {
            // TODO: trigger PKCE flow + secure token storage
        }),
        widget.NewButton("Sign out", func() {
            // TODO: revoke/delete tokens
        }),
        layout.NewSpacer(),
    )

    // --- Tabs ---
    tabs := container.NewAppTabs(
		container.NewTabItem("Extract", extractTab),
        container.NewTabItem("Download", downloadTab),
        container.NewTabItem("Auth", authTab),
    )

    w.SetContent(tabs)
    w.Resize(fyne.NewSize(800, 600))
    w.ShowAndRun()
}
