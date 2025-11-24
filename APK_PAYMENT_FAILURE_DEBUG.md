# APK Payment Failure Debug Guide

## 🎯 Current Issue
Payment fail ho raha hai APK mein jab user service book karta hai.

---

## 🔍 Debugging Steps

### Step 1: Check Browser Console Logs (APK)

APK mein payment attempt ke time console logs check karein:

```bash
# ADB logcat se console logs
adb logcat | grep -i "console\|razorpay\|payment\|booking"
```

**Expected Logs:**
```
🔍 ========== PAYMENT CONTEXT DETECTION ==========
🔍 Is APK/WebView: true
🔍 Is In Iframe: true
🔍 Use Redirect Mode: true
🔗 Callback URL: https://api.getfixfly.com/api/payment/razorpay-callback
```

### Step 2: Check Backend Logs

```bash
# SSH into Contabo VPS
ssh root@your-contabo-server

# Real-time logs
pm2 logs backend --lines 200
```

**Expected Logs Sequence:**
1. **Order Creation:**
   ```
   💰 💰 💰 CREATING RAZORPAY ORDER 💰 💰 💰
   ✅ ✅ ✅ RAZORPAY ORDER CREATED SUCCESSFULLY ✅ ✅ ✅
   ✅ Order ID: order_XXXXX
   ```

2. **Payment Callback (if hit):**
   ```
   🔔 🔔 🔔 RAZORPAY CALLBACK RECEIVED 🔔 🔔 🔔
   💳 💳 💳 VERIFYING PAYMENT STATUS FROM RAZORPAY 💳 💳 💳
   ```

3. **Booking Creation (if successful):**
   ```
   📝 📝 📝 CREATING BOOKING WITH PAYMENT VERIFICATION 📝 📝 📝
   ✅ ✅ ✅ BOOKING CREATED SUCCESSFULLY ✅ ✅ ✅
   ```

### Step 3: Check Payment Status in Razorpay Dashboard

1. Razorpay Dashboard: https://dashboard.razorpay.com
2. **Payments** section mein check karein
3. Order ID se payment search karein
4. Payment status check karein:
   - ✅ **Success:** Payment successful hai
   - ❌ **Failed:** Payment fail ho gaya
   - ⏳ **Pending:** Payment abhi process ho raha hai

---

## 🐛 Common Issues & Solutions

### Issue 1: Payment Order Create Ho Raha Hai But Callback Hit Nahi Ho Raha

**Symptoms:**
- Backend logs mein order creation dikh raha hai
- Lekin callback route hit nahi ho raha
- Payment status logs nahi aa rahe

**Possible Causes:**
1. **Callback URL Not Publicly Accessible**
   - Razorpay servers se backend reachable nahi hai
   - Solution: Test callback endpoint:
     ```bash
     curl https://api.getfixfly.com/api/payment/test-callback
     ```

2. **Razorpay Options Not Set Correctly**
   - `redirect: true` set nahi hai
   - `callback_url` missing hai
   - Solution: Browser console logs check karein:
     ```
     🔗 Callback URL: https://api.getfixfly.com/api/payment/razorpay-callback
     🔍 Options has redirect: true
     🔍 Options has callback_url: true
     ```

3. **WebView Redirect Blocked**
   - WebView redirect block kar raha hai
   - Solution: Check WebView settings in Flutter app

### Issue 2: Payment Failed Event Firing

**Symptoms:**
- Browser console mein `payment.failed` event fire ho raha hai
- Error code/description dikh raha hai

**Possible Causes:**
1. **Insufficient Funds**
   - User ke paas paise nahi hain
   - Solution: Test card use karein

2. **Card Declined**
   - Bank ne decline kar diya
   - Solution: Different card try karein

3. **Network Error**
   - Internet connection issue
   - Solution: Network check karein

4. **Invalid Order**
   - Order ID invalid hai
   - Solution: Backend logs check karein

**Check Error Details:**
```javascript
// Browser console mein
❌ Error Code: [code]
❌ Error Description: [description]
❌ Error Reason: [reason]
```

### Issue 3: Payment Success But Booking Not Created

**Symptoms:**
- Payment successful hai Razorpay mein
- Lekin booking create nahi ho rahi
- Backend logs mein booking creation logs nahi aa rahe

**Possible Causes:**
1. **PaymentCallback Page Not Loading**
   - Callback page pe redirect nahi ho raha
   - Solution: Check URL redirect logs

2. **Pending Payment Data Missing**
   - `localStorage` mein `pending_payment` missing hai
   - Solution: Check browser console:
     ```javascript
     localStorage.getItem('pending_payment')
     ```

3. **Booking Creation API Call Failed**
   - `/bookings/with-payment` endpoint fail ho raha hai
   - Solution: Backend logs check karein

---

## 🔧 Quick Fixes

### Fix 1: Verify Callback URL

```bash
# Test callback endpoint
curl https://api.getfixfly.com/api/payment/test-callback

# Expected: {"success":true,"message":"Payment callback route is accessible"}
```

### Fix 2: Check Razorpay Options

Browser console mein verify karein:
```javascript
// Payment initiate ke time
🔗 Callback URL: https://api.getfixfly.com/api/payment/razorpay-callback
🔍 Options has redirect: true
🔍 Options has callback_url: true
```

### Fix 3: Check Payment Status

Razorpay Dashboard mein:
1. Order ID se payment search karein
2. Payment status check karein
3. Error details check karein (agar failed hai)

### Fix 4: Verify Backend Logs

```bash
# Real-time monitoring
pm2 logs backend --lines 200 | grep -i "payment\|booking\|callback"
```

---

## 📋 Debugging Checklist

- [ ] Browser console logs check kiye (payment attempt ke time)
- [ ] Backend logs check kiye (order creation aur callback)
- [ ] Razorpay Dashboard mein payment status check kiya
- [ ] Callback URL publicly accessible hai (test endpoint se verify kiya)
- [ ] Razorpay options properly set hain (redirect: true, callback_url)
- [ ] Payment.failed event details check kiye (error code, description)
- [ ] Pending payment data localStorage mein hai
- [ ] Booking creation API call ho raha hai

---

## 🎯 Expected Flow

### Success Flow:
1. **User clicks "Pay Now"** → Checkout page
2. **Order Created** → Backend logs: `✅ RAZORPAY ORDER CREATED`
3. **Razorpay Opens** → Payment page
4. **User Completes Payment** → Payment successful
5. **Razorpay Redirects** → Backend callback route hit
6. **Backend Verifies Payment** → Backend logs: `💳 VERIFYING PAYMENT STATUS`
7. **Backend Redirects to Frontend** → PaymentCallback page
8. **Frontend Verifies Payment** → Payment verification API call
9. **Booking Created** → Backend logs: `✅ BOOKING CREATED SUCCESSFULLY`
10. **User Redirected** → Booking confirmation page

### Failure Flow:
1. **User clicks "Pay Now"** → Checkout page
2. **Order Created** → Backend logs: `✅ RAZORPAY ORDER CREATED`
3. **Razorpay Opens** → Payment page
4. **Payment Fails** → `payment.failed` event fires
5. **Error Redirect** → Backend callback with error
6. **Backend Logs Error** → Backend logs: `❌ PAYMENT FAILED`
7. **Frontend Shows Error** → Error message displayed

---

## 📞 Information Needed for Debugging

Agar abhi bhi issue ho, to yeh information share karein:

1. **Browser Console Logs** (payment attempt ke time)
   - Payment context detection logs
   - Callback URL configuration logs
   - Payment.failed event logs (agar fail ho)

2. **Backend Logs** (last 100 lines)
   - Order creation logs
   - Callback route hit logs (agar hit ho)
   - Payment verification logs
   - Booking creation logs

3. **Razorpay Dashboard**
   - Payment status
   - Error details (agar failed hai)
   - Payment ID aur Order ID

4. **Payment Flow**
   - Kya payment page open ho raha hai?
   - Payment complete ho raha hai ya fail?
   - Kya callback page pe redirect ho raha hai?

---

## ✅ Next Steps

1. **Browser Console Logs Check Karein:**
   ```bash
   adb logcat | grep -i "console\|razorpay\|payment"
   ```

2. **Backend Logs Check Karein:**
   ```bash
   pm2 logs backend --lines 200
   ```

3. **Razorpay Dashboard Check Karein:**
   - Payment status
   - Error details

4. **Test Callback Endpoint:**
   ```bash
   curl https://api.getfixfly.com/api/payment/test-callback
   ```

Yeh information se exact issue identify kar sakte hain.

