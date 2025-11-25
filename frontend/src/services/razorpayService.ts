// Razorpay service for frontend
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss: () => void;
  };
}

interface PaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface BookingData {
  customer: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  services: Array<{
    serviceId: string;
    serviceName: string;
    price: number;
  }>;
  pricing: {
    subtotal: number;
    gstRate?: number;
    gstAmount?: number;
    serviceFee?: number;
    totalAmount: number;
  };
  scheduling: {
    preferredDate: string;
    preferredTimeSlot: string;
  };
  notes?: string;
}

class RazorpayService {
  private static instance: RazorpayService;
  private razorpayKey: string;
  private apiUrl: string; // RentYatra style - store API URL

  constructor() {
    // CRITICAL FIX #3: Razorpay Key Mismatch Issue
    // Ensure same key is used everywhere (test or live)
    // Check environment and use appropriate key
    const isProduction = import.meta.env.PROD || 
                        (typeof window !== 'undefined' && window.location.hostname.includes('getfixfly.com'));
    
    // Get key from environment variable (should be set in Vercel)
    this.razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_8sYbzHWidwe5Zw';
    
    // CRITICAL: Validate key format
    if (this.razorpayKey) {
      const isTestKey = this.razorpayKey.startsWith('rzp_test_');
      const isLiveKey = this.razorpayKey.startsWith('rzp_live_');
      
      if (!isTestKey && !isLiveKey) {
        console.error('❌ Invalid Razorpay Key format:', this.razorpayKey);
        console.error('❌ Key should start with rzp_test_ or rzp_live_');
      }
      
      // Note: Test key in production is OK for testing (user preference)
      if (isProduction && isTestKey) {
        console.log('ℹ️  INFO: Production environment using TEST Razorpay key (for testing)');
        console.log('ℹ️  This is OK for testing. Switch to live key when ready for production payments.');
      }
      
      // Warn if development but using live key
      if (!isProduction && isLiveKey) {
        console.warn('⚠️  WARNING: Development environment but using LIVE Razorpay key!');
        console.warn('⚠️  This may cause issues. Consider using test key for development.');
      }
      
      console.log('🔑 Razorpay Key Configuration:', {
        keyType: isTestKey ? 'TEST' : isLiveKey ? 'LIVE' : 'UNKNOWN',
        keyPrefix: this.razorpayKey.substring(0, 10) + '...',
        environment: isProduction ? 'PRODUCTION' : 'DEVELOPMENT',
        isMismatched: (isProduction && isTestKey) || (!isProduction && isLiveKey)
      });
    }
    
    this.apiUrl = import.meta.env.VITE_API_URL || '/api'; // RentYatra style
    
    // Validate API URL in production (RentYatra style)
    if (import.meta.env.PROD && this.apiUrl === '/api') {
      console.warn('⚠️  VITE_API_URL not set! Using relative path "/api".');
      console.warn('⚠️  This may cause payment failures in production.');
      console.warn('⚠️  Please set VITE_API_URL in Vercel environment variables.');
    }
    
    // Log API URL for debugging (RentYatra style)
    console.log('🔧 RazorpayService initialized:', {
      apiUrl: this.apiUrl,
      razorpayKey: this.razorpayKey ? `${this.razorpayKey.substring(0, 8)}...` : 'NOT SET',
      env: import.meta.env.MODE || 'unknown',
      isProduction: import.meta.env.PROD,
      viteApiUrl: import.meta.env.VITE_API_URL || 'NOT SET',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A'
    });
    
    // CRITICAL: Live Server Verification
    if (import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname.includes('getfixfly.com'))) {
      console.log('🌐 ========== LIVE SERVER VERIFICATION ==========');
      console.log('🌐 VITE_API_URL:', import.meta.env.VITE_API_URL || 'NOT SET');
      console.log('🌐 this.apiUrl:', this.apiUrl);
      console.log('🌐 Expected: https://api.getfixfly.com/api');
      console.log('🌐 Match:', this.apiUrl === 'https://api.getfixfly.com/api' ? '✅ YES' : '❌ NO');
      
      if (this.apiUrl !== 'https://api.getfixfly.com/api' && this.apiUrl !== 'https://api.getfixfly.com/api/') {
        console.warn('⚠️ ⚠️ ⚠️ WARNING: VITE_API_URL might not be set correctly! ⚠️ ⚠️ ⚠️');
        console.warn('⚠️ Current value:', this.apiUrl);
        console.warn('⚠️ Expected: https://api.getfixfly.com/api');
        console.warn('⚠️ Please verify Vercel environment variables');
      }
      console.log('🌐 ===============================================');
    }
    
    if (!this.razorpayKey) {
      console.error('⚠️  RAZORPAY_KEY_ID not configured in environment variables');
    }
  }

  static getInstance(): RazorpayService {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService();
    }
    return RazorpayService.instance;
  }

  /**
   * Load Razorpay script dynamically
   * CRITICAL: For WebView, ensure network permissions and proper script loading
   */
  private async loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        console.log('✅ Razorpay script already loaded');
        resolve();
        return;
      }

      // Check if we're in WebView and log network status
      const isWebView = this.isAPKContext();
      if (isWebView) {
        console.log('📱 WebView detected - ensuring network permissions');
        console.log('📱 User Agent:', navigator.userAgent);
      }

      console.log('📥 Loading Razorpay script...');
      console.log('📥 Script URL: https://checkout.razorpay.com/v1/checkout.js');
      
      // Try to load script with retry mechanism
      let retryCount = 0;
      const maxRetries = 3;
      
      const loadScript = () => {
        // Remove any existing script first
        const existingScript = document.querySelector('script[src*="razorpay.com"]');
        if (existingScript) {
          existingScript.remove();
          console.log('🧹 Removed existing Razorpay script');
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.defer = true;
        
        // CRITICAL: For WebView, add crossorigin attribute
        script.crossOrigin = 'anonymous';
        
        // Add integrity check (optional but good for security)
        // script.integrity = 'sha256-...'; // Add if available
        
        // Add timeout for WebView scenarios (increased timeout)
        const timeout = setTimeout(() => {
          if (!window.Razorpay) {
            console.error(`❌ Razorpay script loading timeout (attempt ${retryCount + 1}/${maxRetries})`);
            
            // Retry if attempts left
            if (retryCount < maxRetries - 1) {
              retryCount++;
              console.log(`🔄 Retrying script load (attempt ${retryCount + 1}/${maxRetries})...`);
              setTimeout(loadScript, 2000); // Wait 2 seconds before retry
            } else {
              reject(new Error('Razorpay script loading timeout after multiple attempts. Please check your internet connection and WebView network permissions.'));
            }
          }
        }, 15000); // Increased to 15 seconds for WebView
        
        script.onload = () => {
          clearTimeout(timeout);
          console.log('✅ Razorpay script loaded successfully');
          
          // Wait a bit for Razorpay to initialize
          setTimeout(() => {
            if (window.Razorpay) {
              console.log('✅ Razorpay object available');
              resolve();
            } else {
              console.warn('⚠️ Script loaded but Razorpay object not yet available, waiting...');
              
              // Wait a bit more
              setTimeout(() => {
                if (window.Razorpay) {
                  console.log('✅ Razorpay object now available');
                  resolve();
                } else {
                  console.error('❌ Razorpay object still not available after waiting');
                  
                  // Retry if attempts left
                  if (retryCount < maxRetries - 1) {
                    retryCount++;
                    console.log(`🔄 Retrying script load (attempt ${retryCount + 1}/${maxRetries})...`);
                    setTimeout(loadScript, 2000);
                  } else {
                    reject(new Error('Razorpay script loaded but window.Razorpay is not available. Please check WebView network permissions.'));
                  }
                }
              }, 2000);
            }
          }, 500);
        };
        
        script.onerror = (error) => {
          clearTimeout(timeout);
          console.error('❌ Failed to load Razorpay script:', error);
          console.error('❌ Script URL: https://checkout.razorpay.com/v1/checkout.js');
          console.error('❌ Network status:', navigator.onLine ? 'Online' : 'Offline');
          
          // Retry if attempts left
          if (retryCount < maxRetries - 1) {
            retryCount++;
            console.log(`🔄 Retrying script load after error (attempt ${retryCount + 1}/${maxRetries})...`);
            setTimeout(loadScript, 2000);
          } else {
            reject(new Error('Failed to load Razorpay script after multiple attempts. Please check your internet connection and ensure WebView has network permissions.'));
          }
        };
        
        // CRITICAL: For WebView, try to add script with error handling
        try {
          document.head.appendChild(script);
          console.log('📥 Script element added to DOM');
        } catch (appendError) {
          console.error('❌ Error appending script to DOM:', appendError);
          
          // Try alternative method
          try {
            document.body.appendChild(script);
            console.log('📥 Script element added to body (fallback)');
          } catch (bodyError) {
            console.error('❌ Error appending script to body:', bodyError);
            reject(new Error('Failed to add Razorpay script to page. WebView may have restrictions.'));
          }
        }
      };
      
      // Start loading
      loadScript();
    });
  }

  /**
   * Create Razorpay order
   */
  async createOrder(amount: number, receipt: string, notes: Record<string, string> = {}): Promise<any> {
    try {
      // Validate amount
      if (!amount || amount <= 0 || isNaN(amount)) {
        throw new Error('Invalid payment amount');
      }

      // CRITICAL: Live Server Fix - Use production backend URL if in production
      const isProduction = import.meta.env.PROD || 
                          window.location.hostname.includes('getfixfly.com') ||
                          window.location.hostname.includes('vercel.app') ||
                          window.location.protocol === 'https:';
      
      let orderApiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      // If production and VITE_API_URL is relative/localhost, use production backend
      if (isProduction && (orderApiBase.includes('localhost') || !orderApiBase.startsWith('http'))) {
        orderApiBase = 'https://api.getfixfly.com/api';
        console.log('🔧 PRODUCTION: Using production backend for order creation:', orderApiBase);
      }
      
      const apiUrl = `${orderApiBase}/payment/create-order`;
      
      console.log('📤 Creating Razorpay order:', {
        apiUrl,
        amount,
        currency: 'INR',
        receipt,
        notes
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          receipt,
          notes
        }),
      });

      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Order creation failed - HTTP Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to create order: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        console.error('❌ Order creation failed - API Error:', data);
        throw new Error(data.message || 'Failed to create order');
      }

      if (!data.data || !data.data.id) {
        console.error('❌ Order creation failed - Invalid response:', data);
        throw new Error('Invalid order response from server');
      }

      console.log('✅ Razorpay order created:', {
        orderId: data.data.id,
        amount: data.data.amount,
        currency: data.data.currency,
        status: data.data.status
      });

      return {
        orderId: data.data.id,
        amount: data.data.amount, // Already in paise
        currency: data.data.currency || 'INR',
        status: data.data.status
      };
    } catch (error: any) {
      console.error('❌ Error creating Razorpay order:', error);
      throw new Error(error.message || 'Failed to create payment order. Please try again.');
    }
  }

  /**
   * Check if running in WebView/APK context (RentYatra style - Simple and Reliable)
   * CRITICAL: According to SOP, this detection must be accurate for WebView/APK
   */
  private isAPKContext(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      // RentYatra style detection - simple and reliable (SOP compliant)
      // Method 1: Check for Flutter WebView bridge (most reliable)
      const hasFlutterWebView = (window as any).flutter_inappwebview !== undefined;
      
      // Method 2: Check for Cordova/Capacitor
      const hasCordova = (window as any).cordova !== undefined;
      const hasCapacitor = (window as any).Capacitor !== undefined;
      
      // Method 3: Check user agent for WebView indicators (SOP method)
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
      const isWebView = /wv|WebView/i.test(userAgent);
      const isFlutterUserAgent = /flutter|Flutter/i.test(userAgent);
      const isAndroidWebView = /Android.*wv/i.test(userAgent);
      
      // Method 4: Check for standalone mode (PWA/APK)
      const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      // Return true for actual native app contexts (SOP requirement)
      // This includes Flutter WebView which is used in APK
      const isAPK = hasCordova || hasCapacitor || hasFlutterWebView || isWebView || isFlutterUserAgent || isAndroidWebView || isStandalone || isIOSStandalone;
      
      // Log detection for debugging (SOP best practice)
      if (isAPK) {
        console.log('🔍 APK/WebView detected:', {
          hasFlutterWebView,
          hasCordova,
          hasCapacitor,
          isWebView,
          isFlutterUserAgent,
          isAndroidWebView,
          isStandalone,
          isIOSStandalone,
          userAgent: userAgent.substring(0, 100) // First 100 chars only
        });
      }
      
      return isAPK;
    } catch (e) {
      console.warn('Error detecting APK context:', e);
      return false;
    }
  }

  /**
   * Detect if running in iframe (RentYatra style)
   */
  private isInIframe(): boolean {
    try {
      return window.self !== window.top;
    } catch (e) {
      // If we can't access window.top, we're likely in iframe
      return true;
    }
  }

  /**
   * Send message to parent window (for iframe scenarios) - RentYatra style
   */
  private sendMessageToParent(messageType: string, data: any): void {
    if (this.isInIframe()) {
      try {
        (window.parent as any).postMessage({
          type: messageType,
          data: data,
          source: 'fixfly-payment'
        }, '*'); // In production, use specific origin
        console.log(`📤 Sent message to parent: ${messageType}`, data);
      } catch (error) {
        console.error('❌ Error sending message to parent:', error);
      }
    }
  }

  /**
   * Process payment with order details
   */
  async processPayment(paymentData: {
    orderId: string;
    amount: number;
    currency: string;
    name: string;
    email: string;
    phone: string;
    description: string;
    bookingId?: string;
    ticketId?: string;
    onSuccess: (response: any) => void;
    onError: (error: any) => void;
  }): Promise<void> {
    try {
      // CRITICAL: Check JavaScript enablement before proceeding
      console.log('🔍 ========== JAVASCRIPT ENABLEMENT CHECK ==========');
      try {
        const { checkJavaScriptEnabled, verifyJavaScriptForRazorpay } = await import('../utils/javascriptCheck');
        const jsCheck = checkJavaScriptEnabled();
        const razorpayCheck = verifyJavaScriptForRazorpay();
        
        console.log('🔍 JavaScript Enabled:', jsCheck.isEnabled);
        console.log('🔍 Can Execute:', jsCheck.canExecute);
        console.log('🔍 Can Access DOM:', jsCheck.canAccessDOM);
        console.log('🔍 Can Access Storage:', jsCheck.canAccessStorage);
        console.log('🔍 Can Load Scripts:', jsCheck.canLoadScripts);
        console.log('🔍 Can Make Fetch:', jsCheck.canMakeFetch);
        console.log('🔍 Ready for Razorpay:', razorpayCheck.ready);
        
        if (!razorpayCheck.ready) {
          console.error('❌ ❌ ❌ JAVASCRIPT NOT READY FOR PAYMENT ❌ ❌ ❌');
          console.error('❌ Issues:', razorpayCheck.issues);
          console.error('❌ Recommendations:', razorpayCheck.recommendations);
          
          // Don't block payment, but log warning
          console.warn('⚠️ Proceeding with payment despite JavaScript issues - may fail');
        } else {
          console.log('✅ ✅ ✅ JAVASCRIPT READY FOR PAYMENT ✅ ✅ ✅');
        }
        console.log('🔍 ===================================================');
      } catch (jsCheckError) {
        console.warn('⚠️ JavaScript check failed:', jsCheckError);
        console.warn('⚠️ Proceeding with payment anyway');
      }
      
      // Load Razorpay script
      await this.loadRazorpayScript();

      // Detect WebView/APK context (RentYatra style - Simple and Reliable)
      const isAPK = this.isAPKContext();
      const isInIframe = this.isInIframe();
      
      // CRITICAL: WebView/APK requires redirect mode, not modal mode
      // Modal mode (redirect: false) doesn't work in WebView due to iframe restrictions
      // We must use redirect mode with callback URL for WebView
      const useRedirectMode = isAPK || isInIframe;

      console.log('🔍 ========== PAYMENT CONTEXT DETECTION (RentYatra Style) ==========');
      console.log('🔍 Is APK/WebView:', isAPK);
      console.log('🔍 Is In Iframe:', isInIframe);
      console.log('🔍 Use Redirect Mode:', useRedirectMode);
      console.log('🔍 User Agent:', navigator.userAgent);
      console.log('🔍 Has Flutter WebView:', !!(window as any).flutter_inappwebview);
      console.log('🔍 Has Cordova:', !!(window as any).cordova);
      console.log('🔍 Has Capacitor:', !!(window as any).Capacitor);
      
      // CRITICAL: Iframe detection details
      if (isInIframe) {
        console.log('⚠️ ⚠️ ⚠️ IFRAME DETECTED - REDIRECT MODE MANDATORY ⚠️ ⚠️ ⚠️');
        console.log('⚠️ Iframe mein modal mode work nahi karta');
        console.log('⚠️ Redirect mode aur callback_url required hai');
        console.log('⚠️ Parent window communication enabled');
      }
      
      console.log('🔍 ===============================================');

      // Build callback URL for redirect mode (RentYatra style - Simple and Reliable)
      // CRITICAL: According to SOP, callback URL should be simple and direct
      // RentYatra uses: const apiBase = this.apiUrl; then callbackUrl = `${apiBase}/payment/razorpay-callback`
      
      // Get API base URL - RentYatra style (simple and direct)
      let apiBase = this.apiUrl || import.meta.env.VITE_API_URL || '/api';
      
      // Remove trailing slash if present
      apiBase = apiBase.replace(/\/+$/, '');
      
      // CRITICAL: Production/Live Server Detection
      const isProduction = import.meta.env.PROD || 
                          window.location.hostname.includes('getfixfly.com') ||
                          window.location.hostname.includes('vercel.app') ||
                          window.location.protocol === 'https:';
      
      // CRITICAL: For WebView/APK, ALWAYS use production backend URL (SOP requirement)
      // WebView cannot access localhost, so we must use production backend
      const isLocalhost = apiBase.includes('localhost') || 
                         apiBase.includes('127.0.0.1') ||
                         !apiBase.startsWith('http');
      
      // Production backend URL (must be publicly accessible)
      const PRODUCTION_BACKEND_URL = 'https://api.getfixfly.com';
      
      // CRITICAL FIX: For WebView/APK, always use production backend (SOP requirement)
      // This is the key fix - WebView cannot access localhost callback URLs
      if (useRedirectMode) {
        // WebView/APK scenario - MUST use production backend
        if (isLocalhost || !apiBase.startsWith('http')) {
          console.log('🔧 WEBVIEW/APK MODE: Using production backend URL (REQUIRED)');
          apiBase = PRODUCTION_BACKEND_URL;
        } else if (isProduction && apiBase !== PRODUCTION_BACKEND_URL) {
          // Production mode but wrong URL - fix it
          console.log('🔧 PRODUCTION MODE: Fixing API base URL');
          apiBase = PRODUCTION_BACKEND_URL;
        }
      } else if (isProduction && (isLocalhost || !apiBase.startsWith('http'))) {
        // Production web - use production backend
        console.log('🔧 PRODUCTION MODE: Using production backend URL');
        apiBase = PRODUCTION_BACKEND_URL;
      }
      
      // Ensure absolute URL
      if (!apiBase.startsWith('http://') && !apiBase.startsWith('https://')) {
        // If still relative, construct from current origin
        const currentOrigin = window.location.origin;
        if (isProduction && currentOrigin.includes('getfixfly.com')) {
          // Production: use api subdomain
          apiBase = `https://api.getfixfly.com`;
        } else {
          // Development: use current origin
          apiBase = `${currentOrigin}${apiBase.startsWith('/') ? '' : '/'}${apiBase}`;
        }
      }
      
      // CRITICAL: Handle /api suffix properly (RentYatra style - simple)
      // If apiBase already ends with /api, remove it before adding /api/payment/razorpay-callback
      let finalApiBase = apiBase;
      if (apiBase.endsWith('/api')) {
        finalApiBase = apiBase.replace(/\/api\/?$/, '');
      } else if (apiBase.endsWith('/api/')) {
        finalApiBase = apiBase.replace(/\/api\/+$/, '');
      }
      
      // Build callback URL - RentYatra style (simple and direct)
      // Fixfly uses `/api/payment/razorpay-callback` (with /api prefix)
      const callbackUrl = useRedirectMode 
        ? `${finalApiBase}/api/payment/razorpay-callback`
        : undefined;
      
      console.log('🔗 ========== CALLBACK URL CONFIGURATION (LIVE SERVER) ==========');
      console.log('🔗 Is Production:', isProduction);
      console.log('🔗 VITE_API_URL:', import.meta.env.VITE_API_URL || 'NOT SET');
      console.log('🔗 this.apiUrl:', this.apiUrl);
      console.log('🔗 Initial apiBase:', apiBase);
      console.log('🔗 Final apiBase (after /api handling):', finalApiBase);
      console.log('🔗 Callback URL:', callbackUrl || 'N/A (Modal Mode)');
      console.log('🔗 Expected Callback URL: https://api.getfixfly.com/api/payment/razorpay-callback');
      console.log('🔗 Callback URL Match:', callbackUrl === 'https://api.getfixfly.com/api/payment/razorpay-callback' ? '✅ MATCH' : '❌ MISMATCH');
      
      // CRITICAL: If mismatch, show detailed comparison
      if (callbackUrl && callbackUrl !== 'https://api.getfixfly.com/api/payment/razorpay-callback') {
        console.error('❌ ❌ ❌ CALLBACK URL MISMATCH DETECTED ❌ ❌ ❌');
        console.error('❌ Expected: https://api.getfixfly.com/api/payment/razorpay-callback');
        console.error('❌ Actual:', callbackUrl);
        console.error('❌ This will cause payment failures!');
        console.error('❌ Please check:');
        console.error('   1. Vercel environment variable: VITE_API_URL=https://api.getfixfly.com/api');
        console.error('   2. Frontend rebuild after setting environment variable');
        console.error('   3. Browser cache cleared');
      }
      
      // CRITICAL: Verify callback URL is publicly accessible
      if (callbackUrl) {
        try {
          const urlObj = new URL(callbackUrl);
          const isPublic = !urlObj.hostname.includes('localhost') && 
                          !urlObj.hostname.includes('127.0.0.1') &&
                          urlObj.protocol === 'https:';
          console.log('🔗 Callback URL is Public:', isPublic ? '✅ YES' : '❌ NO');
          console.log('🔗 Callback URL Protocol:', urlObj.protocol);
          console.log('🔗 Callback URL Hostname:', urlObj.hostname);
          
          if (!isPublic && isProduction) {
            console.error('❌ ❌ ❌ CRITICAL ERROR: Callback URL is not publicly accessible! ❌ ❌ ❌');
            console.error('❌ This will cause payment failures on live server!');
            console.error('❌ Callback URL:', callbackUrl);
            console.error('❌ Expected: https://api.getfixfly.com/api/payment/razorpay-callback');
          }
        } catch (e) {
          console.error('❌ Error parsing callback URL:', e);
        }
      }
      
      console.log('🔗 ===============================================');
      
      // For WebView, pre-populate callback URL with order_id and booking/ticket IDs
      // CRITICAL: Don't pre-populate callback URL - Razorpay will add payment data automatically
      // Pre-populating might cause issues with Razorpay's redirect
      // Instead, we rely on backend callback to extract data from Razorpay's redirect
      if (useRedirectMode && callbackUrl && paymentData.orderId) {
        // Just log - don't modify callback URL
        console.log('✅ Callback URL configured for WebView redirect mode');
        console.log('✅ Order ID will be passed by Razorpay automatically');
        console.log('✅ Backend callback will extract payment data from Razorpay redirect');
      }
      
      console.log('🔗 ========== PAYMENT CALLBACK URL SETUP ==========');
      console.log('🔗 Environment:', import.meta.env.MODE);
      console.log('🔗 Is Production:', import.meta.env.PROD);
      console.log('🔗 VITE_API_URL:', import.meta.env.VITE_API_URL || 'NOT SET');
      console.log('🔗 Current Origin:', window.location.origin);
      console.log('🔗 API Base URL:', apiBase);
      console.log('🔗 Callback URL:', callbackUrl);
      console.log('🔗 Use Redirect Mode:', useRedirectMode);
      console.log('🔗 Order ID in Callback:', paymentData.orderId || 'N/A');
      console.log('🔗 Booking ID in Callback:', paymentData.bookingId || 'N/A');
      console.log('🔗 Ticket ID in Callback:', paymentData.ticketId || 'N/A');
      if (callbackUrl) {
        try {
          const urlObj = new URL(callbackUrl);
          console.log('🔗 Callback URL Protocol:', urlObj.protocol);
          console.log('🔗 Callback URL Host:', urlObj.host);
          console.log('🔗 Callback URL Path:', urlObj.pathname);
          console.log('🔗 Callback URL Params:', urlObj.search);
          
          // CRITICAL: Warn if callback URL might not work
          const isLocalhost = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
          if (isLocalhost) {
            console.error('❌ WARNING: Callback URL is localhost - Razorpay cannot access it!');
            console.error('❌ Payment will fail if callback URL is not publicly accessible.');
            console.error('❌ Solution: Set VITE_API_URL to your production backend URL.');
          } else {
            console.log('✅ Callback URL is publicly accessible');
          }
        } catch (e) {
          console.error('❌ Error parsing callback URL:', e);
        }
      }
      console.log('🔗 ================================================');

      // Store payment data for callback handling (WebView scenario)
      if (useRedirectMode) {
        try {
          localStorage.setItem('pending_payment', JSON.stringify({
            type: paymentData.bookingId ? 'booking' : 'ticket',
            orderId: paymentData.orderId,
            bookingId: paymentData.bookingId,
            ticketId: paymentData.ticketId,
            amount: paymentData.amount,
            description: paymentData.description,
            callbackUrl: callbackUrl,
            timestamp: Date.now()
          }));
          console.log('💾 Stored payment info in localStorage for callback handling');
        } catch (e) {
          console.warn('⚠️ Could not store payment info:', e);
        }
      }

      // Razorpay options
      const options: any = {
        key: this.razorpayKey,
        amount: paymentData.amount, // Amount is already in paise from backend
        currency: paymentData.currency,
        name: 'Fixfly',
        description: paymentData.description,
        order_id: paymentData.orderId,
        prefill: {
          name: paymentData.name,
          email: paymentData.email,
          contact: paymentData.phone,
        },
        notes: {
          payment_type: paymentData.bookingId ? 'booking_payment' : 'ticket_payment',
          booking_id: paymentData.bookingId || undefined,
          ticket_id: paymentData.ticketId || undefined,
          isWebView: useRedirectMode ? 'true' : 'false', // Flag for backend
          // CRITICAL: Store booking/ticket IDs in notes so backend can extract them
          // This is important for WebView where callback URL params might not work
          ...(paymentData.bookingId ? { bookingId: paymentData.bookingId } : {}),
          ...(paymentData.ticketId ? { ticketId: paymentData.ticketId } : {}),
        },
        theme: {
          color: '#3B82F6',
        },
        handler: (response: PaymentResponse) => {
          console.log('🎯 Razorpay handler called:', {
            useRedirectMode,
            isInIframe: this.isInIframe(),
            hasResponse: !!response,
            orderId: response?.razorpay_order_id,
            paymentId: response?.razorpay_payment_id
          });
          
          // For modal mode (web), handle directly
          if (!useRedirectMode) {
            console.log('✅ Modal mode - calling onSuccess directly');
            paymentData.onSuccess(response);
          } else {
            // For redirect mode (WebView/Iframe), handler might not execute
            // But we still log it for debugging
            console.log('⚠️ Redirect mode - handler called but redirect will happen via callback_url');
            console.log('📦 Response data:', JSON.stringify(response, null, 2));
            
            // CRITICAL: Iframe mein parent window ko message send karein (RentYatra style)
            if (this.isInIframe()) {
              console.log('📤 Iframe detected - sending payment response to parent window');
              this.sendMessageToParent('payment_success', {
                orderId: response?.razorpay_order_id || (response as any)?.razorpayOrderId,
                paymentId: response?.razorpay_payment_id || (response as any)?.razorpayPaymentId,
                signature: response?.razorpay_signature || (response as any)?.razorpaySignature,
                response: response
              });
            }
          }
          // For redirect mode (WebView/Iframe), callback will be handled by PaymentCallback page via callback_url
        },
        // CRITICAL: Iframe mein modal options disable karein - modal iframe mein work nahi karta
        // RentYatra style: Modal options sirf non-iframe scenarios mein use karein
        ...(useRedirectMode ? {} : {
          modal: {
            ondismiss: () => {
              paymentData.onError(new Error('PAYMENT_CANCELLED'));
            },
            escape: true,
            animation: true,
            backdropclose: true,
          },
        }),
        // WebView specific options
        retry: {
          enabled: true,
          max_count: 3,
        },
        // CRITICAL: For WebView/APK/Iframe - MUST use redirect mode (RentYatra style)
        // Use spread operator to conditionally add redirect options
        // RentYatra uses: ...(useRedirectMode && { redirect: true, callback_url: callbackUrl })
        // IMPORTANT: Iframe mein modal mode work nahi karta, isliye redirect mode mandatory hai
        ...(useRedirectMode && callbackUrl ? {
          redirect: true, // REQUIRED for WebView/Iframe - modal mode doesn't work
          callback_url: callbackUrl, // Callback URL for redirect mode - MUST be publicly accessible
          // CRITICAL: Add error callback URL for payment failures (Razorpay feature)
          // This ensures Razorpay redirects to our callback even on payment failure
          // Note: Razorpay uses callback_url for both success and failure in redirect mode
        } : {}),
        // Add timeout
        timeout: 300,
        // Additional WebView compatibility options
        config: {
          display: {
            blocks: {
              banks: {
                name: 'All payment methods',
                instruments: [
                  { type: 'card' },
                  { type: 'netbanking' },
                  { type: 'wallet' },
                  { type: 'upi' }
                ]
              }
            },
            sequence: ['block.banks'],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        // Enable external wallet selection
        external: {
          wallets: ['paytm']
        }
      };

      // CRITICAL FIX #1: WebView callback return issue
      // In WebView, Razorpay's handler might not execute, so we MUST use callback_url
      // But we also need to ensure payment data is stored before redirect
      if (useRedirectMode && callbackUrl) {
        // CRITICAL: Store payment context BEFORE opening Razorpay (session persistence)
        // This ensures we can retrieve payment data even if callback fails
        try {
          const paymentContext = {
            orderId: paymentData.orderId,
            bookingId: paymentData.bookingId,
            ticketId: paymentData.ticketId,
            amount: paymentData.amount,
            timestamp: Date.now(),
            callbackUrl: callbackUrl
          };
          
          // Store in multiple places for reliability (session persistence fix)
          localStorage.setItem('payment_context', JSON.stringify(paymentContext));
          sessionStorage.setItem('payment_context', JSON.stringify(paymentContext));
          
          // Also store in a way that survives page reloads
          document.cookie = `payment_context=${encodeURIComponent(JSON.stringify(paymentContext))}; path=/; max-age=3600; SameSite=Lax`;
          
          console.log('💾 Stored payment context for session persistence:', {
            orderId: paymentData.orderId,
            bookingId: paymentData.bookingId,
            hasCallbackUrl: !!callbackUrl
          });
        } catch (e) {
          console.error('❌ Error storing payment context:', e);
        }
        
        // Override handler to redirect to callback URL after payment
        // CRITICAL: This handler might NOT execute in WebView, so callback_url is primary
        options.handler = (response: PaymentResponse) => {
          console.log('✅ Payment successful in WebView, storing response...');
          console.log('📦 Payment response:', JSON.stringify(response, null, 2));
          console.log('🔗 Callback URL:', callbackUrl);
          
          // Store response with multiple methods for reliability (session persistence)
          try {
            // Method 1: localStorage (primary) - survives page reloads
            const responseWithContext = {
              ...response,
              bookingId: paymentData.bookingId,
              ticketId: paymentData.ticketId,
              timestamp: Date.now(),
              orderId: paymentData.orderId
            };
            localStorage.setItem('payment_response', JSON.stringify(responseWithContext));
            console.log('💾 Stored payment response in localStorage');
            
            // Method 2: sessionStorage (backup) - survives navigation
            try {
              sessionStorage.setItem('payment_response', JSON.stringify(responseWithContext));
              console.log('💾 Stored payment response in sessionStorage');
            } catch (e) {
              console.warn('⚠️ Could not store in sessionStorage:', e);
            }
            
            // Method 3: Cookie (for session persistence across redirects)
            try {
              document.cookie = `payment_response=${encodeURIComponent(JSON.stringify(responseWithContext))}; path=/; max-age=300; SameSite=Lax`;
              console.log('💾 Stored payment response in cookie');
            } catch (e) {
              console.warn('⚠️ Could not store in cookie:', e);
            }
          } catch (e) {
            console.error('❌ Error storing payment response:', e);
          }
          
          // Build callback URL with payment data directly in query params (most reliable)
          try {
            const callbackUrlWithParams = new URL(callbackUrl);
            callbackUrlWithParams.searchParams.set('razorpay_order_id', response.razorpay_order_id);
            callbackUrlWithParams.searchParams.set('razorpay_payment_id', response.razorpay_payment_id);
            if (response.razorpay_signature) {
              callbackUrlWithParams.searchParams.set('razorpay_signature', response.razorpay_signature);
            }
            if (paymentData.bookingId) {
              callbackUrlWithParams.searchParams.set('booking_id', paymentData.bookingId);
            }
            if (paymentData.ticketId) {
              callbackUrlWithParams.searchParams.set('ticket_id', paymentData.ticketId);
            }
            
            console.log('🔀 Redirecting to callback with params:', callbackUrlWithParams.toString());
            console.log('📋 Redirect details:', {
              url: callbackUrlWithParams.toString(),
              hasOrderId: !!response.razorpay_order_id,
              hasPaymentId: !!response.razorpay_payment_id,
              hasSignature: !!response.razorpay_signature,
              bookingId: paymentData.bookingId,
              ticketId: paymentData.ticketId
            });
            
            // CRITICAL FIX: In WebView, handler might not execute, so callback_url is primary
            // But we still try to redirect here as fallback
            // The main redirect will happen via Razorpay's callback_url
            try {
              console.log('🚀 Attempting redirect to callback (handler fallback):', callbackUrlWithParams.toString());
              
              // CRITICAL: For live/production, ensure callback URL is accessible
              if (!callbackUrlWithParams.host || !callbackUrlWithParams.protocol) {
                throw new Error('Invalid callback URL: missing host or protocol');
              }
              
              // In WebView, callback_url should handle redirect, but we try here too
              // Use window.location.replace to avoid back button issues
              window.location.replace(callbackUrlWithParams.toString());
              
            } catch (redirectError) {
              console.error('❌ Error redirecting from handler:', redirectError);
              // Don't fail - callback_url will handle it
              console.log('ℹ️ Handler redirect failed, but callback_url will handle redirect');
            }
          } catch (e) {
            console.error('❌ Error building callback URL:', e);
            // Don't fail - callback_url will handle redirect
            console.log('ℹ️ Callback URL build failed, but Razorpay callback_url will handle redirect');
          }
        };
      }

      // CRITICAL: Verify Razorpay is available before opening
      if (!window.Razorpay) {
        console.error('❌ Razorpay not available - attempting to reload script...');
        try {
          await this.loadRazorpayScript();
        } catch (reloadError) {
          console.error('❌ Failed to reload Razorpay script:', reloadError);
          paymentData.onError(new Error('Razorpay payment gateway is not available. Please check your internet connection and try again.'));
          return;
        }
      }
      
      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      
      // CRITICAL: For WebView, add additional event listeners to catch payment events
      // These might fire even if the handler doesn't execute
      if (useRedirectMode) {
        // Listen for payment success events
        razorpay.on('payment.success', (response: any) => {
          console.log('✅ ========== PAYMENT.SUCCESS EVENT FIRED (WebView) ==========');
          console.log('✅ Response:', JSON.stringify(response, null, 2));
          console.log('✅ This event fired even if handler did not execute');
          console.log('✅ ============================================================');
          
          // Store response immediately
          try {
            const responseWithContext = {
              ...response,
              bookingId: paymentData.bookingId,
              ticketId: paymentData.ticketId,
              timestamp: Date.now()
            };
            localStorage.setItem('payment_response', JSON.stringify(responseWithContext));
            sessionStorage.setItem('payment_response', JSON.stringify(responseWithContext));
            console.log('💾 Stored payment response from payment.success event');
            
            // CRITICAL: Force redirect to callback URL if not already redirected
            // Sometimes Razorpay callback_url doesn't work in WebView, so we force it
            if (callbackUrl && useRedirectMode) {
              try {
                const callbackUrlWithParams = new URL(callbackUrl);
                callbackUrlWithParams.searchParams.set('razorpay_order_id', response.razorpay_order_id || response.razorpayOrderId || '');
                callbackUrlWithParams.searchParams.set('razorpay_payment_id', response.razorpay_payment_id || response.razorpayPaymentId || '');
                if (response.razorpay_signature || response.razorpaySignature) {
                  callbackUrlWithParams.searchParams.set('razorpay_signature', response.razorpay_signature || response.razorpaySignature);
                }
                if (paymentData.bookingId) {
                  callbackUrlWithParams.searchParams.set('booking_id', paymentData.bookingId);
                }
                if (paymentData.ticketId) {
                  callbackUrlWithParams.searchParams.set('ticket_id', paymentData.ticketId);
                }
                
                console.log('🚀 FORCE REDIRECT: Redirecting to callback from payment.success event');
                console.log('🔗 Callback URL:', callbackUrlWithParams.toString());
                
                // Force redirect immediately
                setTimeout(() => {
                  if (window.location.href !== callbackUrlWithParams.toString() && 
                      !window.location.href.includes('/payment-callback')) {
                    window.location.href = callbackUrlWithParams.toString();
                  }
                }, 500);
              } catch (e) {
                console.error('❌ Error in payment.success redirect:', e);
              }
            }
          } catch (e) {
            console.error('❌ Error storing payment response:', e);
          }
        });
        
        // Listen for payment capture events
        razorpay.on('payment.captured', (response: any) => {
          console.log('💰 ========== PAYMENT.CAPTURED EVENT FIRED (WebView) ==========');
          console.log('💰 Response:', JSON.stringify(response, null, 2));
          console.log('💰 ============================================================');
        });
      }
      
      // Add payment.failed event handler for WebView/Iframe
        razorpay.on('payment.failed', (response: any) => {
          console.error('❌ ========== RAZORPAY PAYMENT.FAILED EVENT FIRED ==========');
          console.error('❌ Response:', JSON.stringify(response, null, 2));
          console.error('❌ Error Object:', response.error);
          console.error('❌ Error Code:', response.error?.code);
          console.error('❌ Error Description:', response.error?.description);
          console.error('❌ Error Reason:', response.error?.reason);
          console.error('❌ Metadata:', response.metadata);
          console.error('❌ Use Redirect Mode:', useRedirectMode);
          console.error('❌ Is In Iframe:', this.isInIframe());
          console.error('❌ Callback URL:', callbackUrl);
          console.error('❌ ========================================================');
          
          // CRITICAL: Iframe mein parent window ko failure message send karein
          if (this.isInIframe()) {
            console.error('📤 Iframe detected - sending payment failure to parent window');
            this.sendMessageToParent('payment_failed', {
              error: response.error,
              errorCode: response.error?.code,
              errorDescription: response.error?.description,
              errorReason: response.error?.reason,
              metadata: response.metadata,
              orderId: paymentData.orderId
            });
          }
          
          const errorMessage = response.error?.description || response.error?.reason || 'Payment failed. Please try again.';
          
          // Store failure info for debugging
          try {
            localStorage.setItem('payment_failure', JSON.stringify({
              error: response.error,
              metadata: response.metadata,
              timestamp: Date.now(),
              orderId: paymentData.orderId,
              bookingId: paymentData.bookingId,
              ticketId: paymentData.ticketId
            }));
            console.log('💾 Stored payment failure info');
          } catch (e) {
            console.warn('Could not store payment failure info:', e);
          }
          
          // CRITICAL: For WebView, we MUST redirect to callback so backend can log the failure
          // Even if callback_url is set, sometimes it doesn't work, so we force redirect
          if (useRedirectMode && callbackUrl) {
          try {
            const errorCallbackUrl = new URL(callbackUrl);
            errorCallbackUrl.searchParams.set('error', 'payment_failed');
            errorCallbackUrl.searchParams.set('error_message', encodeURIComponent(errorMessage));
            errorCallbackUrl.searchParams.set('payment_failed', 'true');
            
            // Add payment IDs if available
            if (response.error?.metadata?.payment_id) {
              errorCallbackUrl.searchParams.set('razorpay_payment_id', response.error.metadata.payment_id);
            }
            if (response.error?.metadata?.order_id || paymentData.orderId) {
              errorCallbackUrl.searchParams.set('razorpay_order_id', response.error?.metadata?.order_id || paymentData.orderId);
            }
            
            // Add booking/ticket IDs for backend logging
            if (paymentData.bookingId) {
              errorCallbackUrl.searchParams.set('booking_id', paymentData.bookingId);
            }
            if (paymentData.ticketId) {
              errorCallbackUrl.searchParams.set('ticket_id', paymentData.ticketId);
            }
            
            console.error('❌ ========== PAYMENT FAILED IN WEBVIEW ==========');
            console.error('❌ Redirecting to callback with error');
            console.error('❌ Error URL:', errorCallbackUrl.toString());
            console.error('❌ Error Message:', errorMessage);
            console.error('❌ Booking ID:', paymentData.bookingId || 'N/A');
            console.error('❌ Ticket ID:', paymentData.ticketId || 'N/A');
            console.error('❌ =============================================');
            
            // IMMEDIATE redirect - don't wait
            // Try multiple methods to ensure redirect works
            try {
              // Method 1: Direct redirect
              window.location.href = errorCallbackUrl.toString();
              
              // Method 2: Fallback after delay
              setTimeout(() => {
                if (window.location.href !== errorCallbackUrl.toString() && 
                    !window.location.href.includes('/payment-callback')) {
                  console.log('🔄 Retrying error redirect...');
                  window.location.replace(errorCallbackUrl.toString());
                }
              }, 500);
              
              // Method 3: Flutter bridge
              setTimeout(() => {
                if ((window as any).flutter_inappwebview) {
                  try {
                    (window as any).flutter_inappwebview.callHandler('navigateTo', errorCallbackUrl.toString());
                  } catch (e) {
                    console.warn('⚠️ Flutter bridge navigation failed:', e);
                  }
                }
              }, 1000);
            } catch (redirectError) {
              console.error('❌ Error redirecting, trying Flutter bridge...');
              // Try Flutter bridge
              if ((window as any).flutter_inappwebview) {
                (window as any).flutter_inappwebview.callHandler('navigateTo', errorCallbackUrl.toString());
              } else {
                // Last resort: call onError
                paymentData.onError(new Error(errorMessage));
              }
            }
          } catch (e) {
            console.error('❌ Error building error callback URL:', e);
            // Still call onError as fallback
            paymentData.onError(new Error(errorMessage));
          }
        } else {
          // For modal mode, call onError directly
          console.log('📞 Calling onError directly (modal mode)');
          paymentData.onError(new Error(errorMessage));
        }
      });
      
      // Add payment success logging
      console.log('🎯 ========== OPENING RAZORPAY CHECKOUT ==========');
      console.log('🎯 Order ID:', paymentData.orderId);
      console.log('🎯 Amount:', paymentData.amount, 'paise (₹' + (paymentData.amount / 100).toFixed(2) + ')');
      console.log('🎯 Callback URL:', callbackUrl);
      console.log('🎯 Use Redirect Mode:', useRedirectMode);
      console.log('🎯 Is APK/WebView:', isAPK);
      console.log('🎯 Booking ID:', paymentData.bookingId || 'N/A');
      console.log('🎯 Ticket ID:', paymentData.ticketId || 'N/A');
      
      // CRITICAL: Log Razorpay options to verify callback_url is set
      console.log('🎯 Razorpay Options Summary:', {
        hasCallbackUrl: !!callbackUrl,
        callbackUrl: callbackUrl || 'NOT SET',
        hasRedirect: useRedirectMode,
        orderId: paymentData.orderId,
        hasBookingId: !!paymentData.bookingId,
        hasTicketId: !!paymentData.ticketId
      });
      
      // CRITICAL: Verify callback URL is set before opening
      if (useRedirectMode && !callbackUrl) {
        console.error('❌ ❌ ❌ CRITICAL ERROR: Redirect mode enabled but callback URL is not set! ❌ ❌ ❌');
        console.error('❌ This will cause payment to fail - Razorpay cannot redirect without callback URL');
        throw new Error('Callback URL is required for WebView/APK payment but is not configured');
      }
      
      console.log('🎯 ===============================================');
      
      // Add event listeners BEFORE opening
      razorpay.on('payment.authorized', (response: any) => {
        console.log('🔐 ========== PAYMENT AUTHORIZED EVENT ==========');
        console.log('🔐 Response:', JSON.stringify(response, null, 2));
        console.log('🔐 =============================================');
      });
      
      razorpay.on('payment.captured', (response: any) => {
        console.log('💰 ========== PAYMENT CAPTURED EVENT ==========');
        console.log('💰 Response:', JSON.stringify(response, null, 2));
        console.log('💰 ============================================');
      });
      
      // CRITICAL: For WebView, add visibility change listener to detect if user closed Razorpay
      // Sometimes Razorpay fails but doesn't redirect to callback_url
      if (useRedirectMode && callbackUrl) {
        let paymentInProgress = true;
        let visibilityCheckInterval: NodeJS.Timeout | null = null;
        
        // Monitor page visibility - if user comes back without redirect, payment might have failed
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible' && paymentInProgress) {
            // User came back to the page - check if we're still on Razorpay
            setTimeout(() => {
              if (paymentInProgress && 
                  (window.location.href.includes('razorpay.com') || 
                   window.location.href.includes('checkout.razorpay.com'))) {
                console.warn('⚠️ User returned to page but still on Razorpay - payment might have failed without redirect');
                // Don't force redirect yet - wait a bit more
              } else if (paymentInProgress && !window.location.href.includes('/payment-callback')) {
                // User is back but not on callback page - payment might have failed
                console.warn('⚠️ User returned but not on callback page - checking payment status...');
              }
            }, 2000);
          }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Clear listener when payment completes
        const originalHandler = options.handler;
        if (originalHandler) {
          options.handler = (response: PaymentResponse) => {
            paymentInProgress = false;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (visibilityCheckInterval) {
              clearInterval(visibilityCheckInterval);
            }
            originalHandler(response);
          };
        }
        
        // Also clear on payment failure
        razorpay.on('payment.failed', () => {
          paymentInProgress = false;
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          if (visibilityCheckInterval) {
            clearInterval(visibilityCheckInterval);
          }
        });
      }
      
      razorpay.open();
      
      console.log('✅ Razorpay checkout opened successfully');
    } catch (error) {
      console.error('Error processing payment:', error);
      paymentData.onError(error);
    }
  }

  /**
   * Process payment for booking
   */
  async processBookingPayment(
    bookingData: BookingData,
    onSuccess: (response: any) => void,
    onFailure: (error: any) => void,
    onClose: () => void
  ): Promise<void> {
    try {
      // CRITICAL: Check JavaScript enablement before proceeding
      console.log('🔍 ========== JAVASCRIPT ENABLEMENT CHECK ==========');
      try {
        const { checkJavaScriptEnabled, verifyJavaScriptForRazorpay } = await import('../utils/javascriptCheck');
        const jsCheck = checkJavaScriptEnabled();
        const razorpayCheck = verifyJavaScriptForRazorpay();
        
        console.log('🔍 JavaScript Enabled:', jsCheck.isEnabled);
        console.log('🔍 Can Execute:', jsCheck.canExecute);
        console.log('🔍 Can Access DOM:', jsCheck.canAccessDOM);
        console.log('🔍 Can Access Storage:', jsCheck.canAccessStorage);
        console.log('🔍 Can Load Scripts:', jsCheck.canLoadScripts);
        console.log('🔍 Can Make Fetch:', jsCheck.canMakeFetch);
        console.log('🔍 Ready for Razorpay:', razorpayCheck.ready);
        
        if (!razorpayCheck.ready) {
          console.error('❌ ❌ ❌ JAVASCRIPT NOT READY FOR PAYMENT ❌ ❌ ❌');
          console.error('❌ Issues:', razorpayCheck.issues);
          console.error('❌ Recommendations:', razorpayCheck.recommendations);
          
          // Don't block payment, but log warning
          console.warn('⚠️ Proceeding with payment despite JavaScript issues - may fail');
        } else {
          console.log('✅ ✅ ✅ JAVASCRIPT READY FOR PAYMENT ✅ ✅ ✅');
        }
        console.log('🔍 ===================================================');
      } catch (jsCheckError) {
        console.warn('⚠️ JavaScript check failed:', jsCheckError);
        console.warn('⚠️ Proceeding with payment anyway');
      }
      
      // Load Razorpay script
      await this.loadRazorpayScript();

      // Detect WebView/APK context
      const isAPK = this.isAPKContext();
      const useRedirectMode = isAPK; // Use redirect mode for WebView/APK

      console.log('🔍 Booking Payment - WebView detection:', {
        isAPK,
        useRedirectMode,
        userAgent: navigator.userAgent
      });

      // Validate amount before creating order
      if (!bookingData.pricing.totalAmount || bookingData.pricing.totalAmount <= 0) {
        throw new Error('Invalid payment amount. Please check your order total.');
      }

      console.log('📋 ========== STEP 1: BOOKING PAYMENT INITIATED ==========');
      console.log('📋 Timestamp:', new Date().toISOString());
      console.log('📋 Customer Name:', bookingData.customer.name);
      console.log('📋 Customer Email:', bookingData.customer.email);
      console.log('📋 Customer Phone:', bookingData.customer.phone);
      console.log('📋 Services Count:', bookingData.services.length);
      console.log('📋 =======================================================');
      
      console.log('💰 ========== STEP 2: CREATING RAZORPAY ORDER ==========');
      console.log('💰 Amount (Rupees):', bookingData.pricing.totalAmount);
      console.log('💰 Amount (Paise):', Math.round(bookingData.pricing.totalAmount * 100));
      console.log('💰 Subtotal:', bookingData.pricing.subtotal || 'N/A');
      console.log('💰 GST Amount:', bookingData.pricing.gstAmount || 'N/A');
      console.log('💰 Service Fee:', bookingData.pricing.serviceFee || 'N/A');
      console.log('💰 Total Amount:', bookingData.pricing.totalAmount);
      console.log('💰 =====================================================');

      // Create order
      let order;
      try {
        order = await this.createOrder(
          bookingData.pricing.totalAmount,
          `booking_${Date.now()}`,
          {
            description: 'Service booking payment',
            customer_email: bookingData.customer.email,
            customer_phone: bookingData.customer.phone
          }
        );
        
        if (!order || !order.orderId) {
          throw new Error('Failed to create payment order. Please try again.');
        }
        
        console.log('✅ ========== STEP 3: RAZORPAY ORDER CREATED ==========');
        console.log('✅ Order ID:', order.orderId);
        console.log('✅ Amount (Paise):', order.amount);
        console.log('✅ Amount (Rupees):', (order.amount / 100).toFixed(2));
        console.log('✅ Currency:', order.currency);
        console.log('✅ Status:', order.status);
        console.log('✅ Timestamp:', new Date().toISOString());
        console.log('✅ ===================================================');
      } catch (orderError: any) {
        console.error('❌ Error creating Razorpay order:', orderError);
        throw new Error(orderError.message || 'Failed to create payment order. Please try again.');
      }

      console.log('🔗 ========== STEP 4: BUILDING CALLBACK URL ==========');
      console.log('🔗 Environment:', import.meta.env.MODE);
      console.log('🔗 Is Production:', import.meta.env.PROD);
      console.log('🔗 Current Origin:', window.location.origin);
      console.log('🔗 Current URL:', window.location.href);
      
      // CRITICAL: Like RentYatra - use simple approach
      // Use VITE_API_URL directly (it should already include /api if needed)
      // For WebView/APK, always use production backend URL
      let apiUrl = import.meta.env.VITE_API_URL || '/api';
      const isProduction = import.meta.env.PROD || window.location.protocol === 'https:';
      
      // CRITICAL: Detect backend server URL for Contabo VPS
      // Backend is on Contabo VPS (Ubuntu), frontend is on Vercel
      // Backend must be publicly accessible for Razorpay callbacks
      const detectBackendUrl = () => {
        // Method 1: Check VITE_API_URL if it's a production URL (set in Vercel env vars)
        if (apiUrl && !apiUrl.includes('localhost') && !apiUrl.includes('127.0.0.1')) {
          try {
            const url = new URL(apiUrl);
            if (url.hostname.includes('getfixfly.com') || url.hostname.includes('api.') || url.hostname.includes('contabo')) {
              return apiUrl;
            }
          } catch (e) {
            // Invalid URL, continue
          }
        }
        
        // Method 2: Try api subdomain (most common setup for Contabo VPS)
        // If you have api.getfixfly.com pointing to Contabo VPS
        if (window.location.hostname.includes('getfixfly.com')) {
          return 'https://api.getfixfly.com/api';
        }
        
        // Method 3: If frontend is on getfixfly.com, backend might be on same domain
        // Or on api subdomain
        // Default: Try api subdomain first (most common for VPS setups)
        return 'https://api.getfixfly.com/api';
      };
      
      // For WebView/APK, always use production backend (like RentYatra)
      if (isAPK || (isProduction && (!apiUrl || apiUrl.includes('localhost')))) {
        // CRITICAL: Backend server must be publicly accessible for Razorpay callbacks
        // Backend is on Contabo VPS - must use public URL (not localhost)
        apiUrl = detectBackendUrl();
        console.log('🔧 ========== BACKEND URL DETECTION ==========');
        console.log('🔧 WEBVIEW/APK MODE: Using production backend URL');
        console.log('🔧 Backend Server: Contabo VPS (Ubuntu)');
        console.log('🔧 Frontend: Vercel');
        console.log('🔧 Detected Backend URL:', apiUrl);
        console.log('🔧 VITE_API_URL:', import.meta.env.VITE_API_URL || 'NOT SET');
        console.log('🔧 CRITICAL: Ensure this URL is publicly accessible from Razorpay servers');
        console.log('🔧 Test this URL manually:', `${apiUrl}/payment/test-callback`);
        console.log('🔧 If test URL fails, check:');
        console.log('   1. Is api.getfixfly.com pointing to Contabo VPS?');
        console.log('   2. Is backend server running on port 5000?');
        console.log('   3. Is firewall allowing HTTPS (443) connections?');
        console.log('   4. Update VITE_API_URL in Vercel environment variables');
        console.log('🔧 ===========================================');
      }
      
      // Ensure we have a valid absolute URL with protocol
      if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
        const currentOrigin = window.location.origin;
        apiUrl = `${currentOrigin}${apiUrl.startsWith('/') ? '' : '/'}${apiUrl}`;
      }
      
      // CRITICAL: Like RentYatra - simple callback URL construction
      // apiUrl already includes /api, so just append /payment/razorpay-callback
      let callbackUrl = useRedirectMode 
        ? `${apiUrl}/payment/razorpay-callback`
        : undefined;
      
      // CRITICAL: Final validation - ensure callback URL is publicly accessible
      if (useRedirectMode && callbackUrl) {
        try {
          const urlObj = new URL(callbackUrl);
          const isLocalhost = urlObj.hostname === 'localhost' || 
                            urlObj.hostname === '127.0.0.1' || 
                            urlObj.hostname.startsWith('192.168.') ||
                            urlObj.hostname.startsWith('10.') ||
                            urlObj.hostname.startsWith('172.');
          
          if (isLocalhost && (isProduction || isAPK)) {
            console.error('❌ CRITICAL: Callback URL is localhost in production/WebView!');
            console.error('❌ Callback URL:', callbackUrl);
            console.error('❌ This will fail. Using production backend fallback.');
            // Use detected backend URL
            const fallbackUrl = detectBackendUrl();
            callbackUrl = `${fallbackUrl}/payment/razorpay-callback`;
            console.error('❌ Using fallback:', callbackUrl);
          } else if (isLocalhost) {
            console.warn('⚠️ Callback URL is localhost - this will only work in development');
          }
          
          // Additional validation: Ensure URL is HTTPS in production
          if (isProduction && urlObj.protocol !== 'https:') {
            console.warn('⚠️ Callback URL is not HTTPS in production, converting...');
            urlObj.protocol = 'https:';
            callbackUrl = urlObj.toString();
          }
          
          // CRITICAL: Final verification - callback URL must be publicly accessible
          console.log('✅ Callback URL Validation:');
          console.log('   URL:', callbackUrl);
          console.log('   Protocol:', urlObj.protocol);
          console.log('   Host:', urlObj.host);
          console.log('   Path:', urlObj.pathname);
          console.log('   Is Public:', !urlObj.hostname.includes('localhost'));
          console.log('   Is HTTPS:', urlObj.protocol === 'https:');
        } catch (urlError) {
          console.error('❌ Error validating callback URL:', urlError);
          // Last resort: use detected backend URL
          const fallbackUrl = detectBackendUrl();
          callbackUrl = `${fallbackUrl}/payment/razorpay-callback`;
          console.warn('⚠️ Using fallback callback URL:', callbackUrl);
        }
      }
      
      // CRITICAL: Don't pre-populate callback URL - Razorpay will add payment data automatically
      // Pre-populating might cause issues with Razorpay's redirect
      // Instead, we rely on backend callback to extract data from Razorpay's redirect
      if (useRedirectMode && callbackUrl && order.orderId) {
        // Just log - don't modify callback URL
        console.log('✅ Callback URL configured for WebView redirect mode (booking)');
        console.log('✅ Order ID will be passed by Razorpay automatically');
        console.log('✅ Backend callback will extract payment data from Razorpay redirect');
      }

      // Validate Razorpay key
      if (!this.razorpayKey) {
        throw new Error('Payment gateway not configured. Please contact support.');
      }

      // Validate order data
      if (!order.orderId || !order.amount || order.amount <= 0) {
        throw new Error('Invalid payment order. Please try again.');
      }

      console.log('⚙️ ========== STEP 5: RAZORPAY OPTIONS CONFIGURATION ==========');
      console.log('⚙️ Key ID:', this.razorpayKey.substring(0, 10) + '...');
      console.log('⚙️ Order ID:', order.orderId);
      console.log('⚙️ Amount (Paise):', order.amount);
      console.log('⚙️ Amount (Rupees):', (order.amount / 100).toFixed(2));
      console.log('⚙️ Currency:', order.currency);
      console.log('⚙️ Callback URL:', callbackUrl || 'N/A (Modal Mode)');
      console.log('⚙️ Use Redirect Mode:', useRedirectMode);
      console.log('⚙️ Is APK/WebView:', isAPK);
      console.log('⚙️ Customer Name:', bookingData.customer.name);
      console.log('⚙️ Customer Email:', bookingData.customer.email);
      console.log('⚙️ Customer Phone:', bookingData.customer.phone);
      console.log('⚙️ Notes:', JSON.stringify({
        payment_type: 'service_payment',
        isWebView: useRedirectMode ? 'true' : 'false',
        booking_amount: bookingData.pricing.totalAmount.toString(),
        payment_context: 'new_booking_checkout',
      }, null, 2));
      
      // CRITICAL: Log the exact callback URL that will be sent to Razorpay
      if (useRedirectMode && callbackUrl) {
        console.log('🔗 ========== CALLBACK URL VERIFICATION ==========');
        console.log('🔗 Full Callback URL:', callbackUrl);
        console.log('🔗 Expected Backend URL: https://api.getfixfly.com/api/payment/razorpay-callback');
        console.log('🔗 Test Endpoint (confirmed working): https://api.getfixfly.com/api/payment/test-callback');
        try {
          const urlObj = new URL(callbackUrl);
          console.log('🔗 Callback URL Protocol:', urlObj.protocol);
          console.log('🔗 Callback URL Host:', urlObj.host);
          console.log('🔗 Callback URL Path:', urlObj.pathname);
          console.log('🔗 Callback URL is Public:', !urlObj.hostname.includes('localhost'));
          console.log('🔗 Callback URL is HTTPS:', urlObj.protocol === 'https:');
          
          // Verify callback URL matches expected format
          const expectedUrl = 'https://api.getfixfly.com/api/payment/razorpay-callback';
          if (callbackUrl === expectedUrl) {
            console.log('✅ Callback URL matches expected format');
          } else {
            console.warn('⚠️ Callback URL does not match expected format');
            console.warn('⚠️ Expected:', expectedUrl);
            console.warn('⚠️ Actual:', callbackUrl);
          }
          console.log('🔗 ============================================');
        } catch (e) {
          console.error('❌ Error parsing callback URL:', e);
        }
      }
      
      console.log('⚙️ ===================================================');

      // Razorpay options - CRITICAL: Like RentYatra, use spread operator for WebView options
      const options: any = {
        key: this.razorpayKey,
        amount: order.amount, // Already in paise from backend
        currency: order.currency || 'INR',
        name: 'Fixfly',
        description: 'Service Booking Payment',
        order_id: order.orderId,
        prefill: {
          name: bookingData.customer.name || '',
          email: bookingData.customer.email || '',
          contact: bookingData.customer.phone || '',
        },
        notes: {
          payment_type: 'service_payment',
          isWebView: useRedirectMode ? 'true' : 'false',
          booking_amount: bookingData.pricing.totalAmount.toString(),
          // CRITICAL: Store booking data in notes for WebView callback handling
          // Backend can extract this if URL params are missing
          payment_context: 'new_booking_checkout',
          // Store order_id in payment notes for callback retrieval (like RentYatra)
          razorpay_order_id: order.orderId,
          order_id: order.orderId
        },
        theme: {
          color: '#3B82F6',
        },
        // CRITICAL: For WebView/APK - MUST use redirect mode (RentYatra style)
        // Use spread operator to conditionally add redirect options
        // IMPORTANT: Both redirect: true AND callback_url are required for WebView
        // RentYatra uses: ...(useRedirectMode && { redirect: true, callback_url: callbackUrl })
        ...(useRedirectMode && callbackUrl ? {
          redirect: true, // REQUIRED for WebView - modal mode doesn't work
          callback_url: callbackUrl, // Callback URL for redirect mode - MUST be publicly accessible
        } : {}),
        
        // Handler - CRITICAL: Like RentYatra, always define handler
        // In WebView redirect mode, callback_url will handle redirect, but handler is fallback
        handler: async (response: PaymentResponse) => {
          try {
            console.log('✅ ========== PAYMENT HANDLER CALLED ==========');
            console.log('✅ Timestamp:', new Date().toISOString());
            console.log('✅ Response:', JSON.stringify(response, null, 2));
            console.log('✅ Is WebView/Redirect Mode:', useRedirectMode);
            console.log('✅ Order ID:', order.orderId);
            console.log('✅ ===========================================');
            
            // Store response immediately (like RentYatra)
            try {
              const responseWithContext = {
                ...response,
                timestamp: Date.now(),
                orderId: order.orderId
              };
              localStorage.setItem('payment_response', JSON.stringify(responseWithContext));
              sessionStorage.setItem('payment_response', JSON.stringify(responseWithContext));
              console.log('💾 Stored payment response in handler');
            } catch (e) {
              console.warn('⚠️ Could not store payment response:', e);
            }
            
            // For WebView redirect mode, callback_url should handle redirect
            // But if it doesn't work, we force redirect here as fallback
            if (useRedirectMode && callbackUrl) {
              console.log('🔀 WebView Redirect Mode: callback_url should handle redirect');
              console.log('🔀 If callback_url fails, handler will force redirect');
              
              // Fallback: Force redirect after small delay if callback_url didn't work
              setTimeout(() => {
                if (!window.location.href.includes('/payment-callback') && 
                    !window.location.href.includes('razorpay')) {
                  try {
                    const callbackUrlWithParams = new URL(callbackUrl);
                    callbackUrlWithParams.searchParams.set('razorpay_order_id', response.razorpay_order_id || order.orderId);
                    callbackUrlWithParams.searchParams.set('razorpay_payment_id', response.razorpay_payment_id);
                    if (response.razorpay_signature) {
                      callbackUrlWithParams.searchParams.set('razorpay_signature', response.razorpay_signature);
                    }
                    
                    console.log('🚀 FALLBACK: Forcing redirect to callback (callback_url did not work)');
                    console.log('🚀 Redirect URL:', callbackUrlWithParams.toString());
                    window.location.href = callbackUrlWithParams.toString();
                  } catch (e) {
                    console.error('❌ Error in fallback redirect:', e);
                  }
                }
              }, 2000); // Wait 2 seconds for callback_url to work
            } else {
              // Modal mode - create booking directly
              console.log('📦 Modal Mode: Creating booking with payment verification');
              try {
                const bookingResponse = await this.createBookingWithPayment(bookingData, response);
                onSuccess(bookingResponse);
              } catch (error) {
                console.error('❌ Error creating booking with payment:', error);
                onFailure(error);
              }
            }
          } catch (handlerError) {
            console.error('❌ Error in payment handler:', handlerError);
            onFailure(handlerError);
          }
        },
        // CRITICAL: For WebView redirect mode, modal options should be minimal or undefined
        // In redirect mode, modal doesn't apply - payment opens in redirect
        ...(useRedirectMode ? {} : {
          modal: {
            ondismiss: onClose,
            escape: true,
            animation: true,
            backdropclose: true,
          },
        }),
        // WebView specific options
        retry: {
          enabled: true,
          max_count: 3,
        },
        timeout: 300,
        // Additional WebView compatibility options (like RentYatra)
        config: {
          display: {
            blocks: {
              banks: {
                name: 'All payment methods',
                instruments: [
                  { type: 'card' },
                  { type: 'netbanking' },
                  { type: 'wallet' },
                  { type: 'upi' }
                ]
              }
            },
            sequence: ['block.banks'],
            preferences: {
              show_default_blocks: true
            }
          }
        },
      };

      // CRITICAL: Verify Razorpay is available before opening
      if (!window.Razorpay) {
        console.error('❌ Razorpay not available - attempting to reload script...');
        try {
          await this.loadRazorpayScript();
        } catch (reloadError) {
          console.error('❌ Failed to reload Razorpay script:', reloadError);
          onFailure(new Error('Razorpay payment gateway is not available. Please check your internet connection and try again.'));
          return;
        }
      }

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      
      // CRITICAL: For WebView, add event listeners to catch payment events (like RentYatra)
      // These events are essential for debugging payment failures in WebView/APK
      if (useRedirectMode) {
        console.log('📱 ========== ADDING WEBVIEW PAYMENT EVENT LISTENERS ==========');
        console.log('📱 Adding payment.failed, payment.authorized, payment.captured listeners');
        console.log('📱 ===================================================');
        
        // Add payment.failed event handler (CRITICAL for WebView)
        razorpay.on('payment.failed', (response: any) => {
          console.error('❌ ❌ ❌ ========== PAYMENT FAILED EVENT (WEBVIEW) ========== ❌ ❌ ❌');
          console.error('❌ Timestamp:', new Date().toISOString());
          console.error('❌ Response:', JSON.stringify(response, null, 2));
          console.error('❌ Error Code:', response.error?.code);
          console.error('❌ Error Description:', response.error?.description);
          console.error('❌ Error Reason:', response.error?.reason);
          console.error('❌ Error Source:', response.error?.source);
          console.error('❌ Error Step:', response.error?.step);
          console.error('❌ Order ID:', order.orderId);
          console.error('❌ User Agent:', navigator.userAgent);
          console.error('❌ ========================================================');
          
          // Store failure info for debugging
          try {
            localStorage.setItem('payment_failure_webview', JSON.stringify({
              error: response.error,
              timestamp: Date.now(),
              orderId: order.orderId,
              userAgent: navigator.userAgent
            }));
            console.log('💾 Stored payment failure info in localStorage');
          } catch (e) {
            console.warn('⚠️ Could not store payment failure info:', e);
          }
          
          // CRITICAL: For WebView/APK, redirect to callback with error so backend can log it
          if (useRedirectMode && callbackUrl) {
            try {
              const errorCallbackUrl = new URL(callbackUrl);
              const errorMessage = response.error?.description || response.error?.reason || 'Payment failed';
              errorCallbackUrl.searchParams.set('error', 'payment_failed');
              errorCallbackUrl.searchParams.set('error_message', encodeURIComponent(errorMessage));
              errorCallbackUrl.searchParams.set('payment_failed', 'true');
              errorCallbackUrl.searchParams.set('razorpay_order_id', order.orderId);
              
              if (response.error?.metadata?.payment_id) {
                errorCallbackUrl.searchParams.set('razorpay_payment_id', response.error.metadata.payment_id);
              }
              
              console.error('❌ Redirecting to callback with error:', errorCallbackUrl.toString());
              
              // Force redirect to backend callback
              setTimeout(() => {
                window.location.href = errorCallbackUrl.toString();
              }, 500);
            } catch (redirectError) {
              console.error('❌ Error redirecting to callback:', redirectError);
              // Fallback: call onError
              onFailure(new Error(response.error?.description || response.error?.reason || 'Payment failed in WebView'));
            }
          } else {
            // Call onError callback
            onFailure(new Error(response.error?.description || response.error?.reason || 'Payment failed in WebView'));
          }
        });
        
        // Add payment.authorized event handler (for debugging)
        razorpay.on('payment.authorized', (response: any) => {
          console.log('✅ ========== PAYMENT AUTHORIZED EVENT (WEBVIEW) ==========');
          console.log('✅ Response:', JSON.stringify(response, null, 2));
          console.log('✅ Order ID:', order.orderId);
          console.log('✅ ===================================================');
        });
        
        // Add payment.captured event handler (for debugging)
        razorpay.on('payment.captured', (response: any) => {
          console.log('✅ ========== PAYMENT CAPTURED EVENT (WEBVIEW) ==========');
          console.log('✅ Response:', JSON.stringify(response, null, 2));
          console.log('✅ Order ID:', order.orderId);
          console.log('✅ ===================================================');
        });
        
        console.log('✅ WebView payment event listeners added successfully');
      }
      
      // For WebView, add event listeners to catch payment events
      if (useRedirectMode) {
        // Store payment data for callback handling
        try {
          localStorage.setItem('pending_payment', JSON.stringify({
            type: 'booking',
            orderId: order.orderId,
            amount: order.amount,
            description: 'Service booking payment',
            callbackUrl: callbackUrl,
            bookingData: {
              customer: bookingData.customer,
              services: bookingData.services,
              pricing: bookingData.pricing,
              scheduling: bookingData.scheduling,
              notes: bookingData.notes
            },
            timestamp: Date.now()
          }));
          console.log('💾 Stored booking payment info in localStorage for callback handling');
        } catch (e) {
          console.warn('⚠️ Could not store payment info:', e);
        }

        // Add payment event listeners for WebView
        // CRITICAL: payment.success event listener for WebView (fallback if callback_url doesn't work)
        razorpay.on('payment.success', (response: any) => {
          console.log('✅ ========== STEP 7: PAYMENT.SUCCESS EVENT FIRED (Booking - WebView) ==========');
          console.log('✅ Timestamp:', new Date().toISOString());
          console.log('✅ Payment ID:', response.razorpay_payment_id || response.razorpayPaymentId || 'N/A');
          console.log('✅ Order ID:', response.razorpay_order_id || response.razorpayOrderId || 'N/A');
          console.log('✅ Signature:', response.razorpay_signature ? 'PRESENT' : 'MISSING');
          console.log('✅ Full Response:', JSON.stringify(response, null, 2));
          console.log('✅ This is a fallback - callback_url should handle redirect normally');
          console.log('✅ ============================================================');
          
          // Store response immediately
          try {
            const responseWithContext = {
              ...response,
              timestamp: Date.now()
            };
            localStorage.setItem('payment_response', JSON.stringify(responseWithContext));
            sessionStorage.setItem('payment_response', JSON.stringify(responseWithContext));
            console.log('💾 Stored booking payment response from payment.success event');
            
            // Fallback redirect if callback_url didn't work (some WebView scenarios)
            if (callbackUrl) {
              try {
                const callbackUrlWithParams = new URL(callbackUrl);
                callbackUrlWithParams.searchParams.set('razorpay_order_id', response.razorpay_order_id || response.razorpayOrderId || order.orderId);
                callbackUrlWithParams.searchParams.set('razorpay_payment_id', response.razorpay_payment_id || response.razorpayPaymentId);
                if (response.razorpay_signature || response.razorpaySignature) {
                  callbackUrlWithParams.searchParams.set('razorpay_signature', response.razorpay_signature || response.razorpaySignature);
                }
                
                console.log('🔀 Fallback: Redirecting to callback (payment.success in WebView):', callbackUrlWithParams.toString());
                // CRITICAL: Force redirect immediately - don't wait for callback_url
                // In WebView, callback_url might not work, so we force redirect
                setTimeout(() => {
                  if (window.location.href !== callbackUrlWithParams.toString() && 
                      !window.location.href.includes('/payment-callback')) {
                    console.log('🚀 FORCE REDIRECT: callback_url did not work, forcing redirect');
                    window.location.href = callbackUrlWithParams.toString();
                  }
                }, 500);
                
                // Additional fallback after longer delay
                setTimeout(() => {
                  if (window.location.href !== callbackUrlWithParams.toString() && 
                      !window.location.href.includes('/payment-callback')) {
                    console.log('🔄 Retry redirect after 2 seconds...');
                    window.location.replace(callbackUrlWithParams.toString());
                  }
                }, 2000);
              } catch (e) {
                console.error('❌ Error in fallback redirect:', e);
              }
            }
          } catch (e) {
            console.error('❌ Error storing payment response:', e);
          }
        });

        razorpay.on('payment.failed', (response: any) => {
          console.error('\n');
          console.error('❌ ❌ ❌ ========== PAYMENT.FAILED EVENT FIRED (Booking - WebView) ========== ❌ ❌ ❌');
          console.error('❌ Timestamp:', new Date().toISOString());
          console.error('❌ Order ID:', order.orderId);
          console.error('❌ Amount:', order.amount, 'paise (₹' + (order.amount / 100).toFixed(2) + ')');
          console.error('❌ Full Response:', JSON.stringify(response, null, 2));
          console.error('❌ Error Object:', JSON.stringify(response.error, null, 2));
          console.error('❌ Error Code:', response.error?.code || 'N/A');
          console.error('❌ Error Description:', response.error?.description || 'N/A');
          console.error('❌ Error Reason:', response.error?.reason || 'N/A');
          console.error('❌ Error Source:', response.error?.source || 'N/A');
          console.error('❌ Error Step:', response.error?.step || 'N/A');
          console.error('❌ Error Metadata:', JSON.stringify(response.error?.metadata || {}, null, 2));
          console.error('❌ Callback URL:', callbackUrl || 'N/A');
          console.error('❌ Use Redirect Mode:', useRedirectMode);
          console.error('❌ ============================================================');
          console.error('\n');
          
          // Extract detailed error message
          let errorMessage = 'Payment failed. Please try again.';
          if (response.error) {
            if (response.error.description) {
              errorMessage = response.error.description;
            } else if (response.error.reason) {
              errorMessage = response.error.reason;
            } else if (response.error.message) {
              errorMessage = response.error.message;
            }
          }
          
          // Store failure info for debugging
          try {
            localStorage.setItem('payment_failure', JSON.stringify({
              error: response.error,
              orderId: order.orderId,
              amount: order.amount,
              timestamp: Date.now(),
              context: 'booking_checkout',
              callbackUrl: callbackUrl
            }));
            console.log('💾 Stored payment failure info in localStorage');
          } catch (e) {
            console.warn('⚠️ Could not store payment failure info:', e);
          }
          
          // CRITICAL: For WebView, redirect to backend callback with error
          // Backend will then redirect to frontend with error
          // IMPORTANT: Even if payment fails, we MUST redirect to callback so backend can log it
          if (useRedirectMode && callbackUrl) {
            try {
              const errorCallbackUrl = new URL(callbackUrl);
              errorCallbackUrl.searchParams.set('error', 'payment_failed');
              errorCallbackUrl.searchParams.set('error_message', encodeURIComponent(errorMessage));
              errorCallbackUrl.searchParams.set('payment_failed', 'true');
              
              // Add payment IDs if available
              if (response.error?.metadata?.payment_id) {
                errorCallbackUrl.searchParams.set('razorpay_payment_id', response.error.metadata.payment_id);
              }
              if (order.orderId) {
                errorCallbackUrl.searchParams.set('razorpay_order_id', order.orderId);
              }
              
              // Add error details for backend logging
              if (response.error?.code) {
                errorCallbackUrl.searchParams.set('error_code', response.error.code);
              }
              if (response.error?.reason) {
                errorCallbackUrl.searchParams.set('error_reason', encodeURIComponent(response.error.reason));
              }
              
              console.error('❌ ========== REDIRECTING TO BACKEND ERROR CALLBACK ==========');
              console.error('❌ Error Callback URL:', errorCallbackUrl.toString());
              console.error('❌ Backend will then redirect to frontend with error details');
              console.error('❌ This ensures payment failure is logged in backend');
              console.error('❌ ===================================================');
              
              // CRITICAL: Force redirect immediately - don't wait
              // This ensures backend receives the failure callback
              // IMPORTANT: Don't call onFailure here - redirect will handle it
              console.error('🚀 Redirecting to backend error callback - onFailure will be called by PaymentCallback page');
              window.location.href = errorCallbackUrl.toString();
              
              // Fallback: If redirect doesn't work, call onFailure after delay
              setTimeout(() => {
                if (!window.location.href.includes('/payment-callback') && 
                    !window.location.href.includes('razorpay')) {
                  console.warn('⚠️ Redirect did not work, calling onFailure as fallback');
                  onFailure(new Error(errorMessage));
                }
              }, 2000);
            } catch (e) {
              console.error('❌ Error redirecting to error callback:', e);
              // Only call onFailure if redirect completely fails
              onFailure(new Error(errorMessage));
            }
          } else {
            // Modal mode - call onFailure directly
            console.log('📞 Calling onFailure directly (Modal Mode)');
            onFailure(new Error(errorMessage));
          }
        });
      }
      
      console.log('🎯 ========== STEP 6: OPENING RAZORPAY CHECKOUT (BOOKING) ==========');
      console.log('🎯 Order ID:', order.orderId);
      console.log('🎯 Amount:', order.amount, 'paise (₹' + (order.amount / 100).toFixed(2) + ')');
      console.log('🎯 Callback URL:', callbackUrl);
      console.log('🎯 Use Redirect Mode:', useRedirectMode);
      console.log('🎯 Is APK/WebView:', isAPK);
      console.log('🎯 Razorpay Options Summary:', {
        hasKey: !!this.razorpayKey,
        hasOrderId: !!order.orderId,
        hasAmount: !!order.amount,
        hasCallbackUrl: !!callbackUrl,
        hasRedirect: useRedirectMode,
        hasHandler: typeof options.handler === 'function'
      });
      console.log('🎯 Full Options (sanitized):', {
        key: this.razorpayKey ? `${this.razorpayKey.substring(0, 10)}...` : 'MISSING',
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        callback_url: callbackUrl || 'N/A',
        redirect: useRedirectMode ? true : undefined,
        hasHandler: typeof options.handler === 'function',
        hasModal: !!options.modal
      });
      console.log('🎯 Timestamp:', new Date().toISOString());
      console.log('🎯 ===============================================================');
      
      // For WebView, ensure Razorpay opens properly
      try {
        console.log('🚀 ========== STEP 6.1: CALLING RAZORPAY.OPEN() ==========');
        console.log('🚀 Order ID:', order.orderId);
        console.log('🚀 Amount:', order.amount, 'paise (₹' + (order.amount / 100).toFixed(2) + ')');
        console.log('🚀 Callback URL:', callbackUrl);
        console.log('🚀 Is WebView:', useRedirectMode);
        console.log('🚀 User-Agent:', navigator.userAgent);
        console.log('🚀 Window Location:', window.location.href);
        console.log('🚀 Timestamp:', new Date().toISOString());
        console.log('🚀 =======================================================');
        
        // CRITICAL: Verify Razorpay instance before opening
        if (!razorpay) {
          throw new Error('Razorpay instance is null or undefined');
        }
        
        // CRITICAL: Log the exact callback URL and Razorpay options before opening
        if (useRedirectMode && callbackUrl) {
          console.log('🔗 ========== FINAL CALLBACK URL VERIFICATION ==========');
          console.log('🔗 Callback URL that will be sent to Razorpay:', callbackUrl);
          console.log('🔗 Expected URL: https://api.getfixfly.com/api/payment/razorpay-callback');
          console.log('🔗 Backend Server: Contabo VPS (Ubuntu) - CONFIRMED ACCESSIBLE');
          console.log('🔗 Test Endpoint: https://api.getfixfly.com/api/payment/test-callback ✅');
          console.log('🔗 This URL MUST be publicly accessible from Razorpay servers');
          console.log('🔗 Expected backend route: /api/payment/razorpay-callback');
          
          // Final verification
          if (callbackUrl === 'https://api.getfixfly.com/api/payment/razorpay-callback') {
            console.log('✅ ✅ ✅ CALLBACK URL IS CORRECT ✅ ✅ ✅');
          } else {
            console.error('❌ ❌ ❌ CALLBACK URL MISMATCH ❌ ❌ ❌');
            console.error('❌ Expected: https://api.getfixfly.com/api/payment/razorpay-callback');
            console.error('❌ Actual:', callbackUrl);
            console.error('❌ This will cause payment to fail!');
          }
          
          // CRITICAL: Verify Razorpay options have callback_url
          console.log('🔗 Razorpay Options Check:');
          console.log('🔗   redirect:', useRedirectMode ? 'true' : 'false');
          console.log('🔗   callback_url:', callbackUrl);
          console.log('🔗   order_id:', order.orderId);
          console.log('🔗   amount:', order.amount);
          console.log('🔗 ===================================================');
        } else if (useRedirectMode && !callbackUrl) {
          console.error('❌ ❌ ❌ CRITICAL ERROR: CALLBACK URL IS MISSING ❌ ❌ ❌');
          console.error('❌ WebView mode requires callback_url but it is not set!');
          console.error('❌ Payment will fail without callback URL!');
        }
        
        // CRITICAL: Log callback URL verification and final options check
        if (useRedirectMode && callbackUrl) {
          console.log('🔗 ========== CALLBACK URL VERIFICATION ==========');
          console.log('🔗 Full Callback URL:', callbackUrl);
          console.log('🔗 Expected Backend URL: https://api.getfixfly.com/api/payment/razorpay-callback');
          console.log('🔗 Test Endpoint (confirmed working): https://api.getfixfly.com/api/payment/test-callback');
          try {
            const urlObj = new URL(callbackUrl);
            console.log('🔗 Callback URL Protocol:', urlObj.protocol);
            console.log('🔗 Callback URL Host:', urlObj.host);
            console.log('🔗 Callback URL Path:', urlObj.pathname);
            console.log('🔗 Callback URL is Public:', !urlObj.hostname.includes('localhost'));
            console.log('🔗 Callback URL is HTTPS:', urlObj.protocol === 'https:');
            
            // Verify callback URL matches expected format
            const expectedUrl = 'https://api.getfixfly.com/api/payment/razorpay-callback';
            if (callbackUrl === expectedUrl) {
              console.log('✅ Callback URL matches expected format');
            } else {
              console.warn('⚠️ Callback URL does not match expected format');
              console.warn('⚠️ Expected:', expectedUrl);
              console.warn('⚠️ Actual:', callbackUrl);
            }
            console.log('🔗 ============================================');
          } catch (e) {
            console.error('❌ Error parsing callback URL:', e);
          }
        }
        
        // CRITICAL: Final check before opening Razorpay
        if (useRedirectMode) {
          console.log('🔍 ========== FINAL RAZORPAY OPTIONS CHECK ==========');
          console.log('🔍 Redirect Mode:', useRedirectMode);
          console.log('🔍 Callback URL:', callbackUrl);
          console.log('🔍 Options has redirect:', options.redirect === true);
          console.log('🔍 Options has callback_url:', !!options.callback_url);
          console.log('🔍 Options callback_url value:', options.callback_url || 'MISSING');
          console.log('🔍 Order ID:', order.orderId);
          console.log('🔍 Amount:', order.amount);
          
          // CRITICAL: Verify callback_url is set in options
          if (!options.callback_url) {
            console.error('❌ ❌ ❌ CRITICAL ERROR: callback_url is NOT set in Razorpay options! ❌ ❌ ❌');
            console.error('❌ This will cause payment to fail in WebView!');
            console.error('❌ Callback URL variable:', callbackUrl);
            console.error('❌ Use Redirect Mode:', useRedirectMode);
            throw new Error('Callback URL is required for WebView payment but is not set in Razorpay options');
          }
          
          if (options.redirect !== true) {
            console.error('❌ ❌ ❌ CRITICAL ERROR: redirect is NOT true in Razorpay options! ❌ ❌ ❌');
            console.error('❌ This will cause payment to fail in WebView!');
            throw new Error('Redirect mode is required for WebView payment but is not enabled in Razorpay options');
          }
          
          console.log('✅ ✅ ✅ RAZORPAY OPTIONS VERIFIED FOR WEBVIEW ✅ ✅ ✅');
          console.log('🔍 ===================================================');
        }
        
        // CRITICAL: Open Razorpay checkout with error handling
        try {
          razorpay.open();
          console.log('✅ ✅ ✅ Razorpay.open() called successfully ✅ ✅ ✅');
          console.log('✅ Timestamp:', new Date().toISOString());
          
          // For WebView, log that payment page should be opening
          if (useRedirectMode) {
            console.log('🔀 ========== WEBVIEW PAYMENT FLOW ==========');
            console.log('🔀 WebView Mode: Payment page should open in redirect mode');
            console.log('🔀 After payment, Razorpay will redirect to:', callbackUrl);
            console.log('🔀 Backend callback will then redirect to frontend callback page');
            console.log('🔀 Expected Flow:');
            console.log('   1. User completes payment in Razorpay');
            console.log('   2. Razorpay redirects to:', callbackUrl);
            console.log('   3. Backend processes callback and redirects to frontend');
            console.log('   4. Frontend PaymentCallback page handles the result');
            console.log('🔀 If payment fails, check:');
            console.log('   1. Is callback URL publicly accessible?');
            console.log('   2. Is backend server running and accessible?');
            console.log('   3. Check backend logs for callback route hits');
            console.log('   4. Check browser console for payment.failed event');
            console.log('🔀 ===========================================');
            
            // CRITICAL: Monitor for payment.failed event (WebView specific)
            // In WebView, payment might fail silently, so we need to monitor
            const paymentFailedTimeout = setTimeout(() => {
              // Check if we're still on the same page after 30 seconds
              // If yes, payment might have failed silently
              if (window.location.href.includes('checkout') || 
                  window.location.href.includes('payment') && 
                  !window.location.href.includes('payment-callback')) {
                console.warn('⚠️ ⚠️ ⚠️ PAYMENT TIMEOUT WARNING ⚠️ ⚠️ ⚠️');
                console.warn('⚠️ Payment page opened but no callback received after 30 seconds');
                console.warn('⚠️ Possible reasons:');
                console.warn('   1. Payment failed silently in Razorpay');
                console.warn('   2. Callback URL not accessible from Razorpay');
                console.warn('   3. User closed payment page');
                console.warn('⚠️ Check Razorpay Dashboard for payment status');
                console.warn('⚠️ Check browser console for payment.failed event');
              }
            }, 30000); // 30 seconds timeout
            
            // Cleanup timeout on navigation
            const originalHref = window.location.href;
            const checkNavigation = setInterval(() => {
              if (window.location.href !== originalHref) {
                clearTimeout(paymentFailedTimeout);
                clearInterval(checkNavigation);
              }
            }, 1000);
          }
        } catch (openError: any) {
          console.error('❌ ❌ ❌ ERROR OPENING RAZORPAY CHECKOUT ❌ ❌ ❌');
          console.error('❌ Error:', openError);
          console.error('❌ Error Message:', openError?.message);
          console.error('❌ Error Stack:', openError?.stack);
          console.error('❌ Order ID:', order.orderId);
          console.error('❌ Callback URL:', callbackUrl);
          console.error('❌ Use Redirect Mode:', useRedirectMode);
          console.error('❌ Timestamp:', new Date().toISOString());
          console.error('❌ ===================================================');
          
          // Store error for debugging
          try {
            localStorage.setItem('razorpay_open_error', JSON.stringify({
              error: openError.message,
              orderId: order.orderId,
              callbackUrl: callbackUrl,
              timestamp: Date.now()
            }));
          } catch (e) {
            console.warn('⚠️ Could not store error info:', e);
          }
          
          // Call onFailure
          onFailure(new Error(openError?.message || 'Failed to open payment gateway. Please try again.'));
        }
        
        // For WebView, add multiple checks to ensure modal opened
        if (useRedirectMode) {
          // Check 1: Immediate check
          setTimeout(() => {
            const razorpayModal = document.querySelector('.razorpay-container, .razorpay-checkout-frame, iframe[src*="razorpay"]');
            if (razorpayModal) {
              console.log('✅ Razorpay modal is visible (immediate check)');
            } else {
              console.warn('⚠️ Razorpay modal not immediately visible - this is normal in WebView');
            }
          }, 500);
          
          // Check 2: Delayed check
          setTimeout(() => {
            const razorpayModal = document.querySelector('.razorpay-container, .razorpay-checkout-frame, iframe[src*="razorpay"]');
            if (!razorpayModal) {
              console.warn('⚠️ Razorpay modal still not visible after 2s - Payment will proceed via callback_url if user completes payment');
              console.warn('⚠️ In WebView, Razorpay might open in external browser or handle payment differently');
            } else {
              console.log('✅ Razorpay modal is visible (delayed check)');
            }
          }, 2000);
          
          // Check 3: Final check and warning
          setTimeout(() => {
            const razorpayModal = document.querySelector('.razorpay-container, .razorpay-checkout-frame, iframe[src*="razorpay"]');
            if (!razorpayModal) {
              console.warn('⚠️ ========== WEBVIEW RAZORPAY MODAL WARNING ==========');
              console.warn('⚠️ Razorpay modal not visible after 5s');
              console.warn('⚠️ This might mean:');
              console.warn('   1. Payment opened in external browser (normal for WebView)');
              console.warn('   2. Payment will redirect via callback_url after completion');
              console.warn('   3. User should complete payment in the opened window');
              console.warn('⚠️ ===================================================');
            }
          }, 5000);
        }
      } catch (openError: any) {
        console.error('❌ ========== ERROR OPENING RAZORPAY CHECKOUT ==========');
        console.error('❌ Error:', openError);
        console.error('❌ Error Message:', openError?.message);
        console.error('❌ Error Stack:', openError?.stack);
        console.error('❌ Order ID:', order.orderId);
        console.error('❌ Amount:', order.amount);
        console.error('❌ Razorpay Key:', this.razorpayKey ? 'Present' : 'Missing');
        console.error('❌ Is WebView:', useRedirectMode);
        console.error('❌ Callback URL:', callbackUrl);
        console.error('❌ ===================================================');
        
        // Store error for debugging
        try {
          localStorage.setItem('razorpay_open_error', JSON.stringify({
            error: openError?.message,
            orderId: order.orderId,
            amount: order.amount,
            isWebView: useRedirectMode,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('⚠️ Could not store error info:', e);
        }
        
        const errorMessage = openError?.message || 'Failed to open payment gateway. Please try again.';
        onFailure(new Error(errorMessage));
      }
    } catch (error) {
      console.error('Error processing booking payment:', error);
      onFailure(error);
    }
  }

  /**
   * Create booking with payment verification
   */
  private async createBookingWithPayment(bookingData: BookingData, paymentResponse: PaymentResponse): Promise<any> {
    try {
      const requestData = {
        ...bookingData,
        customer: {
          ...bookingData.customer,
          phone: bookingData.customer.phone.replace(/^\+91/, '').replace(/^91/, ''), // Remove +91 or 91 prefix for backend
        },
        paymentData: {
          razorpayOrderId: paymentResponse.razorpay_order_id,
          razorpayPaymentId: paymentResponse.razorpay_payment_id,
          razorpaySignature: paymentResponse.razorpay_signature,
        },
      };

      // Validate required fields before sending
      if (!requestData.customer.name || !requestData.customer.email || !requestData.customer.phone) {
        throw new Error('Customer information is incomplete');
      }
      
      if (!requestData.customer.address.street || !requestData.customer.address.city || 
          !requestData.customer.address.state || !requestData.customer.address.pincode) {
        throw new Error('Customer address is incomplete');
      }
      
      if (!requestData.services || requestData.services.length === 0) {
        throw new Error('No services selected');
      }
      
      if (!requestData.pricing || !requestData.pricing.totalAmount) {
        throw new Error('Pricing information is incomplete');
      }

      console.log('Sending booking data:', {
        customer: requestData.customer,
        services: requestData.services,
        pricing: requestData.pricing,
        scheduling: requestData.scheduling,
        paymentData: requestData.paymentData
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/with-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      console.log('Booking creation response:', {
        status: response.status,
        success: data.success,
        message: data.message,
        error: data.error,
        data: data.data
      });

      if (!data.success) {
        console.error('\n');
        console.error('❌ ❌ ❌ BACKEND BOOKING CREATION ERROR ❌ ❌ ❌');
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('❌ HTTP Status:', response.status);
        console.error('❌ Error Message:', data.message);
        console.error('❌ Error Code:', data.error);
        console.error('❌ Payment ID:', paymentResponse.razorpay_payment_id || 'N/A');
        console.error('❌ Order ID:', paymentResponse.razorpay_order_id || 'N/A');
        if (data.details) {
          console.error('❌ Error Details:', JSON.stringify(data.details, null, 2));
        }
        console.error('❌ Full Response:', JSON.stringify(data, null, 2));
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('\n');
        
        // Provide more helpful error messages based on error type
        let errorMessage = data.message || 'Failed to create booking';
        
        if (data.error === 'PAYMENT_VERIFICATION_FAILED') {
          const paymentStatus = data.details?.paymentStatus || 'unknown';
          const paymentExists = data.details?.paymentExists || false;
          
          if (paymentExists && paymentStatus !== 'failed') {
            errorMessage = 'Payment was successful but verification encountered an issue. Your payment may have been processed. Please check your bookings or contact support with Payment ID: ' + (paymentResponse.razorpay_payment_id || 'N/A');
          } else {
            errorMessage = 'Payment verification failed. Please try again or contact support with Payment ID: ' + (paymentResponse.razorpay_payment_id || 'N/A');
          }
        } else if (data.error === 'PAYMENT_AMOUNT_MISMATCH') {
          errorMessage = 'Payment amount mismatch. Please contact support with Payment ID: ' + (paymentResponse.razorpay_payment_id || 'N/A');
        }
        
        throw new Error(errorMessage);
      }

      return data.data;
    } catch (error) {
      console.error('Error creating booking with payment:', error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
      }
      
      // Handle HTTP errors
      if (error.message.includes('Failed to create booking')) {
        throw new Error(`Booking creation failed: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Verify payment signature (for manual verification if needed)
   */
  async verifyPayment(paymentData: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Payment verification failed');
      }

      return data.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to get payment details');
      }

      return data.data;
    } catch (error) {
      console.error('Error getting payment details:', error);
      throw error;
    }
  }

  /**
   * Get available payment methods
   */
  async getPaymentMethods(): Promise<any> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment/methods`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to get payment methods');
      }

      return data.data;
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  }
}

// Create singleton instance
const razorpayService = RazorpayService.getInstance();

export default razorpayService;
export type { BookingData, PaymentResponse };
