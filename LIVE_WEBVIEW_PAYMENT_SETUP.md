# Live WebView APK Payment Setup Guide

## 🔧 Critical Environment Variables for Live Payment

### Backend Configuration (`backend/config/production.env`)

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Frontend URL (CRITICAL for payment callbacks)
FRONTEND_URL=https://getfixfly.com

# CORS Configuration
CORS_ORIGIN=https://getfixfly.com

# Razorpay Configuration (Use LIVE keys in production)
RAZORPAY_KEY_ID=rzp_live_XXXXX  # Replace with your LIVE key
RAZORPAY_KEY_SECRET=XXXXX        # Replace with your LIVE secret
```

### Frontend Configuration

#### Option 1: Environment Variable (Recommended)
Create `.env.production` file in `frontend/` directory:

```env
# Production API URL (CRITICAL for WebView payment)
VITE_API_URL=https://your-backend-domain.com/api
# Example: https://api.getfixfly.com/api
# Example: https://backend.getfixfly.com/api
# Example: https://fixfly-backend.herokuapp.com/api
```

#### Option 2: Build-time Configuration
Set environment variable during build:
```bash
VITE_API_URL=https://your-backend-domain.com/api npm run build
```

## 🚨 Common Issues & Fixes

### Issue 1: Callback URL is localhost
**Symptom:** Payment completes but backend doesn't receive callback

**Fix:**
- Ensure `VITE_API_URL` is set to production backend URL (not localhost)
- Backend URL must be publicly accessible
- Use HTTPS in production

### Issue 2: CORS Error
**Symptom:** Payment fails with CORS error

**Fix:**
- Add your frontend domain to `CORS_ORIGIN` in backend
- Ensure `FRONTEND_URL` is set correctly
- Restart backend server after changes

### Issue 3: Payment Redirect Fails
**Symptom:** Payment completes but doesn't redirect back to app

**Fix:**
- Verify `FRONTEND_URL` is set in backend
- Check callback URL in console logs
- Ensure frontend URL is accessible

### Issue 4: Order ID Missing
**Symptom:** Backend logs show "Order ID: MISSING"

**Fix:**
- Check if callback URL includes `razorpay_order_id` parameter
- Verify order creation succeeded
- Check Razorpay dashboard for order status

## 📋 Setup Checklist

### Backend Setup:
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL` set to production frontend URL
- [ ] `CORS_ORIGIN` includes all frontend domains
- [ ] `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are LIVE keys (not test)
- [ ] Backend is publicly accessible via HTTPS
- [ ] Port 5000 (or configured port) is open

### Frontend Setup:
- [ ] `VITE_API_URL` set to production backend URL
- [ ] Frontend is built with production environment
- [ ] WebView APK is built with production config
- [ ] Test payment flow in WebView APK

### Razorpay Setup:
- [ ] Using LIVE keys (not test keys)
- [ ] Webhook URL configured (if using webhooks)
- [ ] Callback URL is publicly accessible
- [ ] Test payment in Razorpay dashboard

## 🔍 Verification Steps

### 1. Check Backend Logs
When payment is made, you should see:
```
🔔 🔔 🔔 RAZORPAY CALLBACK RECEIVED 🔔 🔔 🔔
📋 Extracted payment data:
  razorpay_payment_id: pay_xxx...
  razorpay_order_id: order_xxx...
```

### 2. Check Frontend Console
When payment button is clicked, you should see:
```
🔍 ========== PAYMENT CONTEXT DETECTION ==========
🔍 Is APK/WebView: true
🔍 Use Redirect Mode: true
🔗 Callback URL: https://your-backend.com/api/payment/razorpay-callback?razorpay_order_id=order_xxx
```

### 3. Check Callback URL
The callback URL should:
- Be HTTPS (not HTTP) in production
- Be publicly accessible (not localhost)
- Include order_id in query parameters
- Point to: `https://your-backend.com/api/payment/razorpay-callback`

## 🛠️ Quick Fix Commands

### Update Backend Environment:
```bash
cd backend
# Edit config/production.env
# Set:
# NODE_ENV=production
# FRONTEND_URL=https://getfixfly.com
# CORS_ORIGIN=https://getfixfly.com
```

### Update Frontend Environment:
```bash
cd frontend
# Create .env.production
echo "VITE_API_URL=https://your-backend-domain.com/api" > .env.production
```

### Rebuild Frontend:
```bash
cd frontend
npm run build
# Use the built files for WebView APK
```

## 📝 Important Notes

1. **HTTPS Required**: Production callback URLs must use HTTPS
2. **Public Access**: Backend must be accessible from internet (not localhost)
3. **CORS**: All frontend domains must be in CORS_ORIGIN
4. **Razorpay Keys**: Use LIVE keys in production, TEST keys only for development
5. **Environment Variables**: Must be set before building/running

## 🆘 Troubleshooting

If payment still fails:

1. **Check Backend Logs:**
   ```bash
   # PM2 logs
   pm2 logs backend
   
   # Or direct logs
   tail -f backend/logs/general-*.log
   ```

2. **Check Frontend Console:**
   - Open WebView APK
   - Enable remote debugging
   - Check console for errors

3. **Test Callback URL:**
   ```bash
   curl "https://your-backend.com/api/payment/razorpay-callback?razorpay_order_id=test&razorpay_payment_id=test"
   ```

4. **Verify Razorpay Configuration:**
   - Login to Razorpay Dashboard
   - Check API keys are LIVE keys
   - Verify webhook/callback settings

## ✅ Success Indicators

When everything is configured correctly:

1. ✅ WebView detection works
2. ✅ Callback URL is HTTPS and publicly accessible
3. ✅ Order ID is in callback URL
4. ✅ Payment completes successfully
5. ✅ Backend receives callback
6. ✅ Payment verification succeeds
7. ✅ Booking is created

---

**Last Updated:** 2025-01-21
**For:** Live WebView APK Payment Setup

