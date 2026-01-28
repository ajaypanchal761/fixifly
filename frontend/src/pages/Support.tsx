import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  Phone,
  Mail,
  MessageCircle,
  User,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Search,
  HelpCircle,
  FileText,
  Users,
  Headphones,
  Copy,
  ExternalLink,
  Download
} from "lucide-react";
import { supportTicketAPI } from "@/services/supportApiService";
import { getUserAMCSubscriptions } from "@/services/amcApiService";
import { useAuth } from "@/contexts/AuthContext";
import MobileBottomNav from "@/components/MobileBottomNav";
import jsPDF from 'jspdf';

const Support = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("new-ticket");
  const [searchQuery, setSearchQuery] = useState("");
  const [supportType, setSupportType] = useState("");
  const [caseId, setCaseId] = useState("");
  const [showCaseIdField, setShowCaseIdField] = useState(false);
  const [showSubscriptionField, setShowSubscriptionField] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState("");
  const [userAMCSubscriptions, setUserAMCSubscriptions] = useState([]);
  const [showThankYou, setShowThankYou] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "",
    priority: "",
    description: "",
    guestName: "",
    guestEmail: "",
    guestPhone: ""
  });
  const [userTickets, setUserTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [showAddResponse, setShowAddResponse] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { toast } = useToast();

  // Load cached tickets immediately on mount for instant display
  useEffect(() => {
    if (!user) {
      return;
    }

    let hasCache = false;
    try {
      const userId = user?.email || user?.id || 'default';
      const cachedTickets = localStorage.getItem(`userSupportTickets_${userId}`);
      if (cachedTickets) {
        const parsed = JSON.parse(cachedTickets);
        const cacheTime = localStorage.getItem(`userSupportTicketsTime_${userId}`);
        const now = Date.now();
        // Use cache if less than 2 minutes old
        if (cacheTime && (now - parseInt(cacheTime)) < 2 * 60 * 1000) {
          console.log('✅ Loading cached support tickets instantly');
          setUserTickets(parsed);
          setLoading(false);
          hasCache = true;
          setIsInitialLoad(false);
        }
      }
    } catch (error) {
      console.error('Error loading cached tickets:', error);
    }

    // Always fetch fresh data in background
    if (hasCache) {
      fetchUserTickets(false); // Fetch without showing loading
    } else {
      fetchUserTickets(true); // Fetch with loading
    }

    fetchUserAMCSubscriptions();
  }, [user]);

  // Fetch user AMC subscriptions
  const fetchUserAMCSubscriptions = async () => {
    try {
      const response = await getUserAMCSubscriptions('active');
      if (response.success) {
        setUserAMCSubscriptions(response.data.subscriptions || []);
      }
    } catch (error) {
      console.error('Error fetching AMC subscriptions:', error);
      setUserAMCSubscriptions([]);
    }
  };

  // Listen for support ticket updates
  useEffect(() => {
    const handleSupportTicketUpdate = (event) => {
      console.log('Support ticket updated event received:', event.detail);
      fetchUserTickets(); // Refresh tickets when vendor completes a task
    };

    window.addEventListener('supportTicketUpdated', handleSupportTicketUpdate);

    return () => {
      window.removeEventListener('supportTicketUpdated', handleSupportTicketUpdate);
    };
  }, []);

  const fetchUserTickets = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      console.log('Fetching user tickets...');
      const response = await supportTicketAPI.getUserTickets();
      if (response.success) {
        console.log('User tickets data:', response.data.tickets);
        console.log('Tickets with payment info:', response.data.tickets.map(ticket => ({
          id: ticket.id,
          status: ticket.status,
          paymentMode: ticket.paymentMode,
          paymentStatus: ticket.paymentStatus,
          billingAmount: ticket.billingAmount,
          hasPendingPayment: ticket.status === 'Resolved' &&
            ticket.paymentMode === 'online' &&
            ticket.paymentStatus === 'pending' &&
            ticket.billingAmount > 0
        })));

        setUserTickets(response.data.tickets);

        // Cache tickets for instant loading next time
        try {
          const userId = user?.email || user?.id || 'default';
          localStorage.setItem(`userSupportTickets_${userId}`, JSON.stringify(response.data.tickets));
          localStorage.setItem(`userSupportTicketsTime_${userId}`, Date.now().toString());
        } catch (error) {
          console.error('Error caching tickets:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching user tickets:', error);

      if (error.message.includes('Authentication failed')) {
        alert('Your session has expired. Please login again.');
        // Redirect to login or refresh token
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      } else {
        alert('Failed to fetch support tickets. Please try again.');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setIsInitialLoad(false);
    }
  };

  // Check if ticket has pending payment
  const hasPendingPayment = (ticket) => {
    console.log('=== PAYMENT CHECK DEBUG ===');
    console.log('Ticket:', ticket);
    console.log('Status check:', {
      status: ticket.status,
      isInProgress: ticket.status === 'In Progress',
      paymentMode: ticket.paymentMode,
      isOnline: ticket.paymentMode === 'online',
      paymentStatus: ticket.paymentStatus,
      isPending: ticket.paymentStatus === 'pending',
      billingAmount: ticket.billingAmount,
      totalAmount: ticket.totalAmount,
      hasAmount: (ticket.billingAmount > 0 || ticket.totalAmount > 0)
    });

    const hasPayment = ticket.status === 'In Progress' &&
      ticket.paymentMode === 'online' &&
      ticket.paymentStatus === 'pending' &&
      (ticket.billingAmount > 0 || ticket.totalAmount > 0);

    console.log('Final result - Has pending payment:', hasPayment);
    console.log('=== END PAYMENT CHECK ===');
    return hasPayment;
  };

  // Handle payment for support ticket - Direct Razorpay integration
  const handlePayNow = async (ticket) => {
    try {
      // Check if user is authenticated
      const userToken = localStorage.getItem('accessToken');
      if (!userToken) {
        alert('Please login to make payment.');
        return;
      }

      console.log('Starting payment for ticket:', ticket);
      console.log('Amount:', ticket.totalAmount || ticket.billingAmount || 0);
      console.log('User token exists:', !!userToken);

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

      const isMobile = isMobileWebView();
      console.log('💳 Processing payment, isMobile:', isMobile);

      // Load Razorpay script with retry for mobile
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

      let res = await loadRazorpayScript();
      if (!res && isMobile) {
        // Retry for mobile
        console.log('📱 Retrying Razorpay script load for mobile...');
        await new Promise(r => setTimeout(r, 1000));
        res = await loadRazorpayScript();
      }

      if (!res || !window.Razorpay) {
        alert('Razorpay payment gateway failed to load. Please check your internet connection and try again.');
        return;
      }

      // Create order on backend
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const orderResponse = await fetch(`${API_BASE_URL}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          amount: (ticket.totalAmount || ticket.billingAmount || 0), // Amount in rupees (totalAmount includes GST if applicable), backend will convert to paise
          currency: 'INR',
          receipt: `receipt_${ticket.id}_${Date.now()}`,
          notes: {
            ticketId: ticket.id,
            type: 'support_ticket',
            description: `Payment for support ticket: ${ticket.subject}`
          }
        })
      });

      console.log('Order response status:', orderResponse.status);
      console.log('Order response headers:', orderResponse.headers);

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error('Order creation failed:', errorText);
        throw new Error(`Order creation failed: ${orderResponse.status} ${errorText}`);
      }

      const orderData = await orderResponse.json();
      console.log('Order data:', orderData);

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      // Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_RyCVwnDNEvO2uL', // Use environment variable or fallback to live key
        amount: orderData.data.amount, // Use amount from order response (already in paise)
        currency: 'INR',
        name: 'FixFly',
        description: `Payment for support ticket: ${ticket.subject}`,
        order_id: orderData.data.id,
        handler: async function (response) {
          try {
            // Verify payment on backend
            console.log('🔧 PAYMENT DEBUG: API_BASE_URL:', API_BASE_URL);
            console.log('🔧 PAYMENT DEBUG: Full URL:', `${API_BASE_URL}/support-tickets/payment/verify`);
            console.log('🔧 PAYMENT DEBUG: Request body:', {
              ticketId: ticket.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            const verifyResponse = await fetch(`${API_BASE_URL}/support-tickets/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
              },
              body: JSON.stringify({
                ticketId: ticket.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })
            });

            console.log('Verify response status:', verifyResponse.status);

            if (!verifyResponse.ok) {
              const errorText = await verifyResponse.text();
              console.error('Payment verification failed:', errorText);
              throw new Error(`Payment verification failed: ${verifyResponse.status} ${errorText}`);
            }

            const verifyData = await verifyResponse.json();
            console.log('Verify data:', verifyData);

            if (verifyData.success) {
              // Payment successful
              alert('Payment successful! Your ticket has been resolved.');
              // Refresh the tickets to show updated status
              fetchUserTickets();
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            console.error('Error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack
            });

            if (error.message.includes('Failed to fetch')) {
              alert('Network error: Cannot connect to payment server. Please check your internet connection and try again.');
            } else {
              alert('Payment verification failed. Please contact support.');
            }
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
          enabled: false,
        },
        // @ts-ignore
        webview_intent: true,
        modal: {
          ondismiss: function () {
            console.log('Payment modal dismissed');
          }
        },
        // UPI app detection and QR code configuration for mobile APK
        // For Android WebView/APK, UPI apps (PhonePe, Google Pay, Paytm) are auto-detected
        config: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? undefined : {
          display: {
            blocks: {
              upi: {
                name: "UPI",
                instruments: [
                  {
                    method: "upi",
                    flows: ["qr", "intent"],
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
            sequence: ["block.upi", "block.banks"],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
      };

      // Check if Razorpay is available
      if (!window.Razorpay) {
        alert('Payment gateway not available. Please refresh the page.');
        return;
      }

      try {
        const rzp = new window.Razorpay(options);

        // Add error handler
        if (rzp.on) {
          rzp.on('payment.failed', function (response) {
            console.error('❌ Razorpay payment failed:', response);
            alert('Payment failed. Please try again.');
          });
        }

        rzp.open();
        console.log('✅ Razorpay checkout opened');
      } catch (error) {
        console.error('❌ Error opening Razorpay checkout:', error);
        alert('Failed to open payment gateway. Please try again.');
      }

    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  // Handle invoice download - PDF format
  const handleDownloadInvoice = async (ticket) => {
    try {
      // Fetch full ticket details to get completionData
      let fullTicket = ticket;
      try {
        const response = await supportTicketAPI.getTicket(ticket.id);
        if (response.success && response.data.ticket) {
          fullTicket = response.data.ticket;
          console.log('📄 Full ticket data fetched:', {
            hasCompletionData: !!fullTicket.completionData,
            completionData: fullTicket.completionData,
            resolutionNote: fullTicket.completionData?.resolutionNote,
            resolution: fullTicket.resolution,
            spareParts: fullTicket.completionData?.spareParts?.length || 0,
            fullTicketKeys: Object.keys(fullTicket)
          });
        }
      } catch (error) {
        console.log('Could not fetch full ticket details, using provided ticket data');
        console.log('Original ticket data:', ticket);
      }

      // Ensure we have completionData from any source
      // Handle case where completionData might be a string (JSON) or object
      let completionData = fullTicket.completionData || ticket.completionData || null;

      // If completionData is a string, try to parse it
      if (typeof completionData === 'string') {
        try {
          completionData = JSON.parse(completionData);
        } catch (e) {
          console.warn('Could not parse completionData as JSON:', e);
        }
      }

      // If completionData is null or undefined, try to get it from the raw ticket
      if (!completionData) {
        // Try accessing from the raw MongoDB document structure
        const rawCompletionData = (fullTicket as any).completionData || (ticket as any).completionData;
        if (rawCompletionData) {
          completionData = rawCompletionData;
        }
      }

      const invoiceData = {
        ticketId: fullTicket.id,
        subject: fullTicket.subject,
        caseId: fullTicket.caseId,
        amount: fullTicket.totalAmount || fullTicket.billingAmount || 0,
        paymentMode: fullTicket.paymentMode,
        status: fullTicket.status,
        created: fullTicket.created,
        resolved: fullTicket.lastUpdate,
        customerName: user?.name || 'Customer',
        customerEmail: user?.email || '',
        customerPhone: user?.phone || '',
        completionData: completionData
      };

      console.log('📄 Invoice data prepared:', {
        hasCompletionData: !!invoiceData.completionData,
        completionData: invoiceData.completionData,
        completionDataType: typeof invoiceData.completionData,
        resolutionNote: invoiceData.completionData?.resolutionNote,
        resolutionNoteType: typeof invoiceData.completionData?.resolutionNote,
        resolutionNoteValue: invoiceData.completionData?.resolutionNote,
        sparePartsCount: invoiceData.completionData?.spareParts?.length || 0,
        fullTicketKeys: Object.keys(fullTicket),
        ticketKeys: Object.keys(ticket)
      });

      // Create PDF using jsPDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 30;

      // Helper function to add text with automatic page break
      const addText = (text: string, x: number, y: number, maxWidth?: number, align?: 'left' | 'center' | 'right') => {
        if (y > pageHeight - 30) {
          doc.addPage();
          return 20;
        }
        const lines = doc.splitTextToSize(text, maxWidth || pageWidth - x - 20);
        doc.text(lines, x, y, { align: align || 'left' });
        return y + (lines.length * 5);
      };

      // Set font
      doc.setFont('helvetica');

      // Add header
      doc.setFontSize(24);
      doc.setTextColor(40, 40, 40);
      yPosition = addText('FIXFLY', pageWidth / 2, yPosition, undefined, 'center');

      doc.setFontSize(16);
      doc.setTextColor(100, 100, 100);
      yPosition = addText('INVOICE', pageWidth / 2, yPosition + 5, undefined, 'center');

      // Add invoice details
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      yPosition += 10;
      yPosition = addText(`Invoice No: INV-${invoiceData.ticketId}`, 20, yPosition);
      yPosition = addText(`Date: ${new Date().toLocaleDateString()}`, 20, yPosition);

      // Add customer details
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      yPosition += 10;
      yPosition = addText('BILL TO:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      yPosition += 5;
      yPosition = addText(invoiceData.customerName, 20, yPosition);
      yPosition = addText(invoiceData.customerEmail, 20, yPosition);
      yPosition = addText(invoiceData.customerPhone, 20, yPosition);

      // Add service details
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      yPosition += 10;
      yPosition = addText('SERVICE DETAILS:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      yPosition += 5;
      yPosition = addText(`Ticket ID: ${invoiceData.ticketId}`, 20, yPosition);
      if (invoiceData.caseId) {
        yPosition = addText(`Case ID: ${invoiceData.caseId}`, 20, yPosition);
      }
      yPosition = addText(`Subject: ${invoiceData.subject}`, 20, yPosition);
      yPosition = addText(`Service Date: ${invoiceData.created}`, 20, yPosition);
      yPosition = addText(`Completion Date: ${invoiceData.resolved}`, 20, yPosition);

      // Add payment details
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      yPosition += 10;
      yPosition = addText('PAYMENT DETAILS:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      yPosition += 5;
      yPosition = addText(`Payment Mode: ${invoiceData.paymentMode || 'N/A'}`, 20, yPosition);
      yPosition = addText(`Status: ${invoiceData.status}`, 20, yPosition);

      // Add amount section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      yPosition += 10;
      yPosition = addText('AMOUNT:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      yPosition += 5;
      yPosition = addText(`Service Amount: ₹${invoiceData.amount}`, 20, yPosition);

      // Add total amount
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      yPosition += 10;
      yPosition = addText(`TOTAL AMOUNT: ₹${invoiceData.amount}`, 20, yPosition);
      doc.setFont('helvetica', 'normal');

      // Spare Parts Section - show details and warranty
      const spareParts = invoiceData.completionData?.spareParts || [];
      if (spareParts && spareParts.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        yPosition += 10;
        yPosition = addText('SPARE PARTS DETAILS', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        yPosition += 5;

        spareParts.forEach((part: any, index: number) => {
          yPosition = addText(`${index + 1}. ${part.name || 'N/A'}`, 20, yPosition);
          if (part.warranty) {
            yPosition = addText(`   Warranty: ${part.warranty}`, 25, yPosition);
          }
          yPosition += 3; // Small gap between parts
        });
        yPosition += 5;
      }

      // Resolution Notes Section
      // Use exact same access pattern as AdminSupportManagement: completionData?.resolutionNote
      // Direct access - simplest and most reliable
      let resolutionNote: string | null = null;

      // Try direct access from completionData (exact same as AdminSupportManagement)
      if (invoiceData.completionData?.resolutionNote) {
        resolutionNote = invoiceData.completionData.resolutionNote;
      } else if (fullTicket.completionData?.resolutionNote) {
        resolutionNote = fullTicket.completionData.resolutionNote;
      } else if (ticket.completionData?.resolutionNote) {
        resolutionNote = ticket.completionData.resolutionNote;
      }

      // Clean and validate
      if (resolutionNote && typeof resolutionNote === 'string') {
        resolutionNote = resolutionNote.trim();
        if (resolutionNote === '') {
          resolutionNote = null;
        }
      } else {
        resolutionNote = null;
      }

      // Comprehensive debug logging
      console.log('📝 Resolution Note Debug - COMPREHENSIVE:', {
        'Step 1 - invoiceData.completionData exists': !!invoiceData.completionData,
        'Step 2 - invoiceData.completionData type': typeof invoiceData.completionData,
        'Step 3 - invoiceData.completionData keys': invoiceData.completionData ? Object.keys(invoiceData.completionData) : [],
        'Step 4 - invoiceData.completionData.resolutionNote': invoiceData.completionData?.resolutionNote,
        'Step 5 - invoiceData.completionData.resolutionNote type': typeof invoiceData.completionData?.resolutionNote,
        'Step 6 - fullTicket.completionData exists': !!fullTicket.completionData,
        'Step 7 - fullTicket.completionData.resolutionNote': fullTicket.completionData?.resolutionNote,
        'Step 8 - ticket.completionData exists': !!ticket.completionData,
        'Step 9 - ticket.completionData.resolutionNote': ticket.completionData?.resolutionNote,
        'FINAL resolutionNote value': resolutionNote,
        'FINAL resolutionNote type': typeof resolutionNote,
        'FINAL resolutionNote length': resolutionNote ? resolutionNote.length : 0,
        'Will display in PDF': !!(resolutionNote && resolutionNote.trim() !== ''),
        'Full invoiceData.completionData JSON': JSON.stringify(invoiceData.completionData, null, 2),
        'Full fullTicket.completionData JSON': JSON.stringify(fullTicket.completionData, null, 2),
        'Full ticket.completionData JSON': JSON.stringify(ticket.completionData, null, 2)
      });

      // Always show resolution note section if completionData exists (same as service management)
      if (invoiceData.completionData || fullTicket.completionData || ticket.completionData) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        yPosition += 10;
        yPosition = addText(`RESOLUTION NOTE: ${resolutionNote}`, 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        yPosition += 5;

        if (resolutionNote && resolutionNote.trim() !== '') {
          // Split long text into multiple lines if needed
          const noteLines = doc.splitTextToSize(resolutionNote.trim(), pageWidth - 40);
          noteLines.forEach((line: string) => {
            yPosition = addText(line, 20, yPosition, pageWidth - 40);
          });
        } else {
          // Show message if resolution note is missing
          doc.setTextColor(150, 150, 150);
          yPosition = addText('(No resolution note provided)', 20, yPosition, pageWidth - 40);
          doc.setTextColor(0, 0, 0);
        }
        yPosition += 5;
      }

      // Add footer
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      yPosition = addText('Thank you for using FixFly services!', pageWidth / 2, pageHeight - 5, undefined, 'center');
      yPosition = addText('For any queries, contact us at info@getfixfly.com', pageWidth / 2, pageHeight - 2, undefined, 'center');

      // Save the PDF
      doc.save(`FixFly_Invoice_${invoiceData.ticketId}.pdf`);

      // Send email notification
      await sendInvoiceEmail(invoiceData);

    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    }
  };

  // Send invoice via email
  const sendInvoiceEmail = async (invoiceData) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/support-tickets/send-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          ticketId: invoiceData.ticketId,
          customerEmail: invoiceData.customerEmail,
          customerName: invoiceData.customerName,
          amount: invoiceData.amount,
          subject: invoiceData.subject
        })
      });

      if (response.ok) {
        alert('Invoice downloaded and sent to your email successfully!');
      } else {
        console.log('Invoice downloaded successfully!');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      // Don't show error to user, just log it
    }
  };

  const openTickets = [
    {
      id: "TK001",
      subject: "MacBook Screen Flickering Issue",
      category: "Hardware",
      priority: "High",
      status: "In Progress",
      created: "Dec 12, 2024",
      lastUpdate: "2 hours ago",
      responses: 3
    },
    {
      id: "TK002",
      subject: "Software Installation Help",
      category: "Software",
      priority: "Medium",
      status: "Waiting for Response",
      created: "Dec 10, 2024",
      lastUpdate: "1 day ago",
      responses: 1
    }
  ];

  const closedTickets = [
    {
      id: "TK003",
      subject: "Laptop Battery Replacement Query",
      category: "General",
      priority: "Low",
      status: "Resolved",
      created: "Dec 8, 2024",
      resolved: "Dec 9, 2024",
      responses: 5,
      rating: 5
    },
    {
      id: "TK004",
      subject: "Printer Connection Issues",
      category: "Technical",
      priority: "Medium",
      status: "Resolved",
      created: "Dec 5, 2024",
      resolved: "Dec 6, 2024",
      responses: 2,
      rating: 4
    }
  ];

  const faqs = [
    {
      category: "General",
      questions: [
        {
          q: "What types of devices do you repair?",
          a: "We repair laptops, desktops, Mac computers, tablets, smartphones, printers, and other IT equipment. Our certified technicians handle all major brands including Apple, Dell, HP, Lenovo, and more."
        },
        {
          q: "How long does a typical repair take?",
          a: "Most repairs are completed within 24-48 hours. Complex issues may take 3-5 business days. We provide estimated completion times when you book your service and keep you updated throughout the process."
        },
        {
          q: "Do you provide warranties on repairs?",
          a: "Yes, all our repairs come with a comprehensive 1-year warranty covering parts and labor. AMC customers receive extended warranty coverage on all services."
        }
      ]
    },
    {
      category: "Booking & Pricing",
      questions: [
        {
          q: "How do I book a repair service?",
          a: "You can book online through our website, call our support line, or visit one of our service centers. Online booking is available 24/7 with instant confirmation and tracking."
        },
        {
          q: "What are your service charges?",
          a: "Our pricing varies by service type. Basic diagnostics start at $29, laptop repairs from $49, and desktop services from $39. We provide upfront pricing with no hidden costs."
        },
        {
          q: "Do you offer emergency or same-day service?",
          a: "Yes, we offer emergency repair services for critical business needs. Same-day service is available for an additional fee, subject to technician availability and service complexity."
        }
      ]
    },
    {
      category: "Technical Support",
      questions: [
        {
          q: "Can you help with data recovery?",
          a: "Yes, we offer comprehensive data recovery services for hard drives, SSDs, and other storage devices. Our success rate is over 95% with free evaluation and no-data-no-charge policy."
        },
        {
          q: "Do you provide remote support?",
          a: "AMC customers receive complimentary remote support for software issues, virus removal, and system optimization. One-time remote support is also available for $39."
        },
        {
          q: "What if my device can't be repaired?",
          a: "If your device is beyond economical repair, we'll provide a detailed assessment and recommend suitable replacement options. We also offer trade-in programs and data migration services."
        }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submitted":
        return "bg-blue-100 text-blue-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Waiting for Response":
        return "bg-yellow-100 text-yellow-800";
      case "Resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-orange-100 text-orange-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(faq =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  // Helper function to detect Android WebView
  const isAndroidWebView = () => {
    try {
      const userAgent = navigator.userAgent || '';
      return /Android/i.test(userAgent) && /wv|WebView/i.test(userAgent);
    } catch {
      return false;
    }
  };

  // Helper function to check for native bridge
  const hasNativeBridge = () => {
    try {
      return typeof (window as any).Android !== 'undefined' ||
        typeof (window as any).webkit !== 'undefined' ||
        typeof (window as any).flutter_inappwebview !== 'undefined';
    } catch {
      return false;
    }
  };

  // Helper function to open URL scheme (works in WebView)
  const openURLScheme = (url: string, scheme: 'tel' | 'mailto' | 'http' = 'http') => {
    try {
      const userAgent = navigator.userAgent || '';
      const isAndroid = /Android/i.test(userAgent);
      const isWebView = /wv|WebView/i.test(userAgent);
      const hasBridge = hasNativeBridge();

      // Method 1: Try native bridge if available
      if (hasBridge) {
        try {
          if ((window as any).Android && typeof (window as any).Android.openUrl === 'function') {
            (window as any).Android.openUrl(url);
            return;
          }
          if ((window as any).webkit && (window as any).webkit.messageHandlers && (window as any).webkit.messageHandlers.openUrl) {
            (window as any).webkit.messageHandlers.openUrl.postMessage(url);
            return;
          }
        } catch (e) {
          console.log('Native bridge failed:', e);
        }
      }

      // Method 2: For Android WebView, use local href for tel and mailto
      if (isAndroid && isWebView && (scheme === 'tel' || scheme === 'mailto')) {
        try {
          window.location.href = url;
          return;
        } catch (e) {
          console.error('Direct location set failed', e);
        }
      }

      // Method 3: For non-WebView or regular browsers, use standard methods
      if (!isWebView) {
        // Use anchor element for regular browsers
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.style.display = 'none';
        anchor.target = '_self';
        document.body.appendChild(anchor);

        setTimeout(() => {
          try {
            anchor.click();
          } catch (e) {
            console.log('Anchor click failed:', e);
          }

          setTimeout(() => {
            if (document.body.contains(anchor)) {
              document.body.removeChild(anchor);
            }
          }, 100);
        }, 10);
        return;
      }

      // Method 4: Last resort for WebView - show user message
      if (isWebView && (scheme === 'tel' || scheme === 'mailto')) {
        if (scheme === 'tel') {
          const phoneNumber = url.replace('tel:', '');
          toast({
            title: "Phone call not available",
            description: `Please dial manually: ${phoneNumber}`,
            variant: "destructive",
            duration: 4000,
          });
        } else {
          const email = url.replace('mailto:', '').split('?')[0];
          toast({
            title: "Email not available",
            description: `Please copy the email: ${email}`,
            variant: "destructive",
            duration: 4000,
          });
        }
        return;
      }

      // For HTTP URLs, use standard method
      if (scheme === 'http') {
        window.open(url, '_blank');
      }

    } catch (error) {
      console.error('Error opening URL scheme:', error);
      toast({
        title: "Unable to open",
        description: "Please try copying the contact information manually",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Quick contact functionality
  const handlePhoneCall = () => {
    // Remove dashes and spaces, use tel: protocol for mobile dialer
    const phoneNumber = '02269647030';
    openURLScheme(`tel:${phoneNumber}`, 'tel');
  };

  const handleEmailClick = () => {
    const email = 'info@getfixfly.com';
    const subject = encodeURIComponent('Support Request');
    const body = encodeURIComponent('Hello, I need help with...');
    openURLScheme(`mailto:${email}?subject=${subject}&body=${body}`, 'mailto');
  };

  const handleWhatsApp = () => {
    // WhatsApp number: 99313-54354, format: 919931354354 (with country code)
    const phoneNumber = '919931354354';
    const message = encodeURIComponent('Hello, I need support assistance.');
    openURLScheme(`https://wa.me/${phoneNumber}?text=${message}`, 'http');
  };

  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: `${type} copied successfully`,
        duration: 2000,
      });
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
        duration: 2000,
      });
    });
  };

  // Handle support type change
  const handleSupportTypeChange = (value: string) => {
    setSupportType(value);
    setShowCaseIdField(value === "service" || value === "product");
    setShowSubscriptionField(value === "amc");
    setCaseId("");
    setSelectedSubscriptionId("");
  };

  // Handle form submission
  const handleSubmitTicket = async () => {
    // Check if user is logged in - REMOVED strictly requirement, now checking guest fields
    // Check for explicit guest/user validation handled below

    if (!supportType || !ticketForm.subject || !ticketForm.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!user && (!ticketForm.guestName || !ticketForm.guestEmail || !ticketForm.guestPhone)) {
      toast({
        title: "Missing Information",
        description: "Please provide your contact details",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if ((supportType === "service" || supportType === "product") && !caseId) {
      toast({
        title: "Case ID Required",
        description: "Please enter your Case ID",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (supportType === "amc" && !selectedSubscriptionId) {
      toast({
        title: "AMC Subscription Required",
        description: "Please select your AMC subscription",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const ticketData = {
        supportType,
        caseId: caseId || null,
        subscriptionId: selectedSubscriptionId || null,
        subject: ticketForm.subject,
        description: ticketForm.description,
        // Add guest details if not logged in
        ...(!user && {
          name: ticketForm.guestName,
          email: ticketForm.guestEmail,
          phone: ticketForm.guestPhone
        })
      };

      const response = await supportTicketAPI.createTicket(ticketData);

      if (response.success) {
        // Refresh user tickets
        await fetchUserTickets();

        // Show thank you message
        setShowThankYou(true);

        // Reset form
        setSupportType("");
        setCaseId("");
        setSelectedSubscriptionId("");
        setShowCaseIdField(false);
        setShowSubscriptionField(false);
        setTicketForm({
          subject: "",
          category: "",
          priority: "",
          description: "",
          guestName: "",
          guestEmail: "",
          guestPhone: ""
        });

        toast({
          title: "Ticket Created Successfully",
          description: `Your ticket ${response.data.ticket.id} has been submitted`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error creating ticket:', error);

      // Check if it's an authentication error
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        toast({
          title: "Session Expired",
          description: "Please log in again to submit your ticket",
          variant: "destructive",
          duration: 3000,
        });
        // Redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create support ticket",
          variant: "destructive",
          duration: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle view ticket details
  const handleViewDetails = async (ticket) => {
    try {
      setLoading(true);
      // Fetch full ticket details from API
      const response = await supportTicketAPI.getTicket(ticket.id);
      if (response.success) {
        setSelectedTicket(response.data.ticket);
        setShowTicketDetails(true);
      } else {
        // Fallback to using the ticket from the list
        setSelectedTicket(ticket);
        setShowTicketDetails(true);
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      // Fallback to using the ticket from the list
      setSelectedTicket(ticket);
      setShowTicketDetails(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle add response
  const handleAddResponse = (ticket) => {
    setSelectedTicket(ticket);
    setShowAddResponse(true);
    setResponseText("");
  };

  // Submit response
  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      toast({
        title: "Response Required",
        description: "Please enter your response",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      const response = await supportTicketAPI.addResponse(selectedTicket.id, responseText.trim());

      if (response.success) {
        // Refresh user tickets
        await fetchUserTickets();

        // Close modal and show success
        setShowAddResponse(false);
        setResponseText("");
        setSelectedTicket(null);

        toast({
          title: "Response Submitted",
          description: "Your response has been sent to our support team",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit response",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Close modals
  const handleCloseDetails = () => {
    setShowTicketDetails(false);
    setSelectedTicket(null);
  };

  const handleCloseResponse = () => {
    setShowAddResponse(false);
    setResponseText("");
    setSelectedTicket(null);
  };

  return (
    <div className="min-h-screen pt-16 bg-secondary/30 pb-24 md:pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
            Support <span className="text-gradient">Center</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Get help with your FixFly repairs, ask questions.
            Our support team is here to assist you 24/7.
          </p>
        </div>


        {/* Support Tabs */}
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 md:mb-8 h-auto">
              <TabsTrigger value="new-ticket" className="flex flex-col items-center gap-1 py-3 px-2 text-xs sm:text-sm">
                <Plus className="h-4 w-4" />
                <span>New Ticket</span>
              </TabsTrigger>
              <TabsTrigger value="my-tickets" className="flex flex-col items-center gap-1 py-3 px-2 text-xs sm:text-sm">
                <MessageSquare className="h-4 w-4" />
                <span>My Tickets</span>
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex flex-col items-center gap-1 py-3 px-2 text-xs sm:text-sm">
                <HelpCircle className="h-4 w-4" />
                <span>FAQ</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new-ticket" className="space-y-4 md:space-y-6">
              {!showThankYou ? (
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                      <FileText className="h-4 w-4 md:h-5 md:w-5" />
                      Create New Support Ticket
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Select the type of support you need and our team will contact you within 12-48 hours.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 md:space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type of Support *</label>
                      <Select value={supportType} onValueChange={handleSupportTypeChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose support type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="service">Service Warranty Claim</SelectItem>
                          <SelectItem value="product">Product Warranty Claim</SelectItem>
                          <SelectItem value="amc">AMC Claim</SelectItem>
                          <SelectItem value="others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Guest User Fields */}
                    {!user && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Your Name *</label>
                          <Input
                            placeholder="Enter your full name"
                            className="w-full"
                            value={ticketForm.guestName}
                            onChange={(e) => setTicketForm({ ...ticketForm, guestName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Phone Number *</label>
                          <Input
                            placeholder="Enter your phone number"
                            className="w-full"
                            value={ticketForm.guestPhone}
                            onChange={(e) => setTicketForm({ ...ticketForm, guestPhone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium">Email Address *</label>
                          <Input
                            placeholder="Enter your email address"
                            type="email"
                            className="w-full"
                            value={ticketForm.guestEmail}
                            onChange={(e) => setTicketForm({ ...ticketForm, guestEmail: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Case ID Field - Only for Service and Product */}
                    {showCaseIdField && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Case ID *</label>
                        <Input
                          placeholder="Enter your Case ID"
                          className="w-full"
                          value={caseId}
                          onChange={(e) => setCaseId(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Please enter the Case ID from your previous service or product purchase.
                        </p>
                      </div>
                    )}

                    {/* Subscription ID Field - Only for AMC Claims */}
                    {showSubscriptionField && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">AMC Subscription *</label>
                        <Select
                          value={selectedSubscriptionId}
                          onValueChange={setSelectedSubscriptionId}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select your AMC subscription" />
                          </SelectTrigger>
                          <SelectContent>
                            {userAMCSubscriptions.length === 0 ? (
                              <SelectItem value="no-subscriptions" disabled>
                                No active AMC subscriptions found
                              </SelectItem>
                            ) : (
                              userAMCSubscriptions.map((subscription) => (
                                <SelectItem
                                  key={subscription._id}
                                  value={subscription.subscriptionId}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{subscription.planName}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ID: {subscription.subscriptionId} |{' '}
                                      {subscription.endDate
                                        ? ` Expires: ${new Date(
                                          subscription.endDate,
                                        ).toLocaleDateString()}`
                                        : ' Active'}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Select the AMC subscription you want to claim warranty for.
                        </p>
                      </div>
                    )}

                    {/* Subject */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject *</label>
                      <Input
                        placeholder="Brief description of your issue"
                        className="w-full"
                        value={ticketForm.subject}
                        onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Issue Description *</label>
                      <Textarea
                        placeholder="Please provide detailed information about your issue, including steps to reproduce, error messages, and any relevant details..."
                        className="min-h-[100px] md:min-h-[120px] w-full"
                        value={ticketForm.description}
                        onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-center md:justify-end">
                      <Button
                        className="bg-primary hover:bg-primary/90 w-full md:w-auto"
                        onClick={handleSubmitTicket}
                        disabled={loading}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {loading ? 'Submitting...' : 'Submit Ticket'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Thank You Message */
                <Card>
                  <CardContent className="pt-8 pb-8">
                    <div className="text-center space-y-6">
                      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl md:text-2xl font-semibold">Thank You!</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Your support ticket has been submitted successfully. Our team will contact you within 12-48 hours.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          A WhatsApp message has been sent to our support team with your ticket details.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setShowThankYou(false)}
                          className="w-full md:w-auto"
                        >
                          Create Another Ticket
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* My Tickets Tab */}
            <TabsContent value="my-tickets" className="space-y-4 md:space-y-6">
              {!user ? (
                /* Guest Access Message */
                <Card>
                  <CardContent className="pt-8 pb-8">
                    <div className="text-center space-y-6">
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl md:text-2xl font-semibold">Track Your Tickets</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Ticket history is available for registered users. As a guest, please check your email for updates on your submitted tickets.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Button
                          onClick={() => setActiveTab("new-ticket")}
                          className="bg-primary hover:bg-primary/90 w-full md:w-auto"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Ticket
                        </Button>
                        <p className="text-sm text-muted-foreground pt-2">
                          Have an account? <a href="/login" className="text-primary hover:underline">Login to view history</a>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* User's Tickets */
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                      <Clock className="h-4 w-4 md:h-5 md:w-5" />
                      My Tickets ({userTickets.length})
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Your submitted support tickets and their status.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userTickets.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Tickets Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          You haven't submitted any support tickets yet.
                        </p>
                        <Button
                          onClick={() => setActiveTab("new-ticket")}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Ticket
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 md:space-y-4">
                        {userTickets.map((ticket) => (
                          <div key={ticket.id} className="border rounded-lg p-3 md:p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex flex-col gap-3 md:gap-4">
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-sm md:text-base">{ticket.subject}</h3>
                                  <div className="flex flex-wrap gap-1">
                                    <Badge className={`${getStatusColor(ticket.status)} text-xs`}>
                                      {ticket.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs md:text-sm text-muted-foreground">
                                  <span>ID: {ticket.id}</span>
                                  <span>Type: {ticket.type}</span>
                                  {ticket.caseId && <span>Case ID: {ticket.caseId}</span>}
                                  <span>Created: {ticket.created}</span>
                                  <span>Last Update: {ticket.lastUpdate}</span>
                                </div>
                              </div>
                              <div className="flex justify-center md:justify-start gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full sm:w-auto"
                                  onClick={() => handleViewDetails(ticket)}
                                >
                                  View Details
                                </Button>
                                {hasPendingPayment(ticket) && (
                                  <Button
                                    size="sm"
                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handlePayNow(ticket)}
                                  >
                                    Pay Now ₹{ticket.totalAmount || ticket.billingAmount || 0}
                                  </Button>
                                )}
                                {ticket.status === 'Resolved' && ticket.paymentStatus === 'collected' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                    onClick={() => handleDownloadInvoice(ticket)}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Invoice
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-4 md:space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <HelpCircle className="h-4 w-4 md:h-5 md:w-5" />
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Find quick answers to common questions about our services.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 md:mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search FAQs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    {filteredFaqs.map((category, index) => (
                      <div key={index}>
                        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
                          <Users className="h-4 w-4 md:h-5 md:w-5" />
                          {category.category}
                        </h3>
                        <Accordion type="single" collapsible className="space-y-2">
                          {category.questions.map((faq, faqIndex) => (
                            <AccordionItem key={faqIndex} value={`${index}-${faqIndex}`} className="border rounded-lg px-3 md:px-4">
                              <AccordionTrigger className="text-left hover:no-underline py-3">
                                <span className="font-medium text-sm md:text-base">{faq.q}</span>
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground pb-3 md:pb-4 text-sm md:text-base">
                                {faq.a}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    ))}
                  </div>

                  {filteredFaqs.length === 0 && searchQuery && (
                    <div className="text-center py-6 md:py-8">
                      <HelpCircle className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
                      <p className="text-muted-foreground text-sm md:text-base">No FAQs found matching your search.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>


        {/* Quick Contact Options */}
        <div className="max-w-2xl mx-auto mt-8 md:mt-12">
          <div className="text-center mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold mb-1">Need Immediate Help?</h2>
            <p className="text-xs md:text-sm text-muted-foreground">Get in touch with our support team</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div className="text-center cursor-pointer group" onClick={handlePhoneCall}>
              <div className="bg-gradient-tech p-2 md:p-3 rounded-lg w-fit mx-auto mb-2 md:mb-3 group-hover:scale-105 transition-transform duration-300">
                <Phone className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2">Phone</h3>
              <div className="flex items-center justify-center gap-1 mb-1">
                <p className="font-semibold text-primary text-xs md:text-sm">022-6964-7030</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyToClipboard('022-6964-7030', 'Phone number');
                  }}
                >
                  <Copy className="h-2 w-2" />
                </Button>
              </div>
              <Button
                size="sm"
                className="flex bg-primary hover:bg-primary/90 text-white text-xs px-2 py-1 w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePhoneCall();
                }}
              >
                <Phone className="h-3 w-3 mr-1" />
                Call
              </Button>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-tech p-2 md:p-3 rounded-lg w-fit mx-auto mb-2 md:mb-3 group-hover:scale-105 transition-transform duration-300">
                <Mail className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2">Email</h3>
              <div className="flex items-center justify-center gap-1 mb-1">
                <p className="font-semibold text-primary text-xs md:text-sm" style={{ pointerEvents: 'none', userSelect: 'none' }}>info@getfixfly.com</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyToClipboard('info@getfixfly.com', 'Email address');
                  }}
                >
                  <Copy className="h-2 w-2" />
                </Button>
              </div>
              <Button
                size="sm"
                className="flex bg-primary hover:bg-primary/90 text-white text-xs px-2 py-1 w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEmailClick();
                }}
              >
                <Mail className="h-3 w-3 mr-1" />
                Email
              </Button>
            </div>

            <div className="text-center cursor-pointer group" onClick={handleWhatsApp}>
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-2 md:p-3 rounded-lg w-fit mx-auto mb-2 md:mb-3 group-hover:scale-105 transition-transform duration-300">
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2">WhatsApp</h3>
              <div className="flex items-center justify-center gap-1 mb-1">
                <p className="font-semibold text-primary text-xs md:text-sm">99313-54354</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyToClipboard('99313-54354', 'WhatsApp number');
                  }}
                >
                  <Copy className="h-2 w-2" />
                </Button>
              </div>
              <Button
                size="sm"
                className="flex bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleWhatsApp();
                }}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>

        {/* Ticket Details Modal */}
        {showTicketDetails && selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-end md:items-end md:justify-center z-50 p-0 md:p-4 md:pb-16">
            <Card className="w-full h-[85vh] md:max-w-2xl md:h-auto md:max-h-[70vh] flex flex-col rounded-t-xl md:rounded-xl">
              <CardHeader className="pb-3 md:pb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <FileText className="h-4 w-4 md:h-5 md:w-5" />
                    Ticket Details
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={handleCloseDetails} className="text-lg">
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="text-xs md:text-sm font-medium text-muted-foreground">Ticket ID</label>
                    <p className="font-semibold text-sm md:text-base">{selectedTicket.id}</p>
                  </div>
                  <div>
                    <label className="text-xs md:text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge className={`${getStatusColor(selectedTicket.status)} text-xs`}>
                        {selectedTicket.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs md:text-sm font-medium text-muted-foreground">Type</label>
                    <p className="font-medium text-sm md:text-base">{selectedTicket.type}</p>
                  </div>
                  {selectedTicket.caseId && (
                    <div>
                      <label className="text-xs md:text-sm font-medium text-muted-foreground">Case ID</label>
                      <p className="font-medium text-sm md:text-base">{selectedTicket.caseId}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs md:text-sm font-medium text-muted-foreground">Created</label>
                    <p className="font-medium text-sm md:text-base">{selectedTicket.created}</p>
                  </div>
                  <div>
                    <label className="text-xs md:text-sm font-medium text-muted-foreground">Last Update</label>
                    <p className="font-medium text-sm md:text-base">{selectedTicket.lastUpdate}</p>
                  </div>
                  {selectedTicket.billingAmount > 0 && (
                    <div>
                      <label className="text-xs md:text-sm font-medium text-muted-foreground">Billing Amount</label>
                      <p className="font-medium text-sm md:text-base">₹{selectedTicket.billingAmount}</p>
                    </div>
                  )}
                  {selectedTicket.paymentMode && (
                    <div>
                      <label className="text-xs md:text-sm font-medium text-muted-foreground">Payment Mode</label>
                      <p className="font-medium text-sm md:text-base capitalize">{selectedTicket.paymentMode}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs md:text-sm font-medium text-muted-foreground">Subject</label>
                  <p className="font-semibold mt-1 text-sm md:text-base">{selectedTicket.subject}</p>
                </div>

                <div>
                  <label className="text-xs md:text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1 text-xs md:text-sm leading-relaxed">{selectedTicket.description}</p>
                </div>

                {/* Payment Information */}
                {hasPendingPayment(selectedTicket) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-green-800 mb-1">Payment Required</h3>
                        <p className="text-xs text-green-600">Complete your payment to finalize this support ticket</p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handlePayNow(selectedTicket)}
                      >
                        Pay Now ₹{selectedTicket.totalAmount || selectedTicket.billingAmount || 0}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Engineer Information - Show only when vendor has accepted */}
                {selectedTicket.assignedTo && selectedTicket.vendorStatus === 'Accepted' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 md:p-3">
                    <h3 className="font-bold text-sm md:text-base text-green-900 mb-1.5 md:mb-2 flex items-center">
                      <User className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 text-green-600" />
                      Assigned Engineer
                    </h3>
                    <div className="space-y-1.5 md:space-y-2 md:grid md:grid-cols-2 md:gap-4">
                      <div>
                        <p className="text-xs md:text-sm text-green-600 md:text-green-700">Name</p>
                        <p className="font-medium text-xs md:text-sm text-green-900">
                          {selectedTicket.assignedTo.name}
                        </p>
                      </div>
                      {selectedTicket.assignedTo.phone && (
                        <div>
                          <p className="text-xs md:text-sm text-green-600 md:text-green-700">Phone</p>
                          <p className="font-medium text-xs md:text-sm text-green-900">{selectedTicket.assignedTo.phone}</p>
                        </div>
                      )}
                      {selectedTicket.assignedTo.email && (
                        <div>
                          <p className="text-xs md:text-sm text-green-600 md:text-green-700">Email</p>
                          <p className="font-medium text-xs md:text-sm text-green-900 break-all" style={{ pointerEvents: 'none', userSelect: 'none' }}>{selectedTicket.assignedTo.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Download Invoice for Resolved Tickets */}
                {selectedTicket.status === 'Resolved' && selectedTicket.paymentStatus === 'collected' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-blue-800 mb-1">Invoice Available</h3>
                        <p className="text-xs text-blue-600">Download your invoice for this completed ticket</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        onClick={() => handleDownloadInvoice(selectedTicket)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Invoice
                      </Button>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Response Modal */}
        {showAddResponse && selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5" />
                    Add Response
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={handleCloseResponse}>
                    ✕
                  </Button>
                </div>
                <CardDescription className="text-sm">
                  Add a response to ticket {selectedTicket.id}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Your Response *</label>
                  <Textarea
                    placeholder="Type your response here..."
                    className="min-h-[120px] w-full mt-2"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCloseResponse}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitResponse}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Response
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default Support;