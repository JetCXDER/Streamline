package util

import (
	"bytes"
	"os"
	"testing"
)

func TestPrintProgress(t *testing.T) {
    // Capture stdout
    old := os.Stdout
    r, w, _ := os.Pipe()
    os.Stdout = w

    PrintProgress(3, 10)

    w.Close()
    os.Stdout = old

    var buf bytes.Buffer
    _, _ = buf.ReadFrom(r)
    output := buf.String()

    if output == "" {
        t.Errorf("PrintProgress produced no output")
    }
    if !bytes.Contains([]byte(output), []byte("30.00%")) {
    	t.Errorf("Expected progress to include '30.00%%', got: %q", output)
	}

}
