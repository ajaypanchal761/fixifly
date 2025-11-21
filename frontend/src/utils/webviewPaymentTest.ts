/**
 * WebView Payment Test Utility
 * Tests WebView payment detection and flow
 */

export const testWebViewPayment = () => {
  console.log('🧪 ========== WEBVIEW PAYMENT TEST START ==========');
  
  // Test 1: WebView Detection
  console.log('\n📱 Test 1: WebView Detection');
  const testWebViewDetection = () => {
    const userAgent = navigator.userAgent || '';
    const hasFlutter = !!(window as any).flutter_inappwebview;
    const hasFlutterAlt = !!(window as any).flutter;
    const hasAndroidBridge = !!(window as any).Android;
    const isWebView = /wv|WebView/i.test(userAgent);
    const isAndroidWebView = /Android.*wv/i.test(userAgent);
    const isIOSWebView = /iPhone.*wv|iPad.*wv/i.test(userAgent);
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    const results = {
      userAgent,
      hasFlutter,
      hasFlutterAlt,
      hasAndroidBridge,
      isWebView,
      isAndroidWebView,
      isIOSWebView,
      isStandalone,
      isIOSStandalone,
      detectedAsWebView: isWebView || isAndroidWebView || isIOSWebView || hasFlutter || hasFlutterAlt || hasAndroidBridge || (isStandalone || isIOSStandalone)
    };
    
    console.log('📋 Detection Results:', results);
    return results;
  };
  
  const detectionResults = testWebViewDetection();
  
  // Test 2: Razorpay Script Loading
  console.log('\n📥 Test 2: Razorpay Script Loading');
  const testRazorpayScript = () => {
    const hasRazorpay = !!(window as any).Razorpay;
    const scriptExists = !!document.querySelector('script[src*="razorpay.com"]');
    
    const results = {
      hasRazorpay,
      scriptExists,
      canLoad: !hasRazorpay && typeof document !== 'undefined'
    };
    
    console.log('📋 Script Results:', results);
    return results;
  };
  
  const scriptResults = testRazorpayScript();
  
  // Test 3: LocalStorage Availability
  console.log('\n💾 Test 3: LocalStorage Availability');
  const testLocalStorage = () => {
    try {
      const testKey = 'webview_test_' + Date.now();
      localStorage.setItem(testKey, 'test');
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      const results = {
        available: true,
        writable: value === 'test',
        canStore: true
      };
      
      console.log('📋 LocalStorage Results:', results);
      return results;
    } catch (e) {
      const results = {
        available: false,
        writable: false,
        canStore: false,
        error: (e as Error).message
      };
      
      console.error('❌ LocalStorage Error:', results);
      return results;
    }
  };
  
  const storageResults = testLocalStorage();
  
  // Test 4: Callback URL Construction
  console.log('\n🔗 Test 4: Callback URL Construction');
  const testCallbackURL = () => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const callbackUrl = `${apiBase}/payment/razorpay-callback`;
      const testOrderId = 'order_test_123456';
      
      const url = new URL(callbackUrl);
      url.searchParams.set('razorpay_order_id', testOrderId);
      url.searchParams.set('order_id', testOrderId);
      
      const results = {
        apiBase,
        callbackUrl,
        constructedUrl: url.toString(),
        hasOrderId: url.searchParams.has('razorpay_order_id'),
        isValid: url.toString().includes(testOrderId)
      };
      
      console.log('📋 Callback URL Results:', results);
      return results;
    } catch (e) {
      const results = {
        error: (e as Error).message,
        isValid: false
      };
      
      console.error('❌ Callback URL Error:', results);
      return results;
    }
  };
  
  const callbackResults = testCallbackURL();
  
  // Test 5: Flutter Bridge Communication
  console.log('\n🌉 Test 5: Flutter Bridge Communication');
  const testFlutterBridge = () => {
    const hasFlutterBridge = !!(window as any).flutter_inappwebview;
    const hasFlutterAlt = !!(window as any).flutter;
    const hasAndroidBridge = !!(window as any).Android;
    
    const results = {
      hasFlutterBridge,
      hasFlutterAlt,
      hasAndroidBridge,
      canCommunicate: hasFlutterBridge || hasFlutterAlt || hasAndroidBridge
    };
    
    console.log('📋 Flutter Bridge Results:', results);
    return results;
  };
  
  const bridgeResults = testFlutterBridge();
  
  // Test 6: Payment Data Storage
  console.log('\n💳 Test 6: Payment Data Storage');
  const testPaymentStorage = () => {
    try {
      const testPaymentData = {
        orderId: 'order_test_123',
        paymentId: 'pay_test_456',
        signature: 'sig_test_789',
        timestamp: Date.now()
      };
      
      localStorage.setItem('payment_response', JSON.stringify(testPaymentData));
      const retrieved = JSON.parse(localStorage.getItem('payment_response') || '{}');
      localStorage.removeItem('payment_response');
      
      const results = {
        canStore: true,
        canRetrieve: retrieved.orderId === testPaymentData.orderId,
        dataIntegrity: JSON.stringify(retrieved) === JSON.stringify(testPaymentData)
      };
      
      console.log('📋 Payment Storage Results:', results);
      return results;
    } catch (e) {
      const results = {
        canStore: false,
        canRetrieve: false,
        dataIntegrity: false,
        error: (e as Error).message
      };
      
      console.error('❌ Payment Storage Error:', results);
      return results;
    }
  };
  
  const paymentStorageResults = testPaymentStorage();
  
  // Summary
  console.log('\n📊 ========== TEST SUMMARY ==========');
  const summary = {
    webViewDetected: detectionResults.detectedAsWebView,
    razorpayAvailable: scriptResults.hasRazorpay,
    localStorageWorking: storageResults.available && storageResults.writable,
    callbackURLValid: callbackResults.isValid,
    flutterBridgeAvailable: bridgeResults.canCommunicate,
    paymentStorageWorking: paymentStorageResults.canStore && paymentStorageResults.canRetrieve,
    overallStatus: 'READY' as 'READY' | 'ISSUES' | 'FAILED'
  };
  
  // Determine overall status
  const criticalTests = [
    summary.webViewDetected,
    summary.localStorageWorking,
    summary.callbackURLValid
  ];
  
  if (criticalTests.every(test => test)) {
    summary.overallStatus = 'READY';
  } else if (criticalTests.some(test => test)) {
    summary.overallStatus = 'ISSUES';
  } else {
    summary.overallStatus = 'FAILED';
  }
  
  console.log('📋 Summary:', summary);
  console.log('\n✅ ========== WEBVIEW PAYMENT TEST END ==========\n');
  
  return {
    detection: detectionResults,
    script: scriptResults,
    storage: storageResults,
    callback: callbackResults,
    bridge: bridgeResults,
    paymentStorage: paymentStorageResults,
    summary
  };
};

/**
 * Test payment flow simulation
 */
export const simulatePaymentFlow = async () => {
  console.log('🧪 ========== PAYMENT FLOW SIMULATION ==========');
  
  try {
    // Step 1: Check WebView detection
    console.log('\n1️⃣ Checking WebView detection...');
    const isAPK = testWebViewPayment().summary.webViewDetected;
    console.log(`   ${isAPK ? '✅' : '❌'} WebView detected: ${isAPK}`);
    
    // Step 2: Check Razorpay availability
    console.log('\n2️⃣ Checking Razorpay availability...');
    const hasRazorpay = !!(window as any).Razorpay;
    console.log(`   ${hasRazorpay ? '✅' : '⚠️'} Razorpay ${hasRazorpay ? 'available' : 'not loaded'}`);
    
    // Step 3: Simulate order creation
    console.log('\n3️⃣ Simulating order creation...');
    const testOrderId = 'order_test_' + Date.now();
    console.log(`   ✅ Test Order ID: ${testOrderId}`);
    
    // Step 4: Simulate callback URL
    console.log('\n4️⃣ Simulating callback URL...');
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const callbackUrl = `${apiBase}/payment/razorpay-callback?razorpay_order_id=${testOrderId}`;
    console.log(`   ✅ Callback URL: ${callbackUrl}`);
    
    // Step 5: Simulate payment data storage
    console.log('\n5️⃣ Simulating payment data storage...');
    try {
      const paymentData = {
        razorpay_order_id: testOrderId,
        razorpay_payment_id: 'pay_test_' + Date.now(),
        razorpay_signature: 'sig_test_' + Date.now(),
        timestamp: Date.now()
      };
      localStorage.setItem('payment_response', JSON.stringify(paymentData));
      console.log('   ✅ Payment data stored');
      
      // Verify retrieval
      const retrieved = JSON.parse(localStorage.getItem('payment_response') || '{}');
      console.log(`   ${retrieved.razorpay_order_id === testOrderId ? '✅' : '❌'} Payment data retrieval: ${retrieved.razorpay_order_id === testOrderId}`);
      
      // Cleanup
      localStorage.removeItem('payment_response');
    } catch (e) {
      console.error('   ❌ Payment data storage failed:', e);
    }
    
    console.log('\n✅ ========== PAYMENT FLOW SIMULATION COMPLETE ==========\n');
    
    return {
      success: true,
      orderId: testOrderId,
      callbackUrl
    };
  } catch (error) {
    console.error('❌ Payment flow simulation failed:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
};

/**
 * Run all tests
 */
export const runAllWebViewTests = () => {
  console.log('🚀 Starting comprehensive WebView payment tests...\n');
  
  const testResults = testWebViewPayment();
  const simulationResults = simulatePaymentFlow();
  
  return {
    testResults,
    simulationResults,
    recommendations: getRecommendations(testResults.summary)
  };
};

/**
 * Get recommendations based on test results
 */
const getRecommendations = (summary: any): string[] => {
  const recommendations: string[] = [];
  
  if (!summary.webViewDetected) {
    recommendations.push('⚠️ WebView not detected. Payment will use modal mode which may not work in WebView.');
  }
  
  if (!summary.razorpayAvailable) {
    recommendations.push('⚠️ Razorpay script not loaded. Make sure to call loadRazorpayScript() before processing payment.');
  }
  
  if (!summary.localStorageWorking) {
    recommendations.push('❌ LocalStorage not working. Payment data cannot be stored for callback handling.');
  }
  
  if (!summary.callbackURLValid) {
    recommendations.push('❌ Callback URL construction failed. Check VITE_API_URL environment variable.');
  }
  
  if (!summary.flutterBridgeAvailable && summary.webViewDetected) {
    recommendations.push('⚠️ Flutter bridge not available. Some navigation features may not work.');
  }
  
  if (summary.overallStatus === 'READY') {
    recommendations.push('✅ All critical tests passed. Payment should work in WebView.');
  }
  
  return recommendations;
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testWebViewPayment = testWebViewPayment;
  (window as any).simulatePaymentFlow = simulatePaymentFlow;
  (window as any).runAllWebViewTests = runAllWebViewTests;
}

