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
  Star
} from "lucide-react";
import VendorHeader from "../components/VendorHeader";
import VendorBottomNav from "../components/VendorBottomNav";

const VendorClosedTaskDetail = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { taskId } = useParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Sample closed task data - in real app, this would come from API
  const closedTaskData = {
    4: { 
      id: 4, caseId: "CASE-004", title: "Laptop Screen Repair", customer: "John Doe", 
      phone: "+91 98765 43210", amount: "₹2,500", date: "15 Dec 2024", time: "10:30 AM", 
      status: "Completed", address: "123 MG Road, Bangalore, Karnataka 560001",
      issue: "Screen cracked and not displaying properly. Need immediate replacement.",
      assignDate: "15 Dec 2024", assignTime: "9:00 AM",
      taskType: "Laptop Repair",
      completedDate: "15 Dec 2024", completedTime: "12:30 PM",
      resolutionNote: "Replaced the cracked screen with a new one. All functionality restored and tested.",
      billingAmount: "₹2,500",
      spareParts: [
        { name: "Laptop Screen 15.6 inch", amount: "₹1,800", photo: null },
        { name: "Screen Connector Cable", amount: "₹300", photo: null }
      ],
      travelingAmount: "₹100",
      totalAmount: "₹2,700",
      customerRating: 5,
      customerFeedback: "Excellent service! The technician was very professional and completed the repair quickly."
    },
    5: { 
      id: 5, caseId: "CASE-005", title: "Desktop Motherboard Issue", customer: "Jane Smith", 
      phone: "+91 87654 32109", amount: "₹4,200", date: "15 Dec 2024", time: "2:15 PM", 
      status: "Completed", address: "456 Brigade Road, Bangalore, Karnataka 560025",
      issue: "Motherboard not booting. Previously repaired but issue recurring.",
      assignDate: "15 Dec 2024", assignTime: "1:00 PM",
      taskType: "Desktop Repair",
      completedDate: "15 Dec 2024", completedTime: "4:45 PM",
      resolutionNote: "Identified faulty RAM module. Replaced with new RAM and updated BIOS. System now booting properly.",
      billingAmount: "₹4,200",
      spareParts: [
        { name: "8GB DDR4 RAM", amount: "₹2,500", photo: null },
        { name: "Thermal Paste", amount: "₹200", photo: null }
      ],
      travelingAmount: "₹100",
      totalAmount: "₹4,500",
      customerRating: 4,
      customerFeedback: "Good service, but took longer than expected. The technician was knowledgeable though."
    },
    6: { 
      id: 6, caseId: "CASE-006", title: "Printer Not Working", customer: "Mike Johnson", 
      phone: "+91 76543 21098", amount: "₹1,800", date: "14 Dec 2024", time: "9:45 AM", 
      status: "Completed", address: "789 Koramangala, Bangalore, Karnataka 560034",
      issue: "Printer not responding to print commands. Paper jam issue.",
      assignDate: "14 Dec 2024", assignTime: "8:30 AM",
      taskType: "Printer Repair",
      completedDate: "14 Dec 2024", completedTime: "11:15 AM",
      resolutionNote: "Cleared paper jam and cleaned print heads. Replaced worn-out rollers. Printer now working perfectly.",
      billingAmount: "₹1,800",
      spareParts: [
        { name: "Printer Rollers Set", amount: "₹800", photo: null },
        { name: "Print Head Cleaning Kit", amount: "₹300", photo: null }
      ],
      travelingAmount: "₹100",
      totalAmount: "₹2,200",
      customerRating: 5,
      customerFeedback: "Quick and efficient service. The printer is working like new now!"
    }
  };

  const task = taskId ? closedTaskData[parseInt(taskId) as keyof typeof closedTaskData] : null;

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
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
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
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-800">Scheduled: {task.date} at {task.time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">Completed: {task.completedDate} at {task.completedTime}</span>
                  </div>
                </div>
              </div>

              {/* Issue Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">Issue Description</h3>
                <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md">{task.issue}</p>
              </div>

              {/* Resolution Note */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">Resolution Note</h3>
                <div className="flex items-start space-x-2">
                  <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                  <p className="text-sm text-gray-800 bg-green-50 p-3 rounded-md">{task.resolutionNote}</p>
                </div>
              </div>

              {/* Spare Parts Used */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">Spare Parts Used</h3>
                <div className="space-y-2">
                  {task.spareParts.map((part, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center space-x-2">
                        <Camera className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-800">{part.name}</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">{part.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing Summary */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">Billing Summary</h3>
                <div className="bg-gray-50 p-3 rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Service Amount:</span>
                    <span className="text-sm font-medium text-gray-800">{task.billingAmount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Spare Parts:</span>
                    <span className="text-sm font-medium text-gray-800">
                      ₹{task.spareParts.reduce((sum, part) => sum + parseInt(part.amount.replace(/[₹,]/g, '')), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Traveling:</span>
                    <span className="text-sm font-medium text-gray-800">{task.travelingAmount}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-300 pt-2">
                    <span className="text-sm font-semibold text-gray-800">Total Amount:</span>
                    <span className="text-lg font-bold text-green-600">{task.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Customer Feedback */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">Customer Feedback</h3>
                <div className="bg-yellow-50 p-3 rounded-md">
                  <div className="flex items-center space-x-2 mb-2">
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
