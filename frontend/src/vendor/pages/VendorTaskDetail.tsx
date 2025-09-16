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
  Clock
} from "lucide-react";
import VendorHeader from "../components/VendorHeader";
import VendorBottomNav from "../components/VendorBottomNav";

const VendorTaskDetail = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { taskId } = useParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  const task = taskId ? taskData[parseInt(taskId) as keyof typeof taskData] : null;

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
                   <p className="text-sm text-gray-800">{task.customer}</p>
                   <a 
                     href={`tel:${task.phone}`}
                     className="flex items-center space-x-3 bg-green-50 hover:bg-green-100 p-3 rounded-lg transition-colors group"
                   >
                     <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full group-hover:bg-green-600 transition-colors">
                       <Phone className="w-4 h-4 text-white" />
                     </div>
                     <div>
                       <p className="text-sm font-medium text-gray-800">{task.phone}</p>
                       <p className="text-xs text-green-600">Tap to call</p>
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
                  <span className="text-sm font-semibold text-green-600">{task.amount}</span>
                </div>
              </div>

              {/* Assignment Info */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">Assignment Details</h3>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-800">Assigned on {task.assignDate} at {task.assignTime}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-200 space-y-2">
              <button 
                onClick={handleCloseTask}
                className="w-full py-3 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Close Task</span>
              </button>
              <button 
                onClick={handleCancelTask}
                className="w-full py-3 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <XCircle className="w-5 h-5" />
                <span>Cancel Task</span>
              </button>
              <button 
                onClick={handleRescheduleTask}
                className="w-full py-3 px-4 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Clock className="w-5 h-5" />
                <span>Reschedule Task</span>
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
