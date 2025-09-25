import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMediaQuery, useTheme } from "@mui/material";
import { 
  ArrowLeft,
  CheckCircle,
  CreditCard,
  FileText,
  DollarSign,
  Package,
  MapPin,
  Clock
} from "lucide-react";
import VendorHeader from "../components/VendorHeader";
import VendorBottomNav from "../components/VendorBottomNav";
import vendorApi from "@/services/vendorApi";

const VendorTaskPreview = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [isProcessing, setIsProcessing] = useState(false);

  const taskData = location.state;
  const paymentMethod = taskData?.paymentMethod || "cash";

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

  if (!taskData) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <VendorHeader />
        <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">No Data Found</h1>
              <p className="text-gray-600 mb-6">Please go back and fill the form.</p>
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

  const { task, resolutionNote, billingAmount, spareParts, travelingAmount } = taskData;

  const calculateTotal = () => {
    const sparePartsTotal = spareParts.reduce((sum, part) => {
      const amount = parseFloat(part.amount.replace(/[₹,]/g, '')) || 0;
      return sum + amount;
    }, 0);
    const billing = parseFloat(billingAmount.replace(/[₹,]/g, '')) || 0;
    const traveling = parseFloat(travelingAmount) || 0;
    return sparePartsTotal + billing + traveling;
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    
    try {
      // Create completion data object
      const completionData = {
        resolutionNote,
        billingAmount,
        spareParts,
        travelingAmount,
        paymentMethod,
        completedAt: new Date().toISOString(),
        totalAmount: calculateTotal()
      };

      // Update booking status to completed
      const response = await vendorApi.updateBookingStatus(task.id, 'completed', completionData);
      
      if (response.success) {
        // Create completed task object for local state update
        const completedTask = {
          id: task.id,
          caseId: task.caseId,
          title: task.title,
          customer: task.customer,
          phone: task.phone,
          amount: calculateTotal().toString(),
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
          status: "Completed",
          address: task.address,
          issue: task.issue,
          assignDate: task.assignDate,
          assignTime: task.assignTime,
          taskType: task.taskType,
          resolutionNote,
          billingAmount,
          spareParts,
          travelingAmount,
          paymentMethod,
          completedAt: new Date().toISOString()
        };

        // Dispatch event to notify VendorHero component
        window.dispatchEvent(new CustomEvent('taskCompleted', { detail: completedTask }));
        
        // Navigate back to vendor dashboard where the task will appear in closed tickets
        navigate('/vendor');
      } else {
        console.error('Failed to update booking status:', response.message);
        alert('Failed to complete task. Please try again.');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert('An error occurred while completing the task. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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

          {/* Task Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <h1 className="text-lg font-semibold text-gray-800 mb-2">{task.title}</h1>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                {task.caseId}
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded">
                {task.taskType}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{task.address}</span>
            </div>
          </div>

          {/* Resolution Note */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Resolution Note</h2>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
              {resolutionNote || "No resolution note provided"}
            </p>
          </div>

          {/* Spare Parts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <Package className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Spare Parts Used</h2>
            </div>
            <div className="space-y-3">
              {spareParts.map((part, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{part.name || `Part ${index + 1}`}</span>
                    <span className="font-semibold text-green-600">{part.amount || "₹0"}</span>
                  </div>
                  {part.photo && (
                    <img
                      src={part.photo}
                      alt="Spare part"
                      className="w-20 h-20 object-cover rounded-md border border-gray-300"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Billing Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <DollarSign className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Billing Summary</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Service Charges:</span>
                <span className="font-medium">{billingAmount || "₹0"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Traveling Charges:</span>
                <span className="font-medium">₹{travelingAmount}</span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-green-600">₹{calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Payment Method</h2>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                paymentMethod === 'online' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                <span className={`text-sm font-bold ${
                  paymentMethod === 'online' ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {paymentMethod === 'online' ? '💳' : '💰'}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-800">
                  {paymentMethod === 'online' ? 'Online Payment' : 'Cash Payment'}
                </span>
                <p className="text-xs text-gray-500">
                  {paymentMethod === 'online' ? 'Card, UPI, Net Banking' : 'Pay on completion'}
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Pay Now</span>
              </>
            )}
          </button>
        </div>
      </main>
      <VendorBottomNav />
    </div>
  );
};

export default VendorTaskPreview;
