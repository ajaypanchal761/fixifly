import { useState } from "react";
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

const VendorRescheduleTask = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { taskId } = useParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sample task data - in real app, this would come from API
  const taskData = {
    1: { 
      id: 1, caseId: "CASE-001", title: "Laptop Screen Repair", customer: "John Doe", 
      phone: "+91 98765 43210", amount: "₹2,500", date: "15 Dec 2024", time: "10:30 AM", 
      status: "Emergency", address: "123 MG Road, Bangalore, Karnataka 560001",
      issue: "Screen cracked and not displaying properly. Need immediate replacement.",
      assignDate: "15 Dec 2024", assignTime: "9:00 AM",
      taskType: "Laptop Repair"
    },
    2: { 
      id: 2, caseId: "CASE-002", title: "Desktop Motherboard Issue", customer: "Jane Smith", 
      phone: "+91 87654 32109", amount: "₹4,200", date: "15 Dec 2024", time: "2:15 PM", 
      status: "Repeat", address: "456 Brigade Road, Bangalore, Karnataka 560025",
      issue: "Motherboard not booting. Previously repaired but issue recurring.",
      assignDate: "15 Dec 2024", assignTime: "1:00 PM",
      taskType: "Desktop Repair"
    },
    3: { 
      id: 3, caseId: "CASE-003", title: "Printer Not Working", customer: "Mike Johnson", 
      phone: "+91 76543 21098", amount: "₹1,800", date: "14 Dec 2024", time: "9:45 AM", 
      status: "Normal", address: "789 Koramangala, Bangalore, Karnataka 560034",
      issue: "Printer not responding to print commands. Paper jam issue.",
      assignDate: "14 Dec 2024", assignTime: "8:30 AM",
      taskType: "Printer Repair"
    }
  };

  const task = taskData[Number(taskId) as keyof typeof taskData];

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

    setIsSubmitting(true);
    
    try {
      // Simulate API call to reschedule task
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create rescheduled task object
      const rescheduledTask = {
        id: task.id,
        caseId: task.caseId,
        title: task.title,
        customer: task.customer,
        phone: task.phone,
        amount: task.amount,
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
        address: task.address,
        issue: task.issue,
        assignDate: task.assignDate,
        assignTime: task.assignTime,
        taskType: task.taskType,
        rescheduleReason: reason,
        originalDate: task.date,
        originalTime: task.time,
        rescheduledAt: new Date().toISOString()
      };

      // Dispatch event to notify VendorHero component
      window.dispatchEvent(new CustomEvent('taskRescheduled', { detail: rescheduledTask }));
      
      // Show success message
      alert("Task has been rescheduled successfully.");
      
      // Navigate back to vendor dashboard
      navigate('/vendor');
    } catch (error) {
      console.error("Error rescheduling task:", error);
      alert("Failed to reschedule task. Please try again.");
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
              <h1 className="text-base font-semibold text-gray-800 mb-1">{task.title}</h1>
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-md border border-blue-200">
                  {task.caseId}
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded">
                  {task.taskType}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p><span className="font-medium">Customer:</span> {task.customer}</p>
                <p><span className="font-medium">Current Schedule:</span> {task.date} at {task.time}</p>
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
                {task.caseId}
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
