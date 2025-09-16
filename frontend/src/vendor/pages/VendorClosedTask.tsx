import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMediaQuery, useTheme } from "@mui/material";
import { 
  ArrowLeft,
  Plus,
  X,
  Camera,
  FileText,
  DollarSign
} from "lucide-react";
import VendorHeader from "../components/VendorHeader";
import VendorBottomNav from "../components/VendorBottomNav";

interface SparePart {
  id: number;
  name: string;
  amount: string;
  photo: string | null;
}

const VendorClosedTask = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { taskId } = useParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [resolutionNote, setResolutionNote] = useState("");
  const [billingAmount, setBillingAmount] = useState("");
  const [spareParts, setSpareParts] = useState<SparePart[]>([
    { id: 1, name: "", amount: "", photo: null }
  ]);

  // Sample task data
  const taskData = {
    1: { 
      id: 1, caseId: "CASE-001", title: "Laptop Screen Repair", customer: "John Doe", 
      phone: "+91 98765 43210", amount: "₹2,500", date: "15 Dec 2024", time: "10:30 AM", 
      status: "Emergency", address: "123 MG Road, Bangalore, Karnataka 560001",
      issue: "Screen cracked and not displaying properly. Need immediate replacement.",
      assignDate: "15 Dec 2024", assignTime: "9:00 AM",
      taskType: "Laptop Repair"
    }
  };

  const task = taskData[taskId as keyof typeof taskData];

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

  const addSparePart = () => {
    const newId = Math.max(...spareParts.map(p => p.id)) + 1;
    setSpareParts([...spareParts, { id: newId, name: "", amount: "", photo: null }]);
  };

  const removeSparePart = (id: number) => {
    if (spareParts.length > 1) {
      setSpareParts(spareParts.filter(part => part.id !== id));
    }
  };

  const updateSparePart = (id: number, field: keyof SparePart, value: string) => {
    setSpareParts(spareParts.map(part => 
      part.id === id ? { ...part, [field]: value } : part
    ));
  };

  const handlePhotoUpload = (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateSparePart(id, 'photo', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTotal = () => {
    const sparePartsTotal = spareParts.reduce((sum, part) => {
      const amount = parseFloat(part.amount.replace(/[₹,]/g, '')) || 0;
      return sum + amount;
    }, 0);
    const billing = parseFloat(billingAmount.replace(/[₹,]/g, '')) || 0;
    const traveling = 100; // Fixed traveling amount
    return sparePartsTotal + billing + traveling;
  };

  const handleNext = () => {
    // Navigate to preview page with all data
    const taskData = {
      task,
      resolutionNote,
      billingAmount,
      spareParts,
      travelingAmount: "100"
    };
    navigate(`/vendor/task/${taskId}/preview`, { state: taskData });
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

          {/* Task Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <h1 className="text-lg font-semibold text-gray-800 mb-2">{task.title}</h1>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                {task.caseId}
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded">
                {task.taskType}
              </span>
            </div>
          </div>

          {/* Resolution Note */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Resolution Note</h2>
            </div>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Describe how the issue was resolved..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          {/* Billing Amount */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <DollarSign className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Billing Amount</h2>
            </div>
            <input
              type="text"
              value={billingAmount}
              onChange={(e) => setBillingAmount(e.target.value)}
              placeholder="Enter billing amount (e.g., ₹2,500)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Spare Parts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Spare Parts Used</h2>
              <button
                onClick={addSparePart}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add</span>
              </button>
            </div>

            <div className="space-y-4">
              {spareParts.map((part, index) => (
                <div key={part.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">Part {index + 1}</span>
                    {spareParts.length > 1 && (
                      <button
                        onClick={() => removeSparePart(part.id)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Spare Part Name */}
                    <input
                      type="text"
                      value={part.name}
                      onChange={(e) => updateSparePart(part.id, 'name', e.target.value)}
                      placeholder="Spare part name (e.g., Laptop Screen)"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    {/* Amount */}
                    <input
                      type="text"
                      value={part.amount}
                      onChange={(e) => updateSparePart(part.id, 'amount', e.target.value)}
                      placeholder="Amount (e.g., ₹1,500)"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    {/* Photo Upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Photo</label>
                      <div className="flex items-center space-x-3">
                        {part.photo ? (
                          <div className="relative">
                            <img
                              src={part.photo}
                              alt="Spare part"
                              className="w-16 h-16 object-cover rounded-md border border-gray-300"
                            />
                            <button
                              onClick={() => updateSparePart(part.id, 'photo', '')}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center w-16 h-16 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 transition-colors">
                            <Camera className="w-6 h-6 text-gray-400" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(part.id, e)}
                              className="hidden"
                            />
                          </label>
                        )}
                        <span className="text-xs text-gray-500">Tap to add photo</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traveling Amount & Total */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Amount Summary</h2>
            
            {/* Traveling Amount */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
              <div>
                <span className="text-sm font-medium text-gray-600">Traveling Amount</span>
                <span className="text-xs text-gray-500 ml-2">(Fixed)</span>
              </div>
              <span className="text-lg font-semibold text-green-600">₹100</span>
            </div>

            {/* Total Amount */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-800">Total Amount</span>
              <span className="text-2xl font-bold text-blue-600">₹{calculateTotal().toLocaleString()}</span>
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Next - Preview & Payment
          </button>
        </div>
      </main>
      <VendorBottomNav />
    </div>
  );
};

export default VendorClosedTask;
