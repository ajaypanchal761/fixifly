# WebView APK Payment Success - Step by Step Guide

## 🎯 Overview
Yeh guide WebView/APK mein payment success karne ke liye step-by-step instructions deta hai.

---

## 📋 Prerequisites Check

### Step 1: Backend Server Verify Karein
```bash
# SSH into Contabo VPS
ssh root@your-contabo-server

# PM2 status check
pm2 status

# Backend logs check
pm2 logs backend --lines 50

# Test callback endpoint
curl https://api.getfixfly.com/api/payment/test-callback
```

**Expected Output:**
```json
{"success":true,"message":"Payment callback route is accessible"}
```

✅ **Agar yeh response aata hai, backend accessible hai.**

---

### Step 2: Environment Variables Verify Karein

#### Backend (Contabo VPS):
```bash
# Check production.env file
cat /root/fixifly/backend/config/production.env | grep -E "RAZORPAY|FRONTEND_URL|DEEP_LINK"
```

**Required Variables:**
- `RAZORPAY_KEY_ID` - Razorpay Key ID
- `RAZORPAY_KEY_SECRET` - Razorpay Key Secret
- `FRONTEND_URL` - Frontend URL (e.g., `https://www.getfixfly.com`)
- `DEEP_LINK_SCHEME` - Deep link scheme (if using)

#### Frontend (Vercel):
Check `VITE_API_URL` in Vercel environment variables:
- Should be: `https://api.getfixfly.com/api` (NOT localhost)

---

## 🔧 Step-by-Step Fix Process

### Step 3: Frontend Rebuild Karein

```bash
# Frontend directory mein jao
cd frontend

# Dependencies install (agar needed)
npm install

# Production build
npm run build

# Vercel deploy
vercel --prod
```

**Important:** Build ke baad verify karein ki:
- `dist/` folder mein files generate hui hain
- `VITE_API_URL` correctly set hai

---

### Step 4: Backend Restart Karein

```bash
# SSH into Contabo VPS
ssh root@your-contabo-server

# PM2 restart
pm2 restart backend

# Logs check
pm2 logs backend --lines 20
```

**Expected:** Server should start without errors.

---

### Step 5: Razorpay Dashboard Check

1. Razorpay Dashboard login: https://dashboard.razorpay.com
2. **Settings → Webhooks** check karein:
   - Webhook URL set hai ya nahi
   - Active webhooks list mein check karein

3. **Settings → API Keys** verify karein:
   - Key ID aur Key Secret correct hain
   - Test/Live mode check karein

---

## 🧪 Testing Steps

### Step 6: WebView APK Mein Test Karein

1. **APK Install Karein** (agar already installed hai, uninstall karke reinstall karein)

2. **Service Book Karein:**
   - App open karein
   - Service select karein
   - Checkout page pe jao
   - Customer details fill karein

3. **Payment Initiate Karein:**
   - Razorpay payment select karein
   - "Pay Now" button click karein

4. **Browser Console Logs Check Karein:**
   - WebView mein developer tools enable karein (agar possible ho)
   - Ya Flutter WebView debug mode enable karein
   - Console logs check karein:

**Expected Logs:**
```
🔍 ========== PAYMENT CONTEXT DETECTION ==========
🔍 Is APK/WebView: true
🔍 Use Redirect Mode: true
🔍 User Agent: Mozilla/5.0 (Linux; Android ... wv) ...
🔍 ===============================================

🔗 ========== CALLBACK URL VERIFICATION ==========
🔗 Full Callback URL: https://api.getfixfly.com/api/payment/razorpay-callback
🔗 Callback URL Protocol: https:
🔗 Callback URL Host: api.getfixfly.com
🔗 Callback URL is Public: true
🔗 Callback URL is HTTPS: true
✅ Callback URL matches expected format
🔗 ============================================

⚙️ ========== RAZORPAY OPTIONS SUMMARY ==========
⚙️ Options.redirect: true
⚙️ Options.callback_url: https://api.getfixfly.com/api/payment/razorpay-callback
⚙️ Options.order_id: order_XXXXX
⚙️ Options.amount: 35300
⚙️ Options.key: SET
⚙️ Options.handler: SET
⚙️ ===========================================

🔍 ========== FINAL RAZORPAY OPTIONS CHECK ==========
🔍 Redirect Mode: true
🔍 Callback URL: https://api.getfixfly.com/api/payment/razorpay-callback
🔍 Options has redirect: true
🔍 Options has callback_url: true
🔍 Options callback_url value: https://api.getfixfly.com/api/payment/razorpay-callback
✅ ✅ ✅ RAZORPAY OPTIONS VERIFIED FOR WEBVIEW ✅ ✅ ✅
```

5. **Payment Complete Karein:**
   - Razorpay payment page pe payment complete karein
   - Success ya failure ke baad redirect check karein

---

### Step 7: Backend Logs Check Karein

```bash
# Real-time logs
pm2 logs backend --lines 100

# Ya specific log file
tail -f /root/.pm2/logs/backend-out.log
```

**Expected Logs (Payment Success Case):**
```
🌐 🌐 🌐 INCOMING REQUEST (PAYMENT/BOOKING) 🌐 🌐 🌐
🌐 Method: POST
🌐 Path: /api/payment/create-order
...

💰 💰 💰 CREATING RAZORPAY ORDER 💰 💰 💰
✅ ✅ ✅ RAZORPAY ORDER CREATED SUCCESSFULLY ✅ ✅ ✅
✅ Order ID: order_XXXXX

🌐 🌐 🌐 INCOMING REQUEST (PAYMENT/BOOKING) 🌐 🌐 🌐
🌐 Method: GET (or POST)
🌐 Path: /api/payment/razorpay-callback
🌐 Query: { razorpay_order_id: 'order_XXXXX', razorpay_payment_id: 'pay_XXXXX', ... }

🔀 ========== RAZORPAY REDIRECT CALLBACK RECEIVED ==========
🔀 Payment ID: pay_XXXXX
🔀 Order ID: order_XXXXX
🔀 Redirecting to frontend...
```

**Expected Logs (Payment Failed Case):**
```
❌ ❌ ❌ ========== PAYMENT FAILED EVENT (WEBVIEW) ========== ❌ ❌ ❌
❌ Error Code: ...
❌ Error Description: ...
❌ Error Reason: ...
```

---

## 🐛 Common Issues aur Solutions

### Issue 1: Callback URL Not Hit
**Symptoms:**
- Payment order create ho raha hai
- Lekin callback logs nahi aa rahe

**Solution:**
1. Verify callback URL publicly accessible hai:
   ```bash
   curl https://api.getfixfly.com/api/payment/test-callback
   ```

2. Razorpay Dashboard mein webhook URL check karein

3. Frontend console logs mein callback URL verify karein:
   - Should be: `https://api.getfixfly.com/api/payment/razorpay-callback`
   - NOT: `http://localhost:5000/api/payment/razorpay-callback`

### Issue 2: Payment Failed Event Firing
**Symptoms:**
- Payment attempt ke baad `payment.failed` event fire ho raha hai

**Solution:**
1. Browser console logs check karein:
   - Error code kya hai?
   - Error description kya hai?
   - Error reason kya hai?

2. Common reasons:
   - **Insufficient funds** - User ke paas paise nahi hain
   - **Card declined** - Bank ne decline kar diya
   - **Network error** - Internet connection issue
   - **Invalid order** - Order ID invalid hai

3. Razorpay Dashboard mein payment logs check karein:
   - https://dashboard.razorpay.com/app/payments
   - Failed payments section mein check karein

### Issue 3: Redirect Not Working
**Symptoms:**
- Payment success ho raha hai
- Lekin callback page pe redirect nahi ho raha

**Solution:**
1. Backend callback route check karein:
   ```bash
   # Backend logs mein check karein
   pm2 logs backend | grep "razorpay-callback"
   ```

2. Frontend `PaymentCallback.tsx` page check karein:
   - URL parameters properly extract ho rahe hain?
   - Payment verification call ho raha hai?

3. `localStorage` check karein:
   - `payment_response` stored hai?
   - `pending_payment` stored hai?

---

## ✅ Success Checklist

Payment success hone ke liye yeh sab verify karein:

- [ ] Backend server running hai (PM2 status)
- [ ] Backend callback route accessible hai (`/api/payment/test-callback`)
- [ ] Frontend rebuild ho chuka hai aur Vercel pe deploy ho chuka hai
- [ ] `VITE_API_URL` correctly set hai (NOT localhost)
- [ ] Razorpay options mein `redirect: true` set hai
- [ ] Razorpay options mein `callback_url` set hai: `https://api.getfixfly.com/api/payment/razorpay-callback`
- [ ] Browser console logs mein callback URL correct dikh raha hai
- [ ] Payment attempt ke baad backend logs mein callback route hit ho raha hai
- [ ] Payment success ke baad booking create ho raha hai

---

## 📞 Debugging Commands

### Backend Logs (Real-time):
```bash
pm2 logs backend --lines 200
```

### Backend Logs (Last 50 lines):
```bash
pm2 logs backend --lines 50 | tail -50
```

### Test Callback Endpoint:
```bash
curl https://api.getfixfly.com/api/payment/test-callback
```

### Check Backend Status:
```bash
pm2 status
pm2 info backend
```

### Restart Backend:
```bash
pm2 restart backend
```

---

## 🎯 Final Verification

Payment success hone ke baad verify karein:

1. **Backend Logs:**
   - Callback route hit hua
   - Payment verification successful
   - Booking created successfully

2. **Frontend:**
   - Payment callback page pe redirect hua
   - Booking confirmation message dikha
   - Booking details correctly display ho rahe hain

3. **Database:**
   - Booking record created hai
   - Payment status: `completed`
   - Payment details correctly stored hain

---

## 📝 Notes

- **WebView Detection:** Code automatically detect karta hai ki WebView mein run ho raha hai
- **Redirect Mode:** WebView mein automatically redirect mode enable ho jata hai
- **Callback URL:** Backend callback URL publicly accessible hona chahiye
- **Logging:** Detailed logs har step pe available hain debugging ke liye

---

## 🆘 Agar Abhi Bhi Issue Hai

Agar abhi bhi payment fail ho raha hai, to yeh information share karein:

1. **Browser Console Logs** (payment attempt ke time)
2. **Backend Logs** (last 100 lines)
3. **Razorpay Dashboard** mein payment status
4. **Error Message** (agar koi specific error aa raha hai)

Yeh information se exact issue identify kar sakte hain.

