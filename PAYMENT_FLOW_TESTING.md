# Payment Flow Testing Guide

## Overview
Yeh document payment flow ko test karne ke liye step-by-step guide hai. Sabhi logs live server console par dikhenge.

## Prerequisites
1. Backend server running (port 5000)
2. Frontend app running (port 8080 ya 5173)
3. Razorpay test credentials configured
4. Browser console open (F12)

## Test Scenario 1: Web Browser (Modal Mode)

### Step 1: Service Select Karein
1. Frontend app kholo
2. Koi service select karo
3. "Book Now" button click karo
4. Checkout page par jao

### Step 2: Customer Information Fill Karein
- Name: Test User
- Email: test@example.com
- Phone: +919876543210
- Address: Complete address fill karo
- Date & Time: Select karo
- Issue Description: Kuch bhi likho

### Step 3: Payment Method Select Karein
- "Razorpay" payment method select karo
- "Pay Now" button click karo

### Step 4: Console Logs Check Karein

**Frontend Console (Browser):**
```
💳 ========== INITIATING RAZORPAY PAYMENT ==========
💰 ========== STEP 2: CREATING RAZORPAY ORDER ==========
✅ ========== STEP 3: RAZORPAY ORDER CREATED ==========
⚙️ ========== STEP 5: RAZORPAY OPTIONS CONFIGURATION ==========
🎯 ========== STEP 6: OPENING RAZORPAY CHECKOUT (BOOKING) ==========
✅ Payment handler called (Modal Mode)
```

**Backend Console (Server):**
```
💳 💳 💳 CREATE PAYMENT ORDER REQUEST 💳 💳 💳
✅ ✅ ✅ PAYMENT ORDER CREATED SUCCESSFULLY ✅ ✅ ✅
```

### Step 5: Razorpay Payment Complete Karein
1. Razorpay modal mein payment details enter karo
2. Test card: 4111 1111 1111 1111
3. CVV: 123
4. Expiry: Koi future date
5. "Pay" button click karo

### Step 6: Success Logs Check Karein

**Frontend Console:**
```
✅ Payment successful, booking created
✅ Booking Reference: FIX12345678
```

**Backend Console:**
```
💳 💳 💳 BOOKING WITH PAYMENT REQUEST RECEIVED 💳 💳 💳
🔍 Payment Data Extracted
✅ ✅ ✅ BOOKING CREATED SUCCESSFULLY ✅ ✅ ✅
```

## Test Scenario 2: Mobile App/WebView (Redirect Mode)

### Step 1-3: Same as Web Browser

### Step 4: WebView Detection
**Frontend Console:**
```
🔍 Booking Payment - WebView detection: { isAPK: true, useRedirectMode: true }
💾 Stored booking payment info in localStorage for callback handling
```

### Step 5: Payment Complete Karein
1. Razorpay payment complete karo
2. Callback URL par redirect hoga

### Step 6: Backend Callback Logs

**Backend Console:**
```
🔔 🔔 🔔 STEP 1: RAZORPAY CALLBACK RECEIVED 🔔 🔔 🔔
📋 ========== STEP 2: EXTRACTING PAYMENT DATA ==========
🔍 ========== STEP 3: DETECTING WEBVIEW CONTEXT ==========
🔍 ========== STEP 6: VERIFYING PAYMENT IN CALLBACK HANDLER ==========
✅ Payment verified in callback handler
✅ ✅ ✅ BOOKING PAYMENT UPDATED IN CALLBACK ✅ ✅ ✅
```

### Step 7: Frontend Callback Page
**Frontend Console:**
```
📱 ========== STEP 1: PAYMENT CALLBACK PAGE LOADED ==========
📋 ========== STEP 2: EXTRACTING URL PARAMETERS ==========
🔍 ========== STEP 3: EXTRACTING PAYMENT DATA FROM URL ==========
✅ ========== STEP 6: PAYMENT VERIFICATION SUCCESS ==========
📋 Detected pending booking from checkout - creating booking now...
✅ Booking created successfully from payment callback
```

## Expected Logs Summary

### Successful Payment Flow Logs:

1. **Payment Order Creation:**
   - Backend: `CREATE PAYMENT ORDER REQUEST`
   - Backend: `PAYMENT ORDER CREATED SUCCESSFULLY`

2. **Payment Verification:**
   - Backend: `RAZORPAY CALLBACK RECEIVED` (WebView mode)
   - Backend: `PAYMENT VERIFICATION REQUEST` (Modal mode)
   - Backend: `PAYMENT VERIFICATION SUCCESS`

3. **Booking Creation:**
   - Backend: `BOOKING WITH PAYMENT REQUEST RECEIVED`
   - Backend: `BOOKING CREATED SUCCESSFULLY`
   - Frontend: `Payment successful, booking created`

### Error Logs (if any):

1. **Payment Verification Failed:**
   - Backend: `PAYMENT VERIFICATION FAILED`
   - Frontend: `Payment verification failed`

2. **Booking Creation Failed:**
   - Backend: `BOOKING CREATION ERROR`
   - Frontend: `Payment successful but booking creation failed`

## Live Server Logs Monitoring

### PM2 Logs (if using PM2):
```bash
pm2 logs fixfly-backend
```

### Direct Server Logs:
```bash
# Terminal mein backend server logs dikhenge
# Ya server.js file run karo
node server.js
```

### Log Files:
- Location: `backend/logs/`
- Files:
  - `general-YYYY-MM-DD.log` - General logs
  - `error-YYYY-MM-DD.log` - Error logs

## Testing Checklist

- [ ] Web browser modal mode test
- [ ] Mobile app/WebView redirect mode test
- [ ] Payment success logs check
- [ ] Booking creation logs check
- [ ] Error handling logs check (if payment fails)
- [ ] Console logs verify (frontend)
- [ ] Server logs verify (backend)

## Common Issues & Solutions

### Issue 1: Payment modal nahi khulta
**Solution:** Browser console check karo, JavaScript errors dekhne ko milenge

### Issue 2: Booking create nahi hota
**Solution:** Backend logs check karo, payment verification status dekhne ko milega

### Issue 3: Callback redirect nahi hota
**Solution:** WebView mode mein callback URL check karo, backend logs mein callback receive hua ya nahi

## Notes

- Sabhi logs timestamp ke saath honge
- Payment ID aur Order ID har log mein include hoga
- Error cases mein detailed error messages milenge
- Logs both console aur log files mein save honge

