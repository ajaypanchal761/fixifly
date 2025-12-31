import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, Smartphone, Building2, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

const Payment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get payment data from localStorage
    const storedPaymentData = localStorage.getItem('paymentData');
    if (storedPaymentData) {
      try {
        const data = JSON.parse(storedPaymentData);
        setPaymentData(data);
      } catch (error) {
        setError('Invalid payment data');
      }
    } else {
      setError('No payment data found');
    }
  }, []);

  // Detect mobile webview
  const isMobileWebView = () => {
    try {
      const userAgent = navigator.userAgent || '';
      const isWebView = /wv|WebView/i.test(userAgent);
      const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      return isWebView || isStandalone || isIOSStandalone || isMobileDevice;
    } catch {
      return false;
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.Razorpay) {
          console.log('✅ Razorpay script loaded');
          resolve(true);
        } else {
          console.warn('⚠️ Script loaded but window.Razorpay not available');
          resolve(false);
        }
      };
      script.onerror = () => {
        console.error('❌ Failed to load Razorpay script');
        resolve(false);
      };

      if (document.head) {
        document.head.appendChild(script);
      } else if (document.body) {
        document.body.appendChild(script);
      } else {
        resolve(false);
      }
    });
  };

  const handlePayment = async () => {
    if (!paymentData) return;

    setLoading(true);
    setError(null);

    try {
      const isMobile = isMobileWebView();
      console.log('💳 Processing payment, isMobile:', isMobile);

      // Load Razorpay script with retry for mobile
      let res = await loadRazorpayScript();
      if (!res && isMobile) {
        // Retry for mobile
        console.log('📱 Retrying Razorpay script load for mobile...');
        await new Promise(r => setTimeout(r, 1000));
        res = await loadRazorpayScript();
      }

      if (!res || !window.Razorpay) {
        throw new Error('Razorpay payment gateway failed to load. Please check your internet connection and try again.');
      }

      // Create order on backend
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          amount: paymentData.amount, // Amount in rupees, backend will convert to paise
          currency: 'INR',
          receipt: `receipt_${paymentData.ticketId}_${Date.now()}`,
          notes: {
            ticketId: paymentData.ticketId,
            type: paymentData.type,
            description: paymentData.description
          }
        })
      });

      const orderData = await orderResponse.json();
      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      // Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_RmLDP4W1dPgg6J', // Use environment variable or fallback to live key
        amount: orderData.data.amount, // Use amount from order response (already in paise)
        currency: 'INR',
        name: 'FixFly',
        description: paymentData.description,
        order_id: orderData.data.id,
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                ticketId: paymentData.ticketId,
                amount: paymentData.amount
              })
            });

            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              // Payment successful
              localStorage.removeItem('paymentData');
              navigate('/support', { state: { paymentSuccess: true } });
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#3B82F6'
        },
        retry: {
          enabled: true,
        },
        // @ts-ignore
        webview_intent: true,
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        },
        // UPI app detection and QR code configuration for mobile APK
        // For Android WebView/APK, UPI apps (PhonePe, Google Pay, Paytm) are auto-detected
        config: {
          display: {
            blocks: {
              qr: {
                name: "UPI QR",
                instruments: [
                  {
                    method: "upi",
                    flows: ["qr"],
                  },
                ],
              },
              upi_apps: {
                name: "UPI Apps",
                instruments: [
                  {
                    method: "upi",
                  },
                ],
              },
              banks: {
                name: "Other Payment Methods",
                instruments: [
                  {
                    method: "upi",
                    flows: ["collect"],
                  },
                  {
                    method: "card",
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
            sequence: ["block.qr", "block.upi_apps", "block.banks"],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
      };

      // Check if Razorpay is available
      if (!window.Razorpay) {
        throw new Error('Payment gateway not available. Please refresh the page.');
      }

      try {
        const rzp = new window.Razorpay(options);

        // Add error handler for mobile
        if (rzp.on) {
          rzp.on('payment.failed', function (response: any) {
            console.error('❌ Razorpay payment failed:', response);
            setError('Payment failed. Please try again.');
          });
        }

        rzp.open();
        console.log('✅ Razorpay checkout opened');
      } catch (openError) {
        console.error('❌ Error opening Razorpay checkout:', openError);
        throw new Error(`Failed to open payment gateway: ${openError}`);
      }

    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (error && !paymentData) {
    return (
      <div className="min-h-screen pt-16 bg-secondary/30 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Payment Error</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button onClick={() => navigate('/support')} className="w-full">
                Back to Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen pt-16 bg-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-secondary/30">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Complete Payment</CardTitle>
              <CardDescription>
                Secure payment powered by Razorpay
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Payment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Ticket ID:</span>
                    <span className="font-medium">{paymentData.ticketId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Description:</span>
                    <span className="font-medium">{paymentData.description}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total Amount:</span>
                    <span className="text-blue-600">₹{paymentData.amount}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4">
                <h3 className="font-semibold">Payment Methods</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium">Credit/Debit Card</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                    <Smartphone className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium">UPI</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm font-medium">Net Banking</p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Payment Button */}
              <Button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  `Pay ₹${paymentData.amount}`
                )}
              </Button>

              {/* Security Note */}
              <div className="text-center text-sm text-muted-foreground">
                <p>🔒 Your payment is secured by Razorpay</p>
                <p>All transactions are encrypted and secure</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Payment;
