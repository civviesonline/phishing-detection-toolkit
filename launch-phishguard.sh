#!/bin/bash
# PhishGuard Launcher Script

PROJECT_DIR="/home/manlikecivvies/phishguard-app"
URL="https://phishguard-soc-toolkit.vercel.app/"

# Simple CLI helper
if [[ "$1" == "--scan-log" && -n "$2" ]]; then
    cat "$2"
    exit 0
fi

# Move to project directory (kept for relative paths in CLI helper flows)
cd "$PROJECT_DIR"

# Open the deployed URL in the default browser
xdg-open "$URL"
