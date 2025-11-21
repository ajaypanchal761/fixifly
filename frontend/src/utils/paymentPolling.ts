/**
 * Payment Polling Utility
 * Polls for payment status when redirect fails in WebView
 */

interface PaymentPollingOptions {
  paymentId: string;
  bookingId?: string;
  ticketId?: string;
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
  maxAttempts?: number;
  interval?: number;
  timeout?: number;
}

/**
 * Poll for payment status
 */
export const pollPaymentStatus = (options: PaymentPollingOptions): (() => void) => {
  const {
    paymentId,
    bookingId,
    ticketId,
    onSuccess,
    onError,
    maxAttempts = 100, // 5 minutes at 3 second intervals
    interval = 3000, // 3 seconds
    timeout = 5 * 60 * 1000 // 5 minutes total
  } = options;

  let attempts = 0;
  let isCancelled = false;

  const poll = async () => {
    if (isCancelled) return;

    try {
      attempts++;

      // Verify payment
      const verifyData: any = {
        razorpay_payment_id: paymentId,
      };

      if (bookingId) {
        verifyData.bookingId = bookingId;
      }
      if (ticketId) {
        verifyData.ticketId = ticketId;
      }

      const verifyResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment/verify-by-id`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          },
          body: JSON.stringify(verifyData)
        }
      );

      const verifyResult = await verifyResponse.json();

      if (verifyResult.success) {
        console.log('✅ Payment verified via polling:', {
          paymentId,
          attempts,
          bookingId,
          ticketId
        });
        onSuccess(verifyResult.data);
        return; // Stop polling
      }

      // If max attempts reached, stop polling
      if (attempts >= maxAttempts) {
        console.warn('⚠️ Payment polling max attempts reached:', attempts);
        onError('Payment verification timeout. Please check your payment status manually.');
        return;
      }

      // Continue polling
      if (!isCancelled) {
        setTimeout(poll, interval);
      }
    } catch (error: any) {
      console.error('❌ Payment polling error:', error);
      
      // If max attempts reached, stop polling
      if (attempts >= maxAttempts) {
        onError(error.message || 'Payment verification failed. Please contact support.');
        return;
      }

      // Continue polling on error (might be temporary network issue)
      if (!isCancelled) {
        setTimeout(poll, interval);
      }
    }
  };

  // Start polling
  poll();

  // Set timeout to stop polling
  const timeoutId = setTimeout(() => {
    if (!isCancelled) {
      console.warn('⚠️ Payment polling timeout reached');
      onError('Payment verification timeout. Please check your payment status manually.');
      isCancelled = true;
    }
  }, timeout);

  // Return cancel function
  return () => {
    isCancelled = true;
    clearTimeout(timeoutId);
    console.log('🛑 Payment polling cancelled');
  };
};

/**
 * Check if payment polling should be enabled
 */
export const shouldEnablePolling = (): boolean => {
  try {
    // Enable polling in WebView/APK context
    const userAgent = navigator.userAgent || '';
    const isWebView = /wv|WebView|flutter|Flutter/i.test(userAgent);
    const hasFlutter = (window as any).flutter_inappwebview !== undefined;
    
    return isWebView || hasFlutter;
  } catch (error) {
    return false;
  }
};

