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
        
        // First, try to fetch from both bookings and support tickets to determine task type
        const [bookingsResponse, supportTicketsResponse] = await Promise.all([
          vendorApiService.getVendorBookings(),
          vendorApiService.getAssignedSupportTickets()
        ]);
        
        let foundTask = null;
        let taskType = null;

        // Check in bookings first
        if (bookingsResponse.success && bookingsResponse.data?.bookings) {
          const bookings = bookingsResponse.data.bookings;
          const bookingTask = bookings.find(booking => booking._id === taskId);
          
          if (bookingTask) {
            foundTask = bookingTask;
            taskType = 'booking';
          }
        }

        // If not found in bookings, check in support tickets
        if (!foundTask && supportTicketsResponse.success && supportTicketsResponse.data?.tickets) {
          const supportTickets = supportTicketsResponse.data.tickets;
          const supportTicket = supportTickets.find(ticket => ticket.id === taskId);
          
          if (supportTicket) {
            foundTask = supportTicket;
            taskType = 'support_ticket';
          }
        }

        if (foundTask) {
          setTask({
            ...foundTask,
            taskType: taskType
          });
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
        <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0 overflow-y-auto">
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
        <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0 overflow-y-auto">
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
      let response;
      
      // Call the appropriate reschedule API based on task type
      if (task.taskType === 'support_ticket') {
        response = await vendorApiService.rescheduleSupportTicket(taskId, {
          newDate: selectedDate,
          newTime: selectedTime,
          reason: reason.trim()
        });
      } else {
        // Default to booking reschedule
        response = await vendorApiService.rescheduleTask(taskId, {
          newDate: selectedDate,
          newTime: selectedTime,
          reason: reason.trim()
        });
      }

      if (response.success) {
        // Create rescheduled task object for event dispatch
        const rescheduledTask = {
          id: task.taskType === 'support_ticket' ? task.id : task._id,
          caseId: task.taskType === 'support_ticket' 
            ? task.id 
            : (task.bookingReference || `FIX${task._id.toString().slice(-8).toUpperCase()}`),
          title: task.taskType === 'support_ticket' 
            ? (task.subject || "Support Ticket")
            : (task.services?.[0]?.serviceName || "Service Task"),
          customer: task.taskType === 'support_ticket' 
            ? (task.customerName || 'Unknown Customer')
            : (task.customer?.name || 'Unknown Customer'),
          phone: task.taskType === 'support_ticket' 
            ? (task.customerPhone || 'N/A')
            : (task.customer?.phone || 'N/A'),
          amount: task.taskType === 'support_ticket' ? 'Support Ticket' : '₹0',
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
          address: task.taskType === 'support_ticket' 
            ? (task.address || "Address not available")
            : (task.customer?.address ? `${task.customer.address.street}, ${task.customer.address.city}` : "Address not available"),
          issue: task.taskType === 'support_ticket' 
            ? (task.description || task.subject || "Support request")
            : (task.notes || task.services?.[0]?.serviceName || "Service request"),
          assignDate: task.taskType === 'support_ticket' 
            ? (task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              }) : new Date().toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              }))
            : (task.scheduling?.scheduledDate ? new Date(task.scheduling.scheduledDate).toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              }) : (task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              }) : "")),
          assignTime: task.taskType === 'support_ticket' 
            ? (task.scheduledTime || "")
            : (task.scheduling?.scheduledTime || task.scheduledTime || ""),
          taskType: task.taskType === 'support_ticket' 
            ? (task.subject || "Support Ticket")
            : (task.services?.[0]?.serviceName || "Service"),
          rescheduleReason: reason,
          originalDate: task.taskType === 'support_ticket' 
            ? (task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              }) : new Date().toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              }))
            : (task.scheduling?.scheduledDate ? new Date(task.scheduling.scheduledDate).toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              }) : (task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              }) : "")),
          originalTime: task.taskType === 'support_ticket' 
            ? (task.scheduledTime || "")
            : (task.scheduling?.scheduledTime || task.scheduledTime || ""),
          rescheduledAt: new Date().toISOString()
        };

        // Dispatch event to notify VendorHero component
        window.dispatchEvent(new CustomEvent('taskRescheduled', { detail: rescheduledTask }));
        
        // Dispatch support ticket update event for admin interface
        if (task.taskType === 'support_ticket') {
          window.dispatchEvent(new CustomEvent('supportTicketUpdated', { 
            detail: { 
              ticketId: taskId,
              type: 'rescheduled',
              newDate: selectedDate,
              newTime: selectedTime,
              reason: reason.trim()
            } 
          }));
        }
        
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
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0 overflow-y-auto">
        <div className="container mx-auto px-4 py-4">
         

          {/* Task Details Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            {/* Header */}
            <div className="p-2 border-b border-gray-200 bg-gray-50">
              <h1 className="text-base font-semibold text-gray-800 mb-1">
                {task.taskType === 'support_ticket' 
                  ? (task.subject || "Support Ticket")
                  : (task.services?.[0]?.serviceName || "Service Task")
                }
              </h1>
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-md border border-blue-200">
                  {task.taskType === 'support_ticket' 
                    ? task.id 
                    : (task.bookingReference || `FIX${task._id.toString().slice(-8).toUpperCase()}`)
                  }
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded">
                  {task.taskType === 'support_ticket' 
                    ? (task.subject || "Support Ticket")
                    : (task.services?.[0]?.serviceName || "Service")
                  }
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p><span className="font-medium">Customer:</span> {
                  task.taskType === 'support_ticket' 
                    ? (task.customerName || 'Unknown Customer')
                    : (task.customer?.name || 'Unknown Customer')
                }</p>
                <p><span className="font-medium">Phone:</span> {
                  task.taskType === 'support_ticket' 
                    ? (task.customerPhone || 'N/A')
                    : (task.customer?.phone || 'N/A')
                }</p>
                <p><span className="font-medium">Current Schedule:</span> {
                  task.taskType === 'support_ticket' 
                    ? (task.scheduledDate 
                        ? new Date(task.scheduledDate).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })
                        : new Date().toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })
                      ) + ' at ' + (task.scheduledTime || 'Not scheduled')
                    : (task.scheduling?.scheduledDate 
                        ? new Date(task.scheduling.scheduledDate).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })
                        : task.scheduledDate 
                        ? new Date(task.scheduledDate).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })
                        : new Date(task.scheduling?.preferredDate).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })
                      ) + ' at ' + (task.scheduling?.scheduledTime || task.scheduledTime || task.scheduling?.preferredTimeSlot)
                }</p>
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
                {task.taskType === 'support_ticket' 
                  ? task.id 
                  : (task.bookingReference || `FIX${task._id.toString().slice(-8).toUpperCase()}`)
                }
              </span>
            </div>
            
            <div className="space-y-4">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      console.log('Date selected:', e.target.value);
                      setSelectedDate(e.target.value);
                    }}
                    onClick={(e) => {
                      console.log('Date input clicked');
                      (e.target as HTMLInputElement).showPicker?.();
                    }}
                    min={getMinDate()}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    required
                    style={{ 
                      colorScheme: 'light'
                    }}
                  />
                  <Calendar 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer"
                    onClick={() => {
                      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
                      if (dateInput) {
                        dateInput.showPicker?.();
                      }
                    }}
                  />
                </div>
                {selectedDate && (
                  <p className="text-sm text-green-600 mt-1">
                    Selected: {new Date(selectedDate).toLocaleDateString('en-IN', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Time *
                </label>
                <div className="relative">
                  <select
                    value={selectedTime}
                    onChange={(e) => {
                      console.log('Time selected:', e.target.value);
                      setSelectedTime(e.target.value);
                    }}
                    onClick={(e) => {
                      console.log('Time dropdown clicked');
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    required
                  >
                    <option value="">Choose a time slot</option>
                    {timeSlots.map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                  <Clock 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer"
                    onClick={() => {
                      const timeSelect = document.querySelector('select') as HTMLSelectElement;
                      if (timeSelect) {
                        timeSelect.focus();
                        timeSelect.click();
                      }
                    }}
                  />
                </div>
                {selectedTime && (
                  <p className="text-sm text-green-600 mt-1">
                    Selected: {new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                )}
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
