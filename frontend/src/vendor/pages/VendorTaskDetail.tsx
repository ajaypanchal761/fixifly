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

      // Fetch all vendor bookings and find the specific task
      const response = await vendorApi.getVendorBookings();
      
      if (response.success && response.data?.bookings) {
        const bookings = response.data.bookings;
        const foundTask = bookings.find(booking => booking._id === taskId);
        
        if (foundTask) {
          // Transform booking data to task format
          const transformedTask = {
            id: foundTask._id,
            caseId: foundTask.bookingReference || `FIX${foundTask._id.toString().substring(foundTask._id.toString().length - 8).toUpperCase()}`,
            title: foundTask.services?.[0]?.serviceName || 'Service Request',
            customer: foundTask.customer?.name || 'Unknown Customer',
            phone: foundTask.customer?.phone || 'N/A',
            amount: `₹${foundTask.pricing?.totalAmount || 0}`,
            date: foundTask.scheduling?.scheduledDate 
              ? new Date(foundTask.scheduling.scheduledDate).toLocaleDateString('en-IN')
              : foundTask.scheduling?.preferredDate 
              ? new Date(foundTask.scheduling.preferredDate).toLocaleDateString('en-IN')
              : new Date(foundTask.createdAt).toLocaleDateString('en-IN'),
            time: foundTask.scheduling?.scheduledTime 
              ? new Date(`2000-01-01T${foundTask.scheduling.scheduledTime}`).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })
              : foundTask.scheduling?.preferredTimeSlot || 'Not scheduled',
            status: foundTask.priority === 'urgent' ? 'Emergency' : 
                   foundTask.priority === 'high' ? 'High Priority' : 
                   foundTask.priority === 'low' ? 'Low Priority' : 'Normal',
            address: foundTask.customer?.address 
              ? typeof foundTask.customer.address === 'object' 
                ? `${foundTask.customer.address.street || ''}, ${foundTask.customer.address.city || ''}, ${foundTask.customer.address.state || ''} - ${foundTask.customer.address.pincode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')
                : foundTask.customer.address
              : 'Address not provided',
            issue: foundTask.notes || foundTask.services?.[0]?.serviceName || 'Service request',
            assignDate: foundTask.vendor?.assignedAt 
              ? new Date(foundTask.vendor.assignedAt).toLocaleDateString('en-IN')
              : new Date(foundTask.createdAt).toLocaleDateString('en-IN'),
            assignTime: foundTask.vendor?.assignedAt 
              ? new Date(foundTask.vendor.assignedAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })
              : 'Not assigned',
            taskType: foundTask.services?.[0]?.serviceName || 'Service Request',
            bookingStatus: foundTask.status,
            priority: foundTask.priority || 'medium'
          };
          
          setTask(transformedTask);
        } else {
          setError('Task not found');
        }
      } else {
        setError(response.message || 'Failed to fetch task details');
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
                <h3 className="text-sm font-medium text-gray-600">Service Address</h3>
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <p className="text-sm text-gray-800">{task.address}</p>
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
                  <span className="text-sm font-semibold text-gray-800">{task.amount}</span>
                </div>
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
            <div className="p-4 border-t border-gray-200 space-y-2">
              <button 
                onClick={handleCloseTask}
                className="w-full py-3 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Complete Task</span>
              </button>
              <button 
                onClick={handleRescheduleTask}
                className="w-full py-3 px-4 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors font-medium flex items-center justify-center space-x-2"
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
            </div>
          </div>
        </div>
      </main>
      <VendorBottomNav />
    </div>
  );
};

export default VendorTaskDetail;
