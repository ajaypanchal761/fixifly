# Environment Variables Setup

## Required Environment Variables

Create a `.env` file in the backend root directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/fixfly

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=30d

# SMS India Hub Configuration
SMS_INDIA_HUB_API_KEY=your-sms-india-hub-api-key-here
SMS_INDIA_HUB_SENDER_ID=FIXFLY
SMS_INDIA_HUB_BASE_URL=https://api.smsindiahub.in

# Server Configuration
NODE_ENV=development
PORT=5000

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

## SMTP Email Setup

### 1. Gmail SMTP Configuration
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. Use the app password in `SMTP_PASS` (not your regular password)

### 2. Other SMTP Providers
- **Outlook/Hotmail**: smtp-mail.outlook.com, port 587
- **Yahoo**: smtp.mail.yahoo.com, port 587
- **Custom SMTP**: Use your provider's SMTP settings

### 3. Email Templates
The system includes pre-built templates for:
- Vendor deposit confirmations
- Vendor approval notifications
- Wallet transaction notifications
- Admin notifications
- Custom emails

## SMS India Hub Setup

### 1. Get API Credentials
1. Visit [SMS India Hub](https://smsindiahub.in)
2. Sign up for an account
3. Get your API key from the dashboard
4. Set up your sender ID (FIXFLY)

### 2. API Configuration
- **API Key**: Your unique API key from SMS India Hub
- **Sender ID**: FIXFLY (or your preferred sender ID)
- **Base URL**: https://api.smsindiahub.in

### 3. SMS Templates
Create these templates in your SMS India Hub dashboard:
- **FIXFLY_OTP**: For login OTP
- **FIXFLY_REGISTRATION**: For registration OTP

### 4. Testing
In development mode, OTPs will be logged to console if SMS sending fails.

## Security Notes

1. **JWT Secret**: Use a long, random string (at least 32 characters)
2. **API Keys**: Never commit API keys to version control
3. **Environment**: Use different API keys for development and production
4. **Rate Limiting**: Configure appropriate rate limits for OTP requests

## Production Setup

For production deployment:

1. Set `NODE_ENV=production`
2. Use production MongoDB URI
3. Use production SMS India Hub API key
4. Configure proper CORS origins
5. Set up SSL certificates
6. Configure proper logging and monitoring
