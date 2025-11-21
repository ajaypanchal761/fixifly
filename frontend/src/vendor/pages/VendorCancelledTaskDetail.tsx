import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMediaQuery, useTheme } from "@mui/material";
import { 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  ArrowLeft,
  XCircle,
  Clock,
  FileText,
  AlertTriangle,
  User
} from "lucide-react";
import VendorHeader from "../components/VendorHeader";
import VendorBottomNav from "../components/VendorBottomNav";

const VendorCancelledTaskDetail = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { taskId } = useParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Sample cancelled task data - in real app, this would come from API
  const cancelledTaskData = {
    7: { 
      id: 7, caseId: "CASE-007", title: "Refrigerator Repair", customer: "Tom Wilson", 
      phone: "+91 32109 87654", amount: "₹3,200", date: "13 Dec 2024", time: "4:15 PM", 
      status: "Cancelled", address: "147 Jayanagar, Bangalore, Karnataka 560011",
      issue: "Refrigerator not cooling. Food spoilage risk.",
      assignDate: "13 Dec 2024", assignTime: "3:00 PM",
      taskType: "Refrigerator Repair",
      cancelledDate: "13 Dec 2024", cancelledTime: "5:30 PM",
      cancellationReason: "Customer requested cancellation due to emergency situation at home",
      cancelledBy: "Customer",
      refundStatus: "Processed",
      refundAmount: "₹3,200",
      refundDate: "14 Dec 2024"
    },
    8: { 
      id: 8, caseId: "CASE-008", title: "Microwave Service", customer: "Emma Taylor", 
      phone: "+91 21098 76543", amount: "₹1,500", date: "11 Dec 2024", time: "10:00 AM", 
      status: "Cancelled", address: "258 Banashankari, Bangalore, Karnataka 560070",
      issue: "Microwave not heating food properly. Previous repair didn't work.",
      assignDate: "11 Dec 2024", assignTime: "9:00 AM",
      taskType: "Microwave Repair",
      cancelledDate: "11 Dec 2024", cancelledTime: "9:45 AM",
      cancellationReason: "Vendor unable to reach location due to traffic congestion",
      cancelledBy: "Vendor",
      refundStatus: "Processed",
      refundAmount: "₹1,500",
      refundDate: "12 Dec 2024"
    },
    9: { 
      id: 9, caseId: "CASE-009", title: "AC Installation", customer: "Robert Kim", 
      phone: "+91 10987 65432", amount: "₹8,500", date: "10 Dec 2024", time: "2:00 PM", 
      status: "Cancelled", address: "369 Malleswaram, Bangalore, Karnataka 560003",
      issue: "New AC installation required for bedroom.",
      assignDate: "10 Dec 2024", assignTime: "1:00 PM",
      taskType: "AC Installation",
      cancelledDate: "10 Dec 2024", cancelledTime: "1:30 PM",
      cancellationReason: "Customer found better deal elsewhere",
      cancelledBy: "Customer",
      refundStatus: "Pending",
      refundAmount: "₹8,500",
      refundDate: "TBD"
    }
  };

  const task = taskId ? cancelledTaskData[parseInt(taskId) as keyof typeof cancelledTaskData] : null;

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
        <main className="flex-1 pb-24 md:pb-0 pt-16 md:pt-0 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Task Not Found</h1>
              <p className="text-gray-600 mb-6">The requested cancelled task could not be found.</p>
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

  const getRefundStatusColor = (status: string) => {
    switch (status) {
      case 'Processed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCancelledByColor = (cancelledBy: string) => {
    return cancelledBy === 'Customer' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800';
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 md:pb-0 pt-16 md:pt-0">
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
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
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
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600">Cancelled: {task.cancelledDate} at {task.cancelledTime}</span>
                  </div>
                </div>
              </div>

              {/* Issue Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">Issue Description</h3>
                <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md">{task.issue}</p>
              </div>

              {/* Cancellation Details */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">Cancellation Details</h3>
                <div className="bg-red-50 p-3 rounded-md space-y-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-gray-800">Cancellation Reason:</span>
                  </div>
                  <p className="text-sm text-gray-800 ml-6">{task.cancellationReason}</p>
                  
                  <div className="flex items-center space-x-2 mt-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Cancelled by:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getCancelledByColor(task.cancelledBy)}`}>
                      {task.cancelledBy}
                    </span>
                  </div>
                </div>
              </div>

              {/* Refund Information */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">Refund Information</h3>
                <div className="bg-gray-50 p-3 rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Refund Status:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getRefundStatusColor(task.refundStatus)}`}>
                      {task.refundStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Refund Amount:</span>
                    <span className="text-sm font-semibold text-green-600">{task.refundAmount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Refund Date:</span>
                    <span className="text-sm text-gray-800">{task.refundDate}</span>
                  </div>
                </div>
              </div>

              {/* Original Billing */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">Original Billing</h3>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-600">{task.amount}</span>
                  <span className="text-xs text-gray-500">(Refunded)</span>
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

export default VendorCancelledTaskDetail;
