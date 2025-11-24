# Payment Debugging Guide

## Payment Fail Ho Raha Hai? Yeh Steps Follow Karein

### Step 1: Console Logs Check Karein

**Frontend (Browser Console - F12):**
1. Payment attempt karein
2. Console mein yeh logs dekhenge:
   - `💳 ========== INITIATING RAZORPAY PAYMENT ==========`
   - `✅ ========== STEP 3: RAZORPAY ORDER CREATED ==========`
   - `❌ ========== PAYMENT FAILED IN CHECKOUT ==========` (agar fail hua)

**Backend (Server Console):**
1. Server terminal mein yeh logs dekhenge:
   - `💳 💳 💳 CREATE PAYMENT ORDER REQUEST 💳 💳 💳`
   - `✅ ✅ ✅ PAYMENT ORDER CREATED SUCCESSFULLY ✅ ✅ ✅`
   - `💳 💳 💳 BOOKING WITH PAYMENT REQUEST RECEIVED 💳 💳 💳`
   - `❌ ❌ ❌ PAYMENT VERIFICATION FAILED ❌ ❌ ❌` (agar fail hua)

### Step 2: Common Errors Aur Solutions

#### Error 1: "Payment ID is missing"
**Reason:** Payment data properly pass nahi ho raha
**Solution:**
- Check karein ki Razorpay payment complete hua ya nahi
- Browser console mein payment response check karein
- Payment callback properly trigger ho raha hai ya nahi

#### Error 2: "Payment verification failed"
**Reason:** Payment Razorpay mein exist karta hai but verification fail ho raha hai
**Solution:**
- Backend logs mein payment status check karein
- Payment ID se Razorpay dashboard mein verify karein
- Payment amount match kar raha hai ya nahi check karein

#### Error 3: "Booking creation failed"
**Reason:** Payment successful hai but booking create nahi ho raha
**Solution:**
- Backend logs mein exact error message check karein
- Database connection check karein
- Required fields properly fill ho rahe hain ya nahi

### Step 3: Detailed Debugging

#### Frontend Debugging:
```javascript
// Browser console mein yeh commands run karein:

// 1. Check pending payment
JSON.parse(localStorage.getItem('pending_payment') || '{}')

// 2. Check payment response
JSON.parse(localStorage.getItem('payment_response') || '{}')

// 3. Check Razorpay errors
JSON.parse(localStorage.getItem('razorpay_open_error') || '{}')
JSON.parse(localStorage.getItem('payment_failure') || '{}')
```

#### Backend Debugging:
```bash
# Server logs check karein
cd backend
tail -f logs/general-$(date +%Y-%m-%d).log
tail -f logs/error-$(date +%Y-%m-%d).log
```

### Step 4: Payment Flow Test

1. **Test Payment Order Creation:**
   ```bash
   curl -X POST http://localhost:5000/api/payment/create-order \
     -H "Content-Type: application/json" \
     -d '{"amount": 100, "currency": "INR", "receipt": "test123"}'
   ```

2. **Test Payment Verification:**
   ```bash
   curl -X POST http://localhost:5000/api/payment/verify \
     -H "Content-Type: application/json" \
     -d '{
       "razorpay_order_id": "order_xxx",
       "razorpay_payment_id": "pay_xxx",
       "razorpay_signature": "signature_xxx"
     }'
   ```

### Step 5: Razorpay Dashboard Check

1. Razorpay dashboard login karein
2. Payments section mein jao
3. Payment ID se search karein
4. Payment status check karein:
   - `captured` - Payment successful
   - `authorized` - Payment authorized (acceptable)
   - `created` - Payment created (might be processing)
   - `failed` - Payment failed
   - `refunded` - Payment refunded

### Step 6: Environment Variables Check

Backend mein yeh variables set hone chahiye:
```bash
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
```

Check karein:
```bash
cd backend
node -e "console.log('Key ID:', process.env.RAZORPAY_KEY_ID ? 'SET' : 'MISSING');"
```

### Step 7: Network Issues Check

1. **CORS Issues:**
   - Browser console mein CORS errors check karein
   - Backend CORS configuration verify karein

2. **API Connection:**
   - Frontend se backend API call ho raha hai ya nahi
   - Network tab mein API requests check karein

3. **Razorpay Script Loading:**
   - Razorpay script properly load ho raha hai ya nahi
   - Browser console mein script errors check karein

### Step 8: Common Fixes

#### Fix 1: Payment Verification More Lenient
- Ab payment verification more lenient hai
- Payment Razorpay mein exist karta hai to accept ho jayega
- Signature missing hone par bhi API verification se accept ho jayega

#### Fix 2: Better Error Messages
- Ab detailed error messages milenge
- Payment status aur amount bhi dikhega
- Exact failure reason pata chalega

#### Fix 3: Retry Mechanism
- Payment fetch ke liye 5 retries hain
- Payment processing time ke liye wait karta hai
- Automatic retry karta hai agar payment processing mein ho

### Step 9: Test Again

1. Clear browser cache
2. Clear localStorage:
   ```javascript
   localStorage.clear();
   ```
3. Fresh payment attempt karein
4. Console logs carefully check karein

### Step 10: Contact Support

Agar abhi bhi issue hai:
1. Backend logs copy karein
2. Frontend console logs copy karein
3. Payment ID note karein
4. Razorpay dashboard screenshot lein
5. Support team ko bhejein

## Important Notes

- Payment verification ab more lenient hai
- Payment Razorpay mein exist karta hai to accept ho jayega
- Detailed logs ab sab kuch dikhayenge
- Error messages ab more helpful hain

