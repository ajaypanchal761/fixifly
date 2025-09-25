import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMediaQuery, useTheme } from "@mui/material";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  RefreshCw
} from "lucide-react";
import VendorHeader from "../components/VendorHeader";
import VendorBottomNav from "../components/VendorBottomNav";
import vendorApiService from "../../services/vendorApi";

const VendorRescheduleTask = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { taskId } = useParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
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
        const response = await vendorApiService.getBookingById(taskId);
        
        if (response.success && response.data && response.data.booking) {
          setTask(response.data.booking);
        } else {
          setError("Task not found");
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
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

  // Generate time slots (9 AM to 6 PM, 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        slots.push({ value: timeString, label: displayTime });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleRescheduleTask = async () => {
    if (!selectedDate || !selectedTime || !reason.trim()) {
      alert("Please fill in all fields: date, time, and reason.");
      return;
    }

    if (!task || !taskId) {
      alert("Task information not available.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Call the reschedule API
      const response = await vendorApiService.rescheduleTask(taskId, {
        newDate: selectedDate,
        newTime: selectedTime,
        reason: reason.trim()
      });

      if (response.success) {
        // Create rescheduled task object for event dispatch
        const rescheduledTask = {
          id: task._id,
          caseId: task.bookingReference,
          title: task.services?.[0]?.serviceName || "Service Task",
          customer: task.customer?.name,
          phone: task.customer?.phone,
          amount: `₹${task.pricing?.totalAmount || 0}`,
          date: new Date(selectedDate).toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          }),
          time: new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          status: "Rescheduled",
          address: `${task.customer?.address?.street}, ${task.customer?.address?.city}`,
          issue: task.notes || "Service request",
          assignDate: task.scheduling?.scheduledDate ? new Date(task.scheduling.scheduledDate).toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          }) : "",
          assignTime: task.scheduling?.scheduledTime || "",
          taskType: task.services?.[0]?.serviceName || "Service",
          rescheduleReason: reason,
          originalDate: task.scheduling?.scheduledDate ? new Date(task.scheduling.scheduledDate).toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          }) : "",
          originalTime: task.scheduling?.scheduledTime || "",
          rescheduledAt: new Date().toISOString()
        };

        // Dispatch event to notify VendorHero component
        window.dispatchEvent(new CustomEvent('taskRescheduled', { detail: rescheduledTask }));
        
        // Show success message
        alert("Task has been rescheduled successfully.");
        
        // Navigate back to vendor dashboard
        navigate('/vendor');
      } else {
        throw new Error(response.message || "Failed to reschedule task");
      }
    } catch (error) {
      console.error("Error rescheduling task:", error);
      alert(`Failed to reschedule task: ${error.message || "Please try again."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <VendorHeader />
      <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0 overflow-hidden">
        <div className="container mx-auto px-4 py-4 h-full flex flex-col">
         

          {/* Task Details Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            {/* Header */}
            <div className="p-2 border-b border-gray-200 bg-gray-50">
              <h1 className="text-base font-semibold text-gray-800 mb-1">
                {task.services?.[0]?.serviceName || "Service Task"}
              </h1>
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-md border border-blue-200">
                  {task.bookingReference}
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded">
                  {task.services?.[0]?.serviceName || "Service"}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p><span className="font-medium">Customer:</span> {task.customer?.name}</p>
                <p><span className="font-medium">Phone:</span> {task.customer?.phone}</p>
                <p><span className="font-medium">Current Schedule:</span> {
                  task.scheduling?.scheduledDate 
                    ? new Date(task.scheduling.scheduledDate).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })
                    : new Date(task.scheduling?.preferredDate).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })
                } at {task.scheduling?.scheduledTime || task.scheduling?.preferredTimeSlot}</p>
              </div>
            </div>
          </div>

          {/* Reschedule Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-800">New Schedule</h2>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-md border border-blue-200">
                {task.bookingReference}
              </span>
            </div>
            
            <div className="space-y-4">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Date *
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Time *
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a time slot</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Reason Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Reschedule Reason</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please provide a reason for rescheduling *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter the reason for rescheduling this task..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This information will be shared with the customer.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mt-auto">
            <button 
              onClick={handleRescheduleTask}
              disabled={isSubmitting || !selectedDate || !selectedTime || !reason.trim()}
              className="w-full py-3 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>{isSubmitting ? "Rescheduling..." : "Reschedule Task"}</span>
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

export default VendorRescheduleTask;
