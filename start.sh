#!/bin/bash
# Start a simple HTTP server to host the timer
PORT=${PORT:-8000}
DIR="$(dirname "$0")"
cd "$DIR"

# Launch the built‑in Python server
python3 -m http.server "$PORT"
