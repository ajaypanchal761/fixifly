# APK Payment Debugging Guide

## 🔴 Issue: Payment Still Failing in APK

अगर payment अभी भी fail हो रहा है, तो ये steps follow करें:

## 📋 Step-by-Step Debugging

### Step 1: Check Browser Console Logs

APK में payment attempt करते समय console logs check करें:

#### ✅ Success Indicators:
- `🔍 Is Flutter APK: true`
- `🔍 Use Redirect Mode: true`
- `🔧 Updated callback URL: https://api.getfixfly.com/api/payment/razorpay-callback`
- `✅ ✅ ✅ RAZORPAY OPTIONS VERIFIED FOR WEBVIEW ✅ ✅ ✅`
- `✅ ✅ ✅ Razorpay.open() called successfully ✅ ✅ ✅`

#### ❌ Failure Indicators:
- `❌ CRITICAL ERROR: callback_url is NOT set`
- `❌ CRITICAL ERROR: redirect is NOT true`
- `❌ ERROR OPENING RAZORPAY CHECKOUT`
- `❌ Razorpay script loaded but window.Razorpay is not available`

### Step 2: Check Error Details

अगर error आ रहा है, तो check करें:

1. **Error Type**: क्या error message क्या है?
2. **Razorpay Script**: `🔍 Check 1: Razorpay script loaded?` - Should be `true`
3. **Callback URL**: `🔍 Check 4: Options valid?` - `hasCallbackUrl` should be `true`
4. **Flutter Bridge**: `🔍 Check 7: Flutter bridge?` - Should be `true` if in Flutter WebView

### Step 3: Check localStorage

Browser console में run करें:
```javascript
// Check stored payment data
console.log('Pending Payment:', localStorage.getItem('pending_payment'));
console.log('Payment Response:', localStorage.getItem('payment_response'));
console.log('Payment Failure:', localStorage.getItem('payment_failure'));
console.log('Razorpay Open Error:', localStorage.getItem('razorpay_open_error'));
```

### Step 4: Check Backend Logs

Backend logs में check करें:
```bash
pm2 logs backend --lines 50
```

Look for:
- `🔔 🔔 🔔 RAZORPAY CALLBACK RECEIVED 🔔 🔔 🔔`
- `❌ CRITICAL: No payment data received in callback!`
- Payment verification logs

### Step 5: Verify Callback URL

Test करें कि callback URL accessible है:
```bash
curl https://api.getfixfly.com/api/payment/test-callback
```

Should return success response.

## 🔧 Common Issues & Solutions

### Issue 1: Razorpay Script Not Loading

**Symptoms**:
- `❌ Razorpay script loaded but window.Razorpay is not available`
- `🔍 Check 1: Razorpay script loaded? false`

**Solutions**:
1. Check internet connection in APK
2. Check WebView network permissions
3. Check if Razorpay CDN is blocked
4. Try reloading the page

### Issue 2: Callback URL Not Set

**Symptoms**:
- `❌ CRITICAL ERROR: callback_url is NOT set in Razorpay options!`
- `🔍 Check 4: Options valid?` - `hasCallbackUrl: false`

**Solutions**:
1. Check `VITE_API_URL` environment variable in Vercel
2. Ensure production backend URL is being used
3. Check console logs for callback URL detection

### Issue 3: Redirect Mode Not Enabled

**Symptoms**:
- `❌ CRITICAL ERROR: redirect is NOT true in Razorpay options!`
- `🔍 Check 4: Options valid?` - `redirectMode: false`

**Solutions**:
1. Ensure Flutter WebView is properly detected
2. Check `isAPKContext()` and `isInIframe()` detection
3. Verify `useRedirectMode` is `true`

### Issue 4: Payment Opens But Fails

**Symptoms**:
- `✅ Razorpay.open() called successfully`
- But payment fails or doesn't redirect

**Solutions**:
1. Check Razorpay Dashboard for payment status
2. Check backend logs for callback
3. Verify callback URL is publicly accessible
4. Check if payment.failed event is fired

### Issue 5: Payment Data Missing in Callback

**Symptoms**:
- Backend receives callback but no payment data
- `❌ CRITICAL: No payment data received in callback!`

**Solutions**:
1. Check if Razorpay is sending payment data
2. Verify callback URL format
3. Check backend callback handler logs
4. Check if order_id is in notes

## 🧪 Testing Checklist

### Before Testing:
- [ ] Backend server is running
- [ ] Backend is accessible at `https://api.getfixfly.com`
- [ ] Test callback endpoint works: `https://api.getfixfly.com/api/payment/test-callback`
- [ ] Flutter WebView has network permissions
- [ ] Internet connection is stable

### During Testing:
- [ ] Open checkout page
- [ ] Fill customer details
- [ ] Click "Pay Now"
- [ ] Check console logs for:
  - [ ] WebView detection
  - [ ] Redirect mode enabled
  - [ ] Callback URL set
  - [ ] Razorpay.open() success
- [ ] Complete payment
- [ ] Check if redirects to callback
- [ ] Verify booking created

### After Testing:
- [ ] Check browser console for errors
- [ ] Check backend logs for callback
- [ ] Check Razorpay Dashboard for payment
- [ ] Verify booking in database

## 📱 Flutter App Requirements

Flutter app में ये handlers implement करें:

```dart
// Payment Error Handler
webViewController.addJavaScriptHandler(
  handlerName: 'paymentError',
  callback: (args) {
    final error = args[0]['error'];
    final orderId = args[0]['orderId'];
    // Show error to user
    // Navigate to error page
  },
);

// Payment Success Handler (if needed)
webViewController.addJavaScriptHandler(
  handlerName: 'paymentSuccess',
  callback: (args) {
    // Handle payment success
  },
);
```

## 🔍 Debugging Commands

### Check Payment Status:
```javascript
// In browser console
console.log('Payment Context:', localStorage.getItem('payment_context'));
console.log('Pending Payment:', localStorage.getItem('pending_payment'));
console.log('Payment Response:', localStorage.getItem('payment_response'));
```

### Check WebView Detection:
```javascript
// In browser console
console.log('Is Flutter WebView:', !!(window.flutter_inappwebview));
console.log('Is In Iframe:', window.self !== window.top);
console.log('User Agent:', navigator.userAgent);
```

### Test Callback URL:
```bash
# In terminal
curl -X GET https://api.getfixfly.com/api/payment/test-callback
```

## 📞 Support

अगर issue persist हो, तो provide करें:
1. Browser console logs (full)
2. Backend logs (last 50 lines)
3. Error message (exact)
4. Steps to reproduce
5. Flutter app version
6. Device/OS information

## ✅ Expected Flow

1. User clicks "Pay Now"
2. `processBookingPayment` called
3. WebView detected → Redirect mode enabled
4. Callback URL set → `https://api.getfixfly.com/api/payment/razorpay-callback`
5. Razorpay options verified
6. `razorpay.open()` called
7. Payment page opens
8. User completes payment
9. Razorpay redirects to callback URL
10. Backend processes callback
11. Backend redirects to frontend `/payment-callback`
12. Frontend creates booking
13. User sees success message

---

**अगर ये सभी steps follow करने के बाद भी issue persist हो, तो exact error message और logs share करें।**

