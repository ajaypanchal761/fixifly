# Mobile App Payment Gateway Testing Guide

## 📱 Mobile App Mein Payment Gateway Test Kaise Karein

### Step 1: App Ko Open Karein
1. Mobile app install karein (APK ya app store se)
2. App open karein
3. Login karein (agar required ho)

---

### Step 2: Payment Flow Test Karein

#### Test Case 1: Support Ticket Payment
1. **Support Ticket Create Karein:**
   - Support section mein jayein
   - New ticket create karein
   - Vendor ko assign ho jane dein
   - Vendor ticket complete karega

2. **Payment Button Click Karein:**
   - "Pay Now" ya "Make Payment" button dikhega
   - Button click karein

3. **Expected Behavior:**
   - ✅ Razorpay checkout modal open hona chahiye
   - ✅ Amount sahi show hona chahiye
   - ✅ Payment methods dikhne chahiye (Card, UPI, Net Banking, Wallet)

4. **Payment Complete Karein:**
   - Test card use karein:
     - **Card:** `4111 1111 1111 1111`
     - **CVV:** `123`
     - **Expiry:** `12/25`
     - **Name:** Kuch bhi
   - Pay button click karein

5. **Success Check:**
   - ✅ Payment success message aana chahiye
   - ✅ Ticket status "Resolved" ho jana chahiye
   - ✅ Payment ID save hona chahiye

---

#### Test Case 2: Booking Payment
1. **Service Booking Create Karein:**
   - Services section mein jayein
   - Service select karein
   - Booking details fill karein
   - Checkout page par jayein

2. **Payment Method Select Karein:**
   - "Pay with Razorpay" select karein
   - Payment button click karein

3. **Expected Behavior:**
   - ✅ Razorpay checkout open hona chahiye
   - ✅ Booking amount sahi show hona chahiye

4. **Payment Complete Karein:**
   - Same test card use karein
   - Payment complete karein

5. **Success Check:**
   - ✅ Booking confirmed message aana chahiye
   - ✅ Booking reference number milna chahiye

---

#### Test Case 3: AMC Subscription Payment
1. **AMC Plan Select Karein:**
   - AMC section mein jayein
   - Plan select karein
   - Subscribe button click karein

2. **Payment Complete Karein:**
   - Payment modal open hoga
   - Test card se payment karein

3. **Success Check:**
   - ✅ Subscription active ho jana chahiye
   - ✅ Payment verified message aana chahiye

---

### Step 3: Console Logs Check Karein

#### Android App (Chrome DevTools):
1. **USB Debugging Enable Karein:**
   - Phone settings → Developer options → USB debugging ON
   - Phone ko computer se connect karein

2. **Chrome DevTools Open Karein:**
   - Chrome browser mein jayein
   - Address bar: `chrome://inspect`
   - Your device dikhega
   - "inspect" click karein

3. **Console Tab Open Karein:**
   - Console tab mein ye logs dikhne chahiye:
   ```
   📱 Mobile webview detected, loading Razorpay with mobile configuration
   ✅ Razorpay script loaded successfully
   💳 Processing payment, isMobile: true
   💳 Opening Razorpay checkout
   ✅ Razorpay checkout opened
   ```

#### iOS App (Safari Web Inspector):
1. **Settings → Safari → Advanced → Web Inspector ON**
2. **Mac par Safari open karein**
3. **Develop → [Your Device] → [Your App]**
4. **Console logs check karein**

---

### Step 4: Common Issues aur Solutions

#### Issue 1: Razorpay Modal Open Nahi Ho Raha
**Symptoms:**
- Payment button click karne par kuch nahi hota
- Error message: "Razorpay SDK failed to load"

**Check Karein:**
1. Console logs check karein
2. Internet connection check karein
3. Retry mechanism kaam kar raha hai ya nahi

**Expected Logs:**
```
📱 Retrying Razorpay script load for mobile...
✅ Razorpay script loaded successfully
```

---

#### Issue 2: Payment Complete Hone Ke Baad Error
**Symptoms:**
- Payment ho jata hai Razorpay mein
- Lekin app mein error aata hai

**Check Karein:**
1. Payment verification API call ho rahi hai ya nahi
2. Network tab mein verify request check karein
3. Backend logs check karein

**Expected:**
- Payment verify API call successful honi chahiye
- Response: `{ success: true }`

---

#### Issue 3: Script Loading Timeout
**Symptoms:**
- "Razorpay payment gateway failed to load" error

**Solutions:**
1. Internet connection check karein
2. App ko restart karein
3. Retry mechanism automatically kaam karega (5 seconds wait)

---

### Step 5: Network Tab Check Karein

#### Chrome DevTools Network Tab:
1. **Network tab open karein**
2. **Payment flow start karein**
3. **Ye API calls dikhni chahiye:**

**a) Create Order:**
```
POST /api/payment/create-order
Status: 200 OK
Response: { success: true, data: { id: "order_xxx" } }
```

**b) Payment Verify (After Payment):**
```
POST /api/payment/verify
OR
POST /api/support-tickets/payment/verify
Status: 200 OK
Response: { success: true }
```

---

### Step 6: Test Scenarios

#### ✅ Success Scenario:
1. Payment button click
2. Razorpay modal open
3. Test card details enter
4. Payment successful
5. Success message show
6. Status update ho jaye

#### ❌ Failure Scenario:
1. Payment button click
2. Razorpay modal open
3. Payment cancel karein
4. Modal close ho jaye
5. No error (normal behavior)

#### ⚠️ Error Scenario:
1. Internet disconnect karein
2. Payment button click
3. Error message: "Razorpay payment gateway failed to load"
4. Retry option dikhe (agar implement kiya ho)

---

### Step 7: Checklist

#### Pre-Testing:
- [ ] App properly installed hai
- [ ] Internet connection active hai
- [ ] User logged in hai
- [ ] Test card details ready hain

#### During Testing:
- [ ] Payment button click karne par Razorpay modal open ho raha hai
- [ ] Amount sahi show ho raha hai
- [ ] Payment methods available hain
- [ ] Test card se payment ho raha hai
- [ ] Payment success message aa raha hai
- [ ] Status update ho raha hai

#### Post-Testing:
- [ ] Console logs check kiye
- [ ] Network requests successful hain
- [ ] Backend mein payment verified ho raha hai
- [ ] Database mein payment details save ho rahe hain

---

### Step 8: Debugging Tips

#### Console Logs Dekhne Ke Liye:
```javascript
// Ye logs dikhne chahiye:
📱 Mobile webview detected
✅ Razorpay script loaded successfully
💳 Processing payment, isMobile: true
💳 Opening Razorpay checkout
✅ Razorpay checkout opened
```

#### Network Requests Check:
1. Network tab open karein
2. Filter: "payment" ya "razorpay"
3. Requests check karein:
   - Status code: 200 (success)
   - Response: `{ success: true }`

#### Backend Logs Check:
Backend console mein ye logs dikhne chahiye:
```
Creating Razorpay order with options: {...}
Razorpay order created successfully: order_xxx
Payment verification successful
```

---

### Step 9: Test Card Details

#### Success Card:
- **Card Number:** `4111 1111 1111 1111`
- **CVV:** `123`
- **Expiry:** `12/25` (koi bhi future date)
- **Name:** Test User

#### Failure Card (Testing ke liye):
- **Card Number:** `4000 0000 0000 0002`
- **CVV:** `123`
- **Expiry:** `12/25`

---

### Step 10: Quick Test Commands

#### App Console Mein Check Karein:
```javascript
// Razorpay loaded hai ya nahi
console.log(window.Razorpay);

// Mobile detection
const isMobile = /wv|WebView/i.test(navigator.userAgent);
console.log('Is Mobile:', isMobile);
```

---

## ✅ Success Criteria

Payment gateway sahi chal raha hai agar:

1. ✅ Razorpay modal open ho raha hai
2. ✅ Payment complete ho raha hai
3. ✅ Success message aa raha hai
4. ✅ Status update ho raha hai
5. ✅ Console logs sahi hain
6. ✅ Network requests successful hain
7. ✅ Backend verification successful hai

---

## 🐛 Common Errors aur Solutions

### Error 1: "Razorpay SDK failed to load"
**Solution:**
- Internet connection check karein
- App restart karein
- Retry mechanism automatically kaam karega

### Error 2: "Payment gateway not available"
**Solution:**
- Console logs check karein
- Script loading issue ho sakta hai
- Network tab mein script request check karein

### Error 3: "Payment verification failed"
**Solution:**
- Backend logs check karein
- Razorpay keys sahi hain ya nahi verify karein
- Network request successful hai ya nahi check karein

---

## 📞 Support

Agar koi issue aaye:
1. Console logs screenshot lein
2. Network tab screenshots lein
3. Error message note karein
4. Steps to reproduce note karein

---

## 🎯 Quick Test Summary

1. **App open karein** → Login karein
2. **Payment flow start karein** → Support ticket/Booking/AMC
3. **Payment button click karein** → Razorpay modal open hona chahiye
4. **Test card se payment karein** → `4111 1111 1111 1111`
5. **Success check karein** → Message aur status update
6. **Console logs check karein** → Mobile detection aur script loading
7. **Network tab check karein** → API calls successful

**Agar sab steps successful hain, toh payment gateway sahi chal raha hai! ✅**

