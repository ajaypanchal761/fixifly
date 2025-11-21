/**
 * WebView Detection Utility
 * Enhanced detection for Flutter WebView and other mobile webviews
 */

declare global {
  interface Window {
    flutter_inappwebview?: any;
    flutter?: any;
    FlutterWebView?: any;
    ReactNativeWebView?: any;
    Android?: any;
    webkit?: {
      messageHandlers?: any;
    };
    FlutterPaymentBridge?: {
      openPaymentLink?: (url: string) => void;
      paymentCallback?: (data: any) => void;
    };
  }
}

/**
 * Detect if the app is running in a WebView environment
 * Enhanced detection for Flutter WebView, React Native WebView, and standard WebViews
 * CRITICAL: This must accurately detect Android WebView APK to use payment links instead of Razorpay modal
 */
export const isWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent || '';
  
  // Flutter WebView detection (priority checks)
  const isFlutterWebView = 
    window.flutter_inappwebview !== undefined || // Flutter InAppWebView
    window.flutter !== undefined || // Flutter WebView
    window.FlutterWebView !== undefined; // Custom Flutter WebView
  
  // Standard WebView indicators - Enhanced for Android WebView APK
  const isStandardWebView = 
    /wv|WebView|Android.*wv|iPhone.*wv/i.test(userAgent) ||
    /Version\/.*Chrome\/.*Mobile/i.test(userAgent) && !/Chrome\/\d+\.\d+\.\d+\.\d+ Mobile/i.test(userAgent) || // Android WebView (not Chrome browser)
    window.ReactNativeWebView !== undefined ||
    window.Android !== undefined ||
    (window.webkit && window.webkit.messageHandlers);
  
  // Additional Android WebView detection
  // Android WebView has specific user agent patterns
  const isAndroidWebView = 
    /Android/i.test(userAgent) && 
    (
      /wv/i.test(userAgent) || // Contains 'wv' (WebView)
      /Version\/.*Chrome\/.*Mobile/i.test(userAgent) && !/Chrome\/\d+\.\d+\.\d+\.\d+ Mobile/i.test(userAgent) || // Chrome WebView pattern
      (window.Android !== undefined) || // Android bridge
      (typeof (window as any).Android !== 'undefined') // Android native bridge
    );
  
  // Mobile device check (but not standard browser)
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // Check if it's a standard mobile browser (Chrome, Safari, Firefox on mobile)
  const isStandardMobileBrowser = 
    /Chrome\/\d+\.\d+\.\d+\.\d+ Mobile/i.test(userAgent) || // Chrome Mobile browser
    /CriOS/i.test(userAgent) || // Chrome iOS
    /FxiOS/i.test(userAgent) || // Firefox iOS
    /Safari/i.test(userAgent) && !/wv|WebView/i.test(userAgent) && !window.flutter_inappwebview && !window.flutter; // Safari but not WebView
  
  // Return true if any WebView indicator is present
  // CRITICAL: For Android APK, we need to be more aggressive in detection
  const result = isFlutterWebView || isStandardWebView || isAndroidWebView || (isMobile && !isStandardMobileBrowser);
  
  console.log('[WebViewUtils][Detection]', {
    userAgent,
    isFlutterWebView,
    isStandardWebView,
    isAndroidWebView,
    isMobile,
    isStandardMobileBrowser,
    result
  });
  
  return result;
};

/**
 * Open payment link in WebView with multiple fallback methods
 * Based on CreateBharat's working implementation
 * CRITICAL: This ensures payment stays within WebView and doesn't open external browser
 */
export const openPaymentLink = (paymentUrl: string): boolean => {
  console.log('[WebViewUtils] Opening payment link:', paymentUrl);
  console.log('[WebViewUtils] Current location:', window.location.href);
  console.log('[WebViewUtils] User agent:', navigator.userAgent);
  
  // Method 1: Flutter bridge (if available) - CRITICAL for Flutter WebView
  if (window.FlutterPaymentBridge && typeof window.FlutterPaymentBridge.openPaymentLink === 'function') {
    console.log('[WebViewUtils] Using Flutter bridge to open payment link');
    try {
      window.FlutterPaymentBridge.openPaymentLink(paymentUrl);
      return true;
    } catch (error) {
      console.warn('[WebViewUtils] Flutter bridge failed:', error);
    }
  }
  
  // Method 2: Flutter InAppWebView handler
  if (window.flutter_inappwebview && typeof window.flutter_inappwebview.callHandler === 'function') {
    console.log('[WebViewUtils] Using Flutter InAppWebView handler');
    try {
      window.flutter_inappwebview.callHandler('openPaymentLink', paymentUrl);
      return true;
    } catch (error) {
      console.warn('[WebViewUtils] Flutter InAppWebView handler failed:', error);
    }
  }
  
  // Method 3: PaymentHandler JavaScript channel
  if (window.PaymentHandler && typeof window.PaymentHandler.postMessage === 'function') {
    console.log('[WebViewUtils] Using PaymentHandler JavaScript channel');
    try {
      window.PaymentHandler.postMessage(JSON.stringify({
        type: 'openPaymentLink',
        url: paymentUrl
      }));
      return true;
    } catch (error) {
      console.warn('[WebViewUtils] PaymentHandler failed:', error);
    }
  }
  
  // Method 4: Android WebView specific handler
  if (typeof (window as any).Android !== 'undefined' && (window as any).Android.openPaymentLink) {
    console.log('[WebViewUtils] Using Android native bridge');
    try {
      (window as any).Android.openPaymentLink(paymentUrl);
      return true;
    } catch (error) {
      console.warn('[WebViewUtils] Android bridge failed:', error);
    }
  }
  
  // Method 5: window.open with _self target (keeps in same window/WebView)
  // CRITICAL: Use _self instead of _blank to keep payment in WebView
  try {
    console.log('[WebViewUtils] Attempting window.open with _self target');
    // Try _self first to keep in same WebView window
    const paymentWindow = window.open(paymentUrl, '_self');
    if (paymentWindow) {
      console.log('[WebViewUtils] Opened payment link in same window');
      return true;
    }
  } catch (openError) {
    console.warn('[WebViewUtils] window.open(_self) failed, trying _blank:', openError);
    // Fallback to _blank if _self doesn't work
    try {
      const paymentWindow = window.open(paymentUrl, '_blank', 'noopener,noreferrer');
      if (paymentWindow && !paymentWindow.closed) {
        console.log('[WebViewUtils] Opened payment link in new window');
        return true;
      }
    } catch (blankError) {
      console.warn('[WebViewUtils] window.open(_blank) also failed:', blankError);
    }
  }
  
  // Method 6: Standard redirect (fallback - most reliable for WebView)
  // CRITICAL: This is the most reliable method for Android WebView APK
  console.log('[WebViewUtils] Redirecting to payment link using window.location.href (most reliable for WebView)');
  try {
    // Use location.href - this works best in WebView
    window.location.href = paymentUrl;
    return true;
  } catch (error) {
    console.error('[WebViewUtils] window.location.href failed:', error);
    // Final fallback - location.replace
    try {
      console.log('[WebViewUtils] Trying window.location.replace as final fallback');
      window.location.replace(paymentUrl);
      return true;
    } catch (replaceError) {
      console.error('[WebViewUtils] All redirect methods failed:', replaceError);
      // Last resort: try assigning to location directly
      try {
        (window as any).location = paymentUrl;
        return true;
      } catch (finalError) {
        console.error('[WebViewUtils] Complete failure - all methods exhausted:', finalError);
        return false;
      }
    }
  }
};

/**
 * Send payment callback message to parent/Flutter
 */
export const sendPaymentCallback = (data: {
  type: 'paymentCallback';
  status: 'success' | 'failed';
  ticketId?: string;
  bookingId?: string;
  paymentId?: string;
  message?: string;
}): void => {
  console.log('[WebViewUtils] Sending payment callback:', data);
  
  // Method 1: Flutter bridge
  if (window.FlutterPaymentBridge && typeof window.FlutterPaymentBridge.paymentCallback === 'function') {
    window.FlutterPaymentBridge.paymentCallback(data);
    return;
  }
  
  // Method 2: postMessage to parent
  if (window.parent !== window) {
    window.parent.postMessage(data, '*');
  }
  
  // Method 3: Broadcast channel (if supported)
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel('payment_callback');
      channel.postMessage(data);
      channel.close();
    } catch (e) {
      console.warn('[WebViewUtils] BroadcastChannel not supported:', e);
    }
  }
};

