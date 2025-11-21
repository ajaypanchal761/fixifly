#!/bin/bash
# Deployment script for Fixfly backend
# Run this script on the production server to install dependencies and restart the service

set -e  # Exit on error

echo "🚀 Starting Fixfly Backend Deployment..."

# Navigate to backend directory
BACKEND_DIR="/root/fixifly/backend"
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Error: Backend directory not found at $BACKEND_DIR"
    echo "Please check the path and update this script if needed."
    exit 1
fi

cd "$BACKEND_DIR"

echo "📦 Installing dependencies..."
npm install --production

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully!"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  Warning: PM2 is not installed. Please restart the server manually."
    exit 0
fi

echo "🔄 Restarting PM2 process..."
pm2 restart backend || pm2 start server.js --name backend

echo "✅ Deployment complete!"
echo "📊 Check PM2 status with: pm2 status"
echo "📋 Check logs with: pm2 logs backend"

