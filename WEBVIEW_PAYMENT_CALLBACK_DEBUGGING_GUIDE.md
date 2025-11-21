# 🔍 WEBVIEW PAYMENT CALLBACK DEBUGGING GUIDE

## 🎯 ISSUE
Payment callback backend तक नहीं पहुंच रहा - logs में `🔔 RAZORPAY CALLBACK RECEIVED` नहीं दिख रहा

---

## 🔍 DEBUGGING STEPS

### **Step 1: Check Frontend Console Logs**

Payment initiate करते समय ये logs दिखने चाहिए:

```
🔍 Payment context detection: { isAPK: true, useRedirectMode: true, ... }
🔗 Payment callback URL: http://localhost:5000/api/payment/razorpay-callback
🔗 API Base URL: http://localhost:5000/api
🔗 Use Redirect Mode: true
💾 Stored payment info in localStorage for callback handling
🎯 Opening Razorpay checkout with options: { orderId: ..., callbackUrl: ..., ... }
```

**अगर ये logs नहीं दिख रहे**:
- WebView detection fail हो रहा है
- Check `isAPKContext()` function

---

### **Step 2: Check Razorpay Handler Execution**

Payment complete करने के बाद (Success/Failure click):

**Success Case**:
```
🎯 ========== RAZORPAY HANDLER EXECUTED ==========
✅ Payment successful in WebView, storing response...
📦 Payment response: { razorpay_order_id: ..., razorpay_payment_id: ..., ... }
🚀 IMMEDIATE redirect to callback (WebView): http://localhost:5000/api/payment/razorpay-callback?...
```

**अगर handler logs नहीं दिख रहे**:
- Handler execute नहीं हो रहा
- Razorpay directly `callback_url` पर redirect कर रहा है
- Check backend logs for callback

---

### **Step 3: Check Backend Logs**

Payment complete के बाद backend में ये log दिखना चाहिए:

```
🔔 ========== RAZORPAY CALLBACK RECEIVED ==========
🔔 Timestamp: 2025-01-21T...
🔔 Method: GET (or POST)
🔔 Original URL: /api/payment/razorpay-callback?razorpay_payment_id=...
🔔 Query params: { razorpay_payment_id: "...", razorpay_order_id: "...", ... }
📋 Extracted payment data: { razorpay_payment_id: "...", ... }
📤 Sending HTML response to client
```

**अगर ये logs नहीं दिख रहे**:
- Callback backend तक नहीं पहुंच रहा
- Possible causes:
  1. Callback URL incorrect
  2. WebView navigation blocked
  3. Network issue
  4. Razorpay redirect not happening

---

## 🐛 COMMON ISSUES & SOLUTIONS

### **Issue 1: Handler Not Executing**
**Symptoms**: Frontend logs में handler logs नहीं दिख रहे

**Solution**: 
- Handler execute नहीं हो सकता WebView में
- Razorpay `callback_url` पर directly redirect करेगा
- Check backend logs instead

---

### **Issue 2: Callback Not Reaching Backend**
**Symptoms**: Backend logs में callback logs नहीं दिख रहे

**Possible Causes**:

1. **Callback URL Incorrect**
   - Check: `VITE_API_URL` environment variable
   - Should be: `http://localhost:5000/api` (dev) or production URL
   - Callback URL: `${VITE_API_URL}/payment/razorpay-callback`

2. **WebView Navigation Blocked**
   - Flutter WebView navigation block कर सकता है
   - Check Flutter WebView settings
   - Enable JavaScript
   - Allow navigation

3. **Network Issue**
   - WebView से backend तक network access नहीं है
   - Check network permissions in Flutter app

4. **Razorpay Redirect Not Happening**
   - Razorpay demo page पर redirect नहीं हो रहा
   - Check Razorpay configuration
   - Verify `callback_url` is set correctly

---

### **Issue 3: Payment Data Missing**
**Symptoms**: Callback reaches backend but payment data missing

**Solution**:
- Check query parameters in backend logs
- Razorpay sends data as query params
- Backend extracts from `req.query`

---

## 🔧 QUICK FIXES

### **Fix 1: Verify Callback URL**
```typescript
// In razorpayService.ts
const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const callbackUrl = `${apiBase}/payment/razorpay-callback`;

console.log('🔗 Callback URL:', callbackUrl); // Should show correct URL
```

### **Fix 2: Test Callback URL Directly**
Browser में directly open करें:
```
http://localhost:5000/api/payment/razorpay-callback?razorpay_payment_id=test&razorpay_order_id=test
```

अगर backend log दिखता है = URL correct है
अगर log नहीं दिखता = Route issue है

### **Fix 3: Check Flutter WebView Settings**
Flutter app में:
```dart
WebViewController webViewController = WebViewController()
  ..setJavaScriptMode(JavaScriptMode.unrestricted) // CRITICAL
  ..setNavigationDelegate(
    NavigationDelegate(
      onNavigationRequest: (NavigationRequest request) {
        // Allow all navigation
        return NavigationDecision.navigate;
      },
    ),
  );
```

---

## 📊 EXPECTED FLOW

### **Success Flow**:
```
1. User clicks "Pay Now"
2. Frontend: "🎯 Opening Razorpay checkout"
3. Razorpay demo page opens
4. User clicks "Success"
5. Option A: Handler executes → Frontend: "🎯 RAZORPAY HANDLER EXECUTED" → Redirect
6. Option B: Razorpay redirects directly to callback_url
7. Backend: "🔔 ========== RAZORPAY CALLBACK RECEIVED =========="
8. Backend: "📤 Sending HTML response"
9. Frontend PaymentCallback page loads
10. Payment verified
```

### **Failure Flow**:
```
1. User clicks "Pay Now"
2. Razorpay demo page opens
3. User clicks "Failure"
4. Frontend: "❌ Razorpay payment failed"
5. Redirect to callback with error
6. Backend: "🔔 ========== RAZORPAY CALLBACK RECEIVED =========="
7. Backend returns error HTML
8. Frontend shows error
```

---

## 🧪 TESTING CHECKLIST

- [ ] Frontend logs show payment initiation
- [ ] Frontend logs show callback URL
- [ ] Razorpay page opens
- [ ] Success/Failure button works
- [ ] Handler logs appear (if handler executes)
- [ ] Backend logs show callback received
- [ ] Payment data extracted correctly
- [ ] HTML response sent
- [ ] Frontend PaymentCallback page loads
- [ ] Payment verified

---

## 📝 NEXT STEPS

1. **Test payment** in WebView
2. **Check frontend console** for all logs
3. **Check backend logs** for callback
4. **If callback not reaching**:
   - Verify callback URL
   - Check Flutter WebView settings
   - Test callback URL directly
   - Check network connectivity

---

**Status**: ✅ ENHANCED LOGGING ADDED
**Date**: 2025-01-21
**Ready for Debugging**: YES

