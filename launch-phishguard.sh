#!/bin/bash
# PhishGuard Launcher Script

PROJECT_DIR="/home/manlikecivvies/phishguard-app"
URL="http://127.0.0.1:5173"

# Simple CLI helper
if [[ "$1" == "--scan-log" && -n "$2" ]]; then
    cat "$2"
    exit 0
fi

# Move to project directory
cd "$PROJECT_DIR"

# Check if the server is already running
if ! curl -s --head "$URL" | head -n 1 | grep "HTTP/1.1 200 OK" > /dev/null; then
    # Start the server in the background if it's not running
    npm run dev > /dev/null 2>&1 &
    # Wait a few seconds for it to initialize
    sleep 3
fi

# Open the URL in the default browser
xdg-open "$URL"
