# WebView Payment Test Guide

## 🧪 Testing WebView Payment in APK

### Quick Test Methods

#### Method 1: Browser Console Test (Recommended)

1. Open your WebView APK
2. Navigate to Checkout page
3. Open browser console (if available) or use Flutter DevTools
4. Run these commands:

```javascript
// Test 1: Run all WebView tests
runAllWebViewTests()

// Test 2: Test WebView detection only
testWebViewPayment()

// Test 3: Simulate payment flow
simulatePaymentFlow()
```

#### Method 2: Using Test Button (Development Mode)

1. In development mode, a test button appears on Checkout page
2. Click "Run WebView Payment Tests" button
3. Check console for detailed results

#### Method 3: Manual Test Flow

1. **Check WebView Detection:**
   - Open Checkout page in WebView APK
   - Check console logs for: `🔍 ========== PAYMENT CONTEXT DETECTION ==========`
   - Verify: `Is APK/WebView: true`
   - Verify: `Use Redirect Mode: true`

2. **Check Razorpay Loading:**
   - Click "Pay with Razorpay" button
   - Check console for: `✅ Razorpay script loaded successfully`
   - Verify Razorpay checkout opens

3. **Check Callback URL:**
   - Before payment, check console for: `🔗 Callback URL: [your-api-url]/payment/razorpay-callback`
   - Verify Order ID is in callback URL: `?razorpay_order_id=order_xxx`

4. **Complete Payment:**
   - Complete payment in Razorpay checkout
   - Check if redirect happens to callback URL
   - Verify backend receives payment data

5. **Check Backend Logs:**
   - Look for: `🔔 🔔 🔔 RAZORPAY CALLBACK RECEIVED 🔔 🔔 🔔`
   - Verify Order ID and Payment ID are present
   - Check if payment verification succeeds

### Expected Console Output

#### On Checkout Page Load:
```
🔍 ========== PAYMENT CONTEXT DETECTION ==========
🔍 Is APK/WebView: true
🔍 Use Redirect Mode: true
🔍 User Agent: [your-user-agent]
🔍 Has Flutter WebView: true/false
🔍 ===============================================
```

#### On Payment Button Click:
```
📥 Loading Razorpay script...
✅ Razorpay script loaded successfully
🔗 ========== PAYMENT CALLBACK URL SETUP ==========
🔗 Callback URL: [url]?razorpay_order_id=order_xxx
🔗 Use Redirect Mode: true
🔗 ================================================
🎯 ========== OPENING RAZORPAY CHECKOUT (BOOKING) ==========
🎯 Order ID: order_xxx
🎯 Callback URL: [url]
🎯 Use Redirect Mode: true
✅ Razorpay checkout opened successfully
```

#### On Payment Success:
```
✅ ========== PAYMENT.SUCCESS EVENT FIRED (Booking - WebView) ==========
✅ Response: {...}
💾 Stored payment response in localStorage
🚀 IMMEDIATE redirect to callback (WebView): [callback-url]
```

#### Backend Logs:
```
🔔 🔔 🔔 RAZORPAY CALLBACK RECEIVED 🔔 🔔 🔔
📋 Extracted payment data:
  razorpay_payment_id: pay_xxx...
  razorpay_order_id: order_xxx...
  bookingId: xxx...
✅ Payment verified via Razorpay API
```

### Test Checklist

- [ ] WebView detection works (`Is APK/WebView: true`)
- [ ] Redirect mode enabled (`Use Redirect Mode: true`)
- [ ] Razorpay script loads successfully
- [ ] Razorpay checkout opens
- [ ] Callback URL contains Order ID
- [ ] Payment can be completed
- [ ] Redirect to callback URL happens
- [ ] Backend receives payment data
- [ ] Order ID and Payment ID are present in backend logs
- [ ] Payment verification succeeds
- [ ] Booking is created successfully

### Common Issues & Solutions

#### Issue 1: WebView Not Detected
**Symptom:** `Is APK/WebView: false`

**Solution:**
- Check if Flutter bridge is available: `window.flutter_inappwebview`
- Check user agent in console
- Manually set WebView flag if needed

#### Issue 2: Razorpay Script Not Loading
**Symptom:** `Failed to load Razorpay script`

**Solution:**
- Check internet connection
- Verify Razorpay CDN is accessible
- Check WebView network permissions

#### Issue 3: Callback URL Missing Order ID
**Symptom:** Backend logs show `Order ID: MISSING`

**Solution:**
- Verify callback URL is pre-populated with order_id
- Check console for callback URL construction logs
- Verify order creation succeeded

#### Issue 4: Payment Redirect Not Working
**Symptom:** Payment completes but no redirect

**Solution:**
- Check if handler executed (look for handler logs)
- Verify callback_url is set in Razorpay options
- Check localStorage for payment_response
- Manually navigate to callback URL if needed

#### Issue 5: Backend Verification Fails
**Symptom:** `Payment verification failed`

**Solution:**
- Check if Order ID and Payment ID are in backend logs
- Verify Razorpay API keys are correct
- Check payment status in Razorpay dashboard
- Verify payment amount matches

### Debug Commands

```javascript
// Check WebView detection
testWebViewPayment().summary

// Check localStorage
localStorage.getItem('payment_response')
localStorage.getItem('pending_payment')

// Check Razorpay availability
window.Razorpay

// Check Flutter bridge
window.flutter_inappwebview

// Clear test data
localStorage.removeItem('payment_response')
localStorage.removeItem('pending_payment')
```

### Test Results Interpretation

#### Status: READY ✅
- All critical tests passed
- Payment should work in WebView
- Proceed with actual payment test

#### Status: ISSUES ⚠️
- Some tests failed but critical ones passed
- Payment might work but with limitations
- Check recommendations in test output

#### Status: FAILED ❌
- Critical tests failed
- Payment will likely not work
- Fix issues before testing payment

### Next Steps After Testing

1. **If tests pass:**
   - Proceed with actual payment test
   - Monitor backend logs during payment
   - Verify booking creation

2. **If tests fail:**
   - Check recommendations in test output
   - Fix identified issues
   - Re-run tests

3. **If payment fails:**
   - Check backend logs for error details
   - Verify Razorpay dashboard for payment status
   - Check network connectivity
   - Review callback URL configuration

### Support

If issues persist:
1. Share console logs
2. Share backend logs
3. Share test results from `runAllWebViewTests()`
4. Include WebView user agent
5. Include Razorpay order ID and payment ID (if available)

