#!/bin/bash

echo "Stopping existing Next.js server..."
pkill -f "next dev" || echo "No Next.js process found"

echo "Clearing Next.js cache..."
rm -rf .next

echo "Starting Next.js server..."
npm run dev
