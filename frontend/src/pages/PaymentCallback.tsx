import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isRunningInFlutterWebView, navigateInMobileApp } from '@/utils/mobileAppBridge';
import { pollPaymentStatus, shouldEnablePolling } from '@/utils/paymentPolling';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing payment...');
  const verificationStarted = useRef(false);

  useEffect(() => {
    const processPaymentCallback = async () => {
      // Prevent duplicate verification
      if (verificationStarted.current) {
        console.log('⚠️ Payment verification already in progress, skipping duplicate request');
        return;
      }
      verificationStarted.current = true;

      try {
        // Check for error parameters
        const error = searchParams.get('error');
        const errorMessage = searchParams.get('error_message');
        const paymentFailed = searchParams.get('payment_failed');

        if (error || paymentFailed) {
          console.error('❌ Payment error from backend:', errorMessage);
          setStatus('error');
          const finalMessage = errorMessage || 
                              (error === 'payment_failed' ? 'Payment was declined. Please try again or use a different payment method.' : null) ||
                              'Payment processing failed. Please contact support.';
          setMessage(finalMessage);
          
          // Mark payment as failed in backend
          const bookingId = searchParams.get('booking_id');
          const ticketId = searchParams.get('ticket_id');
          
          if (bookingId || ticketId) {
            try {
              fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment/mark-failed`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('userToken')}`
                  },
                  body: JSON.stringify({
                    bookingId: bookingId || undefined,
                    ticketId: ticketId || undefined,
                    reason: finalMessage || 'Payment failed'
                  })
                }
              ).catch(err => console.error('Error marking payment as failed:', err));
            } catch (markFailedError) {
              console.error('❌ Error marking payment as failed:', markFailedError);
            }
          }
          
          // Redirect after showing error
          setTimeout(() => {
            const bookingId = searchParams.get('booking_id');
            const ticketId = searchParams.get('ticket_id');
            if (bookingId) {
              navigate('/bookings', { state: { paymentFailed: true, bookingId } });
            } else if (ticketId) {
              navigate('/support', { state: { paymentFailed: true, ticketId } });
            } else {
              navigate('/');
            }
          }, 3000);
          return;
        }

        // Extract payment details from URL parameters
        let razorpay_order_id = searchParams.get('razorpay_order_id') ||
                                searchParams.get('order_id') ||
                                searchParams.get('razorpayOrderId');
        
        let razorpay_payment_id = searchParams.get('razorpay_payment_id') ||
                                  searchParams.get('payment_id') ||
                                  searchParams.get('razorpayPaymentId');
        
        let razorpay_signature = searchParams.get('razorpay_signature') ||
                                 searchParams.get('signature');
        
        const bookingId = searchParams.get('booking_id');
        const ticketId = searchParams.get('ticket_id');

        // Try multiple fallback methods if payment data is missing (WebView scenario)
        if ((!razorpay_order_id || !razorpay_payment_id) && !razorpay_signature) {
          try {
            // Method 1: Try localStorage (primary fallback)
            const storedResponse = JSON.parse(localStorage.getItem('payment_response') || '{}');
            if (storedResponse.razorpay_order_id) {
              razorpay_order_id = razorpay_order_id || storedResponse.razorpay_order_id;
              razorpay_payment_id = razorpay_payment_id || storedResponse.razorpay_payment_id;
              razorpay_signature = razorpay_signature || storedResponse.razorpay_signature;
              if (storedResponse.bookingId && !bookingId) {
                // bookingId will be used from storedResponse
              }
              if (storedResponse.ticketId && !ticketId) {
                // ticketId will be used from storedResponse
              }
              console.log('✅ Retrieved payment data from localStorage');
            }
            
            // Method 2: Try sessionStorage (backup)
            if ((!razorpay_order_id || !razorpay_payment_id) && !razorpay_signature) {
              try {
                const sessionResponse = JSON.parse(sessionStorage.getItem('payment_response') || '{}');
                if (sessionResponse.razorpay_order_id) {
                  razorpay_order_id = razorpay_order_id || sessionResponse.razorpay_order_id;
                  razorpay_payment_id = razorpay_payment_id || sessionResponse.razorpay_payment_id;
                  razorpay_signature = razorpay_signature || sessionResponse.razorpay_signature;
                  console.log('✅ Retrieved payment data from sessionStorage');
                }
              } catch (e) {
                console.warn('⚠️ Could not retrieve from sessionStorage:', e);
              }
            }
            
            // Method 3: Try pending_payment from localStorage
            if ((!razorpay_order_id || !razorpay_payment_id) && !razorpay_signature) {
              const storedPayment = JSON.parse(localStorage.getItem('pending_payment') || '{}');
            if (storedPayment.orderId && !razorpay_order_id) {
              razorpay_order_id = storedPayment.orderId;
            }
            }
          } catch (e) {
            console.warn('⚠️ Could not retrieve payment info from storage:', e);
          }
        }
        
        // Method 4: If still missing order_id but have payment_id, fetch from API (last resort)
        if (!razorpay_order_id && razorpay_payment_id) {
          try {
            console.log('🔍 Order ID missing, fetching payment details from API...');
            const paymentDetailsResponse = await fetch(
              `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment/${razorpay_payment_id}`
            );
            
            if (paymentDetailsResponse.ok) {
              const paymentDetails = await paymentDetailsResponse.json();
              if (paymentDetails.success && paymentDetails.data && paymentDetails.data.order_id) {
                razorpay_order_id = paymentDetails.data.order_id;
                console.log('✅ Retrieved order ID from API:', razorpay_order_id);
              }
            }
          } catch (e) {
            console.warn('⚠️ Could not fetch payment details from API:', e);
          }
        }
        
        // Method 5: Listen for payment callback from Flutter (if in WebView)
        if (isRunningInFlutterWebView() && (!razorpay_order_id || !razorpay_payment_id)) {
          try {
            // Set up listener for Flutter messages
            const messageHandler = (event: MessageEvent) => {
              if (event.data && event.data.type === 'paymentCallback') {
                const data = event.data;
                if (data.razorpay_order_id && !razorpay_order_id) {
                  razorpay_order_id = data.razorpay_order_id;
                }
                if (data.razorpay_payment_id && !razorpay_payment_id) {
                  razorpay_payment_id = data.razorpay_payment_id;
                }
                if (data.razorpay_signature && !razorpay_signature) {
                  razorpay_signature = data.razorpay_signature;
                }
                console.log('✅ Received payment data from Flutter via postMessage');
                window.removeEventListener('message', messageHandler);
              }
            };
            
            window.addEventListener('message', messageHandler);
            
            // Also check if Flutter has already sent data via global handler
            if ((window as any).onPaymentCallback) {
              try {
                const flutterData = (window as any).onPaymentCallback;
                if (flutterData.razorpay_order_id) razorpay_order_id = razorpay_order_id || flutterData.razorpay_order_id;
                if (flutterData.razorpay_payment_id) razorpay_payment_id = razorpay_payment_id || flutterData.razorpay_payment_id;
                if (flutterData.razorpay_signature) razorpay_signature = razorpay_signature || flutterData.razorpay_signature;
                console.log('✅ Retrieved payment data from Flutter global handler');
              } catch (e) {
                console.warn('⚠️ Error reading Flutter global handler:', e);
              }
            }
            
            // Cleanup listener after 5 seconds
            setTimeout(() => {
              window.removeEventListener('message', messageHandler);
            }, 5000);
          } catch (e) {
            console.warn('⚠️ Error setting up Flutter message listener:', e);
          }
        }

        if (!razorpay_order_id || !razorpay_payment_id) {
          console.error('❌ Missing payment details - cannot proceed with verification');
          setStatus('error');
          setMessage('Payment verification failed: Missing payment details. Please contact support.');
          return;
        }

        // Verify payment with backend
        const verifyData: any = {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature: razorpay_signature || undefined,
        };

        if (bookingId) {
          verifyData.bookingId = bookingId;
        }
        if (ticketId) {
          verifyData.ticketId = ticketId;
        }

        console.log('📤 Verifying payment with backend:', {
          razorpay_order_id,
          razorpay_payment_id,
          has_signature: !!razorpay_signature,
          bookingId,
          ticketId
        });

        const verifyResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('userToken')}`
          },
          body: JSON.stringify(verifyData)
        });

        let verifyResult = await verifyResponse.json();

        // If verification failed and we have payment_id, try verify-by-id endpoint (fallback for WebView)
        if (!verifyResult.success && razorpay_payment_id) {
          console.log('⚠️ Primary verification failed, trying verify-by-id endpoint...');
          try {
            const verifyByIdResponse = await fetch(
              `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment/verify-by-id`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('userToken')}`
                },
                body: JSON.stringify({
                  razorpay_payment_id,
                  bookingId: bookingId || undefined,
                  ticketId: ticketId || undefined
                })
              }
            );
            
            const verifyByIdResult = await verifyByIdResponse.json();
            if (verifyByIdResult.success) {
              console.log('✅ Payment verified via verify-by-id endpoint');
              verifyResult = verifyByIdResult;
            } else {
              console.warn('⚠️ Verify-by-id also failed:', verifyByIdResult.message);
              
              // If in WebView and verification failed, start polling
              if (shouldEnablePolling() && razorpay_payment_id) {
                console.log('🔄 Starting payment polling in WebView...');
                setMessage('Payment is being processed. Please wait...');
                
                const cancelPolling = pollPaymentStatus({
                  paymentId: razorpay_payment_id,
                  bookingId: bookingId || undefined,
                  ticketId: ticketId || undefined,
                  onSuccess: (data) => {
                    console.log('✅ Payment verified via polling');
                    setStatus('success');
                    setMessage('Payment successful! Your transaction has been completed.');
                    
                    // Clear stored payment data
                    try {
                      localStorage.removeItem('pending_payment');
                      localStorage.removeItem('payment_response');
                      sessionStorage.removeItem('payment_response');
                    } catch (e) {
                      console.warn('⚠️ Could not clear stored payment info:', e);
                    }
                    
                    // Redirect after success
                    setTimeout(() => {
                      if (isRunningInFlutterWebView()) {
                        if (bookingId) {
                          const navigated = navigateInMobileApp('/bookings');
                          if (!navigated) {
                            navigate('/bookings', { state: { paymentSuccess: true, bookingId } });
                          }
                        } else if (ticketId) {
                          const navigated = navigateInMobileApp('/support');
                          if (!navigated) {
                            navigate('/support', { state: { paymentSuccess: true, ticketId } });
                          }
                        } else {
                          navigate('/');
                        }
                      } else {
                        if (bookingId) {
                          navigate('/bookings', { state: { paymentSuccess: true, bookingId } });
                        } else if (ticketId) {
                          navigate('/support', { state: { paymentSuccess: true, ticketId } });
                        } else {
                          navigate('/');
                        }
                      }
                    }, 2000);
                  },
                  onError: (error) => {
                    console.error('❌ Payment polling failed:', error);
                    setStatus('error');
                    setMessage(error || 'Payment verification failed. Please contact support.');
                    
                    // Mark payment as failed in backend
                    try {
                      fetch(
                        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment/mark-failed`,
                        {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('userToken')}`
                          },
                          body: JSON.stringify({
                            bookingId: bookingId || undefined,
                            ticketId: ticketId || undefined,
                            reason: error || 'Payment verification failed after polling'
                          })
                        }
                      ).catch(err => console.error('Error marking payment as failed:', err));
                    } catch (markFailedError) {
                      console.error('❌ Error marking payment as failed:', markFailedError);
                    }
                    
                    // Redirect after error
                    setTimeout(() => {
                      if (bookingId) {
                        navigate('/bookings', { state: { paymentFailed: true, bookingId } });
                      } else if (ticketId) {
                        navigate('/support', { state: { paymentFailed: true, ticketId } });
                      } else {
                        navigate('/');
                      }
                    }, 3000);
                  }
                });
                
                // Store cancel function for cleanup
                return () => {
                  cancelPolling();
                };
              }
            }
          } catch (fallbackError) {
            console.error('❌ Error in verify-by-id fallback:', fallbackError);
          }
        }

        if (verifyResult.success) {
          console.log('✅ Payment verified successfully');
          
        // CRITICAL: Check if this is a new booking from checkout (WebView scenario)
        // If there's pending booking data in localStorage, create the booking now
        let createdBookingId = bookingId;
        try {
          const pendingPayment = JSON.parse(localStorage.getItem('pending_payment') || '{}');
          if (pendingPayment.type === 'booking' && pendingPayment.bookingData && !bookingId) {
            console.log('📋 Detected pending booking from checkout - creating booking now...');
            console.log('📋 Pending payment data:', {
              type: pendingPayment.type,
              orderId: pendingPayment.orderId,
              hasBookingData: !!pendingPayment.bookingData
            });
            
            try {
              // Validate payment data before creating booking
              if (!razorpay_payment_id) {
                throw new Error('Payment ID is missing - cannot create booking');
              }
              
              // Create booking with payment verification
              const bookingResponse = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/with-payment`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    ...pendingPayment.bookingData,
                    paymentData: {
                      razorpayOrderId: razorpay_order_id,
                      razorpayPaymentId: razorpay_payment_id,
                      razorpaySignature: razorpay_signature,
                    }
                  })
                }
              );
              
              // Check if response is OK
              if (!bookingResponse.ok) {
                const errorText = await bookingResponse.text();
                console.error('❌ Booking creation failed - HTTP Error:', {
                  status: bookingResponse.status,
                  statusText: bookingResponse.statusText,
                  error: errorText
                });
                throw new Error(`Booking creation failed: ${bookingResponse.statusText}`);
              }
              
              const bookingResult = await bookingResponse.json();
              
              if (bookingResult.success && bookingResult.data) {
                createdBookingId = bookingResult.data.booking?._id || bookingResult.data.bookingId;
                console.log('✅ Booking created successfully from payment callback:', {
                  bookingId: createdBookingId,
                  bookingReference: bookingResult.data.bookingReference
                });
                setMessage(`Payment successful! Booking #${bookingResult.data.bookingReference} has been confirmed.`);
              } else {
                console.error('❌ Failed to create booking:', bookingResult.message);
                // Payment is verified but booking creation failed - this is a critical error
                const errorMsg = bookingResult.message || 'Booking creation failed';
                setMessage(`Payment successful but booking creation failed: ${errorMsg}. Please contact support with Payment ID: ${razorpay_payment_id}`);
              }
            } catch (bookingError: any) {
              console.error('❌ Error creating booking from callback:', bookingError);
              const errorMsg = bookingError.message || 'Unknown error';
              setMessage(`Payment successful but booking creation failed: ${errorMsg}. Please contact support with Payment ID: ${razorpay_payment_id}`);
            }
          }
        } catch (e) {
          console.warn('⚠️ Could not check for pending booking:', e);
        }
          
          setStatus('success');
          if (!createdBookingId && !bookingId && !ticketId) {
            setMessage('Payment successful! Your transaction has been completed.');
          }

          // Clear stored payment data
          try {
            localStorage.removeItem('pending_payment');
            localStorage.removeItem('payment_response');
            sessionStorage.removeItem('payment_response');
            console.log('🧹 Cleared stored payment info');
          } catch (e) {
            console.warn('⚠️ Could not clear stored payment info:', e);
          }

          // Redirect after success
          const redirectTo = () => {
            // Use createdBookingId if available (from pending booking creation)
            const finalBookingId = createdBookingId || bookingId;
            
            if (isRunningInFlutterWebView()) {
              if (finalBookingId) {
                const navigated = navigateInMobileApp('/bookings');
                if (!navigated) {
                  navigate('/bookings', { state: { paymentSuccess: true, bookingId: finalBookingId } });
                }
              } else if (ticketId) {
                const navigated = navigateInMobileApp('/support');
                if (!navigated) {
                  navigate('/support', { state: { paymentSuccess: true, ticketId } });
                }
              } else {
                navigate('/');
              }
            } else {
              if (finalBookingId) {
                navigate('/bookings', { state: { paymentSuccess: true, bookingId: finalBookingId } });
              } else if (ticketId) {
                navigate('/support', { state: { paymentSuccess: true, ticketId } });
              } else {
                navigate('/');
              }
            }
          };

          // Try immediately if in WebView, otherwise wait 2 seconds
          if (isRunningInFlutterWebView()) {
            setTimeout(redirectTo, 100);
            setTimeout(redirectTo, 2000);
          } else {
            setTimeout(redirectTo, 2000);
          }
        } else {
          console.error('❌ Payment verification failed:', verifyResult.message);
          setStatus('error');
          setMessage(verifyResult.message || 'Payment verification failed. Please contact support.');
          
          // Mark payment as failed in backend
          try {
            const markFailedResponse = await fetch(
              `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment/mark-failed`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('userToken')}`
                },
                body: JSON.stringify({
                  bookingId: bookingId || undefined,
                  ticketId: ticketId || undefined,
                  reason: verifyResult.message || 'Payment verification failed'
                })
              }
            );
            
            if (markFailedResponse.ok) {
              console.log('✅ Payment marked as failed in backend');
            }
          } catch (markFailedError) {
            console.error('❌ Error marking payment as failed:', markFailedError);
          }
          
          // Redirect to bookings page after showing error
          setTimeout(() => {
            if (bookingId) {
              navigate('/bookings', { state: { paymentFailed: true, bookingId } });
            } else if (ticketId) {
              navigate('/support', { state: { paymentFailed: true, ticketId } });
            } else {
              navigate('/');
            }
          }, 3000);
        }
      } catch (error: any) {
        console.error('❌ Payment callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Payment processing failed. Please contact support.');
        
        // Mark payment as failed in backend
        const bookingId = searchParams.get('booking_id');
        const ticketId = searchParams.get('ticket_id');
        
        if (bookingId || ticketId) {
          try {
            fetch(
              `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment/mark-failed`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('userToken')}`
                },
                body: JSON.stringify({
                  bookingId: bookingId || undefined,
                  ticketId: ticketId || undefined,
                  reason: error.message || 'Payment processing error'
                })
              }
            ).catch(err => console.error('Error marking payment as failed:', err));
          } catch (markFailedError) {
            console.error('❌ Error marking payment as failed:', markFailedError);
          }
        }
        
        // Redirect after error
        setTimeout(() => {
          if (bookingId) {
            navigate('/bookings', { state: { paymentFailed: true, bookingId } });
          } else if (ticketId) {
            navigate('/support', { state: { paymentFailed: true, ticketId } });
          } else {
            navigate('/');
          }
        }, 3000);
      }
    };

    processPaymentCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen pt-16 bg-secondary/30 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {status === 'processing' && 'Processing Payment'}
            {status === 'success' && 'Payment Successful'}
            {status === 'error' && 'Payment Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Please wait while we verify your payment...'}
            {status === 'success' && 'Your payment has been processed successfully'}
            {status === 'error' && 'There was an issue processing your payment'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-6">
            {status === 'processing' && (
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-muted-foreground">{message}</p>
            </div>

            {status === 'error' && (
              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    const bookingId = searchParams.get('booking_id');
                    const ticketId = searchParams.get('ticket_id');
                    if (bookingId) {
                      navigate('/bookings', { state: { paymentFailed: true, bookingId } });
                    } else if (ticketId) {
                      navigate('/support', { state: { paymentFailed: true, ticketId } });
                    } else {
                      navigate('/');
                    }
                  }} 
                  className="w-full"
                >
                  Go to Bookings
                </Button>
                <Button 
                  onClick={() => navigate('/')} 
                  variant="outline" 
                  className="w-full"
                >
                Go to Home
              </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;

