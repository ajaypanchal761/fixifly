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
 */
export const isWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent || '';
  
  // Flutter WebView detection (priority checks)
  const isFlutterWebView = 
    window.flutter_inappwebview !== undefined || // Flutter InAppWebView
    window.flutter !== undefined || // Flutter WebView
    window.FlutterWebView !== undefined; // Custom Flutter WebView
  
  // Standard WebView indicators
  const isStandardWebView = 
    /wv|WebView|Android.*wv|iPhone.*wv/i.test(userAgent) ||
    window.ReactNativeWebView !== undefined ||
    window.Android !== undefined ||
    (window.webkit && window.webkit.messageHandlers);
  
  // Mobile device check (but not standard browser)
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isStandardBrowser = !userAgent.includes('wv') && 
                           !userAgent.includes('WebView') &&
                           !window.flutter_inappwebview &&
                           !window.flutter &&
                           !window.ReactNativeWebView;
  
  // Return true if any WebView indicator is present
  return isFlutterWebView || isStandardWebView || (isMobile && !isStandardBrowser);
};

/**
 * Open payment link in WebView with multiple fallback methods
 */
export const openPaymentLink = (paymentUrl: string): boolean => {
  console.log('[WebViewUtils] Opening payment link:', paymentUrl);
  
  // Method 1: Flutter bridge (if available)
  if (window.FlutterPaymentBridge && typeof window.FlutterPaymentBridge.openPaymentLink === 'function') {
    console.log('[WebViewUtils] Using Flutter bridge to open payment link');
    window.FlutterPaymentBridge.openPaymentLink(paymentUrl);
    return true;
  }
  
  // Method 2: window.open (might work in some WebViews)
  try {
    const paymentWindow = window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    if (paymentWindow) {
      console.log('[WebViewUtils] Opened payment link in new window');
      return true;
    }
  } catch (openError) {
    console.warn('[WebViewUtils] window.open failed, trying redirect:', openError);
  }
  
  // Method 3: Standard redirect (fallback)
  console.log('[WebViewUtils] Redirecting to payment link');
  window.location.href = paymentUrl;
  return true;
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

