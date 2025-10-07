import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import bookingApi, { type Booking} from "@/services/bookingApi";
import jsPDF from 'jspdf';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Laptop, 
  Monitor, 
  Apple,
  Star,
  MapPin,
  Phone,
  Calendar,
  MessageCircle,
  Wrench,
  User,
  X,
  ShoppingCart,
  ArrowLeft
} from "lucide-react";

const Booking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("ongoing");
  const [cartItems, setCartItems] = useState<{id: number, title: string, price: number, image: string}[]>(location.state?.cartItems || []);
  const [totalPrice, setTotalPrice] = useState(location.state?.totalPrice || 0);
  const [showThankYou, setShowThankYou] = useState(false);
  const [newBooking, setNewBooking] = useState<Booking | null>(location.state?.booking || null);
  const [bookingReference, setBookingReference] = useState<string | null>(location.state?.bookingReference || null);
  const [fromCheckout, setFromCheckout] = useState<boolean>(location.state?.fromCheckout || false);
  
  // Real bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If coming from service page with cart items, show checkout view
  const isCheckoutView = cartItems && cartItems.length > 0;
  
  // If coming from checkout with new booking, show success view
  const isNewBookingView = newBooking && fromCheckout;

  // Download booking receipt function
  const downloadBookingReceipt = () => {
    if (!newBooking || !bookingReference) {
      toast({
        title: "Error",
        description: "Booking information not available for receipt generation.",
        variant: "destructive"
      });
      return;
    }

    // Create receipt content for PDF
    const receiptContent = `
BOOKING RECEIPT
================

Booking Reference: ${bookingReference}
Date: ${new Date().toLocaleDateString('en-IN')}
Time: ${new Date().toLocaleTimeString('en-IN')}

CUSTOMER INFORMATION
====================
Name: ${newBooking.customer.name}
Email: ${newBooking.customer.email}
Phone: ${newBooking.customer.phone}

ADDRESS
========
${newBooking.customer.address.street}
${newBooking.customer.address.city}, ${newBooking.customer.address.state}
PIN: ${newBooking.customer.address.pincode}

SERVICES BOOKED
===============
${newBooking.services.map(service => `${service.serviceName} - ₹${service.price}`).join('\n')}

PRICING SUMMARY
===============
Subtotal: ₹${newBooking.pricing.subtotal}
Service Fee: ₹${newBooking.pricing.serviceFee}
Total Amount: ₹${newBooking.pricing.totalAmount}

PAYMENT STATUS
==============
Status: Completed
Method: Card
Transaction ID: ${newBooking.payment?.transactionId || 'N/A'}

Thank you for choosing Fixfly!
For support, contact us at info@fixfly.in
    `.trim();

    // Create and download the receipt as PDF
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Fixfly</h1>
          <h2 style="color: #374151; margin: 10px 0;">BOOKING RECEIPT</h2>
          <hr style="border: 1px solid #e5e7eb;">
        </div>
        
        <div style="margin-bottom: 20px;">
          <p><strong>Booking Reference:</strong> ${bookingReference}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleTimeString('en-IN')}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">CUSTOMER INFORMATION</h3>
          <p><strong>Name:</strong> ${newBooking.customer.name}</p>
          <p><strong>Email:</strong> ${newBooking.customer.email}</p>
          <p><strong>Phone:</strong> ${newBooking.customer.phone}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">ADDRESS</h3>
          <p>${newBooking.customer.address.street}</p>
          <p>${newBooking.customer.address.city}, ${newBooking.customer.address.state}</p>
          <p>PIN: ${newBooking.customer.address.pincode}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">SERVICES BOOKED</h3>
          ${newBooking.services.map(service => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>${service.serviceName}</span>
              <span><strong>₹${service.price}</strong></span>
            </div>
          `).join('')}
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">PRICING SUMMARY</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Subtotal:</span>
            <span>₹${newBooking.pricing.subtotal}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Service Fee:</span>
            <span>₹${newBooking.pricing.serviceFee}</span>
          </div>
          <hr style="border: 1px solid #e5e7eb; margin: 10px 0;">
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #2563eb;">
            <span>Total Amount:</span>
            <span>₹${newBooking.pricing.totalAmount}</span>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">PAYMENT STATUS</h3>
          <p><strong>Status:</strong> Completed</p>
          <p><strong>Method:</strong> Card</p>
          <p><strong>Transaction ID:</strong> ${newBooking.payment?.transactionId || 'N/A'}</p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 0;">Thank you for choosing Fixfly!</p>
          <p style="color: #6b7280; margin: 5px 0;">For support, contact us at info@fixfly.in</p>
        </div>
      </div>
    `;

    // Use browser's print functionality to generate PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Fixfly Receipt - ${bookingReference}</title>
            <style>
              @media print {
                body { margin: 0; }
                @page { margin: 0.5in; }
              }
            </style>
          </head>
          <body>
            ${element.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load, then trigger print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }

    toast({
      title: "Receipt Generated",
      description: `Booking receipt for ${bookingReference} is ready for download.`,
      variant: "default"
    });
  };

  const removeFromCart = (itemId: number) => {
    const updatedCart = cartItems.filter((item) => item.id !== itemId);
    setCartItems(updatedCart);
    setTotalPrice(updatedCart.reduce((sum: number, item) => sum + item.price, 0));
  };

  // Fetch real bookings from API
  const fetchBookings = async () => {
    if (!isAuthenticated || !user?.email) {
      setError('Please login to view your bookings');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching bookings for user:', user.email);
      const response = await bookingApi.getBookingsByCustomer(user.email);
      
      console.log('Bookings API response:', response);
      
      if (response.success && response.data?.bookings) {
        console.log('Bookings found:', response.data.bookings.length);
        setBookings(response.data.bookings);
      } else {
        console.log('No bookings found or API error:', response.message);
        setError(response.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookings when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      fetchBookings();
    }
  }, [isAuthenticated, user?.email]);

  // Listen for booking updates
  useEffect(() => {
    const handleBookingUpdate = (event: any) => {
      console.log('Booking update event received, refreshing bookings...');
      console.log('Event detail:', event.detail);
      fetchBookings();
    };

    window.addEventListener('bookingUpdated', handleBookingUpdate);
    return () => {
      window.removeEventListener('bookingUpdated', handleBookingUpdate);
    };
  }, []);

  // Helper function to get GST data for a booking
  const getGSTData = (bookingId: string) => {
    try {
      const gstData = localStorage.getItem(`gst_${bookingId}`);
      if (gstData) {
        const parsed = JSON.parse(gstData);
        // Check if data is not too old (24 hours)
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed;
        } else {
          // Remove old data
          localStorage.removeItem(`gst_${bookingId}`);
        }
      }
    } catch (error) {
      console.error('Error parsing GST data:', error);
    }
    return null;
  };

  // Process real bookings data
  const processedBookings = {
    ongoing: bookings.filter(booking => {
      const isOngoing = ['pending', 'waiting_for_engineer', 'confirmed', 'in_progress'].includes(booking.status);
      console.log(`Booking ${booking._id} status: ${booking.status}, isOngoing: ${isOngoing}`);
      return isOngoing;
    }),
    completed: bookings.filter(booking => 
      booking.status === 'completed'
    ),
    cancelled: bookings.filter(booking => 
      booking.status === 'cancelled'
    )
  };
  
  console.log('Processed bookings:', {
    total: bookings.length,
    ongoing: processedBookings.ongoing.length,
    completed: processedBookings.completed.length,
    cancelled: processedBookings.cancelled.length
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
      case "waiting_for_engineer":
      case "confirmed":
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string, booking?: any) => {
    // If vendor is assigned, show "assigned" regardless of status
    if (booking && booking.vendor && booking.vendor.vendorId && typeof booking.vendor.vendorId === 'object') {
      return "Assigned";
    }
    
    switch (status) {
      case "pending":
        return "Pending";
      case "waiting_for_engineer":
        return "Wait for Engineer Assign";
      case "confirmed":
        return "Confirmed";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (amount: number) => {
    return `₹${amount}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "waiting_for_engineer":
      case "confirmed":
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  // Handle phone call
  const handlePhoneCall = (phoneNumber: string) => {
    if (phoneNumber && phoneNumber !== 'Phone not available') {
      // Remove any non-digit characters except + for international numbers
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
      window.open(`tel:${cleanPhone}`, '_self');
    } else {
      toast({
        title: "Phone not available",
        description: "Phone number is not available for this engineer",
        variant: "destructive"
      });
    }
  };

  // Handle messaging (WhatsApp)
  const handleMessage = (phoneNumber: string, engineerName: string) => {
    if (phoneNumber && phoneNumber !== 'Phone not available') {
      // Remove any non-digit characters and ensure it starts with country code
      let cleanPhone = phoneNumber.replace(/[^\d]/g, '');
      
      // If phone doesn't start with country code, add India's +91
      if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
      }
      
      // Create WhatsApp message
      const message = `Hello ${engineerName}, I have a question about my service booking.`;
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');
    } else {
      toast({
        title: "Phone not available",
        description: "Phone number is not available for messaging this engineer",
        variant: "destructive"
      });
    }
  };

  const handlePayNow = async (booking: Booking) => {
    try {
      // Use billingAmount (vendor's service charge) - this is what customer needs to pay
      // Try completionData first, then root level billingAmount
      const billingAmountStr = (booking as any).completionData?.billingAmount || (booking as any).billingAmount || '0';
      const baseAmount = parseFloat(billingAmountStr.replace(/[₹,]/g, '')) || 0;
      
      // If billing amount is missing, show error (vendor should have entered this)
      if (baseAmount === 0) {
        toast({
          title: "Billing Amount Missing",
          description: "The vendor did not enter a billing amount. Please contact support.",
          variant: "destructive"
        });
        return;
      }
      
      // Check for GST data in localStorage first
      const gstData = getGSTData(booking._id);
      let totalAmount = baseAmount;
      
      if (gstData && gstData.includeGST && gstData.gstAmount > 0) {
        totalAmount = gstData.totalAmount;
      } else {
        // Fallback to booking data
        const includeGST = (booking as any).includeGST;
        const gstAmount = (booking as any).gstAmount || 0;
        totalAmount = includeGST && gstAmount > 0 ? baseAmount + gstAmount : baseAmount;
      }
      
      console.log('Payment request data:', {
        bookingId: booking._id,
        amount: totalAmount,
        currency: 'INR',
        bookingData: {
          paymentMode: (booking as any).paymentMode,
          paymentStatus: (booking as any).paymentStatus,
          status: booking.status,
          completionData: (booking as any).completionData
        }
      });
      
      // Create payment order
      const response = await bookingApi.createPaymentOrder({
        bookingId: booking._id,
        amount: totalAmount,
        currency: 'INR'
      });

      if (response.success && response.data) {
        // Import Razorpay service
        const razorpayService = (await import('@/services/razorpayService')).default;
        
        // Process payment with Razorpay
        await razorpayService.processPayment({
          orderId: response.data.orderId,
          amount: response.data.amount, // Use amount from order response (already in paise)
          currency: 'INR',
          name: booking.customer.name,
          email: booking.customer.email,
          phone: booking.customer.phone,
          description: `Payment for service: ${booking.services.map(s => s.serviceName).join(', ')}`,
          onSuccess: async (paymentResponse) => {
            // Handle successful payment
            try {
              // Verify payment with backend
              const verifyResponse = await bookingApi.verifyPayment({
                bookingId: booking._id,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature
              });

              if (verifyResponse.success) {
                toast({
                  title: "Payment Successful!",
                  description: `Payment of ₹${totalAmount.toLocaleString()} completed successfully. Your service is now completed.`,
                  variant: "default"
                });
                
                // Trigger refresh events for admin service management
                window.dispatchEvent(new CustomEvent('bookingUpdated', { 
                  detail: { bookingId: booking._id, status: 'completed', paymentStatus: 'payment_done' } 
                }));
                
                // Trigger vendor dashboard refresh
                window.dispatchEvent(new CustomEvent('taskCompleted', { 
                  detail: { taskId: booking._id, status: 'completed', paymentStatus: 'payment_done' } 
                }));
                
                // Refresh bookings
                fetchBookings();
              } else {
                toast({
                  title: "Payment Verification Failed",
                  description: "Payment was successful but verification failed. Please contact support.",
                  variant: "destructive"
                });
              }
            } catch (error) {
              console.error('Error verifying payment:', error);
              toast({
                title: "Payment Successful",
                description: "Payment completed but there was an error verifying the payment. Please contact support.",
                variant: "default"
              });
            }
          },
          onError: (error) => {
            console.error('Payment failed:', error);
            toast({
              title: "Payment Failed",
              description: "Payment was not completed. Please try again.",
              variant: "destructive"
            });
          }
        });
        
      } else {
        toast({
          title: "Payment Failed",
          description: "Failed to create payment order. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast({
        title: "Payment Error",
        description: "An error occurred while initiating payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Simple receipt generation using browser print
  const generateSimpleReceipt = (booking: Booking) => {
    try {
      const bookingRef = (booking as any).bookingReference || `FIX${booking._id.toString().substring(booking._id.toString().length - 8).toUpperCase()}`;
      
      // Get GST data if available
      const gstData = getGSTData(booking._id);
      // Use billing amount instead of spare parts total
      const billingAmountStr = (booking as any).completionData?.billingAmount || (booking as any).billingAmount || '0';
      const billingAmount = parseFloat(billingAmountStr.replace(/[₹,]/g, '')) || 0;
      const baseAmount = booking.pricing.totalAmount + billingAmount;
      let totalAmount = baseAmount;
      let includeGST = false;
      let gstAmount = 0;
      
      if (gstData && gstData.includeGST && gstData.gstAmount > 0) {
        totalAmount = gstData.totalAmount;
        includeGST = gstData.includeGST;
        gstAmount = gstData.gstAmount;
      } else {
        includeGST = (booking as any).includeGST;
        gstAmount = (booking as any).gstAmount || 0;
        totalAmount = includeGST && gstAmount > 0 ? baseAmount + gstAmount : baseAmount;
      }

      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fixfly Receipt - ${bookingRef}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .section h3 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total { font-weight: bold; font-size: 18px; color: #2563eb; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="color: #2563eb; margin: 0;">Fixfly</h1>
            <h2 style="color: #374151; margin: 10px 0;">SERVICE RECEIPT</h2>
            <hr style="border: 1px solid #e5e7eb;">
          </div>
          
          <div class="section">
            <h3>BOOKING DETAILS</h3>
            <p><strong>Booking ID:</strong> ${bookingRef}</p>
            <p><strong>Status:</strong> ${booking.status.toUpperCase()}</p>
            <p><strong>Created Date:</strong> ${new Date(booking.createdAt).toLocaleDateString('en-IN')}</p>
            <p><strong>Completed Date:</strong> ${booking.scheduling?.scheduledDate 
              ? new Date(booking.scheduling.scheduledDate).toLocaleDateString('en-IN')
              : new Date(booking.updatedAt).toLocaleDateString('en-IN')
            }</p>
            ${booking.vendor?.vendorId && typeof booking.vendor.vendorId === 'object' && booking.vendor.vendorId.firstName && booking.vendor.vendorId.lastName ? 
              `<p><strong>Assigned Engineer:</strong> ${booking.vendor.vendorId.firstName} ${booking.vendor.vendorId.lastName}</p>` : ''
            }
          </div>

          <div class="section">
            <h3>CUSTOMER DETAILS</h3>
            <p><strong>Name:</strong> ${booking.customer.name}</p>
            <p><strong>Email:</strong> ${booking.customer.email}</p>
            <p><strong>Phone:</strong> ${booking.customer.phone}</p>
            <p><strong>Address:</strong> ${booking.customer.address.street}, ${booking.customer.address.city}, ${booking.customer.address.state} - ${booking.customer.address.pincode}</p>
          </div>

          <div class="section">
            <h3>SERVICE DETAILS</h3>
            ${booking.services.map(service => `<p>• ${service.serviceName}</p>`).join('')}
          </div>

          ${(booking as any).completionData?.resolutionNote ? `
          <div class="section">
            <h3>RESOLUTION NOTES</h3>
            <p>${(booking as any).completionData.resolutionNote}</p>
          </div>
          ` : ''}

          <div class="section">
            <h3>PAYMENT DETAILS</h3>
            <div class="row">
              <span>Initial Payment:</span>
              <span>₹${booking.pricing.totalAmount}</span>
            </div>
            ${billingAmount > 0 ? `
            <div class="row">
              <span>Service Charges:</span>
              <span>₹${billingAmount}</span>
            </div>
            ` : ''}
            ${includeGST && gstAmount > 0 ? `
            <div class="row">
              <span>GST (18%):</span>
              <span>₹${gstAmount}</span>
            </div>
            ` : ''}
            <hr style="border: 1px solid #e5e7eb; margin: 10px 0;">
            <div class="row total">
              <span>TOTAL AMOUNT:</span>
              <span>₹${totalAmount}</span>
            </div>
            <p><strong>Payment Status:</strong> ${booking.payment?.status || 'Completed'}</p>
            ${booking.payment?.transactionId ? `<p><strong>Transaction ID:</strong> ${booking.payment.transactionId}</p>` : ''}
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0;">Thank you for choosing Fixfly!</p>
            <p style="color: #6b7280; margin: 5px 0;">For support, contact us at info@fixfly.in</p>
          </div>
        </body>
        </html>
      `;

      // Open in new window and print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load, then trigger print
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }

      toast({
        title: "Receipt Generated",
        description: `Receipt for ${bookingRef} is ready for download.`,
        variant: "default"
      });

    } catch (error) {
      console.error('Error generating simple receipt:', error);
      toast({
        title: "Error",
        description: "Failed to generate receipt. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Generate PDF receipt for completed booking
  const generateReceiptPDF = (booking: Booking) => {
    try {
      console.log('Generating PDF receipt for booking:', booking._id);
      
      // Try the simple print method first
      generateSimpleReceipt(booking);
      return;
      
      // Initialize GST variables early
      const gstData = getGSTData(booking._id);
      let includeGST = false;
      let gstAmount = 0;
      
      if (gstData && gstData.includeGST && gstData.gstAmount > 0) {
        includeGST = gstData.includeGST;
        gstAmount = gstData.gstAmount;
      } else {
        includeGST = (booking as any).includeGST;
        gstAmount = (booking as any).gstAmount || 0;
      }
      
      const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Helper function to add text with line wrapping
    const addText = (text: string, x: number, y: number, maxWidth?: number) => {
      if (maxWidth) {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * 7);
      } else {
        doc.text(text, x, y);
        return y + 7;
      }
    };

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('FIXFLY SERVICE RECEIPT', pageWidth / 2, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    yPosition = addText('Service Completion Receipt', pageWidth / 2, yPosition);
    yPosition += 10;

    // Booking Details Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('BOOKING DETAILS', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPosition += 5;

    const bookingRef = (booking as any).bookingReference || `FIX${booking._id.toString().substring(booking._id.toString().length - 8).toUpperCase()}`;
    yPosition = addText(`Booking ID: ${bookingRef}`, 20, yPosition);
    yPosition = addText(`Status: ${booking.status.toUpperCase()}`, 20, yPosition);
    yPosition = addText(`Created Date: ${new Date(booking.createdAt).toLocaleDateString('en-IN')}`, 20, yPosition);
    yPosition = addText(`Completed Date: ${booking.scheduling?.scheduledDate 
      ? new Date(booking.scheduling.scheduledDate).toLocaleDateString('en-IN')
      : new Date(booking.updatedAt).toLocaleDateString('en-IN')
    }`, 20, yPosition);
    if (booking.vendor?.vendorId && typeof booking.vendor.vendorId === 'object') {
      const vendor = booking.vendor.vendorId as { firstName: string; lastName: string };
      if (vendor.firstName && vendor.lastName) {
        yPosition = addText(`Assigned Engineer: ${vendor.firstName} ${vendor.lastName}`, 20, yPosition);
      }
    }
    yPosition += 10;

    // Customer Details Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('CUSTOMER DETAILS', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPosition += 5;

    yPosition = addText(`Name: ${booking.customer.name}`, 20, yPosition);
    yPosition = addText(`Email: ${booking.customer.email}`, 20, yPosition);
    yPosition = addText(`Phone: ${booking.customer.phone}`, 20, yPosition);
    yPosition = addText(`Address: ${booking.customer.address.street}, ${booking.customer.address.city}, ${booking.customer.address.state} - ${booking.customer.address.pincode}`, 20, yPosition, pageWidth - 40);
    yPosition += 10;

    // Service Details Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('SERVICE DETAILS', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPosition += 5;

    booking.services.forEach((service, index) => {
      yPosition = addText(`${index + 1}. ${service.serviceName}`, 20, yPosition);
    });
    yPosition += 10;

    // Scheduling Details Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('SCHEDULING DETAILS', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPosition += 5;

    yPosition = addText(`Preferred Date: ${new Date(booking.scheduling.preferredDate).toLocaleDateString('en-IN')}`, 20, yPosition);
    yPosition = addText(`Preferred Time: ${booking.scheduling.preferredTimeSlot}`, 20, yPosition);
    if (booking.scheduling.scheduledDate) {
      yPosition = addText(`Scheduled Date: ${new Date(booking.scheduling.scheduledDate).toLocaleDateString('en-IN')}`, 20, yPosition);
    }
    if (booking.scheduling.scheduledTime) {
      yPosition = addText(`Scheduled Time: ${booking.scheduling.scheduledTime}`, 20, yPosition);
    }
    yPosition += 10;

    // Payment Details Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('PAYMENT DETAILS', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    yPosition += 5;

    yPosition = addText(`Initial Payment: ₹${booking.pricing.totalAmount}`, 20, yPosition);
    yPosition = addText(`Payment Status: ${booking.payment?.status || 'N/A'}`, 20, yPosition);
    if (booking.payment?.paidAt) {
      yPosition = addText(`Payment Date: ${new Date(booking.payment.paidAt).toLocaleDateString('en-IN')}`, 20, yPosition);
    }
    if (booking.payment?.transactionId) {
      yPosition = addText(`Transaction ID: ${booking.payment.transactionId}`, 20, yPosition);
    }
    yPosition += 10;

    // Spare Parts Section (if any)
    console.log('Spare parts data:', (booking as any).completionData?.spareParts);
    if ((booking as any).completionData?.spareParts && (booking as any).completionData.spareParts.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      yPosition = addText('SPARE PARTS DETAILS', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      yPosition += 5;

      (booking as any).completionData.spareParts.forEach((part: any, index: number) => {
        console.log(`Spare part ${index + 1}:`, part);
        const partName = part.name || 'Unnamed Part';
        const partAmount = part.amount || '0';
        yPosition = addText(`${index + 1}. ${partName} - ₹${partAmount}`, 20, yPosition);
      });
      
      yPosition = addText(`Total Spare Parts Amount: ₹${(booking as any).completionData.totalAmount}`, 20, yPosition);
      
      // Show GST details if applicable
      if (includeGST && gstAmount > 0) {
        yPosition = addText(`GST (18%): ₹${gstAmount}`, 20, yPosition);
      }
      
      yPosition += 10;
    } else if ((booking as any).completionData?.totalAmount && (booking as any).completionData.totalAmount > 0) {
      // Show additional charges if no specific spare parts but there's a total amount
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      yPosition = addText('ADDITIONAL CHARGES', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      yPosition += 5;

      yPosition = addText(`Service Charges: ₹${(booking as any).completionData.totalAmount}`, 20, yPosition);
      
      // Show GST details if applicable
      if (includeGST && gstAmount > 0) {
        yPosition = addText(`GST (18%): ₹${gstAmount}`, 20, yPosition);
      }
      
      yPosition += 10;
    }

    // Resolution Notes Section (if any)
    if ((booking as any).completionData?.resolutionNote) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      yPosition = addText('RESOLUTION NOTES', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      yPosition += 5;

      yPosition = addText((booking as any).completionData.resolutionNote, 20, yPosition, pageWidth - 40);
      yPosition += 10;
    }

    // Total Amount Section
    const baseAmount = booking.pricing.totalAmount + ((booking as any).completionData?.totalAmount || 0);
    let totalAmount = includeGST && gstAmount > 0 ? baseAmount + gstAmount : baseAmount;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('TOTAL AMOUNT', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    yPosition = addText(`₹${totalAmount}`, 20, yPosition);
    yPosition += 10;

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    yPosition = addText('Thank you for choosing Fixfly for your service needs!', pageWidth / 2, pageHeight - 20);
    yPosition = addText('For any queries, contact us at info@fixfly.in', pageWidth / 2, pageHeight - 15);

    // Save the PDF
    const fileName = `Fixfly_Receipt_${bookingRef}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    toast({
      title: "Receipt Downloaded",
      description: `Receipt for ${bookingRef} has been downloaded successfully.`,
      variant: "default"
    });
    
    } catch (error) {
      console.error('Error generating PDF receipt:', error);
      toast({
        title: "Error",
        description: "Failed to generate receipt. Please try again.",
        variant: "destructive"
      });
    }
  };

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);

  const handleCancelBooking = async (booking: Booking) => {
    setBookingToCancel(booking);
    setIsCancelDialogOpen(true);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;

    try {
      const response = await bookingApi.cancelBookingByUser(bookingToCancel._id, 'Cancelled by user');
      
      if (response.success) {
        toast({
          title: "Booking Cancelled",
          description: "Your booking has been cancelled successfully.",
          variant: "default"
        });
        fetchBookings(); // Refresh bookings
      } else {
        toast({
          title: "Cancellation Failed",
          description: "Failed to cancel booking. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Cancellation Error",
        description: "An error occurred while cancelling the booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCancelDialogOpen(false);
      setBookingToCancel(null);
    }
  };

  const handleReschedule = (booking: Booking) => {
    // Navigate to reschedule page or open reschedule modal
    navigate(`/reschedule/${booking._id}`, { state: { booking } });
  };

  // Checkout View
  if (isCheckoutView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-100 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="p-3 rounded-full hover:bg-blue-50 transition-all duration-200"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Checkout</h1>
                  <p className="text-sm text-gray-500">Review your order</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-full">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
                <span className="font-semibold text-blue-700">{cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-4xl pb-32 md:pb-24">
          {/* Back Button */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 px-4 py-2 rounded-full transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Services</span>
            </Button>
          </div>

          {/* Cart Items */}
          <div className="space-y-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Selected Services</h2>
            {cartItems.map((item, index: number) => (
              <div key={item.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromCart(item.id)}
                  className="absolute top-3 right-3 md:hidden p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 z-10"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4 md:space-x-6">
                    <div className="relative">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-md">
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">{item.title}</h3>
                      <div className="flex items-center justify-between md:justify-start">
                        <div>
                          <p className="text-gray-600 text-sm">Professional Service</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600 font-medium">Available</span>
                          </div>
                        </div>
                        <div className="text-right md:hidden">
                          <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">₹{item.price}</div>
                          <p className="text-xs text-gray-500">per service</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">₹{item.price}</div>
                      <p className="text-xs text-gray-500">per service</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="p-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">₹</span>
              </div>
              <span>Order Summary</span>
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600 font-medium">Subtotal</span>
                <span className="font-bold text-lg">₹{totalPrice}</span>
              </div>
              <div className="flex justify-between items-center py-3 px-4 bg-green-50 rounded-xl">
                <span className="text-green-600 font-medium">Service Fee</span>
                <span className="font-bold text-green-600">FREE</span>
              </div>
              <div className="flex justify-between items-center py-3 px-4 bg-blue-50 rounded-xl">
                <span className="text-blue-600 font-medium">Tax & Charges</span>
                <span className="font-bold text-blue-600">₹0</span>
              </div>
              <div className="border-t-2 border-gray-200 pt-4">
                <div className="flex justify-between items-center py-4 px-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                  <span className="text-xl font-bold text-gray-900">Total Amount</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">₹{totalPrice}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Secure Payment Button */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 shadow-2xl z-50 md:bottom-0 bottom-16">
            <div className="container mx-auto px-4 py-4 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">₹{totalPrice}</p>
                </div>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => {
                    // Show thank you popup
                    setShowThankYou(true);
                  }}
                >
                 Book Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // New booking success view
  if (isNewBookingView && newBooking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/')}
                  className="p-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">Booking Confirmed</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-2 max-w-2xl mt-8">
          {/* Success Message */}
          <div className="text-center mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Booking Confirmed!</h1>
            <p className="text-sm text-gray-600 mb-2">
              Your booking has been successfully created and payment has been processed.
            </p>
            <div className="bg-white rounded-lg p-2 inline-block shadow-sm">
              <p className="text-xs text-gray-500">Booking Reference</p>
              <p className="text-base font-bold text-blue-600">{bookingReference}</p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-lg shadow-sm border p-3 mb-3">
            <h2 className="text-base font-bold text-gray-900 mb-2">Booking Details</h2>
            
            {/* Customer Info */}
            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1 text-xs">Customer Information</h3>
                <div className="space-y-0.5 text-xs text-gray-600">
                  <p><strong>Name:</strong> {newBooking.customer.name}</p>
                  <p><strong>Email:</strong> {newBooking.customer.email}</p>
                  <p><strong>Phone:</strong> {newBooking.customer.phone}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1 text-xs">Address</h3>
                <div className="space-y-0.5 text-xs text-gray-600">
                  <p>{newBooking.customer.address.street}</p>
                  <p>{newBooking.customer.address.city}, {newBooking.customer.address.state}</p>
                  <p>PIN: {newBooking.customer.address.pincode}</p>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900 mb-1 text-xs">Services Booked</h3>
              <div className="space-y-0.5">
                {newBooking.services.map((service, index) => (
                  <div key={index} className="flex justify-between items-center py-0.5 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-900 text-xs">{service.serviceName}</span>
                    <span className="font-semibold text-gray-900 text-xs">₹{service.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 rounded p-2">
              <div className="space-y-0.5">
                <div className="flex justify-between text-gray-600 text-xs">
                  <span>Subtotal</span>
                  <span>₹{newBooking.pricing.subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-xs">
                  <span>Service Fee</span>
                  <span>₹{newBooking.pricing.serviceFee}</span>
                </div>
                <div className="border-t border-gray-200 pt-0.5">
                  <div className="flex justify-between text-sm font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span>₹{newBooking.pricing.totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button 
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-xs"
            >
              Back to Home
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setFromCheckout(false);
                setActiveTab("ongoing");
              }}
              className="px-4 py-1.5 text-xs"
            >
              View All Bookings
            </Button>
            <Button 
              variant="outline"
              onClick={() => downloadBookingReceipt()}
              className="px-4 py-1.5 text-xs border-green-200 text-green-700 hover:bg-green-50"
            >
              Download Booking Receipt
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 min-h-screen">
      {/* Header with Categories */}
      <div className="bg-white shadow-sm border-b pb-0 mb-4 mt-2 sticky top-0 z-50">
        <div className="container px-2 py-24">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-0 pt-0">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-0 h-auto rounded-lg">
              <TabsTrigger 
                value="ongoing" 
                className="text-base font-medium py-6 px-4 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all"
              >
                <div className="flex items-center space-x-2">
                  <span>Ongoing</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="text-base font-medium py-3 px-4 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all"
              >
                <div className="flex items-center space-x-2">
                  <span>Completed</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="cancelled" 
                className="text-base font-medium py-3 px-4 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all"
              >
                <div className="flex items-center space-x-2">
                  <span>Cancelled</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 pb-16 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Ongoing Bookings */}
          <TabsContent value="ongoing" className="space-y-4 md:space-y-0">
            {!isAuthenticated ? (
              <div className="text-center py-12">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                  <User className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Login Required</h3>
                  <p className="text-gray-600 mb-4">Please login to view your bookings</p>
                  <Button 
                    onClick={() => navigate('/login')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Login Now
                  </Button>
                </div>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your bookings...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                  <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Bookings</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button 
                    onClick={fetchBookings}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : processedBookings.ongoing.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Ongoing Bookings</h3>
                  <p className="text-gray-600 mb-4">You don't have any ongoing bookings at the moment</p>
                  <Button 
                    onClick={() => navigate('/')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Browse Services
                  </Button>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              {processedBookings.ongoing.map((booking) => {
                const IconComponent = Wrench; // Default icon for services
                return (
                  <Card key={booking._id} className="bg-white shadow-lg rounded-xl overflow-hidden h-fit">
                    <CardContent className="p-2 lg:p-3">
                    {/* Case ID */}
                    <div className="mb-1">
                      <span className="font-bold text-gray-800 text-xs">
                        Case ID: {(booking as any).bookingReference || `FIX${booking._id.toString().substring(booking._id.toString().length - 8).toUpperCase()}`}
                        {(booking as any).completionData?.spareParts && (booking as any).completionData.spareParts.length > 0 && (
                          <span className="text-green-600 ml-1">(spare)</span>
                        )}
                      </span>
                    </div>

                    {/* Service Details */}
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="bg-blue-100 p-1.5 rounded-full">
                        <IconComponent className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-gray-800">
                          {booking.services.map(s => s.serviceName).join(', ')}
                        </h3>
                        <p className="text-gray-600 text-xs">{getStatusText(booking.status, booking)}</p>
                        {/* Show completion status if task is completed */}
                        {booking.status === 'in_progress' && (booking as any).completionData && (booking as any).completionData.resolutionNote && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              ✓ Task Completed - Payment Pending
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dates and Price */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="text-gray-600">Booking Date</span>
                          <div className="font-medium text-sm">{formatDate(booking.createdAt)}</div>
                        </div>
                        {booking.vendor && booking.vendor.vendorId && typeof booking.vendor.vendorId === 'object' ? (
                          <div className="text-xs">
                            <span className="text-gray-600">Appointment Date</span>
                            <div className="font-medium text-sm">
                              {formatDate((booking.scheduling as any).scheduledDate || booking.scheduling.preferredDate)}
                              {(booking.scheduling as any).scheduledTime && (
                                <span className="text-gray-500 ml-1">
                                  {new Date(`2000-01-01T${(booking.scheduling as any).scheduledTime}`).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs">
                            <span className="text-gray-600">Appointment Date</span>
                            <div className="font-medium text-sm text-gray-400">To be assigned</div>
                          </div>
                        )}
                      </div>
                      <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-semibold text-sm">
                        {formatPrice(booking.pricing.totalAmount)}
                      </div>
                    </div>

                    {/* Engineer Details - Show when vendor is assigned */}
                    {booking.vendor && booking.vendor.vendorId && typeof booking.vendor.vendorId === 'object' ? (
                      <div className="bg-green-50 rounded-lg p-1.5 mb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="bg-green-100 p-1 rounded-full">
                              <Wrench className="h-3 w-3 text-green-600" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-800 text-xs">Engineer Assigned</div>
                              <div className="text-gray-600 text-xs">
                                {(() => {
                                  const vendor = booking.vendor.vendorId as any;
                                  if (typeof vendor === 'object' && vendor !== null) {
                                    return vendor.firstName && vendor.lastName 
                                      ? `${vendor.firstName} ${vendor.lastName}` 
                                      : 'Engineer Name';
                                  }
                                  return 'Engineer Name';
                                })()}
                              </div>
                              <div className="text-gray-600 text-xs">
                                {(() => {
                                  const vendor = booking.vendor.vendorId as any;
                                  if (typeof vendor === 'object' && vendor !== null) {
                                    return vendor.phone || 'Phone not available';
                                  }
                                  return 'Phone not available';
                                })()}
                              </div>
                              <div className="text-gray-600 text-xs">
                                {(() => {
                                  const vendor = booking.vendor.vendorId as any;
                                  if (typeof vendor === 'object' && vendor !== null) {
                                    return vendor.email || 'Email not available';
                                  }
                                  return 'Email not available';
                                })()}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="p-1 hover:bg-green-50"
                              onClick={() => {
                                const vendor = booking.vendor.vendorId as any;
                                const phone = vendor?.phone || 'Phone not available';
                                handlePhoneCall(phone);
                              }}
                              title="Call Engineer"
                            >
                              <Phone className="h-3 w-3 text-green-600" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="p-1 hover:bg-green-50"
                              onClick={() => {
                                const vendor = booking.vendor.vendorId as any;
                                const phone = vendor?.phone || 'Phone not available';
                                const name = vendor?.firstName && vendor?.lastName 
                                  ? `${vendor.firstName} ${vendor.lastName}` 
                                  : 'Engineer';
                                handleMessage(phone, name);
                              }}
                              title="Message Engineer on WhatsApp"
                            >
                              <MessageCircle className="h-3 w-3 text-green-600" />
                            </Button>
                          </div>
                        </div>
                        
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-1.5 mb-2">
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-gray-500 text-xs">Waiting for engineer assignment</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-1 mb-1">
                      {/* Debug: Log booking data */}
                      {(() => {
                        console.log('Booking Debug:', {
                          id: booking._id,
                          status: booking.status,
                          completionData: (booking as any).completionData,
                          paymentMode: (booking as any).paymentMode,
                          paymentStatus: (booking as any).paymentStatus,
                          payment: (booking as any).payment
                        });
                        return null;
                      })()}
                      
                      {/* Show Pay Now button - check multiple conditions */}
                      {(() => {
                        // Check localStorage for payment data
                        const paymentData = localStorage.getItem(`payment_${booking._id}`);
                        const gstData = localStorage.getItem(`gst_${booking._id}`);
                        
                        // Check if booking has completion data
                        const hasCompletionData = (booking as any).completionData && (booking as any).completionData.resolutionNote;
                        
                        // Check if payment mode is online
                        const isOnlinePayment = (booking as any).paymentMode === 'online' || 
                                             (booking as any).payment?.method === 'online' ||
                                             (paymentData && JSON.parse(paymentData).paymentMethod === 'online');
                        
                        // Check if payment status is pending
                        const isPaymentPending = (booking as any).paymentStatus === 'pending' || 
                                               (booking as any).payment?.status === 'pending';
                        
                        // Show Pay Now button if any of these conditions are met
                        const shouldShowPayNow = booking.status === 'in_progress' && 
                                               (hasCompletionData || paymentData || gstData) &&
                                               (isOnlinePayment || paymentData) &&
                                               (isPaymentPending || !(booking as any).payment?.status);
                        
                        console.log('Pay Now Button Debug:', {
                          bookingId: booking._id,
                          status: booking.status,
                          hasCompletionData,
                          isOnlinePayment,
                          isPaymentPending,
                          paymentData: !!paymentData,
                          gstData: !!gstData,
                          shouldShowPayNow
                        });
                        
                        return shouldShowPayNow;
                      })() ? (
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1.5"
                          onClick={() => handlePayNow(booking)}
                        >
                          Pay Now - ₹{(() => {
                            // Use billingAmount (vendor's service charge) - this is what customer needs to pay
                            // Try completionData first, then root level billingAmount
                            const billingAmountStr = (booking as any).completionData?.billingAmount || (booking as any).billingAmount || '0';
                            const billingAmount = parseFloat(billingAmountStr.replace(/[₹,]/g, '')) || 0;
                            
                            // If billing amount is missing, show 0 (vendor should have entered this)
                            if (billingAmount === 0) {
                              return '0';
                            }
                            
                            // Check for GST data in localStorage
                            const gstData = getGSTData(booking._id);
                            if (gstData && gstData.includeGST && gstData.gstAmount > 0) {
                              return gstData.totalAmount.toLocaleString();
                            }
                            
                            // Fallback to booking data
                            const includeGST = (booking as any).includeGST;
                            const gstAmount = (booking as any).gstAmount || 0;
                            
                            if (includeGST && gstAmount > 0) {
                              return (billingAmount + gstAmount).toLocaleString();
                            }
                            return billingAmount.toLocaleString();
                          })()}
                        </Button>
                      ) : (
                        <>
                          <Button 
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1.5"
                            onClick={() => handleCancelBooking(booking)}
                          >
                            Cancel Booking
                          </Button>
                          <Button 
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5"
                            onClick={() => handleReschedule(booking)}
                          >
                            Reschedule
                          </Button>
                        </>
                      )}
                    </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            )}
          </TabsContent>

          {/* Completed Bookings */}
          <TabsContent value="completed" className="space-y-4 md:space-y-0">
            {!isAuthenticated ? (
              <div className="text-center py-12">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                  <User className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Login Required</h3>
                  <p className="text-gray-600 mb-4">Please login to view your bookings</p>
                  <Button 
                    onClick={() => navigate('/login')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Login Now
                  </Button>
                </div>
              </div>
            ) : processedBookings.completed.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Completed Bookings</h3>
                  <p className="text-gray-600 mb-4">You don't have any completed bookings yet</p>
                  <Button 
                    onClick={() => navigate('/')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Browse Services
                  </Button>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              {processedBookings.completed.map((booking) => {
                const IconComponent = Wrench; // Default icon for services
                return (
                  <Card key={booking._id} className="bg-white shadow-lg rounded-xl overflow-hidden h-fit">
                  <CardContent className="p-3 lg:p-4">
                    {/* Case ID */}
                    <div className="mb-1">
                      <span className="font-bold text-gray-800 text-xs">
                        Case ID: {(booking as any).bookingReference || `FIX${booking._id.toString().substring(booking._id.toString().length - 8).toUpperCase()}`}
                      </span>
                    </div>

                    {/* Service Details */}
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="bg-green-100 p-1.5 rounded-full">
                        <IconComponent className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-gray-800">
                          {booking.services.map(s => s.serviceName).join(', ')}
                        </h3>
                        <p className="text-gray-600 text-xs">{getStatusText(booking.status, booking)}</p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="mb-2">
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="text-gray-600">Completed Date</span>
                          <div className="font-medium text-sm">
                            {booking.scheduling?.scheduledDate 
                              ? formatDate(booking.scheduling.scheduledDate)
                              : formatDate(booking.updatedAt)
                            }
                          </div>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-600">Assigned Engineer</span>
                          <div className="font-medium text-sm">
                            {booking.vendor?.vendorId && typeof booking.vendor.vendorId === 'object' && booking.vendor.vendorId.firstName && booking.vendor.vendorId.lastName 
                              ? `${booking.vendor.vendorId.firstName} ${booking.vendor.vendorId.lastName}`
                              : 'Engineer Assigned'
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mb-1">
                      <Button 
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white text-xs py-1.5"
                        onClick={() => generateReceiptPDF(booking)}
                      >
                        Download Receipt
                      </Button>
                    </div>

                      {/* Status Tag */}
                      <div className="text-center">
                        <Badge className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs">
                          {booking.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            )}
          </TabsContent>

          {/* Cancelled Bookings */}
          <TabsContent value="cancelled" className="space-y-4 md:space-y-0">
            {!isAuthenticated ? (
              <div className="text-center py-12">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                  <User className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Login Required</h3>
                  <p className="text-gray-600 mb-4">Please login to view your bookings</p>
                  <Button 
                    onClick={() => navigate('/login')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Login Now
                  </Button>
                </div>
              </div>
            ) : processedBookings.cancelled.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
                  <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cancelled Bookings</h3>
                  <p className="text-gray-600 mb-4">You don't have any cancelled bookings</p>
                  <Button 
                    onClick={() => navigate('/')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Browse Services
                  </Button>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              {processedBookings.cancelled.map((booking) => {
                const IconComponent = Wrench; // Default icon for services
                return (
                  <Card key={booking._id} className="bg-white shadow-lg rounded-xl overflow-hidden opacity-75 h-fit">
                  <CardContent className="p-4">
                    {/* Case ID */}
                    <div className="mb-1">
                      <span className="font-bold text-gray-800 text-xs">Case ID: {(booking as any).bookingReference || `FIX${booking._id.toString().substring(booking._id.toString().length - 8).toUpperCase()}`}</span>
                    </div>

                    {/* Service Details */}
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="bg-gray-100 p-1.5 rounded-full">
                        <IconComponent className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-gray-800">
                          {booking.services.map(s => s.serviceName).join(', ')}
                        </h3>
                        <p className="text-gray-600 text-xs">{getStatusText(booking.status, booking)}</p>
                      </div>
                    </div>

                    {/* Dates and Price */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="text-gray-600">Cancelled Date</span>
                          <div className="font-medium text-sm">{formatDate(booking.updatedAt)}</div>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-600">Booking Date</span>
                          <div className="font-medium text-sm">{formatDate(booking.createdAt)}</div>
                        </div>
                      </div>
                      <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-semibold text-sm">
                        {formatPrice(booking.pricing.totalAmount)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-1 mb-1">
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5">
                        Book Similar Service
                      </Button>
                    </div>

                      {/* Status Tag */}
                      <div className="text-center">
                        <Badge className={`${getStatusColor(booking.status)} px-3 py-1 rounded-full text-xs`}>
                          {getStatusText(booking.status, booking)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Booking Confirmation Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-gray-900 mb-2">
              Cancel Booking
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            {bookingToCancel && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-left">
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Case ID:</strong> {(bookingToCancel as any).bookingReference || `FIX${bookingToCancel._id.toString().substring(bookingToCancel._id.toString().length - 8).toUpperCase()}`}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Service:</strong> {bookingToCancel.services.map(s => s.serviceName).join(', ')}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Amount:</strong> ₹{bookingToCancel.pricing.totalAmount}
                </p>
              </div>
            )}
            <div className="flex space-x-3 justify-center">
              <Button 
                variant="outline"
                onClick={() => {
                  setIsCancelDialogOpen(false);
                  setBookingToCancel(null);
                }}
                className="px-6 py-2"
              >
                Keep Booking
              </Button>
              <Button 
                onClick={confirmCancelBooking}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
              >
                Yes, Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Thank You Popup */}
      <Dialog open={showThankYou} onOpenChange={setShowThankYou}>
        <DialogContent className="w-[95vw] max-w-md mx-auto rounded-xl">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You for Your Booking!</h2>
            <p className="text-gray-600 mb-6">
              Your service booking has been confirmed. Our technician will contact you soon to schedule the visit.
            </p>
            <Button 
              onClick={() => {
                setShowThankYou(false);
                navigate('/');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Back to Home
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Booking;
