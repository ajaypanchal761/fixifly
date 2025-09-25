import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMediaQuery, useTheme } from "@mui/material";
import { 
  ArrowLeft,
  Plus,
  X,
  Camera,
  FileText,
  DollarSign,
  Loader2
} from "lucide-react";
import VendorHeader from "../components/VendorHeader";
import VendorBottomNav from "../components/VendorBottomNav";
import vendorApi from "@/services/vendorApi";

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

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash' | ''>('');
  const [includeGST, setIncludeGST] = useState(false);
  const [spareParts, setSpareParts] = useState<SparePart[]>([
    { id: 1, name: "", amount: "", photo: null }
  ]);

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
    
    if (paymentMethod === 'online' && includeGST) {
      const gstAmount = sparePartsTotal * 0.18; // 18% GST
      return sparePartsTotal + gstAmount;
    }
    
    return sparePartsTotal; // Only spare parts amount, no traveling charge
  };

  const calculateGSTAmount = () => {
    const sparePartsTotal = spareParts.reduce((sum, part) => {
      const amount = parseFloat(part.amount.replace(/[₹,]/g, '')) || 0;
      return sum + amount;
    }, 0);
    return sparePartsTotal * 0.18; // 18% GST
  };

  const handleNext = async () => {
    try {
      // Validate payment method is selected
      if (!paymentMethod) {
        alert('Please select a payment method');
        return;
      }

      // Validate resolution note
      if (!resolutionNote.trim()) {
        alert('Please enter resolution notes');
        return;
      }

      // Prepare task completion data
      const taskData = {
        resolutionNote: resolutionNote.trim(),
        spareParts: spareParts.filter(part => part.name.trim() !== ''), // Filter out empty parts
        paymentMethod: paymentMethod as 'online' | 'cash',
        includeGST: includeGST,
        gstAmount: includeGST ? calculateGSTAmount() : 0,
        totalAmount: calculateTotal(),
        travelingAmount: "100"
      };

      // Call the complete task API
      const response = await vendorApi.completeTask(taskId!, taskData);
      
      if (response.success) {
        if (paymentMethod === 'online') {
          // For online payment, task is completed and user will pay
          const totalAmount = calculateTotal();
          const gstAmount = includeGST ? calculateGSTAmount() : 0;
          
          if (includeGST) {
            alert(`Task completed successfully! User will now receive payment request for ₹${totalAmount.toLocaleString()} (including 18% GST: ₹${gstAmount.toLocaleString()}).`);
          } else {
            alert(`Task completed successfully! User will now receive payment request for ₹${totalAmount.toLocaleString()}.`);
          }
          
          // Trigger refresh event for vendor home page
          window.dispatchEvent(new CustomEvent('taskCompleted', { 
            detail: { taskId, status: 'completed', totalAmount, includeGST, gstAmount } 
          }));
          
          // Store GST data in localStorage for user booking page
          const gstData = {
            taskId,
            includeGST,
            gstAmount,
            totalAmount,
            baseAmount: totalAmount - gstAmount,
            timestamp: Date.now()
          };
          localStorage.setItem(`gst_${taskId}`, JSON.stringify(gstData));
          
          // Also trigger event for user bookings refresh
          window.dispatchEvent(new CustomEvent('bookingUpdated', { 
            detail: { taskId, status: 'in_progress', paymentMode: 'online', paymentStatus: 'pending', includeGST, gstAmount } 
          }));
          
          navigate('/vendor');
        } else {
          // For cash payment, show success message and redirect
          alert('Task completed successfully! Payment will be collected on site.');
          
          // Trigger refresh event for vendor home page
          window.dispatchEvent(new CustomEvent('taskCompleted', { 
            detail: { taskId, status: 'completed' } 
          }));
          
          // Also trigger event for user bookings refresh - move to completed
          window.dispatchEvent(new CustomEvent('bookingUpdated', { 
            detail: { taskId, status: 'completed', paymentMode: 'cash', paymentStatus: 'collected' } 
          }));
          
          navigate('/vendor');
        }
      } else {
        alert('Failed to complete task. Please try again.');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert('An error occurred while completing the task. Please try again.');
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

          {/* Total Amount */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Amount Summary</h2>
            
            <div className="space-y-2">
              {/* Spare Parts Total */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Spare Parts Total</span>
                <span className="text-sm font-medium text-gray-800">
                  ₹{spareParts.reduce((sum, part) => {
                    const amount = parseFloat(part.amount.replace(/[₹,]/g, '')) || 0;
                    return sum + amount;
                  }, 0).toLocaleString()}
                </span>
              </div>

              {/* GST (only show if online payment and GST is included) */}
              {paymentMethod === 'online' && includeGST && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">GST (18%)</span>
                  <span className="text-sm font-medium text-gray-800">
                    ₹{calculateGSTAmount().toLocaleString()}
                  </span>
                </div>
              )}

              {/* Total Amount */}
              <div className="flex items-center justify-between border-t border-gray-300 pt-2">
                <span className="text-lg font-semibold text-gray-800">Total Amount</span>
                <span className="text-2xl font-bold text-blue-600">₹{calculateTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Payment Method</h2>
            <div className="space-y-3">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="online"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'cash')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="online" className="flex items-center space-x-2 cursor-pointer">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">💳</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-800">Online Payment</span>
                      <p className="text-xs text-gray-500">Card, UPI, Net Banking</p>
                    </div>
                  </label>
                </div>
                
                {/* GST Option - only show when online payment is selected */}
                {paymentMethod === 'online' && (
                  <div className="ml-11 flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="includeGST"
                      checked={includeGST}
                      onChange={(e) => setIncludeGST(e.target.checked)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="includeGST" className="flex items-center space-x-2 cursor-pointer">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 text-xs font-bold">📋</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-800">Include GST (18%)</span>
                        <p className="text-xs text-gray-500">Add 18% GST to the total amount</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="cash"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'cash')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="cash" className="flex items-center space-x-2 cursor-pointer">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm font-bold">💰</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-800">Cash Payment</span>
                    <p className="text-xs text-gray-500">Pay on completion</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!paymentMethod}
            className={`w-full py-3 px-4 rounded-lg transition-colors font-medium ${
              paymentMethod 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {paymentMethod === 'online' && includeGST ? 'Complete Task & Send Payment Request' : 'Complete Task'}
          </button>
        </div>
      </main>
      <VendorBottomNav />
    </div>
  );
};

export default VendorClosedTask;
