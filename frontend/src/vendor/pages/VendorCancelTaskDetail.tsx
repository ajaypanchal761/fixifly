import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMediaQuery, useTheme } from "@mui/material";
import { 
  ArrowLeft,
  XCircle,
  AlertTriangle,
  FileText
} from "lucide-react";
import VendorHeader from "../components/VendorHeader";
import VendorBottomNav from "../components/VendorBottomNav";
import vendorApiService from "../../services/vendorApi";

const VendorCancelTaskDetail = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { taskId } = useParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch task data from API
  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) {
        setError("Task ID not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Try to fetch as booking first
        let response = await vendorApiService.getBookingById(taskId);

        if (response.success && response.data && response.data.booking) {
          setTask({
            ...response.data.booking,
            taskType: 'booking'
          });
        } else {
          // If not found as booking, try to fetch as support ticket
          response = await vendorApiService.getSupportTicketById(taskId);

          if (response.success && response.data && response.data.ticket) {
            setTask({
              ...response.data.ticket,
              taskType: 'support_ticket'
            });
          } else {
            setError(response.message || "Task not found");
          }
        }
      } catch (err) {
        console.error("Error fetching task:", err);
        setError("Failed to load task details");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
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
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Loading Task Details</h1>
              <p className="text-gray-600">Please wait while we fetch the task information...</p>
            </div>
          </div>
        </main>
        <VendorBottomNav />
      </div>
    );
  }

  // Error state
  if (error || !task) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <VendorHeader />
        <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Task Not Found</h1>
              <p className="text-gray-600 mb-6">{error || "The requested task could not be found."}</p>
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

  const handleCancelTask = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for cancelling the task.");
      return;
    }

    if (!task || !taskId) {
      alert("Task information not available.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      let response;

      if (task.taskType === 'support_ticket') {
        // Call the decline support ticket API
        response = await vendorApiService.declineSupportTicket(taskId, reason.trim());
      } else {
        // Call the cancel booking API
        response = await vendorApiService.cancelTask(taskId, reason.trim());
      }

      if (response.success) {
        // Create cancelled task object for event dispatch
        const cancelledTask = {
          id: task._id || task.id,
          caseId: task.taskType === 'support_ticket' 
            ? task.ticketId || task.id 
            : task.bookingReference,
          title: task.taskType === 'support_ticket' 
            ? task.subject || "Support Ticket"
            : task.services?.[0]?.serviceName || "Service Task",
          customer: task.taskType === 'support_ticket' 
            ? task.userName || task.customerName
            : task.customer?.name,
          phone: task.taskType === 'support_ticket' 
            ? task.userPhone || task.customerPhone
            : task.customer?.phone,
          amount: `₹0`,
          date: new Date().toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          }),
          time: new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          status: "Cancelled",
          address: task.taskType === 'support_ticket' 
            ? task.address || "Not provided"
            : `${task.customer?.address?.street}, ${task.customer?.address?.city}`,
          issue: task.taskType === 'support_ticket' 
            ? task.description || "Support request"
            : task.notes || "Service request",
          assignDate: task.taskType === 'support_ticket' 
            ? (task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              }) : "")
            : (task.scheduling?.scheduledDate ? new Date(task.scheduling.scheduledDate).toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              }) : ""),
          assignTime: task.taskType === 'support_ticket' 
            ? task.scheduledTime || ""
            : task.scheduling?.scheduledTime || "",
          taskType: task.taskType === 'support_ticket' 
            ? "Support Ticket"
            : task.services?.[0]?.serviceName || "Service",
          cancelReason: reason,
          cancelledAt: new Date().toISOString()
        };

        // Dispatch event to notify VendorHero component
        window.dispatchEvent(new CustomEvent('taskCancelled', { detail: cancelledTask }));
        
        // Show success message
        const successMessage = task.taskType === 'support_ticket' 
          ? "Support ticket has been declined successfully. ₹100 penalty has been applied to your wallet."
          : "Task has been cancelled successfully.";
        alert(successMessage);
        
        // Navigate back to vendor dashboard with cancelled tab active
        navigate('/vendor?tab=cancelled');
      } else {
        throw new Error(response.message || "Failed to cancel task");
      }
    } catch (error) {
      console.error("Error cancelling task:", error);
      alert(`Failed to cancel task: ${error.message || "Please try again."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <VendorHeader />
      <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0 overflow-hidden">
        <div className="container mx-auto px-4 py-4 h-full overflow-y-auto">
          {/* Task Details Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            {/* Header */}
             <div className="p-2 border-b border-gray-200 bg-gray-50">
               <h1 className="text-base font-semibold text-gray-800 mb-1">
                 {task.taskType === 'support_ticket' 
                   ? task.subject || "Support Ticket"
                   : task.services?.[0]?.serviceName || "Service Task"}
               </h1>
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                  {task.taskType === 'support_ticket'
                    ? task.ticketId || task.id
                    : task.bookingReference}
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded">
                  {task.taskType === 'support_ticket' 
                    ? "Support Ticket"
                    : task.services?.[0]?.serviceName || "Service"}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p><span className="font-medium">Customer:</span> {
                  task.taskType === 'support_ticket' 
                    ? task.userName || task.customerName
                    : task.customer?.name
                }</p>
                <p><span className="font-medium">Phone:</span> {
                  task.taskType === 'support_ticket' 
                    ? task.userPhone || task.customerPhone
                    : task.customer?.phone
                }</p>
                <p><span className="font-medium">Scheduled:</span> {
                  task.taskType === 'support_ticket' 
                    ? (task.scheduledDate 
                        ? new Date(task.scheduledDate).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })
                        : "Not scheduled")
                    : (task.scheduling?.scheduledDate 
                        ? new Date(task.scheduling.scheduledDate).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })
                        : new Date(task.scheduling?.preferredDate).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          }))
                } {
                  task.taskType === 'support_ticket' 
                    ? (task.scheduledTime ? `at ${task.scheduledTime}` : "")
                    : `at ${task.scheduling?.scheduledTime || task.scheduling?.preferredTimeSlot}`
                }</p>
              </div>
            </div>
          </div>

          {/* Cancel Reason Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                {task.taskType === 'support_ticket' ? 'Decline Reason' : 'Cancellation Reason'}
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please provide a reason for {task.taskType === 'support_ticket' ? 'declining' : 'cancelling'} this {task.taskType === 'support_ticket' ? 'support ticket' : 'task'} *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={`Enter the reason for ${task.taskType === 'support_ticket' ? 'declining' : 'cancelling'} this ${task.taskType === 'support_ticket' ? 'support ticket' : 'task'}...`}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {task.taskType === 'support_ticket' 
                    ? "This information will be shared with the admin and a ₹100 penalty will be applied to your wallet."
                    : "This information will be shared with the customer and used for internal records."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button 
              onClick={handleCancelTask}
              disabled={isSubmitting || !reason.trim()}
              className="w-full py-3 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <XCircle className="w-5 h-5" />
              <span>
                {isSubmitting 
                  ? (task.taskType === 'support_ticket' ? "Declining..." : "Cancelling...") 
                  : (task.taskType === 'support_ticket' ? "Decline Support Ticket" : "Cancel Task")
                }
              </span>
            </button>
            
            <button 
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
      <VendorBottomNav />
    </div>
  );
};

export default VendorCancelTaskDetail;
