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

const VendorClosedTask = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Show 404 error on desktop - must be before any other hooks
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

  const navigate = useNavigate();
  const { taskId } = useParams();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    const billingAmountValue = billingAmount ? parseFloat(billingAmount.replace(/[₹,]/g, '')) || 0 : 0;
    if (!includeGST) return 0;
    return billingAmountValue * 0.18; // 18% GST on base amount
  };

  // Calculate GST-excluded amount (base amount without GST)
  const calculateGSTExcludedAmount = () => {
    const billingAmountValue = billingAmount ? parseFloat(billingAmount.replace(/[₹,]/g, '')) || 0 : 0;
    if (!includeGST) return billingAmountValue;
    return billingAmountValue; // Base amount (GST-excluded)
  };

  // Calculate total billing amount (base amount + GST if GST is included)
  const calculateBillingTotal = () => {
    const billingAmountValue = billingAmount ? parseFloat(billingAmount.replace(/[₹,]/g, '')) || 0 : 0;
    if (!includeGST) return billingAmountValue;
    return billingAmountValue + (billingAmountValue * 0.18); // Base amount + 18% GST
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <VendorHeader />
        <main className="flex-1 pb-24 md:pb-0 pt-16 md:pt-0 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">Loading task details...</p>
              </div>
            </div>
          </div>
        </main>
        <VendorBottomNav />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <VendorHeader />
        <main className="flex-1 pb-24 md:pb-0 pt-16 md:pt-0 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Task</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-x-4">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Go Back
                </button>
                {error.includes('log in') ? (
                  <button
                    onClick={() => navigate('/vendor/login')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Go to Login
                  </button>
                ) : (
                  <button
                    onClick={fetchTaskDetails}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
        <VendorBottomNav />
      </div>
    );
  }

  // Task not found
  if (!task) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <VendorHeader />
        <main className="flex-1 pb-24 md:pb-0 pt-16 md:pt-0 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Task Not Found</h1>
              <p className="text-gray-600 mb-6">The requested task could not be found.</p>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </main>
        <VendorBottomNav />
      </div>
    );
  }

  const addSparePart = () => {
    const newId = Math.max(...spareParts.map(p => p.id)) + 1;
    setSpareParts([...spareParts, { id: newId, name: "", amount: "", photo: null, warranty: "" }]);
  };

  const removeSparePart = (id: number) => {
    if (spareParts.length > 1) {
      setSpareParts(spareParts.filter(part => part.id !== id));
    }
  };

  const updateSparePart = (id: number, field: keyof SparePart, value: string) => {
    setSpareParts(spareParts.map(part => 
      part.id === id ? { ...part, [field]: value } : part
    ));
  };

  // Detect if running in APK/WebView
  const isAPKEnvironment = () => {
    try {
      if (typeof navigator === 'undefined') return false;
      const userAgent = navigator.userAgent || '';
      const isWebView = /wv|WebView/i.test(userAgent);
      const hasFlutterBridge = typeof (window as any).flutter_inappwebview !== 'undefined' || 
                                typeof (window as any).Android !== 'undefined';
      return isWebView || hasFlutterBridge;
    } catch (error) {
      return false;
    }
  };

  // Compress image to reduce payload size
  const compressImage = (base64String: string, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validate input
      if (!base64String || typeof base64String !== 'string') {
        reject(new Error('Invalid base64 string'));
        return;
      }

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Image compression timeout'));
      }, 10000); // 10 seconds timeout

      const img = new Image();
      
      img.onload = () => {
        try {
          clearTimeout(timeout);
          
          // Validate image loaded successfully
          if (img.width === 0 || img.height === 0) {
          reject(new Error('Invalid image dimensions'));
          return;
        }

          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            height = Math.round(height * ratio);
            width = maxWidth;
          }

          // Ensure minimum dimensions (but don't force if image is smaller)
          if (width < 50) width = 50;
          if (height < 50) height = 50;

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Set image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG with specified quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          
          // Validate compressed result
          if (!compressedBase64 || compressedBase64.length < 100) {
            reject(new Error('Compression failed - result too small'));
            return;
          }
          
          // Check if compression actually reduced size
          const originalSize = base64String.length;
          const compressedSize = compressedBase64.length;
          const reductionPercent = ((1 - compressedSize / originalSize) * 100).toFixed(1);
          
          console.log(`Image compression: ${(originalSize / 1024).toFixed(2)}KB -> ${(compressedSize / 1024).toFixed(2)}KB (${reductionPercent}% reduction)`);
          
          resolve(compressedBase64);
        } catch (error: any) {
          clearTimeout(timeout);
          reject(new Error(`Compression error: ${error.message || 'Unknown error'}`));
        }
      };
      
      img.onerror = (error) => {
        clearTimeout(timeout);
        reject(new Error('Failed to load image for compression'));
      };
      
      // Set image source to trigger loading
      img.src = base64String;
    });
  };

  const handlePhotoCapture = async (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file size before processing (max 10MB)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      alert('Image size is too large. Please capture a smaller image or use better lighting.');
      event.target.value = '';
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        if (!base64String) {
          alert('Failed to read image. Please try again.');
          return;
        }

        // Compress image before storing
        try {
          let compressedImage = await compressImage(base64String, 800, 0.7);
          
          // Check if compressed image is still too large (over 500KB base64)
          const compressedSizeKB = compressedImage.length / 1024;
          if (compressedSizeKB > 500) {
            // Try more aggressive compression
            console.log('Image still large, applying more aggressive compression...');
            compressedImage = await compressImage(base64String, 600, 0.6);
          }

          // Final size check
          const finalSizeKB = compressedImage.length / 1024;
          if (finalSizeKB > 800) {
            alert('Image is too large even after compression. Please try capturing again with better lighting.');
            event.target.value = '';
            return;
          }

          updateSparePart(id, 'photo', compressedImage);
          console.log(`✅ Image captured and compressed: ${finalSizeKB.toFixed(2)}KB`);
        } catch (compressError) {
          console.error('Image compression failed:', compressError);
          // Don't use original if compression fails - it's likely too large
          alert('Failed to process image. Please try capturing again.');
          event.target.value = '';
        }
      };
      
      reader.onerror = () => {
        console.error('FileReader error');
        alert('Failed to read image. Please try again.');
        event.target.value = '';
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read image. Please try again.');
      event.target.value = '';
    }
  };
  
  // Function to trigger camera - works in both web and APK
  const triggerCamera = (partId: number) => {
    const isAPK = isAPKEnvironment();
    
    if (isAPK) {
      // For APK: Use the ref-based input that's already in DOM
      const input = fileInputRefs.current[partId];
      if (input) {
        // Reset value to allow selecting same file again
        input.value = '';
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          input.click();
        }, 100);
      } else {
        console.error('File input ref not found for part:', partId);
        // Fallback: create input dynamically
        createDynamicInput(partId);
      }
    } else {
      // For web: Use dynamic input creation (original method)
      createDynamicInput(partId);
    }
  };

  // Fallback method: Create input dynamically (for web or if ref fails)
  const createDynamicInput = (partId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Force back camera
    input.style.display = 'none';
    input.style.position = 'absolute';
    input.style.opacity = '0';
    input.style.width = '1px';
    input.style.height = '1px';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          updateSparePart(partId, 'photo', event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
      // Clean up
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };
    
    input.oncancel = () => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };
    
    document.body.appendChild(input);
    // Use setTimeout for better compatibility
    setTimeout(() => {
      input.click();
    }, 50);
  };

  const calculateTotal = () => {
    const billingAmountValue = billingAmount ? parseFloat(billingAmount.replace(/[₹,]/g, '')) || 0 : 0;
    const sparePartsTotal = spareParts.reduce((sum, part) => {
      const amount = parseFloat(part.amount.replace(/[₹,]/g, '')) || 0;
      return sum + amount;
    }, 0);
    
    // If GST is included, billing amount is already GST-inclusive
    if (includeGST) {
      return billingAmountValue; // Billing amount is already GST-inclusive
    }
    
    return billingAmountValue; // Billing amount only
  };




  const handleCashPaymentClick = () => {
    setShowCashWarning(true);
  };

  const handleCashWarningConfirm = () => {
    setPaymentMethod('cash');
    setIncludeGST(false); // Disable GST for cash payment
    setShowCashWarning(false);
    // Check wallet balance before proceeding with cash task completion
    setIsWalletCheckOpen(true);
  };

  // Calculate required wallet amount for cash payment
  const calculateRequiredWalletAmount = (): number => {
    if (paymentMethod !== 'cash') return 0;
    
    const billingAmountValue = billingAmount ? parseFloat(billingAmount.replace(/[₹,]/g, '')) || 0 : 0;
    const spareAmountValue = spareParts.reduce((sum, part) => {
      return sum + (parseFloat(part.amount.replace(/[₹,]/g, '')) || 0);
    }, 0);
    const travellingAmountValue = 100; // Fixed travelling amount
    const bookingAmountValue = 0; // For now, booking amount is 0
    
    const calculation = calculateCashCollectionDeduction({
      billingAmount: billingAmountValue,
      spareAmount: spareAmountValue,
      travellingAmount: travellingAmountValue,
      bookingAmount: bookingAmountValue,
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

      // Validate billing amount for both support tickets and booking tasks
      if (!billingAmount || billingAmount.trim() === '') {
        alert('Please enter billing amount');
        return;
      }
      
      setIsCompleting(true);

      // Validate billing amount value
      const billingAmountValue = billingAmount ? parseFloat(billingAmount.replace(/[₹,]/g, '')) || 0 : 0;
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
      // The vendor enters the GST-excluded amount in the input field
      // Backend expects GST-excluded amount for calculation
      const billingAmountForBackend = billingAmountValue;
      
      const taskData = {
        resolutionNote: resolutionNote.trim(),
        spareParts: validSpareParts, // Only include parts with names, photos, and warranty
        paymentMethod: paymentMethod as 'online' | 'cash',
        includeGST: includeGST,
        gstAmount: includeGST ? calculateGSTAmount() : 0,
        totalAmount: calculateBillingTotal(), // Use total amount including GST
        billingAmount: billingAmountForBackend, // Send GST-excluded amount for vendor calculation
        travelingAmount: "100"
      };
      
      // Calculate payload size for debugging and validation
      const payloadString = JSON.stringify(taskData);
      const payloadSizeKB = parseFloat((new Blob([payloadString]).size / 1024).toFixed(2));
      console.log('Task data being sent:', taskData);
      console.log('Payload size:', `${payloadSizeKB} KB`);
      
      // Validate payload size before sending (max 1MB to prevent timeout)
      if (payloadSizeKB > 1000) {
        alert(`Request size is too large (${payloadSizeKB.toFixed(2)}KB). Please reduce the number of images or try capturing smaller images.`);
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
        if (paymentMethod === 'online') {
          // For online payment, task is completed and user will pay
          let totalAmount, gstAmount;
          
          if (task?.isSupportTicket) {
            // For support tickets, only billing amount is charged
            totalAmount = calculateBillingTotal();
            gstAmount = 0;
            alert(`Support ticket completed successfully! User will now receive payment request for ₹${totalAmount.toLocaleString()}.`);
          } else {
            // For booking tasks, use billing amount (not spare parts)
            totalAmount = calculateBillingTotal();
            gstAmount = includeGST ? calculateGSTAmount() : 0;
          
          if (includeGST) {
            alert(`Task completed successfully! User will now receive payment request for ₹${totalAmount.toLocaleString()} (including 18% GST: ₹${gstAmount.toLocaleString()}).`);
          } else {
            alert(`Task completed successfully! User will now receive payment request for ₹${totalAmount.toLocaleString()}.`);
            }
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
              status: 'in_progress', // Keep as in_progress to show Pay Now button
              paymentMode: 'online', 
              paymentStatus: 'pending', 
              includeGST: task?.isSupportTicket ? false : includeGST, 
              gstAmount: task?.isSupportTicket ? 0 : gstAmount,
              totalAmount,
              completionData: {
                resolutionNote: resolutionNote.trim(),
                billingAmount: billingAmountValue,
                spareParts: spareParts.filter(part => part.name.trim() !== ''),
                paymentMethod: 'online',
                includeGST: includeGST,
                gstAmount: includeGST ? calculateGSTAmount() : 0,
                totalAmount: totalAmount
              }
            } 
          }));
          
          navigate('/vendor');
        } else {
          // For cash payment, show success message and redirect
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
        }
      } else {
        alert('Failed to complete task. Please try again.');
      }
    } catch (error: any) {
      console.error('Error completing task:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        response: error?.response?.data
      });
      
      // Show more detailed error message
      let errorMessage = 'An error occurred while completing the task. Please try again.';
      
      if (error?.message) {
        // Check for specific error types
        if (error.message.includes('timeout') || error.message.includes('Timeout')) {
          errorMessage = 'Request timeout: The task is taking too long to complete. Please check your internet connection and try again. If the problem persists, try reducing the number of images.';
        } else if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error: Unable to connect to server. Please check your internet connection and try again.';
        } else if (error.message.includes('payload') || error.message.includes('too large') || error.message.includes('413')) {
          errorMessage = 'Request size too large. Please reduce the number of images or try capturing smaller images with better lighting.';
        } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
          errorMessage = 'Invalid request data. Please check all fields and try again.';
        } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
          errorMessage = 'Server error occurred. Please try again in a few moments.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Check response data for more details
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      // Show user-friendly error message
      alert(errorMessage);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 md:pb-0 pt-16 md:pt-0">
        <div className="container mx-auto px-4 py-4">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Task Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <h1 className="text-lg font-semibold text-gray-800 mb-2">{task.title}</h1>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                {task.caseId}
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded">
                {task.taskType}
              </span>
            </div>
          </div>

          {/* Resolution Note */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Resolution Note</h2>
            </div>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Describe how the issue was resolved..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>


          {/* Spare Parts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Spare Parts Used</h2>
              <button
                onClick={addSparePart}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add</span>
              </button>
            </div>

            <div className="space-y-4">
              {spareParts.map((part, index) => (
                <div key={part.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">Part {index + 1}</span>
                    {spareParts.length > 1 && (
                      <button
                        onClick={() => removeSparePart(part.id)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Spare Part Name */}
                    <input
                      type="text"
                      value={part.name}
                      onChange={(e) => updateSparePart(part.id, 'name', e.target.value)}
                      placeholder="Spare part name (e.g., Laptop Screen)"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    {/* Amount */}
                    <input
                      type="text"
                      value={part.amount}
                      onChange={(e) => updateSparePart(part.id, 'amount', e.target.value)}
                      placeholder="Amount (e.g., ₹1,500)"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    {/* Service Warranty */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Service Warranty <span className="text-red-500">*</span></label>
                      <select
                        value={part.warranty}
                        onChange={(e) => updateSparePart(part.id, 'warranty', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select warranty period</option>
                        <option value="30 days">30 days</option>
                        <option value="90 days">90 days</option>
                        <option value="180 days">180 days</option>
                        <option value="1 year">1 year</option>
                        <option value="3 years">3 years</option>
                        <option value="5 years">5 years</option>
                      </select>
                    </div>

                    {/* Photo Capture - Mandatory */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">
                        Photo <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center space-x-3">
                        {part.photo ? (
                          <div className="relative">
                            <img
                              src={part.photo}
                              alt="Spare part"
                              className="w-20 h-20 object-cover rounded-md border-2 border-green-500"
                            />
                            <button
                              onClick={() => updateSparePart(part.id, 'photo', '')}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                              type="button"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            {/* Hidden file input for APK compatibility - always in DOM */}
                            <input
                              ref={(el) => {
                                fileInputRefs.current[part.id] = el;
                              }}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => handlePhotoCapture(part.id, e)}
                              className="hidden"
                              id={`file-input-${part.id}`}
                            />
                            {/* Label for APK compatibility - clicking label triggers input */}
                            <label
                              htmlFor={`file-input-${part.id}`}
                              className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-red-300 rounded-md cursor-pointer hover:border-red-400 transition-colors bg-red-50"
                            >
                              <Camera className="w-8 h-8 text-red-500 mb-1" />
                              <span className="text-xs text-red-600 font-medium">Capture</span>
                            </label>
                          </div>
                        )}
                        {!part.photo && (
                          <span className="text-xs text-red-600 font-medium">Photo capture required</span>
                        )}
                        {part.photo && (
                          <span className="text-xs text-green-600 font-medium">✓ Photo captured</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Billing Amount */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Billing Amount</h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="billingAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Billing Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">₹</span>
                  <input
                    type="text"
                    id="billingAmount"
                    value={billingAmount}
                    onChange={(e) => setBillingAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Amount Summary</h2>
            
            <div className="space-y-2">
              {/* Billing Amount */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Billing Amount</span>
                <span className="text-sm font-medium text-gray-800">
                  ₹{billingAmount ? parseFloat(billingAmount.replace(/[₹,]/g, '')) || 0 : 0}
                </span>
              </div>

              {/* Spare Parts Total */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Spare Parts Total</span>
                <span className="text-sm font-medium text-gray-800">
                  ₹{spareParts.reduce((sum, part) => {
                    const amount = parseFloat(part.amount.replace(/[₹,]/g, '')) || 0;
                    return sum + amount;
                  }, 0).toLocaleString()}
                </span>
              </div>

              {/* Traveling Amount */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Traveling Amount</span>
                <span className="text-sm font-medium text-gray-800">₹100</span>
              </div>

              {/* Booking Amount */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Booking Amount</span>
                <span className="text-sm font-medium text-gray-800">
                  {task?.isSupportTicket ? 'N/A' : task?.amount || '₹0'}
                </span>
              </div>

              {/* GST (show if GST is included) */}
              {includeGST && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">GST (18%)</span>
                  <span className="text-sm font-medium text-gray-800">
                    ₹{calculateGSTAmount().toLocaleString()}
                  </span>
                </div>
              )}

              {/* GST-excluded amount (show if GST is included) */}
              {includeGST && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">GST-excluded Amount</span>
                  <span className="text-sm font-medium text-gray-800">
                    ₹{calculateGSTExcludedAmount().toLocaleString()}
                  </span>
                </div>
              )}

              {/* Billing Amount Total */}
              <div className="flex items-center justify-between border-t border-gray-300 pt-2">
                <span className="text-lg font-semibold text-gray-800">Billing Amount Total</span>
                <span className="text-xl font-bold text-green-600">₹{calculateBillingTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Payment Method</h2>
            <div className="space-y-3">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="online"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'cash')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="online" className="flex items-center space-x-2 cursor-pointer">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">💳</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-800">Online Payment</span>
                      <p className="text-xs text-gray-500">Card, UPI, Net Banking</p>
                    </div>
                  </label>
                </div>
                
                {/* GST Option - only enabled for online payment */}
                <div className="ml-11 flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="includeGST"
                    checked={includeGST}
                    onChange={(e) => setIncludeGST(e.target.checked)}
                    disabled={paymentMethod === 'cash'}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <label 
                    htmlFor="includeGST" 
                    className={`flex items-center space-x-2 ${paymentMethod === 'cash' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 text-xs font-bold">📋</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-800">Customer wants GST bill</span>
                      <p className="text-xs text-gray-500">
                        {paymentMethod === 'online' 
                          ? 'Billing amount is GST-inclusive. Vendor gets: (GST-excluded - spare - travel) × 50% + spare + travel'
                          : paymentMethod === 'cash'
                          ? 'GST bill option is not available for cash payments'
                          : 'Billing amount is GST-inclusive. Wallet deduction: (GST-excluded - spare - travel) × 50% + 18% GST'
                        }
                      </p>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="cash"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={handleCashPaymentClick}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="cash" className="flex items-center space-x-2 cursor-pointer">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm font-bold">💰</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-800">Cash Payment</span>
                    <p className="text-xs text-gray-500">Pay on completion</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!paymentMethod || isCompleting}
            className={`w-full py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 ${
              paymentMethod && !isCompleting
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isCompleting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>
              {isCompleting 
                ? 'Completing Task...' 
                : paymentMethod === 'online' && includeGST 
                  ? 'Complete Task & Send Payment Request' 
                  : 'Complete Task'
              }
            </span>
          </button>
        </div>
      </main>
      <VendorBottomNav />

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
