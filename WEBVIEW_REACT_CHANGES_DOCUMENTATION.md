# WebView के लिए React में किए गए Changes - Documentation

## 📋 Overview
यह document React codebase में WebView (Flutter/Android APK) support के लिए किए गए सभी changes को list करता है।

---

## 🔧 Changes Summary

### 1. **main.tsx** - Entry Point Changes

#### A. AOS Library Disabled
**Location:** `frontend/src/main.tsx` (Lines 5-14)
```typescript
// import AOS from 'aos';
// import 'aos/dist/aos.css';

// Initialize AOS - COMMENTED OUT FOR WEBVIEW TESTING
// AOS.init({
//   duration: 800,
//   easing: 'ease-in-out',
//   once: true,
//   offset: 100
// });
```
**Reason:** WebView testing के लिए AOS animation library disable की गई।

---

#### B. FCM Token Bridge Function
**Location:** `frontend/src/main.tsx` (Lines 16-34)
```typescript
// Global function for Flutter to call and save FCM token
// Flutter can call: window.saveFCMTokenMobile(token, phone)
(window as any).saveFCMTokenMobile = async (token: string, phone: string): Promise<boolean> => {
  console.log('📱 Flutter called saveFCMTokenMobile:', { token: token?.substring(0, 30) + '...', phone });
  try {
    // Clean phone number (remove +91 if present)
    const cleanPhone = phone.replace(/\D/g, '').replace(/^91/, '');
    const success = await saveMobileFCMToken(token, cleanPhone);
    if (success) {
      console.log('✅ FCM token saved successfully via Flutter bridge');
    } else {
      console.warn('⚠️ Failed to save FCM token via Flutter bridge');
    }
    return success;
  } catch (error) {
    console.error('❌ Error saving FCM token via Flutter bridge:', error);
    return false;
  }
};
```
**Purpose:** Flutter से FCM token receive करने और save करने के लिए global function।

---

#### C. Razorpay WebView Message Listener
**Location:** `frontend/src/main.tsx` (Lines 36-63)
```typescript
// WebView message listener for Razorpay integration
window.addEventListener("message", function (event) {
  try {
    // Check if message is for starting Razorpay
    if (event.data === "start_razorpay" || (event.data && event.data.type === "start_razorpay")) {
      console.log('📱 Received start_razorpay message from WebView:', event.data);
      
      // Get order data from event detail or data
      const orderData = event.detail || event.data.orderData || event.data;
      
      if (orderData && orderData.orderId) {
        // Import razorpay service dynamically
        import('./services/razorpayService').then((module) => {
          const razorpayService = module.default;
          razorpayService.openRazorpayCheckout(orderData);
        }).catch((error) => {
          console.error('❌ Error loading razorpay service:', error);
          alert('Failed to load payment gateway. Please refresh the page.');
        });
      } else {
        console.error('❌ Invalid order data received:', orderData);
        alert('Invalid payment data. Please try again.');
      }
    }
  } catch (error) {
    console.error('❌ Error handling WebView message:', error);
  }
});
```
**Purpose:** Flutter/WebView से Razorpay payment start करने के लिए message listener।

---

#### D. Global Error Handlers
**Location:** `frontend/src/main.tsx` (Lines 65-84)
```typescript
// Global error handler - Log errors but don't prevent them
window.addEventListener('error', (event) => {
  console.error('❌ Global error caught:', event.error);
  // Error details logging...
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection caught:', event.reason);
  // Rejection details logging...
});
```
**Purpose:** WebView में errors को properly log करने के लिए।

---

### 2. **razorpayService.ts** - Payment Service Changes

#### A. WebView Detection Method
**Location:** `frontend/src/services/razorpayService.ts` (Lines 93-122)
```typescript
/**
 * Detect if running in mobile webview/app
 */
private isMobileWebView(): boolean {
  try {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') {
      return false;
    }

    const userAgent = navigator.userAgent || '';
    
    // Check for webview indicators
    const isWebView = /wv|WebView/i.test(userAgent);
    
    // Check for standalone mode (PWA)
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    
    // Check for iOS standalone
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    // Check for mobile device
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Check for Flutter bridge or Android bridge
    const hasNativeBridge = typeof (window as any).flutter_inappwebview !== 'undefined' || 
                           typeof (window as any).Android !== 'undefined';
    
    return isWebView || isStandalone || isIOSStandalone || (isMobileDevice && hasNativeBridge);
  } catch (error) {
    console.error('Error detecting mobile webview:', error);
    return false;
  }
}
```
**Purpose:** WebView environment detect करने के लिए utility method।

---

#### B. Mobile-Specific Razorpay Script Loading
**Location:** `frontend/src/services/razorpayService.ts` (Lines 127-202)
```typescript
private async loadRazorpayScript(): Promise<void> {
  // For mobile webview, try to load script with retry mechanism
  const isMobile = this.isMobileWebView();
  
  if (isMobile) {
    console.log('📱 Mobile webview detected, loading Razorpay with mobile configuration');
  }
  
  // Retry mechanism for mobile WebView
  // Timeout handling for mobile
  // Error handling specific to WebView
}
```
**Purpose:** WebView में Razorpay script load करने के लिए retry mechanism और mobile-specific configuration।

---

#### C. Flutter Bridge Integration for Payments
**Location:** `frontend/src/services/razorpayService.ts` (Multiple locations)

**Payment Success Handler:**
```typescript
handler: (response: PaymentResponse) => {
  console.log('✅ Payment successful:', response);
  
  // Flutter bridge call for WebView integration
  if (window.flutter_inappwebview) {
    try {
      window.flutter_inappwebview.callHandler('razorpayResponse', response);
      console.log('📱 Flutter bridge called with payment response');
    } catch (error) {
      console.error('❌ Error calling Flutter bridge:', error);
    }
  }
  
  // Show success alert for WebView
  if (this.isMobileWebView()) {
    alert("Payment Success!");
  }
  
  paymentData.onSuccess(response);
}
```

**Payment Error Handler:**
```typescript
razorpay.on('payment.failed', (error: any) => {
  // Flutter bridge call for error
  if (window.flutter_inappwebview) {
    try {
      window.flutter_inappwebview.callHandler('razorpayError', {
        error: error.error || error,
        message: errorMessage
      });
    } catch (bridgeError) {
      console.error('❌ Error calling Flutter bridge for error:', bridgeError);
    }
  }
  
  // Show error alert for WebView
  if (isMobile) {
    alert(`Payment Failed: ${errorMessage}`);
  }
  
  paymentData.onError(new Error(errorMessage));
});
```
**Purpose:** Payment success/error को Flutter bridge के through communicate करना।

---

#### D. Mobile-Specific Razorpay Options
**Location:** `frontend/src/services/razorpayService.ts` (Lines 330-358)
```typescript
// Mobile-specific options
...(isMobile && {
  config: {
    display: {
      blocks: {
        banks: {
          name: "All payment methods",
          instruments: [
            { method: "card" },
            { method: "upi" },
            { method: "netbanking" },
            { method: "wallet" },
          ],
        },
      },
      sequence: ["block.banks"],
      preferences: {
        show_default_blocks: true,
      },
    },
  },
})
```
**Purpose:** WebView में Razorpay checkout के लिए mobile-optimized payment options।

---

#### E. Global openRazorpayCheckout Function
**Location:** `frontend/src/services/razorpayService.ts` (Lines 826-943)
```typescript
/**
 * Open Razorpay Checkout (WebView compatible function)
 * This function can be called from Flutter/WebView via message listener
 */
openRazorpayCheckout(orderData: {
  key: string;
  amount: number;
  currency: string;
  name: string;
  email: string;
  contact: string;
  orderId: string;
  description?: string;
}): void {
  // WebView-specific Razorpay checkout implementation
  // Flutter bridge integration
  // Error handling for WebView
}

// Export as global function for WebView/Flutter integration
(window as any).openRazorpayCheckout = (orderData: any) => {
  razorpayService.openRazorpayCheckout(orderData);
};
```
**Purpose:** Flutter/WebView से directly Razorpay checkout open करने के लिए global function।

---

### 3. **AuthContext.tsx** - Authentication Changes

#### A. WebView Detection in Login
**Location:** `frontend/src/contexts/AuthContext.tsx` (Lines 103-125)
```typescript
// Detect if running in webview/APK
const isWebView = (() => {
  try {
    // Check for webview user agent
    const userAgent = navigator.userAgent || '';
    const isWebViewUA = /wv|WebView/.test(userAgent);
    
    // Check for standalone mode (PWA)
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    
    // Check for iOS standalone
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    // Check if Flutter bridge is available (for APK)
    const hasFlutterBridge = typeof (window as any).flutter_inappwebview !== 'undefined' || 
                             typeof (window as any).Android !== 'undefined';
    
    return isWebViewUA || isStandalone || isIOSStandalone || hasFlutterBridge;
  } catch (error) {
    console.error('Error detecting webview:', error);
    return false;
  }
})();
```
**Purpose:** Login के समय WebView environment detect करना।

---

#### B. FCM Token Handling for WebView
**Location:** `frontend/src/contexts/AuthContext.tsx` (Lines 127-196)
```typescript
// Register FCM token after successful login
setTimeout(() => {
  if (isWebView) {
    // For webview/APK: Get FCM token from Flutter bridge and save using mobile endpoint
    console.log('📱 Detected webview/APK environment, using mobile FCM token endpoint');
    
    // Try to get FCM token from Flutter bridge
    const getFCMTokenFromFlutter = (): Promise<string | null> => {
      return new Promise((resolve) => {
        try {
          // Check if Flutter bridge is available
          if (typeof (window as any).flutter_inappwebview !== 'undefined') {
            // Flutter InAppWebView
            (window as any).flutter_inappwebview.callHandler('getFCMToken').then((token: string) => {
              resolve(token);
            }).catch(() => {
              resolve(null);
            });
          } else if (typeof (window as any).Android !== 'undefined') {
            // Android WebView
            const token = (window as any).Android.getFCMToken();
            resolve(token || null);
          } else {
            // Try to get from localStorage (if Flutter saved it)
            const savedToken = localStorage.getItem('fcmToken');
            if (savedToken) {
              resolve(savedToken);
            } else {
              resolve(null);
            }
          }
        } catch (error) {
          console.error('Error getting FCM token from Flutter:', error);
          resolve(null);
        }
      });
    };
    
    // Get token and save using mobile endpoint
    getFCMTokenFromFlutter().then((token) => {
      if (token) {
        saveMobileFCMToken(token, userData.phone).catch((error) => {
          console.error('Failed to save FCM token:', error);
        });
      }
    });
  }
}, 1000);
```
**Purpose:** WebView में Flutter bridge से FCM token लेकर mobile endpoint पर save करना।

---

### 4. **App.tsx** - App Initialization Changes

#### A. Service Worker Disabled
**Location:** `frontend/src/App.tsx` (Lines 235-242)
```typescript
// Register service worker for PWA functionality - COMMENTED OUT FOR WEBVIEW TESTING
// if ('serviceWorker' in navigator) {
//   import('./serviceWorkerRegistration').then(({ register }) => {
//     register();
//   }).catch((error) => {
//     console.error('❌ Service Worker registration failed:', error);
//   });
// }
```
**Reason:** WebView testing के लिए service worker disable किया गया।

---

#### B. WebView Detection Debug Logging
**Location:** `frontend/src/App.tsx` (Lines 252-257)
```typescript
// Debug mobile webview detection
const isMobileWebView = /wv|WebView/.test(navigator.userAgent);
const isPWA = window.matchMedia('(display-mode: standalone)').matches;
console.log('📱 Mobile WebView detected:', isMobileWebView);
console.log('📱 PWA mode detected:', isPWA);
console.log('🌐 User Agent:', navigator.userAgent);
```
**Purpose:** WebView detection को debug करने के लिए logging।

---

### 5. **api.ts** - API Configuration Changes

#### A. Credentials Changed for WebView
**Location:** `frontend/src/services/api.ts` (Line 74)
```typescript
credentials: 'omit', // Changed from 'include' to 'omit' for mobile webview compatibility
```
**Reason:** WebView में CORS issues avoid करने के लिए credentials 'omit' set किया गया।

---

### 6. **Payment.tsx** - Payment Page Changes

#### A. WebView Detection
**Location:** `frontend/src/pages/Payment.tsx` (Lines 37-49)
```typescript
// Detect mobile webview
const isMobileWebView = () => {
  try {
    const userAgent = navigator.userAgent || '';
    const isWebView = /wv|WebView/i.test(userAgent);
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    return isWebView || isStandalone || isIOSStandalone || isMobileDevice;
  } catch {
    return false;
  }
};
```
**Purpose:** Payment page में WebView detection।

---

#### B. Mobile-Specific Razorpay Loading
**Location:** `frontend/src/pages/Payment.tsx` (Lines 51-92)
```typescript
const loadRazorpayScript = () => {
  // Mobile WebView के लिए retry mechanism
  // Mobile-specific timeout handling
  // Error handling for WebView
};
```
**Purpose:** WebView में Razorpay script load करने के लिए mobile-specific handling।

---

### 7. **Support.tsx** - Support Page Changes

#### A. WebView Detection
**Location:** `frontend/src/pages/Support.tsx` (Lines 173-185)
```typescript
// Detect mobile webview
const isMobileWebView = () => {
  try {
    const userAgent = navigator.userAgent || '';
    const isWebView = /wv|WebView/i.test(userAgent);
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    return isWebView || isStandalone || isIOSStandalone || isMobileDevice;
  } catch {
    return false;
  }
};
```
**Purpose:** Support page में WebView detection।

---

### 8. **AMCSubscribe.tsx** - AMC Subscription Changes

#### A. WebView Detection
**Location:** `frontend/src/pages/AMCSubscribe.tsx` (Lines 419-427)
```typescript
// Detect mobile webview
const isMobileWebView = () => {
  try {
    const userAgent = navigator.userAgent || '';
    const isWebView = /wv|WebView/i.test(userAgent);
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    return isWebView || isStandalone || isIOSStandalone;
  } catch {
    return false;
  }
};
```

#### B. Flutter Bridge Integration
**Location:** `frontend/src/pages/AMCSubscribe.tsx` (Lines 319-330, 399-412)
```typescript
// Flutter bridge call for WebView integration
if ((window as any).flutter_inappwebview) {
  try {
    (window as any).flutter_inappwebview.callHandler('razorpayResponse', paymentResponse);
  } catch (error) {
    console.error('❌ Error calling Flutter bridge:', error);
  }
}

// Show success alert for WebView
if (isMobileWebView()) {
  alert("Payment Success!");
}
```
**Purpose:** AMC subscription payment में WebView support।

---

### 9. **Vendor Pages** - Vendor Dashboard Changes

#### A. WebView Detection in VendorLogin
**Location:** `frontend/src/vendor/pages/VendorLogin.tsx` (Line 136)
```typescript
isAPK = (typeof navigator !== 'undefined' && /wv|WebView/.test(navigator.userAgent || '')) || 
        typeof (window as any).flutter_inappwebview !== 'undefined';
```

#### B. WebView Detection in VendorDashboard
**Location:** `frontend/src/vendor/pages/VendorDashboard.tsx` (Lines 20-23)
```typescript
// Check if running in APK/webview
const isAPKDetected = (typeof navigator !== 'undefined' && /wv|WebView/.test(navigator.userAgent || '')) || 
                      typeof (window as any).flutter_inappwebview !== 'undefined';
```

#### C. WebView Detection in VendorProtectedRoute
**Location:** `frontend/src/vendor/components/VendorProtectedRoute.tsx` (Line 102)
```typescript
isAPK = (typeof navigator !== 'undefined' && /wv|WebView/.test(navigator.userAgent || '')) || 
        typeof (window as any).flutter_inappwebview !== 'undefined';
```

---

### 10. **VendorVerification.tsx** - Vendor Verification Changes

#### A. Razorpay Key with Live Key Fallback
**Location:** `frontend/src/vendor/pages/VendorVerification.tsx` (Line 82)
```typescript
key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_RmLDP4W1dPgg6J',
```
**Purpose:** WebView में live Razorpay key use करना।

---

## 📊 Summary of Changes

### Files Modified:
1. ✅ `frontend/src/main.tsx` - FCM bridge, Razorpay listener, error handlers
2. ✅ `frontend/src/services/razorpayService.ts` - WebView detection, Flutter bridge, mobile config
3. ✅ `frontend/src/contexts/AuthContext.tsx` - WebView detection, FCM handling
4. ✅ `frontend/src/App.tsx` - Service worker disabled, WebView logging
5. ✅ `frontend/src/services/api.ts` - Credentials changed to 'omit'
6. ✅ `frontend/src/pages/Payment.tsx` - WebView detection, mobile Razorpay
7. ✅ `frontend/src/pages/Support.tsx` - WebView detection, mobile Razorpay
8. ✅ `frontend/src/pages/AMCSubscribe.tsx` - WebView detection, Flutter bridge
9. ✅ `frontend/src/vendor/pages/VendorLogin.tsx` - WebView detection
10. ✅ `frontend/src/vendor/pages/VendorDashboard.tsx` - WebView detection
11. ✅ `frontend/src/vendor/components/VendorProtectedRoute.tsx` - WebView detection
12. ✅ `frontend/src/vendor/pages/VendorVerification.tsx` - Live Razorpay key

### Key Features Added:
- ✅ WebView detection utility (multiple files)
- ✅ Flutter bridge integration (FCM tokens, Razorpay)
- ✅ Mobile-specific Razorpay configuration
- ✅ Retry mechanism for script loading
- ✅ Error handling for WebView
- ✅ Global functions for Flutter communication
- ✅ Service worker disabled for WebView
- ✅ API credentials changed for WebView compatibility

---

## 🔗 Flutter Bridge Communication

### React → Flutter:
1. **FCM Token:** `window.saveFCMTokenMobile(token, phone)`
2. **Razorpay Response:** `window.flutter_inappwebview.callHandler('razorpayResponse', response)`
3. **Razorpay Error:** `window.flutter_inappwebview.callHandler('razorpayError', error)`

### Flutter → React:
1. **Razorpay Start:** `window.postMessage({ type: 'start_razorpay', orderData })`
2. **FCM Token:** `window.flutter_inappwebview.callHandler('getFCMToken')`

---

## ✅ Status
**All WebView changes are implemented and ready for use!**

---

*Last Updated: Current Date*
*Version: 1.0*

