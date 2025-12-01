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

  /**
   * Load Razorpay script dynamically
   */
  private async loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.Razorpay) {
        resolve();
        return;
      }

      // For mobile webview, try to load script with retry mechanism
      const isMobile = this.isMobileWebView();
      
      if (isMobile) {
        console.log('📱 Mobile webview detected, loading Razorpay with mobile configuration');
      }

      try {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.defer = true;
        
        // Add timeout for mobile
        const timeout = setTimeout(() => {
          if (!window.Razorpay) {
            console.warn('⚠️ Razorpay script loading timeout, retrying...');
            // Retry once
            const retryScript = document.createElement('script');
            retryScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
            retryScript.async = true;
            retryScript.onload = () => {
              if (window.Razorpay) {
                resolve();
              } else {
                reject(new Error('Razorpay not available after retry'));
              }
            };
            retryScript.onerror = () => reject(new Error('Failed to load Razorpay script after retry'));
            document.head.appendChild(retryScript);
          }
        }, isMobile ? 5000 : 3000);

        script.onload = () => {
          clearTimeout(timeout);
          if (window.Razorpay) {
            console.log('✅ Razorpay script loaded successfully');
            resolve();
          } else {
            reject(new Error('Razorpay script loaded but window.Razorpay is not available'));
          }
        };
        
        script.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load Razorpay script'));
        };
        
        // Append to head or body
        if (document.head) {
          document.head.appendChild(script);
        } else if (document.body) {
          document.body.appendChild(script);
        } else {
          // Wait for DOM to be ready
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
              (document.head || document.body).appendChild(script);
            });
          } else {
            (document.head || document.body).appendChild(script);
          }
        }
      } catch (error) {
        reject(new Error(`Error creating Razorpay script: ${error}`));
      }
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
    onSuccess: (response: any) => void;
    onError: (error: any) => void;
  }): Promise<void> {
    try {
      const isMobile = this.isMobileWebView();
      console.log('💳 Processing payment, isMobile:', isMobile);

      // Load Razorpay script with retry for mobile
      try {
        await this.loadRazorpayScript();
      } catch (scriptError) {
        console.error('❌ Failed to load Razorpay script:', scriptError);
        
        // For mobile, try alternative approach
        if (isMobile) {
          console.log('📱 Mobile detected, trying alternative Razorpay loading...');
          // Wait a bit and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            await this.loadRazorpayScript();
          } catch (retryError) {
            paymentData.onError(new Error('Razorpay payment gateway failed to load. Please check your internet connection and try again.'));
            return;
          }
        } else {
          paymentData.onError(new Error('Razorpay payment gateway failed to load. Please refresh the page and try again.'));
          return;
        }
      }

      // Check if Razorpay is available
      if (!window.Razorpay) {
        console.error('❌ window.Razorpay is not available');
        paymentData.onError(new Error('Payment gateway not available. Please refresh the page.'));
        return;
      }

      // Razorpay options
      const options: RazorpayOptions = {
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
          payment_type: 'service_payment',
        },
        theme: {
          color: '#3B82F6',
        },
        handler: (response: PaymentResponse) => {
          console.log('✅ Payment successful:', response);
          paymentData.onSuccess(response);
        },
        modal: {
          ondismiss: () => {
            console.log('⚠️ Payment modal dismissed by user');
            // User cancellation - don't treat as error, just call onError with a specific cancellation message
            paymentData.onError(new Error('PAYMENT_CANCELLED'));
          },
        },
        // Mobile-specific options
        ...(isMobile && {
          config: {
            display: {
              blocks: {
                banks: {
                  name: "All payment methods",
                  instruments: [
                    {
                      method: "card",
                    },
                    {
                      method: "upi",
                    },
                    {
                      method: "netbanking",
                    },
                    {
                      method: "wallet",
                    },
                  ],
                },
              },
              sequence: ["block.banks"],
              preferences: {
                show_default_blocks: true,
              },
            },
          },
        }),
      };

      console.log('💳 Opening Razorpay checkout with options:', {
        ...options,
        key: '***hidden***',
      });

      // Open Razorpay checkout
      try {
        const razorpay = new window.Razorpay(options);
        
        // Add error handler for mobile
        if (isMobile && razorpay.on) {
          razorpay.on('payment.failed', (error: any) => {
            console.error('❌ Payment failed:', error);
            paymentData.onError(new Error(error.error?.description || 'Payment failed'));
          });
        }
        
        razorpay.open();
        console.log('✅ Razorpay checkout opened');
      } catch (openError) {
        console.error('❌ Error opening Razorpay checkout:', openError);
        paymentData.onError(new Error(`Failed to open payment gateway: ${openError}`));
      }
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      paymentData.onError(error instanceof Error ? error : new Error('Unknown payment error'));
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
      const isMobile = this.isMobileWebView();
      console.log('💳 Processing booking payment, isMobile:', isMobile);

      // Load Razorpay script with retry for mobile
      try {
        await this.loadRazorpayScript();
      } catch (scriptError) {
        console.error('❌ Failed to load Razorpay script:', scriptError);
        
        // For mobile, try alternative approach
        if (isMobile) {
          console.log('📱 Mobile detected, trying alternative Razorpay loading...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            await this.loadRazorpayScript();
          } catch (retryError) {
            onFailure(new Error('Razorpay payment gateway failed to load. Please check your internet connection and try again.'));
            return;
          }
        } else {
          onFailure(new Error('Razorpay payment gateway failed to load. Please refresh the page and try again.'));
          return;
        }
      }

      // Check if Razorpay is available
      if (!window.Razorpay) {
        console.error('❌ window.Razorpay is not available');
        onFailure(new Error('Payment gateway not available. Please refresh the page.'));
        return;
      }

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
        order_id: order.orderId || order.id,
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
            console.log('✅ Payment successful:', response);
            // Create booking with payment verification
            const bookingResponse = await this.createBookingWithPayment(bookingData, response);
            onSuccess(bookingResponse);
          } catch (error) {
            console.error('Error creating booking with payment:', error);
            onFailure(error);
          }
        },
        modal: {
          ondismiss: () => {
            console.log('⚠️ Payment modal dismissed by user');
            onClose();
          },
        },
        // Mobile-specific options
        ...(isMobile && {
          config: {
            display: {
              blocks: {
                banks: {
                  name: "All payment methods",
                  instruments: [
                    {
                      method: "card",
                    },
                    {
                      method: "upi",
                    },
                    {
                      method: "netbanking",
                    },
                    {
                      method: "wallet",
                    },
                  ],
                },
              },
              sequence: ["block.banks"],
              preferences: {
                show_default_blocks: true,
              },
            },
          },
        }),
      };

      console.log('💳 Opening Razorpay checkout for booking');

      // Open Razorpay checkout
      try {
        const razorpay = new window.Razorpay(options);
        
        // Add error handler for mobile
        if (isMobile && razorpay.on) {
          razorpay.on('payment.failed', (error: any) => {
            console.error('❌ Payment failed:', error);
            onFailure(new Error(error.error?.description || 'Payment failed'));
          });
        }
        
        razorpay.open();
        console.log('✅ Razorpay checkout opened for booking');
      } catch (openError) {
        console.error('❌ Error opening Razorpay checkout:', openError);
        onFailure(new Error(`Failed to open payment gateway: ${openError}`));
      }
    } catch (error) {
      console.error('❌ Error processing booking payment:', error);
      onFailure(error instanceof Error ? error : new Error('Unknown payment error'));
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
