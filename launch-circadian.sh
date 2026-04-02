#!/bin/bash
# Circadian Launcher Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
URL="${CIRCADIAN_URL:-http://127.0.0.1:5173/}"

# Simple CLI helper
if [[ "$1" == "--scan-log" && -n "$2" ]]; then
    cat "$2"
    exit 0
fi

# Move to project directory (kept for relative paths in CLI helper flows)
cd "$PROJECT_DIR"

# Open the deployed URL in the default browser
xdg-open "$URL"
