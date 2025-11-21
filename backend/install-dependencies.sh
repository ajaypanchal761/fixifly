#!/bin/bash
# Script to install dependencies on production server

echo "Installing backend dependencies..."
cd /root/fixifly/backend || cd "$(dirname "$0")"
npm install --production

echo "Dependencies installed successfully!"
echo "You can now restart your PM2 process with: pm2 restart backend"

