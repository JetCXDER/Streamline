package util

import (
	"fmt"
	"strings"
)

func PrintProgress(current, total int) {
    percent := float64(current) / float64(total)
    barLength := 40
    filled := int(percent * float64(barLength))

    bar := strings.Repeat("█", filled) + strings.Repeat("-", barLength-filled)
    fmt.Printf("\r[%s] %.2f%%", bar, percent*100)
    if current == total {
        fmt.Println()
    }
}
