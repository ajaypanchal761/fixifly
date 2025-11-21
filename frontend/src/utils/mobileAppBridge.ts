/**
 * Mobile App Bridge Utilities
 * Handles communication between WebView and native app
 */

/**
 * Check if running in Flutter WebView (Enhanced Detection)
 */
export const isRunningInFlutterWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const userAgent = navigator.userAgent || '';
    
    // Method 1: Check for Flutter WebView bridge objects
    const hasFlutterWebView = window.flutter_inappwebview !== undefined;
    const hasFlutter = (window as any).flutter !== undefined;
    const hasAndroidBridge = (window as any).Android !== undefined;
    
    // Method 2: Check user agent for Flutter/WebView indicators
    const hasFlutterInUserAgent = userAgent.includes('Flutter');
    const isWebViewUA = /wv|WebView/i.test(userAgent);
    const isAndroidWebView = /Android.*wv/i.test(userAgent);
    const isIOSWebView = /iPhone.*wv|iPad.*wv/i.test(userAgent);
    
    // Method 3: Check for WebKit message handlers (iOS)
    const hasWebKitHandlers = (window as any).webkit && (window as any).webkit.messageHandlers;
    
    // Method 4: Check for React Native WebView (for reference, though not used in Flutter)
    const hasReactNativeWebView = (window as any).ReactNativeWebView !== undefined;
    
    // Method 5: Check if running in mobile-like environment but not standard browser
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isStandardBrowser = !userAgent.includes('wv') && 
                             !userAgent.includes('WebView') && 
                             !hasFlutterWebView && 
                             !hasFlutter &&
                             !hasAndroidBridge;
    
    // Method 6: Check for standalone mode (PWA/APK)
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    // Return true if any Flutter WebView indicator is found
    return hasFlutterWebView || 
           hasFlutter || 
           hasAndroidBridge ||
           hasFlutterInUserAgent || 
           isWebViewUA || 
           isAndroidWebView ||
           isIOSWebView ||
           hasWebKitHandlers ||
           (isMobile && !isStandardBrowser && (isStandalone || isIOSStandalone));
  } catch (error) {
    console.error('Error detecting Flutter WebView:', error);
    return false;
  }
};

/**
 * Check if running in APK/WebView context (Enhanced)
 */
export const isAPKContext = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Use the enhanced Flutter WebView detection
    if (isRunningInFlutterWebView()) {
      return true;
    }
    
    // Check for other WebView indicators
    const userAgent = navigator.userAgent || '';
    const isWebView = /wv|WebView/i.test(userAgent);
    const isAndroidWebView = /Android.*wv/i.test(userAgent);
    const hasCordova = window.cordova !== undefined;
    const hasCapacitor = window.Capacitor !== undefined;
    
    // Check for standalone mode
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    return isWebView || isAndroidWebView || hasCordova || hasCapacitor || isStandalone || isIOSStandalone;
  } catch (error) {
    console.error('Error detecting APK context:', error);
    return false;
  }
};

/**
 * Navigate in mobile app using bridge
 */
export const navigateInMobileApp = (path: string): boolean => {
  try {
    // Try Flutter WebView bridge
    if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
      window.flutter_inappwebview.callHandler('navigate', path);
      return true;
    }
    
    // Try Cordova
    if (window.cordova && window.cordova.exec) {
      window.cordova.exec(null, null, 'Navigation', 'navigate', [path]);
      return true;
    }
    
    // Try Capacitor
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      window.Capacitor.Plugins.App.openUrl({ url: path });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error navigating in mobile app:', error);
    return false;
  }
};

/**
 * Send message to native app
 */
export const sendMessageToNative = (message: string, data?: any): boolean => {
  try {
    // Method 1: Flutter InAppWebView
    if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
      window.flutter_inappwebview.callHandler('message', { message, data });
      return true;
    }
    
    // Method 2: Flutter WebView (alternative)
    if ((window as any).flutter && (window as any).flutter.postMessage) {
      (window as any).flutter.postMessage(JSON.stringify({ message, data }));
      return true;
    }
    
    // Method 3: Android bridge
    if ((window as any).Android && (window as any).Android.postMessage) {
      (window as any).Android.postMessage(JSON.stringify({ message, data }));
      return true;
    }
    
    // Method 4: WebKit message handlers (iOS)
    if ((window as any).webkit && (window as any).webkit.messageHandlers && (window as any).webkit.messageHandlers.nativeHandler) {
      (window as any).webkit.messageHandlers.nativeHandler.postMessage({ message, data });
      return true;
    }
    
    // Method 5: postMessage to parent (if in iframe)
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'nativeMessage', message, data }, '*');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error sending message to native:', error);
    return false;
  }
};

/**
 * Open payment link in external browser or WebView
 */
export const openPaymentLink = (url: string): boolean => {
  try {
    // Method 1: Use Flutter bridge to open in external browser
    if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
      window.flutter_inappwebview.callHandler('openPaymentLink', url);
      return true;
    }
    
    // Method 2: Use Android intent
    if ((window as any).Android && (window as any).Android.openUrl) {
      (window as any).Android.openUrl(url);
      return true;
    }
    
    // Method 3: Use window.open with _system (Cordova/Capacitor)
    if (window.cordova && (window as any).cordova.InAppBrowser) {
      (window as any).cordova.InAppBrowser.open(url, '_system');
      return true;
    }
    
    // Method 4: Standard window.open (fallback)
    const paymentWindow = window.open(url, '_blank');
    if (paymentWindow) {
      return true;
    }
    
    // Method 5: Direct navigation (last resort)
    window.location.href = url;
    return true;
  } catch (error) {
    console.error('Error opening payment link:', error);
    // Fallback: direct navigation
    window.location.href = url;
    return false;
  }
};

/**
 * Handle payment callback from native app
 */
export const handlePaymentCallback = (callback: (data: any) => void): void => {
  try {
    // Listen for messages from Flutter
    if (window.flutter_inappwebview) {
      // Flutter will call this handler
      (window as any).onPaymentCallback = callback;
    }
    
    // Listen for postMessage
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'paymentCallback') {
        callback(event.data);
      }
    });
    
    // Listen for custom events
    window.addEventListener('paymentCallback', ((event: CustomEvent) => {
      callback(event.detail);
    }) as EventListener);
  } catch (error) {
    console.error('Error setting up payment callback handler:', error);
  }
};

// Extend Window interface
declare global {
  interface Window {
    flutter_inappwebview?: {
      callHandler: (method: string, ...args: any[]) => void | Promise<any>;
    };
    flutter?: {
      postMessage: (message: string) => void;
    };
    Android?: {
      postMessage: (message: string) => void;
      openUrl: (url: string) => void;
    };
    webkit?: {
      messageHandlers?: {
        nativeHandler?: {
          postMessage: (data: any) => void;
        };
        [key: string]: {
          postMessage: (data: any) => void;
        } | undefined;
      };
    };
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
    onPaymentCallback?: (data: any) => void;
    cordova?: {
      exec: (success: any, error: any, service: string, action: string, args: any[]) => void;
      InAppBrowser?: {
        open: (url: string, target: string) => any;
      };
    };
    Capacitor?: {
      Plugins?: {
        App?: {
          openUrl: (options: { url: string }) => void;
        };
      };
    };
  }
}

