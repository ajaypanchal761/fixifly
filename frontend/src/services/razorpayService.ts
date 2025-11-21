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
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay script'));
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

      console.log('🔍 Payment context detection:', {
        isAPK,
        useRedirectMode,
        userAgent: navigator.userAgent
      });

      // Build callback URL for redirect mode
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const callbackUrl = useRedirectMode 
        ? `${apiBase}/payment/razorpay-callback`
        : undefined;
      
      console.log('🔗 Payment callback URL:', callbackUrl);
      console.log('🔗 API Base URL:', apiBase);
      console.log('🔗 Use Redirect Mode:', useRedirectMode);

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
      
      // Add payment.failed event handler for WebView
      razorpay.on('payment.failed', (response: any) => {
        console.error('❌ Razorpay payment failed:', response);
        console.error('❌ Payment failure details:', JSON.stringify(response, null, 2));
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
        
        // For WebView, redirect to callback with error
        if (useRedirectMode && callbackUrl) {
          try {
            const errorCallbackUrl = new URL(callbackUrl);
            errorCallbackUrl.searchParams.set('error', 'payment_failed');
            errorCallbackUrl.searchParams.set('error_message', errorMessage);
            errorCallbackUrl.searchParams.set('razorpay_payment_id', response.error?.metadata?.payment_id || '');
            errorCallbackUrl.searchParams.set('razorpay_order_id', response.error?.metadata?.order_id || paymentData.orderId);
            if (paymentData.bookingId) {
              errorCallbackUrl.searchParams.set('booking_id', paymentData.bookingId);
            }
            if (paymentData.ticketId) {
              errorCallbackUrl.searchParams.set('ticket_id', paymentData.ticketId);
            }
            
            console.log('🔀 Redirecting to callback with error:', errorCallbackUrl.toString());
            setTimeout(() => {
              console.log('🚀 Executing error redirect to:', errorCallbackUrl.toString());
              window.location.href = errorCallbackUrl.toString();
            }, 500);
          } catch (e) {
            console.error('❌ Error building error callback URL:', e);
            paymentData.onError(new Error(errorMessage));
          }
        } else {
          // For modal mode, call onError directly
          console.log('📞 Calling onError directly (modal mode)');
          paymentData.onError(new Error(errorMessage));
        }
      });
      
      // Add payment success logging
      console.log('🎯 Opening Razorpay checkout with options:', {
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        callbackUrl: callbackUrl,
        useRedirectMode: useRedirectMode,
        isAPK: isAPK
      });
      
      razorpay.open();
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

      // Razorpay options
      const options: RazorpayOptions = {
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
        },
        theme: {
          color: '#3B82F6',
        },
        handler: async (response: PaymentResponse) => {
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
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error processing payment:', error);
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
