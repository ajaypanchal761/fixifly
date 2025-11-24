/**
 * JavaScript Enablement Check Utility
 * Verifies that JavaScript is properly enabled in Flutter WebView/APK
 * This is critical for Razorpay payment flow to work correctly
 */

export interface JavaScriptCheckResult {
  isEnabled: boolean;
  canExecute: boolean;
  canAccessDOM: boolean;
  canAccessStorage: boolean;
  canLoadScripts: boolean;
  canMakeFetch: boolean;
  details: {
    userAgent: string;
    isWebView: boolean;
    isFlutter: boolean;
    localStorageAvailable: boolean;
    sessionStorageAvailable: boolean;
    documentAvailable: boolean;
    windowAvailable: boolean;
    fetchAvailable: boolean;
    errors: string[];
  };
}

/**
 * Comprehensive JavaScript enablement check
 */
export const checkJavaScriptEnabled = (): JavaScriptCheckResult => {
  const result: JavaScriptCheckResult = {
    isEnabled: false,
    canExecute: false,
    canAccessDOM: false,
    canAccessStorage: false,
    canLoadScripts: false,
    canMakeFetch: false,
    details: {
      userAgent: '',
      isWebView: false,
      isFlutter: false,
      localStorageAvailable: false,
      sessionStorageAvailable: false,
      documentAvailable: false,
      windowAvailable: false,
      fetchAvailable: false,
      errors: []
    }
  };

  try {
    console.log('🔍 ========== JAVASCRIPT ENABLEMENT CHECK START ==========');
    console.log('🔍 Timestamp:', new Date().toISOString());

    // Check 1: Basic JavaScript execution
    try {
      result.canExecute = true;
      result.isEnabled = true;
      console.log('✅ JavaScript execution: ENABLED');
    } catch (e) {
      result.details.errors.push('JavaScript execution failed: ' + (e as Error).message);
      console.error('❌ JavaScript execution: DISABLED');
    }

    // Check 2: Window object
    try {
      result.details.windowAvailable = typeof window !== 'undefined';
      if (result.details.windowAvailable) {
        console.log('✅ Window object: AVAILABLE');
      } else {
        result.details.errors.push('Window object not available');
        console.error('❌ Window object: NOT AVAILABLE');
      }
    } catch (e) {
      result.details.errors.push('Window check failed: ' + (e as Error).message);
    }

    // Check 3: Document object (DOM access)
    try {
      result.details.documentAvailable = typeof document !== 'undefined';
      if (result.details.documentAvailable) {
        result.canAccessDOM = true;
        console.log('✅ Document object: AVAILABLE');
        console.log('✅ DOM access: ENABLED');
      } else {
        result.details.errors.push('Document object not available');
        console.error('❌ Document object: NOT AVAILABLE');
      }
    } catch (e) {
      result.details.errors.push('Document check failed: ' + (e as Error).message);
    }

    // Check 4: User Agent
    try {
      result.details.userAgent = navigator.userAgent || '';
      console.log('✅ User Agent:', result.details.userAgent);
      
      // Check for WebView
      result.details.isWebView = /wv|WebView|flutter|Flutter/i.test(result.details.userAgent);
      result.details.isFlutter = /flutter|Flutter/i.test(result.details.userAgent) || 
                                 !!(window as any).flutter_inappwebview;
      
      console.log('✅ Is WebView:', result.details.isWebView);
      console.log('✅ Is Flutter:', result.details.isFlutter);
    } catch (e) {
      result.details.errors.push('User agent check failed: ' + (e as Error).message);
    }

    // Check 5: LocalStorage
    try {
      const testKey = '__js_check_test__';
      localStorage.setItem(testKey, 'test');
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (value === 'test') {
        result.details.localStorageAvailable = true;
        result.canAccessStorage = true;
        console.log('✅ LocalStorage: AVAILABLE');
        console.log('✅ Storage access: ENABLED');
      } else {
        result.details.errors.push('LocalStorage test failed');
        console.error('❌ LocalStorage: NOT WORKING');
      }
    } catch (e) {
      result.details.errors.push('LocalStorage check failed: ' + (e as Error).message);
      console.error('❌ LocalStorage: NOT AVAILABLE -', (e as Error).message);
    }

    // Check 6: SessionStorage
    try {
      const testKey = '__js_check_test_session__';
      sessionStorage.setItem(testKey, 'test');
      const value = sessionStorage.getItem(testKey);
      sessionStorage.removeItem(testKey);
      
      if (value === 'test') {
        result.details.sessionStorageAvailable = true;
        console.log('✅ SessionStorage: AVAILABLE');
      } else {
        result.details.errors.push('SessionStorage test failed');
        console.error('❌ SessionStorage: NOT WORKING');
      }
    } catch (e) {
      result.details.errors.push('SessionStorage check failed: ' + (e as Error).message);
      console.error('❌ SessionStorage: NOT AVAILABLE -', (e as Error).message);
    }

    // Check 7: Script loading capability
    try {
      if (result.details.documentAvailable) {
        const testScript = document.createElement('script');
        testScript.type = 'text/javascript';
        testScript.textContent = 'window.__js_script_test__ = true;';
        document.head.appendChild(testScript);
        
        // Check if script executed
        const scriptExecuted = !!(window as any).__js_script_test__;
        delete (window as any).__js_script_test__;
        document.head.removeChild(testScript);
        
        if (scriptExecuted) {
          result.canLoadScripts = true;
          console.log('✅ Script loading: ENABLED');
        } else {
          result.details.errors.push('Script execution test failed');
          console.error('❌ Script loading: NOT WORKING');
        }
      }
    } catch (e) {
      result.details.errors.push('Script loading check failed: ' + (e as Error).message);
      console.error('❌ Script loading: FAILED -', (e as Error).message);
    }

    // Check 8: Fetch API
    try {
      result.details.fetchAvailable = typeof fetch !== 'undefined';
      if (result.details.fetchAvailable) {
        result.canMakeFetch = true;
        console.log('✅ Fetch API: AVAILABLE');
        console.log('✅ Network requests: ENABLED');
      } else {
        result.details.errors.push('Fetch API not available');
        console.error('❌ Fetch API: NOT AVAILABLE');
      }
    } catch (e) {
      result.details.errors.push('Fetch check failed: ' + (e as Error).message);
    }

    // Check 9: Razorpay script loading capability (if needed)
    try {
      if (result.canLoadScripts && result.details.documentAvailable) {
        const razorpayScript = document.querySelector('script[src*="razorpay.com"]');
        if (razorpayScript) {
          console.log('✅ Razorpay script: ALREADY LOADED');
        } else {
          console.log('ℹ️ Razorpay script: NOT LOADED (will load on payment)');
        }
      }
    } catch (e) {
      console.warn('⚠️ Razorpay script check failed:', (e as Error).message);
    }

    // Final assessment
    const allCriticalChecks = result.canExecute && 
                             result.canAccessDOM && 
                             result.canAccessStorage && 
                             result.canLoadScripts && 
                             result.canMakeFetch;

    if (allCriticalChecks) {
      result.isEnabled = true;
      console.log('✅ ✅ ✅ JAVASCRIPT FULLY ENABLED ✅ ✅ ✅');
      console.log('✅ All critical checks passed');
    } else {
      console.error('❌ ❌ ❌ JAVASCRIPT ISSUES DETECTED ❌ ❌ ❌');
      console.error('❌ Failed checks:', {
        canExecute: result.canExecute,
        canAccessDOM: result.canAccessDOM,
        canAccessStorage: result.canAccessStorage,
        canLoadScripts: result.canLoadScripts,
        canMakeFetch: result.canMakeFetch
      });
    }

    console.log('🔍 ========== JAVASCRIPT ENABLEMENT CHECK END ==========');
    console.log('🔍 Result:', JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('❌ Critical error in JavaScript check:', error);
    result.details.errors.push('Critical check error: ' + (error as Error).message);
    return result;
  }
};

/**
 * Quick check if JavaScript is enabled (for payment flow)
 */
export const isJavaScriptEnabledForPayment = (): boolean => {
  try {
    const check = checkJavaScriptEnabled();
    return check.isEnabled && check.canLoadScripts && check.canMakeFetch;
  } catch (e) {
    console.error('Error checking JavaScript for payment:', e);
    return false;
  }
};

/**
 * Test JavaScript functionality with a simple operation
 */
export const testJavaScriptExecution = (): boolean => {
  try {
    // Simple test
    const test = 1 + 1;
    if (test === 2) {
      console.log('✅ JavaScript execution test: PASSED');
      return true;
    }
    return false;
  } catch (e) {
    console.error('❌ JavaScript execution test: FAILED', e);
    return false;
  }
};

/**
 * Verify JavaScript is ready for Razorpay payment
 */
export const verifyJavaScriptForRazorpay = (): {
  ready: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  const check = checkJavaScriptEnabled();

  if (!check.canExecute) {
    issues.push('JavaScript execution is disabled');
    recommendations.push('Enable JavaScript in WebView settings');
  }

  if (!check.canAccessDOM) {
    issues.push('DOM access is not available');
    recommendations.push('Check WebView DOM access permissions');
  }

  if (!check.canAccessStorage) {
    issues.push('Storage (localStorage/sessionStorage) is not available');
    recommendations.push('Enable storage permissions in WebView');
    recommendations.push('Payment callback data may not persist');
  }

  if (!check.canLoadScripts) {
    issues.push('Script loading is not working');
    recommendations.push('Razorpay script may not load');
    recommendations.push('Check WebView script execution permissions');
  }

  if (!check.canMakeFetch) {
    issues.push('Fetch API is not available');
    recommendations.push('Network requests may fail');
    recommendations.push('Check WebView network permissions');
  }

  const ready = check.isEnabled && 
                check.canExecute && 
                check.canAccessDOM && 
                check.canAccessStorage && 
                check.canLoadScripts && 
                check.canMakeFetch;

  return {
    ready,
    issues,
    recommendations
  };
};

