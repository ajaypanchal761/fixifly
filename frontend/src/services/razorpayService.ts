// Razorpay service for frontend
import { isWebView, openPaymentLink } from '@/utils/webviewUtils';

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
   * CRITICAL: In WebView, this should use payment link instead
   */
  async createOrder(amount: number, receipt: string, notes: Record<string, string> = {}): Promise<any> {
    try {
      // CRITICAL: Check for WebView before creating order
      // If WebView detected, backend will handle it, but we should warn
      const userAgent = navigator.userAgent || '';
      const isWebView = /wv/i.test(userAgent) && /Android/i.test(userAgent);
      
      if (isWebView) {
        console.warn('[RazorpayService][CreateOrder] WebView detected - Backend should redirect to payment link');
      }
      
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
      // Load Razorpay script
      await this.loadRazorpayScript();

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
          paymentData.onSuccess(response);
        },
        modal: {
          ondismiss: () => {
            // User cancellation - don't treat as error, just call onError with a specific cancellation message
            paymentData.onError(new Error('PAYMENT_CANCELLED'));
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error processing payment:', error);
      paymentData.onError(error);
    }
  }

  /**
   * Process payment for booking
   * CRITICAL: Should use payment link in WebView
   */
  async processBookingPayment(
    bookingData: BookingData,
    onSuccess: (response: any) => void,
    onFailure: (error: any) => void,
    onClose: () => void
  ): Promise<void> {
    try {
      // CRITICAL: Check for WebView - if WebView, use payment link instead
      const inWebView = isWebView();
      
      // Force WebView check if user agent has 'wv'
      const userAgent = navigator.userAgent || '';
      const forceWebView = /wv/i.test(userAgent) && /Android/i.test(userAgent);
      const finalWebViewCheck = inWebView || forceWebView;
      
      console.log('[RazorpayService][ProcessBookingPayment] WebView detection', {
        isWebView: inWebView,
        forceWebView,
        finalWebViewCheck,
        userAgent
      });
      
      if (finalWebViewCheck) {
        // WebView: Use payment link
        console.log('[RazorpayService][ProcessBookingPayment] WebView detected - using payment link');
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        
        // Note: For new bookings, we don't have bookingId yet, so we'll use a temporary approach
        // Create payment link with temporary identifier
        const paymentLinkResponse = await fetch(`${API_BASE_URL}/payment/create-payment-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: bookingData.pricing.totalAmount,
            currency: 'INR',
            description: `Payment for service: ${bookingData.services.map(s => s.serviceName).join(', ')}`,
            customer: {
              name: bookingData.customer.name,
              email: bookingData.customer.email,
              contact: bookingData.customer.phone
            },
            notes: {
              type: 'new_booking',
              description: `Payment for service: ${bookingData.services.map(s => s.serviceName).join(', ')}`,
              customer_email: bookingData.customer.email,
              customer_phone: bookingData.customer.phone
            }
          })
        });
        
        if (!paymentLinkResponse.ok) {
          throw new Error('Failed to create payment link');
        }
        
        const paymentLinkData = await paymentLinkResponse.json();
        console.log('[RazorpayService][ProcessBookingPayment] Payment link response:', paymentLinkData);
        
        if (!paymentLinkData.success) {
          console.error('[RazorpayService][ProcessBookingPayment] Payment link creation failed:', paymentLinkData);
          throw new Error(paymentLinkData.message || 'Failed to create payment link');
        }
        
        const paymentUrl = paymentLinkData.data?.paymentUrl || paymentLinkData.data?.shortUrl;
        
        if (!paymentUrl) {
          console.error('[RazorpayService][ProcessBookingPayment] No payment URL in response:', paymentLinkData);
          throw new Error('Payment link created but no URL returned');
        }
        
        console.log('[RazorpayService][ProcessBookingPayment] Opening payment link:', paymentUrl);
        console.log('[RazorpayService][ProcessBookingPayment] Payment URL type:', typeof paymentUrl);
        console.log('[RazorpayService][ProcessBookingPayment] Payment URL length:', paymentUrl?.length);
        
        // Show user feedback that payment is opening
        console.log('[RazorpayService][ProcessBookingPayment] ⚠️ Opening payment link - user should see Razorpay page now');
        
        // Open payment link
        const opened = openPaymentLink(paymentUrl);
        
        if (!opened) {
          console.error('[RazorpayService][ProcessBookingPayment] ❌ Failed to open payment link');
          // Show error to user
          onFailure(new Error('Failed to open payment link. Please try again or contact support.'));
          return;
        }
        
        console.log('[RazorpayService][ProcessBookingPayment] ✅ Payment link opened successfully - redirecting to Razorpay...');
        // Note: For new bookings, payment callback will need special handling
        // This is a limitation - new booking payments in WebView need callback handling
        console.warn('[RazorpayService][ProcessBookingPayment] Payment link opened for new booking. Callback handling needed.');
        
        // Don't call onFailure or onSuccess yet - wait for payment callback
        // The payment callback will handle success/failure
        return;
      }
      
      // Browser: Use Razorpay modal
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
