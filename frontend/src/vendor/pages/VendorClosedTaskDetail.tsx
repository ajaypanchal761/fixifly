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
  Clock,
  FileText,
  Camera,
  Star,
  Package
} from "lucide-react";
import VendorHeader from "../components/VendorHeader";
import VendorBottomNav from "../components/VendorBottomNav";
import vendorApi from "@/services/vendorApi";

const VendorClosedTaskDetail = () => {
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
      // Track loading start time for minimum 1 second display
      const loadingStartTime = Date.now();
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

      // Ensure loading shows for at least 1 second
      const elapsedTime = Date.now() - loadingStartTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

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
            phone: '******' + (bookingTask.customer?.phone?.slice(-4) || '****'),
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
            status: foundTask.status === 'completed' ? 'Completed' : foundTask.status,
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
            completedDate: bookingTask.completionData?.completedAt
              ? new Date(bookingTask.completionData.completedAt).toLocaleDateString('en-IN')
              : bookingTask.scheduling?.scheduledDate
                ? new Date(bookingTask.scheduling.scheduledDate).toLocaleDateString('en-IN')
                : new Date(bookingTask.updatedAt).toLocaleDateString('en-IN'),
            completedTime: bookingTask.completionData?.completedAt
              ? new Date(bookingTask.completionData.completedAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
              : bookingTask.scheduling?.scheduledTime
                ? new Date(`2000-01-01T${bookingTask.scheduling.scheduledTime}`).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })
                : 'Not available',
            resolutionNote: bookingTask.completionData?.resolutionNote || 'No resolution notes provided',
            billingAmount: `₹${bookingTask.pricing?.totalAmount || 0}`,
            spareParts: bookingTask.completionData?.spareParts || [],
            travelingAmount: bookingTask.completionData?.travelingAmount || '₹100',
            totalAmount: `₹${(bookingTask.pricing?.totalAmount || 0) + (bookingTask.completionData?.totalAmount || 0)}`,
            customerRating: 5, // Default rating - can be enhanced later
            customerFeedback: "Service completed successfully.", // Default feedback - can be enhanced later
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
            phone: '******' + (supportTicket.customerPhone?.slice(-4) || '****'),
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
            status: supportTicket.vendorStatus === 'Completed' ? 'Completed' : supportTicket.vendorStatus,
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
            completedDate: supportTicket.vendorCompletedAt
              ? new Date(supportTicket.vendorCompletedAt).toLocaleDateString('en-IN')
              : supportTicket.scheduledDate
                ? new Date(supportTicket.scheduledDate).toLocaleDateString('en-IN')
                : new Date().toLocaleDateString('en-IN'),
            completedTime: supportTicket.vendorCompletedAt
              ? new Date(supportTicket.vendorCompletedAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
              : supportTicket.scheduledTime
                ? (() => {
                  if (supportTicket.scheduledTime.includes(':')) {
                    const [hours, minutes] = supportTicket.scheduledTime.split(':');
                    const hour24 = parseInt(hours);
                    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                    const ampm = hour24 >= 12 ? 'PM' : 'AM';
                    return `${hour12}:${minutes} ${ampm}`;
                  }
                  return supportTicket.scheduledTime;
                })()
                : 'Not available',
            resolutionNote: supportTicket.completionData?.resolutionNote || 'No resolution notes provided',
            billingAmount: `₹${supportTicket.billingAmount || 0}`,
            spareParts: supportTicket.completionData?.spareParts || [],
            travelingAmount: supportTicket.completionData?.travelingAmount || '₹0',
            totalAmount: `₹${supportTicket.completionData?.totalAmount || supportTicket.billingAmount || 0}`,
            customerRating: 5, // Default rating - can be enhanced later
            customerFeedback: "Support ticket completed successfully.", // Default feedback - can be enhanced later
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
        <main className="flex-1 pb-24 md:pb-0 pt-16 md:pt-0 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading task details...</p>
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
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Error</h1>
              <p className="text-gray-600 mb-6">{error}</p>
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

  if (!task) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <VendorHeader />
        <main className="flex-1 pb-24 md:pb-0 pt-16 md:pt-0 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Task Not Found</h1>
              <p className="text-gray-600 mb-6">The requested closed task could not be found.</p>
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
      />
    ));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 md:pb-0 pt-16 md:pt-0">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
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
            <div className="p-3 border-b border-gray-200">
              <h1 className="text-lg font-semibold text-gray-800 mb-2">{task.title}</h1>
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                  {task.caseId}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
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
            <div className="p-3 space-y-3">
              {/* Customer Info */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-600">Customer Information</h3>
                <div className="space-y-1">
                  <p className="text-sm text-gray-800">{task.customer}</p>
                  <div
                    className="flex items-center space-x-3 bg-gray-50 p-2 rounded-lg transition-colors cursor-not-allowed opacity-70"
                  >
                    <div className="flex items-center justify-center w-6 h-6 bg-gray-400 rounded-full">
                      <Phone className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{task.phone}</p>
                      <p className="text-xs text-gray-500">Number hidden (Task Closed)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-600">Service Address</h3>
                <div className="flex items-start space-x-2">
                  <MapPin className="w-3 h-3 text-gray-500 mt-0.5" />
                  <p className="text-sm text-gray-800">{task.address}</p>
                </div>
              </div>

              {/* Task Schedule */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-600">Task Schedule</h3>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    <span className="text-sm text-gray-800">Scheduled: {task.date} at {task.time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-sm text-green-600">Completed: {task.completedDate} at {task.completedTime}</span>
                  </div>
                </div>
              </div>

              {/* Issue Description */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-600">Issue Description</h3>
                <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded-md">{task.issue}</p>
              </div>

              {/* Resolution Note */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-600">Resolution Note</h3>
                <div className="flex items-start space-x-2">
                  <FileText className="w-3 h-3 text-gray-500 mt-0.5" />
                  <p className="text-sm text-gray-800 bg-green-50 p-2 rounded-md">{task.resolutionNote}</p>
                </div>
              </div>

              {/* Spare Parts Used */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-600">Spare Parts Used</h3>
                <div className="space-y-1">
                  {task.spareParts && task.spareParts.length > 0 ? (
                    task.spareParts.map((part, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded-md space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Camera className="w-3 h-3 text-gray-500" />
                            <span className="text-sm text-gray-800">{part.name}</span>
                          </div>
                          <span className="text-sm font-medium text-green-600">{part.amount}</span>
                        </div>
                        {part.warranty && (
                          <div className="flex items-center space-x-2 ml-5">
                            <span className="text-xs text-gray-500">Warranty:</span>
                            <span className="text-xs font-medium text-blue-600">{part.warranty}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center bg-gray-50 p-2 rounded-md">
                      <Package className="w-3 h-3 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">No spare parts used</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Billing Summary */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-600">Billing Summary</h3>
                <div className="bg-gray-50 p-2 rounded-md space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Service Amount:</span>
                    <span className="text-sm font-medium text-gray-800">{task.billingAmount}</span>
                  </div>
                  {task.spareParts && task.spareParts.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Spare Parts:</span>
                      <span className="text-sm font-medium text-gray-800">
                        ₹{task.spareParts.reduce((sum, part) => sum + parseInt(part.amount.replace(/[₹,]/g, '')), 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Traveling:</span>
                    <span className="text-sm font-medium text-gray-800">{task.travelingAmount}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-300 pt-1">
                    <span className="text-sm font-semibold text-gray-800">Total Amount:</span>
                    <span className="text-lg font-bold text-green-600">{task.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Customer Feedback */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-600">Customer Feedback</h3>
                <div className="bg-yellow-50 p-2 rounded-md">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-600">Rating:</span>
                    <div className="flex items-center space-x-1">
                      {renderStars(task.customerRating)}
                    </div>
                    <span className="text-sm text-gray-600">({task.customerRating}/5)</span>
                  </div>
                  <p className="text-sm text-gray-800 italic">"{task.customerFeedback}"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <VendorBottomNav />
    </div>
  );
};

export default VendorClosedTaskDetail;
