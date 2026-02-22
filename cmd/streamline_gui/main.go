package main

import (
	"fmt"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/layout"
	"fyne.io/fyne/v2/theme"
	"fyne.io/fyne/v2/widget"
)

// FileItem represents a file in the download list
type FileItem struct {
	Name     string
	Uploader string
	Size     string
	Type     string
	Progress float64
	Status   string
}

func main() {
	myApp := app.New()
	myWindow := myApp.NewWindow("Download Manager")
	myWindow.Resize(fyne.NewSize(800, 600))
	myWindow.CenterOnScreen()

	// Debug output label
	logOutput := widget.NewLabel("")

	// Sample data matching the image
	files := []FileItem{
		{Name: "OceanMusic.mp3", Uploader: "biggieuploader", Size: "61.7 MB", Type: "audio", Progress: 0, Status: "idle"},
		{Name: "GreatOceanBeach.zip", Uploader: "biggieuploader", Size: "61.7 MB", Type: "archive", Progress: 0, Status: "idle"},
		{Name: "OceanDeep.rar", Uploader: "biggieuploader", Size: "61.7 MB", Type: "archive", Progress: 0, Status: "idle"},
		{Name: "OceanSurfRock.mp3", Uploader: "biggieuploader", Size: "61.7 MB", Type: "audio", Progress: 0.35, Status: "downloading"},
		{Name: "OceanWaves.mp4", Uploader: "biggieuploader", Size: "61.7 MB", Type: "video", Progress: 0, Status: "idle"},
		{Name: "OceanWater.rar", Uploader: "biggieuploader", Size: "61.7 MB", Type: "archive", Progress: 0.18, Status: "downloading"},
		{Name: "OceanFunk.mp3", Uploader: "biggieuploader", Size: "61.7 MB", Type: "audio", Progress: 0, Status: "idle"},
		{Name: "OceanBeach.zip", Uploader: "biggieuploader", Size: "61.7 MB", Type: "archive", Progress: 0, Status: "idle"},
	}

	// Build UI
	sidebar := createSidebar(logOutput)
	content := createContent(files, logOutput)
	player := createPlayerBar(logOutput)

	// Main layout
	main := container.NewBorder(
		nil,     // top
		player,  // bottom
		sidebar, // left
		nil,     // right
		content, // center
	)

	myWindow.SetContent(main)
	myWindow.ShowAndRun()
}

func createSidebar(log *widget.Label) fyne.CanvasObject {
	// Title
	title := widget.NewLabelWithStyle("◉ DOWNLOAD", fyne.TextAlignLeading, fyne.TextStyle{Bold: true})

	// Nav items
	items := []struct {
		icon  string
		label string
	}{
		{"▶", "Downloads"},
		{"📁", "Library"},
		{"👥", "Community"},
		{"💬", "Friends"},
	}

	var navs []fyne.CanvasObject
	for _, item := range items {
		item := item
		btn := widget.NewButton(fmt.Sprintf("%s   %s", item.icon, item.label), func() {
			log.SetText(fmt.Sprintf("[DEBUG] Nav: %s", item.label))
		})
		btn.Alignment = widget.ButtonAlignLeading
		navs = append(navs, btn)
	}

	// Bottom actions
	settings := widget.NewButton("⚙   Settings", func() { log.SetText("[DEBUG] Settings") })
	settings.Alignment = widget.ButtonAlignLeading
	help := widget.NewButton("?   Help", func() { log.SetText("[DEBUG] Help") })
	help.Alignment = widget.ButtonAlignLeading

	return container.NewPadded(container.NewVBox(
		title,
		widget.NewSeparator(),
		container.NewVBox(navs...),
		layout.NewSpacer(),
		widget.NewSeparator(),
		settings,
		help,
	))
}

func createContent(files []FileItem, log *widget.Label) fyne.CanvasObject {
	// Search and tabs
	search := widget.NewEntry()
	search.SetPlaceHolder("🔍  Search files...")
	search.OnSubmitted = func(s string) { log.SetText(fmt.Sprintf("[DEBUG] Search: %s", s)) }

	tabs := container.NewAppTabs(
		container.NewTabItem("All", widget.NewLabel("")),
		container.NewTabItem("NNTP", widget.NewLabel("")),
		container.NewTabItem("HTTP", widget.NewLabel("")),
		container.NewTabItem("P2P", widget.NewLabel("")),
	)

	searchRow := container.NewBorder(nil, nil, nil, tabs, search)

	// Actions
	filter := widget.NewButton("Filters ▼", func() { log.SetText("[DEBUG] Filters") })
	dl := widget.NewButtonWithIcon("Download", theme.DownloadIcon(), func() { log.SetText("[DEBUG] Download") })
	dl.Importance = widget.HighImportance
	queue := widget.NewButtonWithIcon("Add to ZIP Queue", theme.ContentAddIcon(), func() { log.SetText("[DEBUG] Queue") })
	nzb := widget.NewButton("Create NZB", func() { log.SetText("[DEBUG] NZB") })
	sort := widget.NewButton("Relevance ▼", func() { log.SetText("[DEBUG] Sort") })

	actions := container.NewBorder(nil, nil, container.NewHBox(filter, dl, queue, nzb), sort, nil)

	// Header
	header := container.NewGridWithColumns(5,
		widget.NewCheck("", func(bool) {}),
		widget.NewLabelWithStyle("Name", fyne.TextAlignLeading, fyne.TextStyle{Bold: true}),
		widget.NewLabelWithStyle("Size", fyne.TextAlignCenter, fyne.TextStyle{Bold: true}),
		widget.NewLabelWithStyle("Status", fyne.TextAlignCenter, fyne.TextStyle{Bold: true}),
		widget.NewLabelWithStyle("Actions", fyne.TextAlignTrailing, fyne.TextStyle{Bold: true}),
	)

	// File list
	list := container.NewVBox()
	for i, f := range files {
		row := createFileRow(f, log)
		list.Add(row)
		if i < len(files)-1 {
			list.Add(widget.NewSeparator())
		}
	}

	scroll := container.NewScroll(list)

	return container.NewBorder(
		container.NewVBox(searchRow, widget.NewSeparator(), actions, widget.NewSeparator(), header),
		nil, nil, nil,
		scroll,
	)
}

func createFileRow(f FileItem, log *widget.Label) fyne.CanvasObject {
	check := widget.NewCheck("", func(bool) {})

	icon := "📄"
	switch f.Type {
	case "audio":
		icon = "🎵"
	case "video":
		icon = "🎬"
	case "archive":
		icon = "📦"
	}

	name := widget.NewLabel(fmt.Sprintf("%s %s\n%s • 2 months ago", icon, f.Name, f.Uploader))
	size := widget.NewLabelWithStyle(f.Size, fyne.TextAlignCenter, fyne.TextStyle{})

	var status fyne.CanvasObject
	if f.Status == "downloading" {
		bar := widget.NewProgressBar()
		bar.Value = f.Progress
		bar.Resize(fyne.NewSize(80, 16))
		status = container.NewVBox(bar, widget.NewLabel(fmt.Sprintf("%.0f%%", f.Progress*100)))
	} else {
		status = widget.NewLabel("Ready")
	}

	var actions *fyne.Container
	if f.Status == "downloading" {
		pause := widget.NewButtonWithIcon("Pause", theme.MediaPauseIcon(), func() {
			log.SetText(fmt.Sprintf("[DEBUG] Pause: %s", f.Name))
		})
		cancel := widget.NewButton("Cancel", func() {
			log.SetText(fmt.Sprintf("[DEBUG] Cancel: %s", f.Name))
		})
		actions = container.NewHBox(pause, cancel)
	} else {
		dl := widget.NewButtonWithIcon("Download", theme.DownloadIcon(), func() {
			log.SetText(fmt.Sprintf("[DEBUG] DL: %s", f.Name))
		})
		dl.Importance = widget.HighImportance
		hdr := widget.NewButton("Header", func() { log.SetText(fmt.Sprintf("[DEBUG] Header: %s", f.Name)) })
		nzb := widget.NewButton("NZB", func() { log.SetText(fmt.Sprintf("[DEBUG] NZB: %s", f.Name)) })
		add := widget.NewButtonWithIcon("", theme.ContentAddIcon(), func() { log.SetText(fmt.Sprintf("[DEBUG] Add: %s", f.Name)) })
		actions = container.NewHBox(dl, hdr, nzb, add)
	}

	return container.NewGridWithColumns(5,
		check, name, size, container.NewCenter(status), container.NewHBox(layout.NewSpacer(), actions),
	)
}

func createPlayerBar(log *widget.Label) fyne.CanvasObject {
	// Track info
	icon := widget.NewLabel("🎵")
	title := widget.NewLabelWithStyle("OceanSurfRock.mp3", fyne.TextAlignLeading, fyne.TextStyle{Bold: true})
	meta := widget.NewLabelWithStyle("biggieuploader • 2 months ago", fyne.TextAlignLeading, fyne.TextStyle{Italic: true})
	left := container.NewHBox(icon, container.NewVBox(title, meta))

	// Controls
	prev := widget.NewButtonWithIcon("", theme.MediaSkipPreviousIcon(), func() { log.SetText("[DEBUG] Prev") })
	play := widget.NewButtonWithIcon("", theme.MediaPlayIcon(), func() { log.SetText("[DEBUG] Play") })
	next := widget.NewButtonWithIcon("", theme.MediaSkipNextIcon(), func() { log.SetText("[DEBUG] Next") })
	controls := container.NewHBox(prev, play, next)

	// Progress
	slider := widget.NewSlider(0, 167)
	slider.Value = 136
	slider.Resize(fyne.NewSize(150, 20))
	progress := container.NewBorder(nil, nil, widget.NewLabel("02:16"), widget.NewLabel("02:47"), slider)
	center := container.NewVBox(container.NewCenter(controls), progress)

	// Right buttons
	dl := widget.NewButtonWithIcon("", theme.DownloadIcon(), func() { log.SetText("[DEBUG] DL audio") })
	add := widget.NewButtonWithIcon("", theme.ContentAddIcon(), func() { log.SetText("[DEBUG] Add audio") })
	share := widget.NewButtonWithIcon("", theme.ContentCopyIcon(), func() { log.SetText("[DEBUG] Share") })
	right := container.NewHBox(dl, add, share)

	return container.NewBorder(nil, nil, left, right, center)
}

