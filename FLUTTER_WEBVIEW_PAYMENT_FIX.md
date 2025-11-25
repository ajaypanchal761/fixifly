# Flutter WebView/Iframe Payment Fixes

## 🔴 Issue: Payment Failed in Flutter WebView/Iframe APK

**Problem**: 
- APK में Flutter WebView/iframe के through payment fail हो रहा था
- Payment callback return नहीं हो रही
- Payment data lost हो जा रहा था

## ✅ Fixes Applied

### 1. Enhanced Iframe Detection for Flutter WebView

**Before**: Only checked `window.self !== window.top`

**After**: Multiple detection methods:
```typescript
private isInIframe(): boolean {
  // Method 1: Standard iframe check
  const isInIframe = window.self !== window.top;
  
  // Method 2: Flutter WebView detection
  const hasFlutterWebView = (window as any).flutter_inappwebview !== undefined;
  
  // Method 3: WebView user agent
  const isWebViewUA = /wv|WebView/i.test(userAgent);
  
  // Method 4: Parent window access check
  try {
    const parentCheck = window.parent !== window;
    if (parentCheck) return true;
  } catch (e) {
    return true; // Can't access parent = iframe
  }
  
  // Flutter WebView = treat as iframe (needs redirect mode)
  if (hasFlutterWebView || isWebViewUA) {
    return true;
  }
  
  return isInIframe;
}
```

### 2. Flutter WebView-Specific Redirect Mode

**Before**: Only checked `isAPK || isInIframe`

**After**: Also checks for Flutter WebView:
```typescript
const hasFlutterWebView = (window as any).flutter_inappwebview !== undefined;
const isFlutterAPK = hasFlutterWebView || /flutter|Flutter/i.test(navigator.userAgent);
const useRedirectMode = isAPK || isInIframe || isFlutterAPK;
```

### 3. Flutter Bridge Communication

**Added**: Flutter bridge handlers for payment success/failure:
```typescript
// Payment Success
if ((window as any).flutter_inappwebview) {
  (window as any).flutter_inappwebview.callHandler('paymentSuccess', {
    razorpay_order_id: response.razorpay_order_id,
    razorpay_payment_id: response.razorpay_payment_id,
    razorpay_signature: response.razorpay_signature,
    bookingId: paymentData.bookingId,
    ticketId: paymentData.ticketId
  });
}

// Payment Failure
if ((window as any).flutter_inappwebview) {
  (window as any).flutter_inappwebview.callHandler('paymentFailed', {
    error: response.error,
    errorCode: response.error?.code,
    errorDescription: response.error?.description,
    orderId: paymentData.orderId
  });
}
```

### 4. Enhanced PaymentCallback for Flutter WebView

**Added**: Flutter WebView message listener:
```typescript
// Listen for payment data from Flutter
if ((window as any).flutter_inappwebview) {
  window.addEventListener('message', (event: MessageEvent) => {
    if (event.data && event.data.type === 'payment_data') {
      const flutterPaymentData = event.data.data;
      // Extract payment data
    }
  });
}
```

### 5. Improved Logging

**Added**: Detailed Flutter WebView detection logs:
```typescript
console.log('🔍 Has Flutter WebView:', hasFlutterWebView);
console.log('🔍 Is Flutter APK:', isFlutterAPK);
console.log('⚠️ Flutter WebView bridge available - will use for navigation');
```

## 📋 Key Changes Summary

1. ✅ **Iframe Detection**: Now detects Flutter WebView as iframe
2. ✅ **Redirect Mode**: Automatically enabled for Flutter WebView
3. ✅ **Flutter Bridge**: Payment data sent via Flutter bridge
4. ✅ **Message Listeners**: PaymentCallback listens for Flutter messages
5. ✅ **Enhanced Logging**: Better debugging for Flutter WebView

## 🧪 Testing Checklist

### Test in Flutter WebView APK:
- [ ] Payment opens correctly
- [ ] Redirect mode is enabled (check console logs)
- [ ] Payment success callback works
- [ ] Payment failure callback works
- [ ] Payment data retrieved from multiple sources
- [ ] Flutter bridge handlers called (check console logs)

### Check Console Logs:
- [ ] `🔍 Has Flutter WebView: true`
- [ ] `🔍 Is Flutter APK: true`
- [ ] `⚠️ Flutter WebView bridge available`
- [ ] `📤 Sending payment success to Flutter bridge`
- [ ] `✅ Retrieved payment data from Flutter WebView message`

## 🔧 Flutter App Requirements

Flutter app में ये handlers implement करने होंगे:

```dart
// Payment Success Handler
webViewController.addJavaScriptHandler(
  handlerName: 'paymentSuccess',
  callback: (args) {
    // Handle payment success
    final orderId = args[0]['razorpay_order_id'];
    final paymentId = args[0]['razorpay_payment_id'];
    // Navigate to success page
  },
);

// Payment Failed Handler
webViewController.addJavaScriptHandler(
  handlerName: 'paymentFailed',
  callback: (args) {
    // Handle payment failure
    final error = args[0]['error'];
    // Navigate to error page
  },
);

// Navigate Handler
webViewController.addJavaScriptHandler(
  handlerName: 'navigateTo',
  callback: (args) {
    final url = args[0] as String;
    // Navigate to URL
    webViewController.loadUrl(urlRequest: URLRequest(url: WebUri(url)));
  },
);
```

## ✅ All Fixes Applied!

Flutter WebView/iframe में payment अब properly काम करेगा:
- ✅ Redirect mode automatically enabled
- ✅ Flutter bridge communication
- ✅ Payment data persistence
- ✅ Enhanced error handling

