# Payment Failure Debug Guide

## 🔍 Payment Failure Analysis

Screenshot se pata chal raha hai ki:
- Payment amount: ₹353
- Error: "Payment could not be completed"
- Razorpay payment gateway use ho raha hai
- WebView APK mein payment fail ho raha hai

## 🚨 Common Causes & Solutions

### 1. **Razorpay TEST Keys in Production** ⚠️ CRITICAL

**Problem:** Aap currently TEST keys use kar rahe ho (`rzp_test_*`)

**Check:**
```env
RAZORPAY_KEY_ID=rzp_test_8sYbzHWidwe5Zw  # ❌ TEST KEY
RAZORPAY_KEY_SECRET=GkxKRQ2B0U63BKBoayuugS3D  # ❌ TEST KEY
```

**Solution:**
1. Razorpay Dashboard mein jao: https://dashboard.razorpay.com/app/keys
2. **LIVE mode** toggle karo (top right)
3. **LIVE Key ID** aur **LIVE Key Secret** copy karo
4. `.env` file mein update karo:
   ```env
   RAZORPAY_KEY_ID=rzp_live_XXXXXXXXX  # ✅ LIVE KEY
   RAZORPAY_KEY_SECRET=XXXXXXXXX        # ✅ LIVE SECRET
   ```
5. Backend restart karo

**Note:** TEST keys se real payments nahi hote!

---

### 2. **Callback URL Not Accessible**

**Check Backend Logs:**
```bash
# PM2 logs check karo
pm2 logs backend

# Ya direct logs
tail -f backend/logs/general-*.log
```

**Look for:**
- `🔔 🔔 🔔 PAYMENT CALLBACK ROUTE HIT 🔔 🔔 🔔` - Agar yeh nahi dikh raha, callback URL issue hai
- `❌ CRITICAL: No payment data received in callback!` - Callback URL properly hit nahi ho rahi

**Solution:**
- Verify `FRONTEND_URL` correctly set hai
- Verify callback URL publicly accessible hai (not localhost)
- Check CORS settings

---

### 3. **Payment Method Issue**

**Possible Reasons:**
- Bank server down
- Insufficient balance
- Card/Bank declined payment
- Network timeout

**Solution:**
- Different payment method try karo (Card, UPI, Wallet)
- Network connection check karo
- Bank/Card limit check karo

---

### 4. **Environment Configuration Issues**

**Check These:**

```env
# ✅ Must be production
NODE_ENV=production

# ✅ Must be correct port
PORT=5000

# ✅ No trailing slash
CORS_ORIGIN=https://getfixfly.com

# ✅ Frontend URL set
FRONTEND_URL=https://getfixfly.com
```

---

## 🔧 Debug Steps

### Step 1: Check Browser/WebView Console

APK mein payment try karte waqt console logs check karo:

1. **Chrome DevTools** se connect karo (WebView debugging enable karo)
2. Ya Flutter WebView console check karo

**Look for:**
```
🔗 Callback URL: [should be HTTPS, not localhost]
🎯 Order ID: [should be present]
❌ Payment failed: [error details]
```

### Step 2: Check Backend Logs

```bash
# Real-time logs
pm2 logs backend --lines 100

# Or
tail -f backend/logs/general-*.log
```

**Look for:**
- Payment callback received?
- Order creation successful?
- Payment verification status?

### Step 3: Check Razorpay Dashboard

1. Razorpay Dashboard: https://dashboard.razorpay.com/app/payments
2. **LIVE mode** mein check karo
3. Payment attempts dekho
4. Error details check karo

### Step 4: Test Payment Flow

**Manual Test:**
1. Small amount se test karo (₹1)
2. Different payment method try karo
3. Check network connectivity
4. Verify callback URL accessible hai

---

## 📋 Quick Fix Checklist

- [ ] **Razorpay LIVE keys** use kar rahe ho (not TEST keys)
- [ ] `NODE_ENV=production` set hai
- [ ] `FRONTEND_URL` correctly set hai
- [ ] `CORS_ORIGIN` correctly set hai (no trailing slash)
- [ ] Backend server running hai
- [ ] Callback URL publicly accessible hai
- [ ] Network connection stable hai
- [ ] Payment method valid hai (sufficient balance, not expired)

---

## 🛠️ Immediate Actions

### 1. Verify Razorpay Keys

```bash
# Backend .env file check karo
cat backend/.env | grep RAZORPAY

# Should show LIVE keys (rzp_live_*)
# NOT test keys (rzp_test_*)
```

### 2. Check Backend Logs During Payment

```bash
# Terminal 1: Watch logs
pm2 logs backend --lines 0

# Terminal 2: Make payment in APK
# Watch Terminal 1 for callback logs
```

### 3. Test Callback URL Manually

```bash
# Test if callback URL is accessible
curl -X GET "https://your-backend-url.com/api/payment/razorpay-callback?test=1"

# Should return HTML page, not error
```

### 4. Check Payment in Razorpay Dashboard

1. Go to: https://dashboard.razorpay.com/app/payments
2. Switch to **LIVE mode**
3. Check if payment attempt visible hai
4. Check error details

---

## 🎯 Most Likely Issue

**Based on your configuration, most likely issue is:**

### ❌ TEST Keys in Production

Aap currently **TEST keys** use kar rahe ho:
- `RAZORPAY_KEY_ID=rzp_test_8sYbzHWidwe5Zw` ❌

**TEST keys se real payments nahi hote!**

**Fix:**
1. Razorpay Dashboard → LIVE mode
2. Copy LIVE keys
3. Update `.env` file
4. Restart backend

---

## 📞 Additional Debugging

### Enable More Logging

Backend mein already detailed logging hai. Check karo:

```javascript
// Payment callback logs
🔔 🔔 🔔 PAYMENT CALLBACK ROUTE HIT 🔔 🔔 🔔

// Payment failure logs  
❌ ❌ ❌ PAYMENT FAILURE CALLBACK RECEIVED ❌ ❌ ❌

// Payment success logs
✅ ✅ ✅ PAYMENT SUCCESS ✅ ✅ ✅
```

### Check Payment Response

Frontend console mein check karo:
```javascript
// Payment failure event
❌ ========== PAYMENT.FAILED EVENT FIRED ==========
❌ Error Object: {...}
❌ Error Description: "..."
```

---

## 🚀 Next Steps

1. **Verify Razorpay Keys** - Most important!
2. **Check Backend Logs** - See if callback received
3. **Test with Different Payment Method** - Rule out payment method issue
4. **Check Network** - Ensure stable connection
5. **Verify Environment Variables** - All correctly set

---

## 💡 Pro Tips

1. **Always use LIVE keys in production**
2. **Test with small amounts first** (₹1)
3. **Check Razorpay Dashboard** for detailed error messages
4. **Monitor backend logs** during payment attempts
5. **Use different payment methods** to isolate issue

---

## 📝 Error Code Reference

Common Razorpay error codes:
- `BAD_REQUEST_ERROR` - Invalid request
- `GATEWAY_ERROR` - Payment gateway issue
- `SERVER_ERROR` - Razorpay server issue
- `BAD_REQUEST_ERROR` - Invalid payment method

Check Razorpay Dashboard for specific error details.

