import { useState, useEffect } from "react";
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

interface SparePart {
  id: number;
  name: string;
  amount: string;
  photo: string | null;
}

const VendorClosedTask = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { taskId } = useParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash' | ''>('');
  const [includeGST, setIncludeGST] = useState(false);
  const [billingAmount, setBillingAmount] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [spareParts, setSpareParts] = useState<SparePart[]>([
    { id: 1, name: "", amount: "", photo: null }
  ]);

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

  // Show 404 error on desktop
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

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <VendorHeader />
        <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0">
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
        <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0">
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
        <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0">
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
    setSpareParts([...spareParts, { id: newId, name: "", amount: "", photo: null }]);
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

  const handlePhotoUpload = (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateSparePart(id, 'photo', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTotal = () => {
    const billingAmountValue = billingAmount ? parseFloat(billingAmount.replace(/[₹,]/g, '')) || 0 : 0;
    const sparePartsTotal = spareParts.reduce((sum, part) => {
      const amount = parseFloat(part.amount.replace(/[₹,]/g, '')) || 0;
      return sum + amount;
    }, 0);
    
    if (paymentMethod === 'online' && includeGST) {
      const gstAmount = sparePartsTotal * 0.18; // 18% GST on spare parts only
      return sparePartsTotal + gstAmount; // Only spare parts + GST, billing amount separate
    }
    
    return sparePartsTotal; // Only spare parts amount, billing amount separate
  };

  const calculateBillingTotal = () => {
    const billingAmountValue = billingAmount ? parseFloat(billingAmount.replace(/[₹,]/g, '')) || 0 : 0;
    return billingAmountValue; // Only billing amount for support tickets
  };

  const calculateGSTAmount = () => {
    const sparePartsTotal = spareParts.reduce((sum, part) => {
      const amount = parseFloat(part.amount.replace(/[₹,]/g, '')) || 0;
      return sum + amount;
    }, 0);
    return sparePartsTotal * 0.18; // 18% GST
  };

  const handleNext = async () => {
    try {
      setIsCompleting(true);
      
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

      // Validate billing amount for support tickets
      if (task?.isSupportTicket && (!billingAmount || billingAmount.trim() === '')) {
        alert('Please enter billing amount for support ticket');
        return;
      }

      // Validate billing amount value
      const billingAmountValue = billingAmount ? parseFloat(billingAmount.replace(/[₹,]/g, '')) || 0 : 0;
      if (task?.isSupportTicket && billingAmountValue <= 0) {
        alert('Please enter a valid billing amount greater than 0');
        return;
      }
      console.log('Billing amount calculation:', {
        originalBillingAmount: billingAmount,
        billingAmountValue: billingAmountValue,
        isSupportTicket: task?.isSupportTicket
      });
      
      const taskData = {
        resolutionNote: resolutionNote.trim(),
        spareParts: spareParts.filter(part => part.name.trim() !== ''), // Filter out empty parts
        paymentMethod: paymentMethod as 'online' | 'cash',
        includeGST: includeGST,
        gstAmount: includeGST ? calculateGSTAmount() : 0,
        totalAmount: task?.isSupportTicket ? billingAmountValue : calculateTotal(),
        billingAmount: billingAmountValue,
        travelingAmount: "100"
      };
      
      console.log('Task data being sent:', taskData);

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
            // For booking tasks, spare parts + GST
            totalAmount = calculateTotal();
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
          localStorage.setItem(`payment_${taskId}`, JSON.stringify(paymentData));
          
          // Trigger event for user page refresh
          const eventName = task?.isSupportTicket ? 'supportTicketUpdated' : 'bookingUpdated';
          window.dispatchEvent(new CustomEvent(eventName, { 
            detail: { 
              taskId, 
              status: 'completed', 
              paymentMode: 'online', 
              paymentStatus: 'pending', 
              includeGST: task?.isSupportTicket ? false : includeGST, 
              gstAmount: task?.isSupportTicket ? 0 : gstAmount,
              totalAmount 
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
          window.dispatchEvent(new CustomEvent('bookingUpdated', { 
            detail: { taskId, status: 'completed', paymentMode: 'cash', paymentStatus: 'collected' } 
          }));
          
          navigate('/vendor');
        }
      } else {
        alert('Failed to complete task. Please try again.');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert('An error occurred while completing the task. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0">
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

                    {/* Photo Upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Photo</label>
                      <div className="flex items-center space-x-3">
                        {part.photo ? (
                          <div className="relative">
                            <img
                              src={part.photo}
                              alt="Spare part"
                              className="w-16 h-16 object-cover rounded-md border border-gray-300"
                            />
                            <button
                              onClick={() => updateSparePart(part.id, 'photo', '')}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center w-16 h-16 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 transition-colors">
                            <Camera className="w-6 h-6 text-gray-400" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(part.id, e)}
                              className="hidden"
                            />
                          </label>
                        )}
                        <span className="text-xs text-gray-500">Tap to add photo</span>
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

              {/* GST (only show if online payment and GST is included) */}
              {paymentMethod === 'online' && includeGST && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">GST (18%)</span>
                  <span className="text-sm font-medium text-gray-800">
                    ₹{calculateGSTAmount().toLocaleString()}
                  </span>
                </div>
              )}

              {/* Spare Parts Total */}
              <div className="flex items-center justify-between border-t border-gray-300 pt-2">
                <span className="text-lg font-semibold text-gray-800">Spare Parts Total</span>
                <span className="text-xl font-bold text-blue-600">₹{calculateTotal().toLocaleString()}</span>
              </div>

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
                
                {/* GST Option - only show when online payment is selected */}
                {paymentMethod === 'online' && (
                  <div className="ml-11 flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="includeGST"
                      checked={includeGST}
                      onChange={(e) => setIncludeGST(e.target.checked)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="includeGST" className="flex items-center space-x-2 cursor-pointer">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 text-xs font-bold">📋</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-800">Include GST (18%)</span>
                        <p className="text-xs text-gray-500">Add 18% GST to the total amount</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="cash"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'cash')}
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
    </div>
  );
};

export default VendorClosedTask;
