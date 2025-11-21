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

  constructor() {
    this.razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_8sYbzHWidwe5Zw';
    
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
   */
  private async loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        console.log('✅ Razorpay script already loaded');
        resolve();
        return;
      }

      console.log('📥 Loading Razorpay script...');
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.defer = true;
      
      // Add timeout for WebView scenarios
      const timeout = setTimeout(() => {
        if (!window.Razorpay) {
          console.error('❌ Razorpay script loading timeout');
          reject(new Error('Razorpay script loading timeout. Please try again.'));
        }
      }, 10000); // 10 second timeout
      
      script.onload = () => {
        clearTimeout(timeout);
        console.log('✅ Razorpay script loaded successfully');
        if (window.Razorpay) {
          resolve();
        } else {
          reject(new Error('Razorpay script loaded but window.Razorpay is not available'));
        }
      };
      
      script.onerror = (error) => {
        clearTimeout(timeout);
        console.error('❌ Failed to load Razorpay script:', error);
        reject(new Error('Failed to load Razorpay script. Please check your internet connection.'));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * Create Razorpay order
   */
  async createOrder(amount: number, receipt: string, notes: Record<string, string> = {}): Promise<any> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment/create-order`, {
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

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create order');
      }

      return data.data;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  }

  /**
   * Check if running in WebView/APK context (Enhanced)
   */
  private isAPKContext(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      // Import the enhanced detection from mobileAppBridge
      // For now, use inline enhanced detection
      const userAgent = navigator.userAgent || '';
      const isWebView = /wv|WebView/i.test(userAgent);
      const isAndroidWebView = /Android.*wv/i.test(userAgent);
      const isIOSWebView = /iPhone.*wv|iPad.*wv/i.test(userAgent);
      const hasFlutter = (window as any).flutter_inappwebview !== undefined;
      const hasFlutterAlt = (window as any).flutter !== undefined;
      const hasAndroidBridge = (window as any).Android !== undefined;
      const hasCordova = (window as any).cordova !== undefined;
      const hasCapacitor = (window as any).Capacitor !== undefined;
      const hasWebKit = (window as any).webkit && (window as any).webkit.messageHandlers;
      
      // Check for standalone mode
      const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      // Check if mobile but not standard browser
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isStandardBrowser = !userAgent.includes('wv') && 
                               !userAgent.includes('WebView') && 
                               !hasFlutter && 
                               !hasFlutterAlt &&
                               !hasAndroidBridge;
      
      return isWebView || 
             isAndroidWebView || 
             isIOSWebView ||
             hasFlutter || 
             hasFlutterAlt ||
             hasAndroidBridge ||
             hasCordova || 
             hasCapacitor ||
             hasWebKit ||
             (isMobile && !isStandardBrowser && (isStandalone || isIOSStandalone));
    } catch (error) {
      console.error('Error detecting APK context:', error);
      return false;
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
      // Load Razorpay script
      await this.loadRazorpayScript();

      // Detect WebView/APK context
      const isAPK = this.isAPKContext();
      const useRedirectMode = isAPK; // Use redirect mode for WebView/APK

      console.log('🔍 ========== PAYMENT CONTEXT DETECTION ==========');
      console.log('🔍 Is APK/WebView:', isAPK);
      console.log('🔍 Use Redirect Mode:', useRedirectMode);
      console.log('🔍 User Agent:', navigator.userAgent);
      console.log('🔍 Has Flutter WebView:', !!(window as any).flutter_inappwebview);
      console.log('🔍 Has Flutter:', !!(window as any).flutter);
      console.log('🔍 Has Android Bridge:', !!(window as any).Android);
      console.log('🔍 ===============================================');

      // Build callback URL for redirect mode
      // CRITICAL: Include order_id in callback URL upfront so backend can track it even if handler doesn't execute
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      let callbackUrl = useRedirectMode 
        ? `${apiBase}/payment/razorpay-callback`
        : undefined;
      
      // For WebView, pre-populate callback URL with order_id and booking/ticket IDs
      if (useRedirectMode && callbackUrl && paymentData.orderId) {
        try {
          const callbackUrlObj = new URL(callbackUrl);
          callbackUrlObj.searchParams.set('razorpay_order_id', paymentData.orderId);
          callbackUrlObj.searchParams.set('order_id', paymentData.orderId);
          if (paymentData.bookingId) {
            callbackUrlObj.searchParams.set('booking_id', paymentData.bookingId);
          }
          if (paymentData.ticketId) {
            callbackUrlObj.searchParams.set('ticket_id', paymentData.ticketId);
          }
          callbackUrl = callbackUrlObj.toString();
          console.log('✅ Pre-populated callback URL with order_id and IDs');
        } catch (e) {
          console.warn('⚠️ Error pre-populating callback URL:', e);
        }
      }
      
      console.log('🔗 ========== PAYMENT CALLBACK URL SETUP ==========');
      console.log('🔗 API Base URL:', apiBase);
      console.log('🔗 Callback URL:', callbackUrl);
      console.log('🔗 Use Redirect Mode:', useRedirectMode);
      console.log('🔗 Order ID in Callback:', paymentData.orderId || 'N/A');
      console.log('🔗 Booking ID in Callback:', paymentData.bookingId || 'N/A');
      console.log('🔗 Ticket ID in Callback:', paymentData.ticketId || 'N/A');
      console.log('🔗 Full Callback Path:', callbackUrl ? new URL(callbackUrl).pathname : 'N/A');
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
        },
        theme: {
          color: '#3B82F6',
        },
        handler: (response: PaymentResponse) => {
          console.log('🎯 Razorpay handler called:', {
            useRedirectMode,
            hasResponse: !!response,
            orderId: response?.razorpay_order_id,
            paymentId: response?.razorpay_payment_id
          });
          
          // For modal mode (web), handle directly
          if (!useRedirectMode) {
            console.log('✅ Modal mode - calling onSuccess directly');
            paymentData.onSuccess(response);
          } else {
            // For redirect mode (WebView), handler might not execute
            // But we still log it for debugging
            console.log('⚠️ Redirect mode - handler called but redirect will happen via callback_url');
            console.log('📦 Response data:', JSON.stringify(response, null, 2));
          }
          // For redirect mode (WebView), callback will be handled by PaymentCallback page via callback_url
        },
        modal: {
          ondismiss: () => {
            if (!useRedirectMode) {
              paymentData.onError(new Error('PAYMENT_CANCELLED'));
            }
          },
          escape: true,
          animation: true,
          // WebView specific modal settings
          backdropclose: true,
        },
        // WebView specific options
        retry: {
          enabled: true,
          max_count: 3,
        },
        // CRITICAL: callback_url is what Razorpay uses to redirect after payment
        // In WebView, Razorpay will automatically redirect to this URL after payment
        // The handler might not execute, so callback_url is essential
        // IMPORTANT: callbackUrl already has order_id pre-populated above
        callback_url: useRedirectMode ? callbackUrl : undefined,
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

      // For WebView/APK, handle redirect in handler
      if (useRedirectMode && callbackUrl) {
        // Override handler to redirect to callback URL after payment
        options.handler = (response: PaymentResponse) => {
          console.log('✅ Payment successful in WebView, storing response...');
          console.log('📦 Payment response:', JSON.stringify(response, null, 2));
          console.log('🔗 Callback URL:', callbackUrl);
          
          // Store response with multiple methods for reliability
          try {
            // Method 1: localStorage (primary)
            const responseWithContext = {
              ...response,
              bookingId: paymentData.bookingId,
              ticketId: paymentData.ticketId,
              timestamp: Date.now()
            };
            localStorage.setItem('payment_response', JSON.stringify(responseWithContext));
            console.log('💾 Stored payment response in localStorage');
            
            // Method 2: sessionStorage (backup)
            try {
              sessionStorage.setItem('payment_response', JSON.stringify(responseWithContext));
              console.log('💾 Stored payment response in sessionStorage');
            } catch (e) {
              console.warn('⚠️ Could not store in sessionStorage:', e);
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
            
            // CRITICAL: In WebView, handler might not execute, so we MUST redirect immediately
            // Don't wait - redirect immediately to ensure callback is called
            try {
              console.log('🚀 IMMEDIATE redirect to callback (WebView):', callbackUrlWithParams.toString());
              
              // Try multiple redirect methods for maximum reliability
              // Method 1: Direct window.location (most reliable)
              window.location.href = callbackUrlWithParams.toString();
              
              // Method 2: If that doesn't work, try after small delay
              setTimeout(() => {
                if (window.location.href !== callbackUrlWithParams.toString()) {
                  console.log('🔄 Retrying redirect (method 1 failed)...');
                  window.location.replace(callbackUrlWithParams.toString());
                }
              }, 100);
              
              // Method 3: Flutter bridge fallback
              setTimeout(() => {
                if ((window as any).flutter_inappwebview && window.location.href !== callbackUrlWithParams.toString()) {
                  console.log('🔄 Trying Flutter bridge navigation...');
                  (window as any).flutter_inappwebview.callHandler('navigateTo', callbackUrlWithParams.toString());
                }
              }, 200);
              
            } catch (redirectError) {
              console.error('❌ Error redirecting:', redirectError);
              // Last resort: try to navigate using Flutter bridge if available
              if ((window as any).flutter_inappwebview) {
                console.log('🔄 Trying Flutter bridge navigation (error fallback)...');
                (window as any).flutter_inappwebview.callHandler('navigateTo', callbackUrlWithParams.toString());
              } else {
                // Fallback: show error to user
                console.error('❌ No navigation method available');
                paymentData.onError(new Error('Payment successful but redirect failed. Please contact support.'));
              }
            }
          } catch (e) {
            console.error('❌ Error building callback URL:', e);
            // Fallback: redirect to callback URL without params (will use localStorage)
            setTimeout(() => {
              window.location.href = callbackUrl;
            }, 300);
          }
        };
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
      
      // Add payment.failed event handler for WebView
      razorpay.on('payment.failed', (response: any) => {
        console.error('❌ ========== RAZORPAY PAYMENT.FAILED EVENT FIRED ==========');
        console.error('❌ Response:', JSON.stringify(response, null, 2));
        console.error('❌ Error Object:', response.error);
        console.error('❌ Metadata:', response.metadata);
        console.error('❌ Use Redirect Mode:', useRedirectMode);
        console.error('❌ Callback URL:', callbackUrl);
        console.error('❌ ========================================================');
        
        const errorMessage = response.error?.description || response.error?.reason || 'Payment failed. Please try again.';
        
        // Store failure info for debugging
        try {
          localStorage.setItem('payment_failure', JSON.stringify({
            error: response.error,
            metadata: response.metadata,
            timestamp: Date.now()
          }));
          console.log('💾 Stored payment failure info');
        } catch (e) {
          console.warn('Could not store payment failure info:', e);
        }
        
        // CRITICAL: For WebView, we MUST redirect to callback so backend can log the failure
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
            try {
              window.location.href = errorCallbackUrl.toString();
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

      // Create order
      const order = await this.createOrder(
        bookingData.pricing.totalAmount,
        `booking_${Date.now()}`,
        {
          description: 'Service booking payment',
          customer_email: bookingData.customer.email,
          customer_phone: bookingData.customer.phone
        }
      );

      // Build callback URL for redirect mode (WebView)
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      let callbackUrl = useRedirectMode 
        ? `${apiBase}/payment/razorpay-callback`
        : undefined;
      
      // Pre-populate callback URL with order_id and booking ID for WebView
      if (useRedirectMode && callbackUrl && order.orderId) {
        try {
          const callbackUrlObj = new URL(callbackUrl);
          callbackUrlObj.searchParams.set('razorpay_order_id', order.orderId);
          callbackUrlObj.searchParams.set('order_id', order.orderId);
          callbackUrl = callbackUrlObj.toString();
          console.log('✅ Pre-populated callback URL with order_id for booking');
        } catch (e) {
          console.warn('⚠️ Error pre-populating callback URL:', e);
        }
      }

      // Razorpay options
      const options: any = {
        key: this.razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'Fixfly',
        description: 'Service Booking Payment',
        order_id: order.orderId,
        prefill: {
          name: bookingData.customer.name,
          email: bookingData.customer.email,
          contact: bookingData.customer.phone,
        },
        notes: {
          payment_type: 'service_payment',
          isWebView: useRedirectMode ? 'true' : 'false',
        },
        theme: {
          color: '#3B82F6',
        },
        // CRITICAL: For WebView, use callback_url instead of handler
        callback_url: useRedirectMode ? callbackUrl : undefined,
        handler: useRedirectMode ? undefined : async (response: PaymentResponse) => {
          try {
            // Create booking with payment verification
            const bookingResponse = await this.createBookingWithPayment(bookingData, response);
            onSuccess(bookingResponse);
          } catch (error) {
            console.error('Error creating booking with payment:', error);
            onFailure(error);
          }
        },
        modal: {
          ondismiss: onClose,
          escape: true,
          animation: true,
          backdropclose: true,
        },
        // WebView specific options
        retry: {
          enabled: true,
          max_count: 3,
        },
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
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      
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
            timestamp: Date.now()
          }));
          console.log('💾 Stored booking payment info in localStorage for callback handling');
        } catch (e) {
          console.warn('⚠️ Could not store payment info:', e);
        }

        // Add payment event listeners for WebView
        razorpay.on('payment.success', (response: any) => {
          console.log('✅ ========== PAYMENT.SUCCESS EVENT FIRED (Booking - WebView) ==========');
          console.log('✅ Response:', JSON.stringify(response, null, 2));
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
          } catch (e) {
            console.error('❌ Error storing payment response:', e);
          }
        });

        razorpay.on('payment.failed', (response: any) => {
          console.error('❌ ========== PAYMENT.FAILED EVENT FIRED (Booking - WebView) ==========');
          console.error('❌ Response:', JSON.stringify(response, null, 2));
          console.error('❌ ============================================================');
          
          const errorMessage = response.error?.description || response.error?.reason || 'Payment failed. Please try again.';
          
          // Redirect to callback with error
          if (callbackUrl) {
            try {
              const errorCallbackUrl = new URL(callbackUrl);
              errorCallbackUrl.searchParams.set('error', 'payment_failed');
              errorCallbackUrl.searchParams.set('error_message', encodeURIComponent(errorMessage));
              errorCallbackUrl.searchParams.set('payment_failed', 'true');
              if (response.error?.metadata?.payment_id) {
                errorCallbackUrl.searchParams.set('razorpay_payment_id', response.error.metadata.payment_id);
              }
              if (order.orderId) {
                errorCallbackUrl.searchParams.set('razorpay_order_id', order.orderId);
              }
              
              window.location.href = errorCallbackUrl.toString();
            } catch (e) {
              console.error('❌ Error redirecting to error callback:', e);
              onFailure(new Error(errorMessage));
            }
          } else {
            onFailure(new Error(errorMessage));
          }
        });
      }
      
      console.log('🎯 ========== OPENING RAZORPAY CHECKOUT (BOOKING) ==========');
      console.log('🎯 Order ID:', order.orderId);
      console.log('🎯 Amount:', order.amount, 'paise (₹' + (order.amount / 100).toFixed(2) + ')');
      console.log('🎯 Callback URL:', callbackUrl);
      console.log('🎯 Use Redirect Mode:', useRedirectMode);
      console.log('🎯 Is APK/WebView:', isAPK);
      console.log('🎯 ===============================================');
      
      // For WebView, ensure Razorpay opens properly
      try {
        razorpay.open();
        console.log('✅ Razorpay checkout opened successfully (Booking)');
        
        // For WebView, add a check to ensure modal opened
        if (useRedirectMode) {
          setTimeout(() => {
            // Check if Razorpay modal is visible (might not work in all WebViews)
            const razorpayModal = document.querySelector('.razorpay-container, .razorpay-checkout-frame');
            if (!razorpayModal) {
              console.warn('⚠️ Razorpay modal might not be visible in WebView. Payment will proceed via callback_url.');
            } else {
              console.log('✅ Razorpay modal is visible');
            }
          }, 1000);
        }
      } catch (openError) {
        console.error('❌ Error opening Razorpay checkout:', openError);
        onFailure(new Error('Failed to open payment gateway. Please try again.'));
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
        console.error('Backend returned error:', {
          message: data.message,
          error: data.error,
          fullResponse: data
        });
        throw new Error(data.message || 'Failed to create booking');
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
