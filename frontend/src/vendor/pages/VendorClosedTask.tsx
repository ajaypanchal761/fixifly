import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMediaQuery, useTheme } from "@mui/material";
import {
  ArrowLeft,
  Plus,
  X,
  Camera,
  FileText,
  DollarSign,
  Loader2
} from "lucide-react";
import VendorHeader from "../components/VendorHeader";
import VendorBottomNav from "../components/VendorBottomNav";
import vendorApi from "@/services/vendorApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import WalletBalanceCheck from "../components/WalletBalanceCheck";
import { calculateCashCollectionDeduction } from "@/utils/walletCalculation";

interface SparePart {
  id: number;
  name: string;
  amount: string;
  photo: string | null;
  warranty: string;
}

// Image compression utility
const compressImage = (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (err) => reject(err);
  });
};

const VendorClosedTask = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { taskId } = useParams();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash' | ''>('');
  const [includeGST, setIncludeGST] = useState(false);
  const [billingAmount, setBillingAmount] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCashWarning, setShowCashWarning] = useState(false);
  const [isWalletCheckOpen, setIsWalletCheckOpen] = useState(false);
  const [spareParts, setSpareParts] = useState<SparePart[]>([
    { id: 1, name: "", amount: "", photo: null, warranty: "" }
  ]);

  // Refs for file inputs - one per spare part for APK compatibility
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // New States for Online Payment QR Flow (Moved to top)
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrStep, setQrStep] = useState<'scan' | 'proof'>('scan');
  const [tempTaskData, setTempTaskData] = useState<any>(null);
  const [paymentProofImage, setPaymentProofImage] = useState<string | null>(null);
  const paymentProofInputRef = useRef<HTMLInputElement>(null);

  // Device Serial Number State (Moved to top)
  const [deviceSerialImage, setDeviceSerialImage] = useState<string | null>(null);
  const serialNumberInputRef = useRef<HTMLInputElement>(null);

  // Show 404 error on desktop - must be AFTER all hooks
  if (!isMobile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h1>
          <p className="text-gray-600">This page is only available on mobile devices.</p>
        </div>
      </div>
    );
  }

  // Fetch task details from API
  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const vendorToken = localStorage.getItem('vendorToken');
      const vendorData = localStorage.getItem('vendorData');

      console.log('Vendor authentication check:', {
        hasToken: !!vendorToken,
        hasVendorData: !!vendorData,
        tokenLength: vendorToken ? vendorToken.length : 0
      });

      if (!vendorToken) {
        console.error('Vendor not authenticated - no token');
        setError('Please log in as a vendor to view task details');
        setLoading(false);
        return;
      }

      console.log('Fetching task details for taskId:', taskId);

      // Test backend connectivity first
      try {
        const testResponse = await vendorApi.test();
        console.log('Backend test response:', testResponse);
      } catch (testError) {
        console.error('Backend test failed:', testError);
        setError('Cannot connect to backend server. Please check your connection.');
        setLoading(false);
        return;
      }

      // Fetch both bookings and support tickets to find the specific task
      const [bookingsResponse, supportTicketsResponse] = await Promise.all([
        vendorApi.getVendorBookings(),
        vendorApi.getAssignedSupportTickets()
      ]);

      console.log('API Responses:', {
        bookingsResponse,
        supportTicketsResponse
      });

      let foundTask = null;
      let isSupportTicket = false;

      // Check in bookings first
      if (bookingsResponse.success && bookingsResponse.data?.bookings) {
        const bookings = bookingsResponse.data.bookings;
        const bookingTask = bookings.find(booking => booking._id === taskId);

        if (bookingTask) {
          // Transform booking data to task format
          foundTask = {
            id: bookingTask._id,
            caseId: bookingTask.bookingReference || `FIX${bookingTask._id.toString().substring(bookingTask._id.toString().length - 8).toUpperCase()}`,
            title: bookingTask.services?.[0]?.serviceName || 'Service Request',
            customer: bookingTask.customer?.name || 'Unknown Customer',
            phone: bookingTask.customer?.phone || 'N/A',
            amount: `₹${bookingTask.pricing?.totalAmount || 0}`,
            date: bookingTask.scheduling?.scheduledDate
              ? new Date(bookingTask.scheduling.scheduledDate).toLocaleDateString('en-IN')
              : bookingTask.scheduling?.preferredDate
                ? new Date(bookingTask.scheduling.preferredDate).toLocaleDateString('en-IN')
                : new Date(bookingTask.createdAt).toLocaleDateString('en-IN'),
            time: bookingTask.scheduling?.scheduledTime
              ? new Date(`2000-01-01T${bookingTask.scheduling.scheduledTime}`).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
              : bookingTask.scheduling?.preferredTimeSlot || 'Not scheduled',
            status: bookingTask.priority === 'urgent' ? 'Emergency' :
              bookingTask.priority === 'high' ? 'High Priority' :
                bookingTask.priority === 'low' ? 'Low Priority' : 'Normal',
            address: bookingTask.customer?.address
              ? typeof bookingTask.customer.address === 'object'
                ? `${bookingTask.customer.address.street || ''}, ${bookingTask.customer.address.city || ''}, ${bookingTask.customer.address.state || ''} - ${bookingTask.customer.address.pincode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')
                : bookingTask.customer.address
              : 'Address not provided',
            issue: bookingTask.notes || bookingTask.services?.[0]?.serviceName || 'Service request',
            assignDate: bookingTask.vendor?.assignedAt
              ? new Date(bookingTask.vendor.assignedAt).toLocaleDateString('en-IN')
              : new Date(bookingTask.createdAt).toLocaleDateString('en-IN'),
            assignTime: bookingTask.vendor?.assignedAt
              ? new Date(bookingTask.vendor.assignedAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
              : 'Not assigned',
            taskType: bookingTask.services?.[0]?.serviceName || 'Service Request',
            bookingStatus: bookingTask.status,
            priority: bookingTask.priority || 'medium',
            isSupportTicket: false
          };
        }
      }

      // If not found in bookings, check in support tickets
      if (!foundTask && supportTicketsResponse.success && supportTicketsResponse.data?.tickets) {
        const supportTickets = supportTicketsResponse.data.tickets;
        const supportTicket = supportTickets.find(ticket => ticket.id === taskId);

        if (supportTicket) {
          isSupportTicket = true;
          // Transform support ticket data to task format
          foundTask = {
            id: supportTicket.id,
            caseId: supportTicket.id,
            title: supportTicket.subject || 'Support Request',
            customer: supportTicket.customerName || 'Unknown Customer',
            phone: supportTicket.customerPhone || 'N/A',
            amount: 'Support Ticket',
            date: supportTicket.scheduledDate
              ? new Date(supportTicket.scheduledDate).toLocaleDateString('en-IN')
              : supportTicket.created
                ? new Date(supportTicket.created).toLocaleDateString('en-IN')
                : new Date().toLocaleDateString('en-IN'),
            time: supportTicket.scheduledTime
              ? (() => {
                // Convert 24-hour format to 12-hour format with AM/PM
                if (supportTicket.scheduledTime.includes(':')) {
                  const [hours, minutes] = supportTicket.scheduledTime.split(':');
                  const hour24 = parseInt(hours);
                  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                  const ampm = hour24 >= 12 ? 'PM' : 'AM';
                  return `${hour12}:${minutes} ${ampm}`;
                }
                return supportTicket.scheduledTime;
              })()
              : 'Not scheduled',
            status: supportTicket.priority === 'High' ? 'High Priority' :
              supportTicket.priority === 'Medium' ? 'Normal' : 'Low Priority',
            address: supportTicket.address || 'Address not provided',
            issue: supportTicket.description || supportTicket.subject || 'Support request',
            assignDate: supportTicket.assignedAt
              ? new Date(supportTicket.assignedAt).toLocaleDateString('en-IN')
              : new Date().toLocaleDateString('en-IN'),
            assignTime: supportTicket.assignedAt
              ? new Date(supportTicket.assignedAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
              : 'Not assigned',
            taskType: supportTicket.subject || 'Support Request',
            vendorStatus: supportTicket.vendorStatus,
            priority: supportTicket.priority?.toLowerCase() || 'medium',
            assignmentNotes: supportTicket.scheduleNotes || null, // Map scheduleNotes to assignmentNotes for display
            isSupportTicket: true
          };
        }
      }

      if (foundTask) {
        setTask(foundTask);
      } else {
        setError('Task not found');
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
      setError('Failed to load task details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  // Automatically uncheck GST when cash payment is selected
  useEffect(() => {
    if (paymentMethod === 'cash') {
      setIncludeGST(false);
    }
  }, [paymentMethod]);

  // Calculate GST amount (18% of billing amount)
  const calculateGSTAmount = () => {
    const billingAmountValue = billingAmount ? parseFloat(String(billingAmount).replace(/[₹,]/g, '')) || 0 : 0;
    if (!includeGST) return 0;
    return billingAmountValue * 0.18; // 18% GST on base amount
  };

  // Calculate GST-excluded amount (base amount without GST)
  const calculateGSTExcludedAmount = () => {
    const billingAmountValue = billingAmount ? parseFloat(String(billingAmount).replace(/[₹,]/g, '')) || 0 : 0;
    if (!includeGST) return billingAmountValue;
    return billingAmountValue; // Base amount (GST-excluded)
  };

  // Calculate total billing amount (base amount + GST if GST is included + spares + visiting)
  // Calculate total billing amount (base amount + GST if GST is included + spares + visiting)
  const calculateBillingTotal = () => {
    return calculateTotal(); // Visiting charge already included in Final Billing Amount entered by user
  };

  const calculateRequiredWalletAmount = (): number => {
    if (paymentMethod !== 'cash') return 0;

    const billingAmountValue = billingAmount ? parseFloat(String(billingAmount).replace(/[₹,]/g, '')) || 0 : 0;
    const spareAmountValue = spareParts.reduce((sum, part) => {
      return sum + (parseFloat(String(part.amount).replace(/[₹,]/g, '')) || 0);
    }, 0);
    const travellingAmountValue = 130; // Fixed travelling amount

    const calculation = calculateCashCollectionDeduction({
      billingAmount: calculateTotal(), // Pass the Grand Total (Service + Visiting) - Visiting included in user input
      spareAmount: 0, // spareAmountValue, // Spare amount excluded from deduction calculation as it's not billed to user
      travellingAmount: travellingAmountValue,
      bookingAmount: 0,
      gstIncluded: includeGST
    });

    return calculation.calculatedAmount;
  };

  const handleCashWarningCancel = () => {
    setShowCashWarning(false);
  };

  const handleWalletCheckProceed = () => {
    setIsWalletCheckOpen(false);
    // Proceed with task completion
    handleNext();
  };

  const calculateTotal = () => {
    const billingAmountValue = billingAmount ? parseFloat(String(billingAmount).replace(/[₹,]/g, '')) || 0 : 0;
    const gstValue = includeGST ? billingAmountValue * 0.18 : 0;

    const sparePartsTotal = spareParts.reduce((sum, part) => {
      return sum + (parseFloat(String(part.amount).replace(/[₹,]/g, '')) || 0);
    }, 0);

    return billingAmountValue + gstValue + sparePartsTotal;
  };

  const addSparePart = () => {
    const newId = spareParts.length > 0 ? Math.max(...spareParts.map(p => p.id)) + 1 : 1;
    setSpareParts([...spareParts, { id: newId, name: "", amount: "", photo: null, warranty: "" }]);
  };

  const removeSparePart = (id: number) => {
    if (spareParts.length > 1) {
      setSpareParts(prev => prev.filter(p => p.id !== id));
      // Clean up ref if needed, though react handles this mainly
      if (fileInputRefs.current[id]) {
        delete fileInputRefs.current[id];
      }
    }
  };

  const updateSparePart = (id: number, field: keyof SparePart, value: string) => {
    setSpareParts(prev => prev.map(part =>
      part.id === id ? { ...part, [field]: value } : part
    ));
  };

  const triggerCamera = (id: number) => {
    if (fileInputRefs.current[id]) {
      fileInputRefs.current[id]?.click();
    }
  };

  const handlePhotoCapture = async (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size is too large. Please capture a smaller image.');
      event.target.value = '';
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        if (!base64String) {
          alert('Failed to read image.');
          return;
        }

        try {
          const compressed = await compressImage(base64String);
          setSpareParts(prev => prev.map(part =>
            part.id === id ? { ...part, photo: compressed } : part
          ));
        } catch (compressError) {
          console.error('Image compression failed:', compressError);
          alert('Failed to process image. Please try again.');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read image.');
    }
  };

  const handleCashPaymentClick = () => {
    setShowCashWarning(true);
  };

  const handleCashWarningConfirm = () => {
    setPaymentMethod('cash');
    setShowCashWarning(false);
  };

  // New States for Online Payment QR Flow - MOVED TO TOP

  const handlePaymentProofCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size is too large. Please capture a smaller image.');
      event.target.value = '';
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        if (!base64String) {
          alert('Failed to read image.');
          return;
        }

        try {
          const compressedImage = await compressImage(base64String, 800, 0.7);
          setPaymentProofImage(compressedImage);
          console.log(`✅ Payment proof image captured`);
        } catch (compressError) {
          console.error('Image compression failed:', compressError);
          alert('Failed to process image. Please try again.');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read image.');
    }
  };

  const triggerPaymentProofCamera = () => {
    if (paymentProofInputRef.current) {
      paymentProofInputRef.current.value = '';
      paymentProofInputRef.current.click();
    }
  };

  const handleFinalOnlineSubmission = async () => {
    if (!tempTaskData) return;

    if (!paymentProofImage) {
      alert('Please upload/capture payment proof screenshot.');
      return;
    }

    setIsCompleting(true);

    try {
      // Add payment proof to task data
      const finalTaskData = {
        ...tempTaskData,
        paymentProofImage: paymentProofImage
      };

      let response;
      if (task?.isSupportTicket) {
        response = await vendorApi.completeSupportTicket(taskId!, finalTaskData);
      } else {
        response = await vendorApi.completeTask(taskId!, finalTaskData);
      }

      if (response.success) {
        const totalAmount = finalTaskData.totalAmount;
        const gstAmount = finalTaskData.gstAmount;
        const includeGST = finalTaskData.includeGST;

        if (task?.isSupportTicket) {
          alert(`Support ticket completed successfully! Payment verified.`);
        } else {
          alert(`Task completed successfully! Online payment verified.`);
        }

        // Trigger refresh event for vendor home page
        window.dispatchEvent(new CustomEvent('taskCompleted', {
          detail: { taskId, status: 'completed', totalAmount, includeGST, gstAmount }
        }));

        // Store payment data in localStorage for user page
        const paymentData = {
          taskId,
          includeGST: task?.isSupportTicket ? false : includeGST,
          gstAmount: task?.isSupportTicket ? 0 : gstAmount,
          totalAmount,
          baseAmount: task?.isSupportTicket ? totalAmount : (totalAmount - gstAmount),
          isSupportTicket: task?.isSupportTicket || false,
          timestamp: Date.now()
        };

        // Store with both key formats for compatibility
        localStorage.setItem(`payment_${taskId}`, JSON.stringify(paymentData));
        localStorage.setItem(`gst_${taskId}`, JSON.stringify(paymentData));

        // Trigger event for user page refresh
        const eventName = task?.isSupportTicket ? 'supportTicketUpdated' : 'bookingUpdated';
        window.dispatchEvent(new CustomEvent(eventName, {
          detail: {
            taskId,
            status: 'completed', // Completed now since payment is verified
            paymentMode: 'online',
            paymentStatus: 'collected', // Collected via QR
            includeGST: task?.isSupportTicket ? false : includeGST,
            gstAmount: task?.isSupportTicket ? 0 : gstAmount,
            totalAmount,
            completionData: finalTaskData
          }
        }));

        navigate('/vendor');
      } else {
        alert(response.message || 'Failed to complete task');
      }

    } catch (error: any) {
      console.error('Error completing task:', error);
      alert(error.message || 'Failed to complete task. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleNext = async () => {
    try {
      // Validate payment method is selected
      if (!paymentMethod) {
        alert('Please select a payment method');
        return;
      }

      // Validate resolution note
      if (!resolutionNote.trim()) {
        alert('Please enter resolution notes');
        return;
      }

      // Validate Device Serial Number Image
      if (!deviceSerialImage) {
        alert('Please capture the Device Serial Number image.');
        return;
      }

      // Validate billing amount for both support tickets and booking tasks
      if (!billingAmount || billingAmount.trim() === '') {
        alert('Please enter billing amount');
        return;
      }

      setIsCompleting(true);

      // Validate billing amount value
      const billingAmountValue = billingAmount ? parseFloat(String(billingAmount).replace(/[₹,]/g, '')) || 0 : 0;
      if (billingAmountValue <= 0) {
        alert('Please enter a valid billing amount greater than 0');
        setIsCompleting(false);
        return;
      }

      // Validate spare parts - check if all spare parts with names have photos and warranty
      const validSpareParts = spareParts.filter(part => part.name.trim() !== '');
      if (validSpareParts.length > 0) {
        for (const part of validSpareParts) {
          if (!part.photo) {
            alert(`Please capture photo for spare part: ${part.name || 'Part ' + (spareParts.indexOf(part) + 1)}`);
            setIsCompleting(false);
            return;
          }

          // Validate photo size (should be compressed, max 800KB base64)
          if (part.photo) {
            const photoSizeKB = part.photo.length / 1024;
            if (photoSizeKB > 800) {
              alert(`Image for "${part.name}" is too large (${photoSizeKB.toFixed(2)}KB). Please capture again.`);
              setIsCompleting(false);
              return;
            }
          }

          if (!part.warranty) {
            alert(`Please select warranty period for spare part: ${part.name || 'Part ' + (spareParts.indexOf(part) + 1)}`);
            setIsCompleting(false);
            return;
          }
        }
      }

      console.log('Billing amount calculation:', {
        originalBillingAmount: billingAmount,
        billingAmountValue: billingAmountValue,
        isSupportTicket: task?.isSupportTicket
      });

      // Calculate the correct billing amount to send to backend
      const billingAmountForBackend = billingAmountValue;

      const taskData = {
        resolutionNote: resolutionNote.trim(),
        spareParts: validSpareParts, // Only include parts with names, photos, and warranty
        paymentMethod: paymentMethod as 'online' | 'cash',
        includeGST: includeGST,
        gstAmount: includeGST ? calculateGSTAmount() : 0,
        totalAmount: calculateBillingTotal(), // Use total amount including GST
        billingAmount: String(billingAmountForBackend), // Send GST-excluded amount for vendor calculation as String
        travelingAmount: "130",
        deviceSerialImage: deviceSerialImage // Include device serial image
      };

      // If Online Payment -> Open QR Modal
      if (paymentMethod === 'online') {
        setTempTaskData(taskData);
        setQrStep('scan');
        setPaymentProofImage(null); // Reset proof image for new flow
        setShowQRModal(true);
        setIsCompleting(false); // Stop loading state for now, will restart on final submission
        return;
      }

      // Calculate payload size for debugging and validation
      const payloadString = JSON.stringify(taskData);
      const payloadSizeKB = parseFloat((new Blob([payloadString]).size / 1024).toFixed(2));
      console.log('Task data being sent:', taskData);
      console.log('Payload size:', `${payloadSizeKB} KB`);

      // Validate payload size before sending (max 2MB to accommodate extra image)
      if (payloadSizeKB > 2000) {
        alert(`Request size is too large (${payloadSizeKB.toFixed(2)}KB). Please try capturing smaller images.`);
        setIsCompleting(false);
        return;
      }

      // Warn if payload is large (over 500KB)
      if (payloadSizeKB > 500) {
        console.warn('⚠️ Large payload detected. This may cause timeout issues.');
        // Still allow but warn user
        const proceed = confirm(`Warning: Request size is large (${payloadSizeKB.toFixed(2)}KB). This may take longer. Do you want to continue?`);
        if (!proceed) {
          setIsCompleting(false);
          return;
        }
      }

      // Call the appropriate complete task API based on task type
      let response;
      if (task?.isSupportTicket) {
        response = await vendorApi.completeSupportTicket(taskId!, taskData);
      } else {
        response = await vendorApi.completeTask(taskId!, taskData);
      }

      if (response.success) {
        // For cash payment (Online handled above), show success message and redirect
        alert('Task completed successfully! Payment will be collected on site.');

        // Trigger refresh event for vendor home page
        window.dispatchEvent(new CustomEvent('taskCompleted', {
          detail: { taskId, status: 'completed' }
        }));

        // Also trigger event for user bookings refresh - move to completed
        console.log('=== VENDOR CASH PAYMENT COMPLETION ===');
        console.log('Triggering bookingUpdated event with data:', {
          taskId,
          status: 'completed',
          paymentMode: 'cash',
          paymentStatus: 'collected'
        });

        window.dispatchEvent(new CustomEvent('bookingUpdated', {
          detail: { taskId, status: 'completed', paymentMode: 'cash', paymentStatus: 'collected' }
        }));

        console.log('bookingUpdated event dispatched successfully');

        navigate('/vendor');
      } else {
        alert(response.message || 'Failed to complete task. Please try again.');
      }
    } catch (error: any) {
      console.error('Error completing task:', error);
      // Show more detailed error message...
      let errorMessage = 'An error occurred while completing the task. Please try again.';
      if (error?.message) {
        if (error.message.includes('timeout')) errorMessage = 'Request timeout. Check internet connection.';
        else errorMessage = error.message;
      }
      alert(errorMessage);
    } finally {
      setIsCompleting(false);
    }
  };

  // Device Serial Number State - MOVED TO TOP

  const handleSerialImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size is too large. Please capture a smaller image.');
      event.target.value = '';
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        if (!base64String) { alert('Failed to read image.'); return; }
        try {
          const compressedImage = await compressImage(base64String, 800, 0.7);
          setDeviceSerialImage(compressedImage);
        } catch (compressError) {
          alert('Failed to process image.');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert('Failed to read image.');
    }
  };

  const triggerSerialCamera = () => {
    if (serialNumberInputRef.current) {
      serialNumberInputRef.current.value = '';
      serialNumberInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 md:pb-0 pt-16 md:pt-0 overflow-y-auto">
        <div className="container mx-auto px-4 py-4 max-w-2xl pb-32">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <h1 className="text-xl font-bold text-gray-800 mb-6">Close Task</h1>

          <div className="space-y-6">

            {/* Device Serial Number Image Section */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-500" />
                Device Serial Number <span className="text-red-500">*</span>
              </h3>

              <div
                onClick={triggerSerialCamera}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="file"
                  ref={serialNumberInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleSerialImageCapture}
                />

                {deviceSerialImage ? (
                  <div className="relative w-full h-64 flex items-center justify-center overflow-hidden rounded-md bg-gray-50">
                    <img
                      src={deviceSerialImage}
                      alt="Device Serial Number"
                      className="max-w-full max-h-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <span className="text-white font-medium bg-black/60 px-4 py-2 rounded-full shadow-lg backdrop-blur-sm">
                        Retake Photo
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 text-blue-600">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Tap to capture serial number</p>
                    <p className="text-xs text-gray-400 mt-1">Required for verification</p>
                  </>
                )}
              </div>
            </div>

            {/* Resolution Note */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Resolution Note <span className="text-red-500">*</span></h3>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Describe the work done to resolve the issue..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              />
            </div>

            {/* Spare Parts */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Spare Parts (Optional)</h3>
                <button
                  onClick={addSparePart}
                  className="text-sm text-blue-600 font-medium flex items-center hover:text-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Part
                </button>
              </div>

              {spareParts.map((part, index) => (
                <div key={part.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 relative">
                  {spareParts.length > 1 && (
                    <button
                      onClick={() => removeSparePart(part.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <div className="space-y-3">
                    {/* Part Name */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Part Name</label>
                      <input
                        type="text"
                        value={part.name}
                        onChange={(e) => updateSparePart(part.id, 'name', e.target.value)}
                        placeholder="e.g. Capacitor, Fan Motor"
                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Part Amount and Warranty */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Amount (₹)</label>
                        <input
                          type="number"
                          value={part.amount}
                          onChange={(e) => updateSparePart(part.id, 'amount', e.target.value)}
                          placeholder="0"
                          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Warranty</label>
                        <select
                          value={part.warranty}
                          onChange={(e) => updateSparePart(part.id, 'warranty', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Select</option>
                          <option value="No Warranty">No Warranty</option>
                          <option value="3 Months">3 Months</option>
                          <option value="6 Months">6 Months</option>
                          <option value="1 Year">1 Year</option>
                          <option value="3 Years">3 Years</option>
                          <option value="5 Years">5 Years</option>
                        </select>
                      </div>
                    </div>

                    {/* Part Photo */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Part Photo</label>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => triggerCamera(part.id)}
                          className="flex items-center justify-center p-2 bg-white border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 flex-1"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          <span className="text-xs">Take Photo</span>
                        </button>

                        {/* Hidden input for this specific part */}
                        <input
                          type="file"
                          ref={el => fileInputRefs.current[part.id] = el}
                          accept="image/*"
                          capture="environment"
                          style={{ display: 'none' }}
                          onChange={(e) => handlePhotoCapture(part.id, e)}
                        />

                        {part.photo && (
                          <div className="w-10 h-10 relative">
                            <img
                              src={part.photo}
                              alt="Part"
                              className="w-full h-full object-cover rounded-md border border-gray-300"
                            />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Billing Info */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
              <h3 className="text-sm font-medium text-gray-700 border-b pb-2">Billing Information</h3>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Final Billing Amount</span>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={billingAmount}
                    onChange={(e) => setBillingAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded-md text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end -mt-3 mb-2">
                <p className="text-[10px] text-gray-500">Traveling Amount 130 will Auto Adjust</p>
              </div>

              {/* Visiting Charge removed as per requirement - included in Auto Adjust logic */}

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-base font-bold text-gray-900">Total Amount</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-600">
                    ₹{calculateTotal().toLocaleString()}
                  </span>
                  {includeGST && (
                    <p className="text-xs text-gray-500">(Includes 18% GST)</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Method <span className="text-red-500">*</span></h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('online')}
                  className={`p-3 rounded-lg border text-sm font-medium flex flex-col items-center justify-center space-y-1 transition-all ${paymentMethod === 'online'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Online Payment</span>
                </button>

                <button
                  onClick={handleCashPaymentClick}
                  className={`p-3 rounded-lg border text-sm font-medium flex flex-col items-center justify-center space-y-1 transition-all ${paymentMethod === 'cash'
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Cash Payment</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Complete Button Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10 md:hidden">
        <button
          onClick={handleNext}
          disabled={isCompleting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg shadow-md hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isCompleting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Completing Task...
            </>
          ) : (
            'Complete & Close Task'
          )}
        </button>
      </div>

      {/* Online Payment QR Modal */}
      <Dialog open={showQRModal} onOpenChange={(open) => {
        if (!open) { setShowQRModal(false); setQrStep('scan'); }
      }}>
        <DialogContent className="sm:max-w-md p-0 bg-white max-h-[90vh] overflow-y-auto">
          {qrStep === 'scan' ? (
            <div className="flex flex-col items-center">
              <div className="w-full bg-yellow-400 py-4 text-center sticky top-0 z-10">
                <h2 className="text-xl font-bold text-black">Accept Payment Now</h2>
              </div>

              <div className="p-8 flex flex-col items-center">
                <div className="w-64 h-64 border-4 border-yellow-200 rounded-lg p-2 mb-6 shadow-sm">
                  {/* Placeholder QR Code - In production use actual QR image */}
                  <div className="w-full h-full bg-white flex items-center justify-center relative">
                    <img
                      src="/qrcode_payment.png"
                      alt="Company QR Code"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white p-1 rounded-full shadow-md">
                        <div className="text-blue-500 font-bold text-xs">FIXFLY</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setQrStep('proof')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg py-6 rounded-full font-bold mb-3 shadow-md"
                >
                  Payment Completed
                </Button>

                <p className="text-red-500 text-xs text-center font-medium">
                  Jab Payment Complete ho Jaye to ihi buttons ko click kare
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              <div className="w-full bg-gradient-to-r from-blue-500 to-purple-600 py-4 text-center sticky top-0 z-10">
                <h2 className="text-xl font-bold text-white">Upload Payment Proof</h2>
              </div>

              <div className="p-6 w-full flex flex-col items-center">
                <div
                  onClick={triggerPaymentProofCamera}
                  className={`w-full bg-blue-50 rounded-xl border-2 border-dashed border-blue-300 p-4 mb-6 cursor-pointer flex flex-col items-center justify-center transition-all ${paymentProofImage ? 'border-solid border-blue-500' : ''
                    }`}
                  style={{ minHeight: '200px' }}
                >
                  <input
                    type="file"
                    ref={paymentProofInputRef}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePaymentProofCapture}
                  />

                  {paymentProofImage ? (
                    <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={paymentProofImage}
                        alt="Payment Proof"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white font-medium bg-black bg-opacity-60 px-4 py-2 rounded-full backdrop-blur-sm">
                          Retake Screenshot
                        </span>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-sm flex items-center">
                        <Camera className="w-3 h-3 mr-1" />
                        Uploaded
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600 shadow-sm animate-pulse">
                        <Camera className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-blue-600 mb-1">Take Photo</h3>
                      <p className="text-sm text-gray-500 text-center max-w-[200px]">
                        Capture or upload payment success screenshot
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleFinalOnlineSubmission}
                  disabled={!paymentProofImage || isCompleting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-6 rounded-full font-bold mb-2 disabled:opacity-70 shadow-lg"
                >
                  {isCompleting ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      <span>PROCESSING...</span>
                    </div>
                  ) : (
                    'CLOSE TASK'
                  )}
                </Button>

                <p className="text-xs text-gray-400 mt-2 text-center">
                  Make sure payment details are clearly visible
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cash Payment Warning Modal */}
      <Dialog open={showCashWarning} onOpenChange={setShowCashWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-center">
              ⚠️ Cash Payment Warning
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-gray-700 leading-relaxed">
                <strong>Be a Loyal Vendor</strong>
              </p>
              <p className="text-gray-600 mt-2">
                Click cash only if the user pays in cash. Otherwise, penalties may apply and your ID could be suspended.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={handleCashWarningCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCashWarningConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Confirm Cash Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wallet Balance Check Modal */}
      <WalletBalanceCheck
        isOpen={isWalletCheckOpen}
        onClose={() => setIsWalletCheckOpen(false)}
        onProceed={handleWalletCheckProceed}
        requiredAmount={calculateRequiredWalletAmount()}
        action="close_cash_task"
        taskDetails={{
          id: taskId || '',
          caseId: task?.caseId || '',
          title: task?.title || ''
        }}
        onDepositSuccess={() => {
          // Refresh wallet balance after successful deposit
          console.log('Deposit successful, wallet balance should be refreshed');
        }}
      />
    </div>
  );
};

export default VendorClosedTask;
