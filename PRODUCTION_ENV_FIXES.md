# Production Environment Configuration Fixes

## 🚨 Issues Found in Your Current Configuration

1. ❌ `NODE_ENV=development` → Should be `production`
2. ❌ `PORT=3000` → Should be `5000` (backend uses port 5000)
3. ❌ `CORS_ORIGIN=https://getfixfly.com/` → Remove trailing slash
4. ⚠️ Razorpay keys are TEST keys → Use LIVE keys for production payments

## ✅ Corrected Production Configuration

Copy this to your `.env` file in backend root:

```env
# Database Configuration - MongoDB Atlas
MONGODB_URI=mongodb+srv://fixfly:fixfly786@cluster0.2ne8beo.mongodb.net/FixFly

# JWT Configuration
JWT_SECRET=ajaypanchal761
JWT_EXPIRES_IN=30d

# SMS India Hub Configuration
SMSINDIAHUB_API_KEY=WbI0WTYqwEKPaJQYGV5Ylw
SMSINDIAHUB_SENDER_ID=SMSHUB

# Server Configuration
NODE_ENV=production
PORT=5000

# Frontend URL (CRITICAL for payment callbacks)
FRONTEND_URL=https://getfixfly.com

# CORS Configuration (NO trailing slash)
CORS_ORIGIN=https://getfixfly.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=fixfly
CLOUDINARY_API_KEY=541225795446565
CLOUDINARY_API_SECRET=Sd7-NPLSgzzGq4VVR_CyO3o17g0

# Razorpay Configuration
# ⚠️ IMPORTANT: Replace with LIVE keys for production
# Current keys are TEST keys (rzp_test_*)
# Get LIVE keys from: https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_test_8sYbzHWidwe5Zw
RAZORPAY_KEY_SECRET=GkxKRQ2B0U63BKBoayuugS3D

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=fixfly.in@gmail.com
SMTP_PASS=hzwg sumb aacd cnei

# Firebase Configuration for Push Notifications
FIREBASE_PROJECT_ID=fixfly-d8e35
FIREBASE_PRIVATE_KEY_ID=17cb7a00c8063270912497ed1fa8bc85921d5e59
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC0NoqFyVIYR+dA\nDkYUdW9N/5zv3YZx1tcvWm18QquDzoGPK91Fr1bPscWxg/Io9zxYRbar8qcDoWML\nHbsf3xw80Axk0Lt8/2/HLK/hs/OtNKDDxpdwd1FA4zSvrlwgECuv/KqvMffLtGKb\nbEskwO43LjnSF0vsOu4eZX4wgrA99DwJzKmaSRcK1lH69QaNSiUBZ4+C5FsdDOFi\n7hB3hHPKQzbNjdKDEsE0pYtchutT5Vh6KA6UlLQW+KS1gwqIU8Ox24liie2FZ6Di\nJIln12a86eiFMY8JgCykMaBFOCa5qe1vWqAflPBx8RTYQgj4tj+NT+/H+oSRKaFW\nQWrY0OYvAgMBAAECggEAEiAQM5+Jfb6xoAwveTxMexRT9P4bWRTKJM2cCGzuMj4R\nYtR/F1Sozw/quc1zDDK9o4Uzd7zalm9jdklBulVm0ij8riEeUlagp/AzKmi+f/O0\nnaw6LAocJoITmP3Y7zKhKjyn8CH+8cKNTmOIdURgUTV5hEtqi/JrY6xCkl96mWht\nB6pzwP26cVRnWWgKyJNjCxClHVMSgEmvHp23RJ+m18d8i1dwtjFNQpgP1k41nyMW\n+5n5CcDt0K6rLY00Mb0erZ+HxGRFp3faZlmdwtIhiY8hfOU29z4FKp+EBQ8nuh87\nUvYACKhTIgaL3/2Ij7PPhPDGz9WCgAAkyVmcGatNBQKBgQD2zv/z5nDSg+eOCXyA\n67dBHU1Ye/DbjyDQAMPtdrwjhWiZuX99ICUKj/5NwS8HYZFnUrkX4IhwekxN/Bwl\n/n5pIreKX41b4gRLqOmxSheY+emCXsXCH8hE9ClpHWlclwYQDVu0ctSjs0gIwySm\nn3XiVNulnxYXpXHsjH1vDReYKwKBgQC67KOaXOMvBy5u5UeoE2arK46MAXLG3b8J\n+SJGzGStHRcwKgT4tsxpawZWgc47eUgIldT3S+fF8ppI2b0zTcwYGRqo7jTwuTby\nQbcfBGllGwpg5+xND242sqCNMqzzXtIuWjI5xY3+UUQ1XaDyDyJfZ7VfSINlOv/l\nC2LfEHiEDQKBgQDnECz4fwmpTOyAQclaOVQ7ld9Ps9lu9LTXh5/mtX62ErQ3Fz+Q\nOYP0O5Lt4KrS0jl67itzezbBdv3xFNKVj4lxjJsg5QxGtXcoDl+bJ66n/XDsKSYj\n8/Ve+Oe8DVkS4iE+7gKpEciZ6cLK0UeC509KMf/hMutQAAiEWZMlYLByOQKBgHnP\nxD3P0mzPLT8vQycQnZNmaxppxzY5Q0lohSHGCMWXc4j7mQnLdiIskJDHPnIbcwnF\nOmd9m6ivlENtQZKxXBNIKMt1kCJfUKNGl+MqqNQubvD/skn1iEk01tOs9nASlr2G\nIbzsNMBKjTyJq1yS6D9sAhH520aY0DGe3eunfCHxAoGBAMkEqJRqm4gnsg8VPYJj\nvcr6t+azqOlxNuRy+SPvatFukwI5NcQ1qOK1BKwhTnlNCIz8M7JWcLY01QUAaUQ9\ntIt9EyLOhhcCXV36UHiokmx2k+m4Oj5xXGHIOEuPvVjB+eVKgdqTBel9e7+eBfDV\nesx0dIAKDHTfBvgnI3z4D0GK\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@fixfly-d8e35.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=106035619768304668471
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40fixfly-d8e35.iam.gserviceaccount.com

# Botbee WhatsApp Configuration
BOTBEE_API_KEY=13816|2rTnPGlI8b7OEl23PapMglbcwif1rOb4pJ4jIH3C0901dcee
BOTBEE_PHONE_ID=617825224738198
ADMIN_WHATSAPP=919931354354
BOTBEE_BASE=https://app.botbee.io
BOTBEE_BOOKING_TEMPLATE_ID=267669
```

## 🔧 Critical Changes Made

### 1. NODE_ENV
```diff
- NODE_ENV=development
+ NODE_ENV=production
```

### 2. PORT
```diff
- PORT=3000
+ PORT=5000
```
**Note:** Backend server uses port 5000 by default. If your hosting provider uses a different port, keep that.

### 3. CORS_ORIGIN
```diff
- CORS_ORIGIN=https://getfixfly.com/
+ CORS_ORIGIN=https://getfixfly.com
```
**Important:** Remove trailing slash - it can cause CORS issues.

### 4. FRONTEND_URL
✅ Already correct: `FRONTEND_URL=https://getfixfly.com`

## ⚠️ Important: Razorpay LIVE Keys

For **production payments**, you MUST use **LIVE keys** from Razorpay:

1. Go to: https://dashboard.razorpay.com/app/keys
2. Switch to **LIVE mode** (top right toggle)
3. Copy **Key ID** and **Key Secret**
4. Replace in `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_live_XXXXXXXXX  # Replace with LIVE key
   RAZORPAY_KEY_SECRET=XXXXXXXXX        # Replace with LIVE secret
   ```

**Current keys are TEST keys** - they won't process real payments!

## 📋 Action Steps

1. **Update `.env` file** with corrected values above
2. **Restart backend server:**
   ```bash
   # If using PM2
   pm2 restart backend
   
   # Or stop and start manually
   ```
3. **Verify configuration:**
   - Check server logs show: `Environment: production`
   - Check CORS is working (no CORS errors in browser console)
   - Test payment callback URL is accessible

## 🧪 Testing Checklist

After updating configuration:

- [ ] Backend shows `Environment: production` in logs
- [ ] Server starts on port 5000 (or your configured port)
- [ ] No CORS errors in browser console
- [ ] Payment callback URL is accessible (not localhost)
- [ ] Razorpay keys are LIVE keys (for production)
- [ ] Frontend can connect to backend API

## 🚨 Common Issues

### Issue: CORS Error
**Solution:** Ensure `CORS_ORIGIN` has NO trailing slash and matches your frontend URL exactly.

### Issue: Payment Callback Fails
**Solution:** 
- Verify `FRONTEND_URL` is set correctly
- Check backend logs for callback receipt
- Ensure callback URL is publicly accessible (not localhost)

### Issue: Port Already in Use
**Solution:** 
- Check if port 5000 is already in use: `lsof -i :5000` (Linux/Mac) or `netstat -ano | findstr :5000` (Windows)
- Use a different port or stop the conflicting service

## 📞 Need Help?

If payment still fails after these fixes:
1. Check backend logs for error messages
2. Verify callback URL in browser console during payment
3. Ensure all environment variables are loaded correctly

