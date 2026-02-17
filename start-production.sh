#!/bin/bash

# Start script for NiceTop AI production server
# This ensures proper cleanup when PM2 stops the process

cd /home/dyserver01/NiceTop/NiceTop_AI1:1

# Load environment variables from .env
export $(grep -v '^#' .env | xargs)

# Trap SIGTERM and SIGINT for cleanup
cleanup() {
    echo "Shutting down gracefully..."
    pkill -P $$ || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# Start Next.js server
exec node_modules/.bin/next start -p 23000 -H 0.0.0.0
