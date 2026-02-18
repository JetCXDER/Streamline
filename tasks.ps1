param([string]$task)

switch ($task) {
    "test" {
        Write-Host "Running tests..."
        go test ./...
    }
    "build" {
        Write-Host "Building binary..."
        go build -o streamline.exe ./cmd/streamline
    }
    "lint" {
        Write-Host "Running linter..."
        golangci-lint run
    }
    "run" {
        Write-Host "Running Streamline..."
        go run ./cmd/streamline
    }
    "clean" {
        Write-Host "Cleaning build artifacts..."
        go clean
        Remove-Item streamline.exe -ErrorAction Ignore
    }
    default {
        Write-Host 'Usage: .\tasks.ps1 [test|build|lint|run|clean]'
    }
}
