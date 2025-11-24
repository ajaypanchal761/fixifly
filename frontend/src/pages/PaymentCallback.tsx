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
      console.log('📱 ========== STEP 1: PAYMENT CALLBACK PAGE LOADED ==========');
      console.log('📱 Current URL:', window.location.href);
      console.log('📱 Search Params:', window.location.search);
      console.log('📱 Timestamp:', new Date().toISOString());
      console.log('📱 ===================================================');
      
      // Prevent duplicate verification
      if (verificationStarted.current) {
        console.log('⚠️ Payment verification already in progress, skipping duplicate request');
        return;
      }
      verificationStarted.current = true;

      try {
        console.log('📋 ========== STEP 2: EXTRACTING URL PARAMETERS ==========');
        // Check for error parameters
        const error = searchParams.get('error');
        const errorMessage = searchParams.get('error_message');
        const paymentFailed = searchParams.get('payment_failed');
        console.log('📋 Error:', error || 'NONE');
        console.log('📋 Error Message:', errorMessage || 'NONE');
        console.log('📋 Payment Failed:', paymentFailed || 'NONE');

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

        console.log('📋 ========== STEP 3: EXTRACTING PAYMENT DATA FROM URL ==========');
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
        
        console.log('📋 Order ID (from URL):', razorpay_order_id || 'MISSING');
        console.log('📋 Payment ID (from URL):', razorpay_payment_id || 'MISSING');
        console.log('📋 Signature (from URL):', razorpay_signature ? 'PRESENT' : 'MISSING');
        console.log('📋 Booking ID (from URL):', bookingId || 'MISSING');
        console.log('📋 Ticket ID (from URL):', ticketId || 'MISSING');
        console.log('📋 ===================================================');

        // CRITICAL: If payment details missing from URL, try localStorage (like RentYatra)
        // This is especially important for WebView where URL params might not be passed correctly
        if ((!razorpay_order_id || !razorpay_payment_id) && !razorpay_signature) {
          console.log('🔍 ========== STEP 4: PAYMENT DATA MISSING - TRYING FALLBACKS ==========');
          try {
            // Method 1: Try localStorage (primary fallback) - like RentYatra
            console.log('🔍 Method 1: Checking localStorage...');
            const storedResponse = JSON.parse(localStorage.getItem('payment_response') || '{}');
            if (storedResponse.razorpay_order_id || storedResponse.razorpayOrderId) {
              razorpay_order_id = razorpay_order_id || storedResponse.razorpay_order_id || storedResponse.razorpayOrderId;
              razorpay_payment_id = razorpay_payment_id || storedResponse.razorpay_payment_id || storedResponse.razorpayPaymentId;
              razorpay_signature = razorpay_signature || storedResponse.razorpay_signature || storedResponse.razorpaySignature;
              console.log('✅ ✅ ✅ Retrieved payment data from localStorage');
              console.log('✅ Order ID:', razorpay_order_id ? razorpay_order_id.substring(0, 10) + '...' : 'MISSING');
              console.log('✅ Payment ID:', razorpay_payment_id ? razorpay_payment_id.substring(0, 10) + '...' : 'MISSING');
            } else {
              console.log('⚠️ No payment data in localStorage');
            }
            
            // Method 2: Try sessionStorage (backup)
            if ((!razorpay_order_id || !razorpay_payment_id) && !razorpay_signature) {
              try {
                console.log('🔍 Method 2: Checking sessionStorage...');
                const sessionResponse = JSON.parse(sessionStorage.getItem('payment_response') || '{}');
                if (sessionResponse.razorpay_order_id || sessionResponse.razorpayOrderId) {
                  razorpay_order_id = razorpay_order_id || sessionResponse.razorpay_order_id || sessionResponse.razorpayOrderId;
                  razorpay_payment_id = razorpay_payment_id || sessionResponse.razorpay_payment_id || sessionResponse.razorpayPaymentId;
                  razorpay_signature = razorpay_signature || sessionResponse.razorpay_signature || sessionResponse.razorpaySignature;
                  console.log('✅ ✅ ✅ Retrieved payment data from sessionStorage');
                } else {
                  console.log('⚠️ No payment data in sessionStorage');
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

        // CRITICAL: For WebView/APK, payment_id is required but order_id might be missing
        // We can still verify payment using payment_id only
        if (!razorpay_payment_id) {
          console.error('❌ Missing payment ID - cannot proceed with verification');
          setStatus('error');
          setMessage('Payment verification failed: Missing payment details. Please contact support.');
          return;
        }

        // Verify payment with backend
        // CRITICAL: order_id is optional for WebView scenarios - backend will fetch it from payment
        const verifyData: any = {
          razorpay_payment_id,
          razorpay_order_id: razorpay_order_id || undefined, // Optional for WebView
          razorpay_signature: razorpay_signature || undefined,
        };

        if (bookingId) {
          verifyData.bookingId = bookingId;
        }
        if (ticketId) {
          verifyData.ticketId = ticketId;
        }

        console.log('📤 ========== STEP 5: VERIFYING PAYMENT WITH BACKEND ==========');
        console.log('📤 Order ID:', razorpay_order_id || 'MISSING');
        console.log('📤 Payment ID:', razorpay_payment_id || 'MISSING');
        console.log('📤 Has Signature:', !!razorpay_signature);
        console.log('📤 Booking ID:', bookingId || 'N/A');
        console.log('📤 Ticket ID:', ticketId || 'N/A');
        console.log('📤 API URL:', `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment/verify`);
        console.log('📤 Timestamp:', new Date().toISOString());
        console.log('📤 ===================================================');

        console.log('📤 ========== STEP 5.1: CALLING PAYMENT VERIFY API ==========');
        console.log('📤 API URL:', `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment/verify`);
        console.log('📤 Request Data:', JSON.stringify(verifyData, null, 2));
        console.log('📤 Timestamp:', new Date().toISOString());
        console.log('📤 ===================================================');
        
        const verifyResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('userToken')}`
          },
          body: JSON.stringify(verifyData)
        });

        console.log('📤 ========== STEP 5.2: PAYMENT VERIFY API RESPONSE ==========');
        console.log('📤 Response Status:', verifyResponse.status);
        console.log('📤 Response OK:', verifyResponse.ok);
        console.log('📤 Response Headers:', Object.fromEntries(verifyResponse.headers.entries()));
        console.log('📤 Timestamp:', new Date().toISOString());
        console.log('📤 ===================================================');

        const responseText = await verifyResponse.text();
        console.log('📤 Response Text (raw):', responseText);
        
        let verifyResult;
        try {
          verifyResult = JSON.parse(responseText);
          console.log('📤 Response Parsed Successfully:', JSON.stringify(verifyResult, null, 2));
        } catch (parseError) {
          console.error('❌ Error parsing response:', parseError);
          console.error('❌ Response Text:', responseText);
          throw new Error(`Payment verification failed: Invalid response from server (${verifyResponse.status})`);
        }

        // CRITICAL: If verification failed or order_id is missing, try verify-by-id endpoint (fallback for WebView)
        // This is especially important for WebView where order_id might not be in URL params
        if ((!verifyResult.success || !razorpay_order_id) && razorpay_payment_id) {
          console.log('⚠️ Primary verification failed or order_id missing, trying verify-by-id endpoint...');
          console.log('⚠️ Reason:', !verifyResult.success ? 'Verification failed' : 'Order ID missing');
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
          console.log('✅ ========== STEP 6: PAYMENT VERIFICATION SUCCESS ==========');
          console.log('✅ Payment verified successfully');
          console.log('✅ Payment ID:', razorpay_payment_id);
          console.log('✅ Order ID:', razorpay_order_id);
          console.log('✅ Verification Result:', JSON.stringify(verifyResult, null, 2));
          console.log('✅ Timestamp:', new Date().toISOString());
          console.log('✅ ===================================================');
          
          // CRITICAL: Check if this is a new booking from checkout (WebView scenario)
        // If there's pending booking data in localStorage, create the booking now
        let createdBookingId = bookingId;
        try {
          const pendingPayment = JSON.parse(localStorage.getItem('pending_payment') || '{}');
          // CRITICAL FIX: Also check if we have bookingId but no booking exists yet
          // This handles cases where payment succeeded but booking wasn't created
          const shouldCreateBooking = (pendingPayment.type === 'booking' && pendingPayment.bookingData && !bookingId) ||
                                     (pendingPayment.type === 'booking' && pendingPayment.bookingData && bookingId && !verifyResult.data?.booking);
          
          if (shouldCreateBooking) {
            console.log('📋 Detected pending booking from checkout - creating booking now...');
            console.log('📋 Pending payment data:', {
              type: pendingPayment.type,
              orderId: pendingPayment.orderId,
              hasBookingData: !!pendingPayment.bookingData,
              existingBookingId: bookingId
            });
            
            try {
              // Validate payment data before creating booking
              if (!razorpay_payment_id) {
                throw new Error('Payment ID is missing - cannot create booking');
              }
              
              // Validate booking data
              if (!pendingPayment.bookingData || !pendingPayment.bookingData.customer || !pendingPayment.bookingData.services) {
                throw new Error('Booking data is incomplete - cannot create booking');
              }
              
              console.log('📤 Creating booking with payment verification...');
              console.log('📤 Payment ID:', razorpay_payment_id);
              console.log('📤 Order ID:', razorpay_order_id);
              console.log('📤 Customer:', pendingPayment.bookingData.customer.name);
              console.log('📤 Amount:', pendingPayment.bookingData.pricing?.totalAmount);
              
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
                let errorData;
                try {
                  errorData = JSON.parse(errorText);
                } catch {
                  errorData = { message: errorText };
                }
                
                console.error('❌ Booking creation failed - HTTP Error:', {
                  status: bookingResponse.status,
                  statusText: bookingResponse.statusText,
                  error: errorData
                });
                throw new Error(errorData.message || `Booking creation failed: ${bookingResponse.statusText}`);
              }
              
              const bookingResult = await bookingResponse.json();
              
              if (bookingResult.success && bookingResult.data) {
                createdBookingId = bookingResult.data.booking?._id || bookingResult.data.bookingId;
                console.log('✅ ✅ ✅ Booking created successfully from payment callback ✅ ✅ ✅');
                console.log('✅ Booking ID:', createdBookingId);
                console.log('✅ Booking Reference:', bookingResult.data.bookingReference);
                console.log('✅ Payment ID:', razorpay_payment_id);
                console.log('✅ Order ID:', razorpay_order_id);
                setMessage(`Payment successful! Booking #${bookingResult.data.bookingReference} has been confirmed.`);
              } else {
                console.error('❌ Failed to create booking:', bookingResult.message);
                // Payment is verified but booking creation failed - this is a critical error
                const errorMsg = bookingResult.message || 'Booking creation failed';
                setStatus('error');
                setMessage(`Payment successful but booking creation failed: ${errorMsg}. Please contact support with Payment ID: ${razorpay_payment_id}`);
                
                // Don't clear pending payment on error - user might need to retry
                return;
              }
            } catch (bookingError: any) {
              console.error('❌ ❌ ❌ Error creating booking from callback ❌ ❌ ❌');
              console.error('❌ Error:', bookingError);
              console.error('❌ Error Message:', bookingError.message);
              console.error('❌ Payment ID:', razorpay_payment_id);
              console.error('❌ Order ID:', razorpay_order_id);
              
              const errorMsg = bookingError.message || 'Unknown error';
              setStatus('error');
              setMessage(`Payment successful but booking creation failed: ${errorMsg}. Please contact support with Payment ID: ${razorpay_payment_id}`);
              
              // Don't clear pending payment on error - user might need to retry
              return;
            }
          } else if (pendingPayment.type === 'booking' && !pendingPayment.bookingData) {
            console.warn('⚠️ Pending payment found but booking data is missing');
          }
        } catch (e) {
          console.error('❌ Error checking for pending booking:', e);
          console.error('❌ Error details:', e instanceof Error ? e.message : String(e));
        }
          
          setStatus('success');
          
          // Set success message based on context
          if (createdBookingId) {
            // Booking was just created
            setMessage('Payment successful! Your booking has been confirmed.');
          } else if (bookingId) {
            // Existing booking payment
            setMessage('Payment successful! Your payment has been verified and booking updated.');
          } else if (ticketId) {
            // Ticket payment
            setMessage('Payment successful! Your payment has been verified and ticket updated.');
          } else {
            // Generic success
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

