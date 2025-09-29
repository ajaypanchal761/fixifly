# Backend Server Setup Instructions

## Quick Start

To resolve the "Unexpected token '<', "<!doctype "... is not valid JSON" errors, you need to start the backend server.

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies (if not already installed)
```bash
npm install
```

### 3. Start the Server
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

### 4. Verify Server is Running
The server should start on port 5000 (or the port specified in your environment variables).

You can verify by visiting: `http://localhost:5000/health`

You should see a JSON response like:
```json
{
  "success": true,
  "message": "Fixifly Backend Server is running!",
  "timestamp": "2024-01-XX...",
  "environment": "development"
}
```

## Environment Setup

Make sure you have the following environment variables set in your `.env` file:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## API Endpoints

Once the server is running, the following endpoints will be available:

- `GET /api/health` - Server health check
- `GET /api/vendor/wallet` - Get vendor wallet data
- `GET /api/vendor/wallet/transactions` - Get vendor transactions
- `GET /api/vendor/stats` - Get vendor statistics
- `POST /api/vendor/wallet/earning` - Add earning to wallet
- `POST /api/vendor/wallet/penalty` - Add penalty to wallet
- And many more...

## Troubleshooting

### Common Issues:

1. **Port Already in Use**
   - Change the PORT in your .env file
   - Or kill the process using the port: `lsof -ti:5000 | xargs kill -9`

2. **MongoDB Connection Issues**
   - Check your MONGODB_URI in the .env file
   - Ensure MongoDB is running and accessible

3. **Module Not Found Errors**
   - Run `npm install` to install all dependencies
   - Check if all required packages are in package.json

4. **Permission Errors**
   - Make sure you have write permissions in the backend directory
   - On Linux/Mac, you might need `sudo` for some operations

## Development vs Production

- **Development**: Uses `npm run dev` with nodemon for auto-restart
- **Production**: Uses `npm start` for optimized performance

## Logs

Server logs are stored in the `logs/` directory:
- `error-YYYY-MM-DD.log` - Error logs
- `general-YYYY-MM-DD.log` - General logs

Check these files if you encounter issues.

## Need Help?

If you're still experiencing issues:
1. Check the console output when starting the server
2. Look at the log files in the `logs/` directory
3. Verify all environment variables are set correctly
4. Ensure MongoDB is running and accessible















