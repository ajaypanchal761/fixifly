import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMediaQuery, useTheme } from "@mui/material";
import { 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  User,
  AlertTriangle,
  Star,
  Package
} from "lucide-react";
import VendorHeader from "../components/VendorHeader";
import VendorBottomNav from "../components/VendorBottomNav";
import vendorApi from "@/services/vendorApi";

const VendorTaskDetail = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { taskId } = useParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch task details from API
  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const vendorToken = localStorage.getItem('vendorToken');
      if (!vendorToken) {
        setError('Please log in as a vendor to view task details');
        setLoading(false);
        return;
      }

      // Fetch both bookings and support tickets to find the specific task
      const [bookingsResponse, supportTicketsResponse] = await Promise.all([
        vendorApi.getVendorBookings(),
        vendorApi.getAssignedSupportTickets()
      ]);
      
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
            amount: `₹0`,
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
            payment: bookingTask.payment,
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
            street: supportTicket.street || supportTicket.userId?.address?.street || 'Not provided',
            city: supportTicket.city || supportTicket.userId?.address?.city || 'Not provided',
            state: supportTicket.state || supportTicket.userId?.address?.state || 'Not provided',
            pincode: supportTicket.pincode || supportTicket.userId?.address?.pincode || 'Not provided',
            landmark: supportTicket.landmark || supportTicket.userId?.address?.landmark || 'Not provided',
            userId: supportTicket.userId, // Include full user object for address access
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
        console.log('Task data with payment info:', foundTask);
        console.log('Payment data:', foundTask.payment);
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
        <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0 overflow-y-auto">
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
        <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0 overflow-y-auto">
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
        <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0 overflow-y-auto">
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

  const handleCloseTask = () => {
    // Navigate to close task page
    navigate(`/vendor/task/${task.id}/close`);
  };

  const handleCancelTask = () => {
    // Navigate to cancel task detail page
    navigate(`/vendor/task/${task.id}/cancel`);
  };

  const handleRescheduleTask = () => {
    // Navigate to reschedule task page
    navigate(`/vendor/task/${task.id}/reschedule`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0 overflow-y-auto">
        <div className="container mx-auto px-4 py-4">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Task Details Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h1 className="text-xl font-semibold text-gray-800 mb-2">{task.title}</h1>
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                  {task.caseId}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  task.status === 'Emergency' 
                    ? 'bg-red-100 text-red-800' 
                    : task.status === 'Repeat'
                    ? 'bg-orange-100 text-orange-800'
                    : task.status === 'Rescheduled'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {task.status}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Task Type:</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded">
                  {task.taskType}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
               {/* Customer Info */}
               <div className="space-y-2">
                 <h3 className="text-sm font-medium text-gray-600">Customer Information</h3>
                 <div className="space-y-2">
                   <div className="flex items-center gap-2">
                     <span className="text-sm font-medium text-gray-700">Name:</span>
                     <span className="text-sm text-gray-800">{task.customer}</span>
                   </div>
                   <a 
                     href={`tel:${task.phone}`}
                     className="flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors group"
                   >
                     <div className="flex items-center justify-center w-8 h-8 bg-gray-500 rounded-full group-hover:bg-gray-600 transition-colors">
                       <Phone className="w-4 h-4 text-white" />
                     </div>
                     <div>
                       <p className="text-sm font-medium text-gray-800">{task.phone}</p>
                       <p className="text-xs text-gray-600">Tap to call customer</p>
                     </div>
                   </a>
                 </div>
               </div>

              {/* Address */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">Complete Address</h3>
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="text-sm text-gray-800 space-y-1">
                    {(() => {
                      // Try to get address from multiple possible sources
                      const address = task.userId?.address || task.address || task.userAddress;
                      const street = address?.street || task.street || task.address;
                      const city = address?.city || task.city;
                      const state = address?.state || task.state;
                      const pincode = address?.pincode || task.pincode;
                      const landmark = address?.landmark || task.landmark;
                      
                      if (street || city || state || pincode) {
                        return (
                          <div>
                            {street && (
                              <p className="font-medium text-gray-900">{street}</p>
                            )}
                            <div className="flex flex-wrap gap-2 text-muted-foreground">
                              {city && <span>{city}</span>}
                              {state && <span>{state}</span>}
                              {pincode && <span>{pincode}</span>}
                            </div>
                            {landmark && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <span className="font-medium">Landmark:</span> {landmark}
                              </p>
                            )}
                          </div>
                        );
                      } else {
                        return (
                          <div>
                            <p>Address not available</p>
                            <p className="text-xs mt-1">Phone: {task.phone}</p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>

              {/* Task Schedule */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">Task Schedule</h3>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-800">{task.date} at {task.time}</span>
                </div>
              </div>

              {/* Issue Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">Issue Description</h3>
                <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md">{task.issue}</p>
              </div>

              {/* Billing */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">Billing Information</h3>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-800">{task.isSupportTicket ? task.amount : '₹0'}</span>
                </div>
                
                {/* Payment Status for Cash on Delivery */}
                {!task.isSupportTicket && task.payment && task.payment.method === 'cash' && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Booking Amount Pending</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">Payment will be collected on service completion</p>
                  </div>
                )}
                
                {/* Payment Status for Online Payments */}
                {!task.isSupportTicket && task.payment && task.payment.method !== 'cash' && task.payment.status === 'completed' && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Payment Completed</span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">Customer has already paid online</p>
                  </div>
                )}
              </div>

              {/* Assignment Info */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">Assignment Details</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-800">Assigned on {task.assignDate} at {task.assignTime}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-800">Priority: {task.priority || 'Medium'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-200 space-y-2 bg-white">
              {/* Show different buttons based on task status */}
              {(() => {
                const currentStatus = task.bookingStatus || task.vendorStatus;
                const isCompleted = currentStatus === 'completed' || currentStatus === 'Completed';
                const isInProgress = currentStatus === 'in_progress' || currentStatus === 'Accepted';
                const isCancelled = currentStatus === 'cancelled' || currentStatus === 'Cancelled';
                const isDeclined = currentStatus === 'declined' || currentStatus === 'Declined';

                if (isCompleted) {
                  return (
                    <div className="text-center py-4">
                      <div className="flex items-center justify-center mb-2">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                      <p className="text-green-600 font-medium">Task Completed Successfully</p>
                      <p className="text-sm text-gray-600 mt-1">This task has been completed and closed.</p>
                    </div>
                  );
                }

                if (isCancelled || isDeclined) {
                  return (
                    <div className="text-center py-4">
                      <div className="flex items-center justify-center mb-2">
                        <XCircle className="w-8 h-8 text-red-500" />
                      </div>
                      <p className="text-red-600 font-medium">
                        {isCancelled ? 'Task Cancelled' : 'Task Declined'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {isCancelled ? 'This task has been cancelled.' : 'This task has been declined.'}
                      </p>
                    </div>
                  );
                }

                if (isInProgress) {
                  return (
                    <>
                      <button 
                        onClick={handleCloseTask}
                        className="w-full py-3 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>Complete Task</span>
                      </button>
                      <button 
                        onClick={handleRescheduleTask}
                        className="w-full py-3 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium flex items-center justify-center space-x-2"
                      >
                        <Clock className="w-5 h-5" />
                        <span>Reschedule Task</span>
                      </button>
                      <button 
                        onClick={handleCancelTask}
                        className="w-full py-3 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium flex items-center justify-center space-x-2"
                      >
                        <XCircle className="w-5 h-5" />
                        <span>Cancel Task</span>
                      </button>
                    </>
                  );
                }

                // Default case - task is pending/assigned
                return (
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                    <p className="text-yellow-600 font-medium">Task Pending</p>
                    <p className="text-sm text-gray-600 mt-1">Please accept this task first to start working on it.</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </main>
      <VendorBottomNav />
    </div>
  );
};

export default VendorTaskDetail;
