# Fix Node Modules Issue on Live Server

## Problem
The error `Cannot find module './helpers/merge-exports'` in `iconv-lite` indicates corrupted or incomplete node_modules.

## Solution

Run these commands on the live server:

```bash
# Navigate to backend directory
cd /root/fixifly/backend

# Stop PM2 process
pm2 stop backend

# Remove corrupted node_modules
rm -rf node_modules

# Remove package-lock.json (optional but recommended)
rm -f package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall all dependencies
npm install

# Start PM2 process again
pm2 start server.js --name backend

# Check logs
pm2 logs backend
```

## Alternative: Quick Fix (if above doesn't work)

```bash
cd /root/fixifly/backend
pm2 stop backend
npm install iconv-lite --save
pm2 restart backend
```

## Verify Installation

After installation, verify iconv-lite is properly installed:
```bash
ls -la node_modules/iconv-lite/lib/helpers/
```

You should see `merge-exports.js` file in that directory.

