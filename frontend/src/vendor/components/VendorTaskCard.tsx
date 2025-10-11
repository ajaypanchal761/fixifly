import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  MapPin, 
  Clock, 
  User, 
  Phone,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import vendorApi from '@/services/vendorApi';
import { useToast } from '@/hooks/use-toast';
import WalletBalanceCheck from './WalletBalanceCheck';
import { vendorDepositService } from '@/services/vendorDepositService';
import { useVendor } from '@/contexts/VendorContext';

interface VendorTaskCardProps {
  task: {
    id: string;
    caseId: string;
    title: string;
    customer: string;
    phone: string;
    amount: string;
    date: string;
    time: string;
    status: string;
    address: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
    userId?: {
      address?: {
        street?: string;
        city?: string;
        state?: string;
        pincode?: string;
        landmark?: string;
      };
    };
    issue: string;
    assignDate: string;
    assignTime: string;
    priority: string;
    bookingStatus?: string;
    vendorStatus?: string;
    vendorResponse?: {
      status: string;
      respondedAt?: string;
      responseNote?: string;
    };
    isSupportTicket?: boolean;
  };
  onStatusUpdate: (taskId: string, newStatus: string) => void;
}

const VendorTaskCard: React.FC<VendorTaskCardProps> = ({ task, onStatusUpdate }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { vendor, updateVendor } = useVendor();

  // Safe render helper to prevent object rendering
  const safeRender = (value: any, fallback: string = 'N/A'): string => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') {
      // Try to extract meaningful data from objects
      if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : fallback;
      }
      
      // Check if it's an empty object
      if (Object.keys(value).length === 0) {
        console.warn('Empty object detected:', { value, taskId: task.id, taskCaseId: task.caseId });
        return fallback;
      }
      
      // Try to extract string values from objects
      const stringValues = Object.values(value).filter(v => typeof v === 'string' && v.trim() !== '');
      if (stringValues.length > 0) {
        return stringValues.join(', ');
      }
      
      console.error('Attempted to render object directly:', {
        value,
        type: typeof value,
        keys: Object.keys(value),
        taskId: task.id,
        taskCaseId: task.caseId
      });
      return fallback;
    }
    return String(value);
  };
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDepositRequiredModalOpen, setIsDepositRequiredModalOpen] = useState(false);
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWalletCheckOpen, setIsWalletCheckOpen] = useState(false);
  
  // Debug: Log task data to identify object issues
  useEffect(() => {
    console.log('VendorTaskCard - Task data received:', {
      id: task.id,
      caseId: task.caseId,
      title: task.title,
      customer: task.customer,
      phone: task.phone,
      address: task.address,
      street: task.street,
      city: task.city,
      state: task.state,
      pincode: task.pincode,
      landmark: task.landmark,
      userId: task.userId,
      date: task.date,
      time: task.time,
      amount: task.amount,
      status: task.status,
      priority: task.priority,
      issue: task.issue,
      assignDate: task.assignDate,
      assignTime: task.assignTime,
      vendorStatus: task.vendorStatus,
      bookingStatus: task.bookingStatus,
      vendorResponse: task.vendorResponse,
      isSupportTicket: task.isSupportTicket
    });
    
    // Check each property for object types
    const checkProperty = (propName: string, value: any) => {
      if (typeof value === 'object' && value !== null) {
        console.warn(`⚠️ Property ${propName} is an object:`, value);
      }
    };
    
    checkProperty('id', task.id);
    checkProperty('caseId', task.caseId);
    checkProperty('title', task.title);
    checkProperty('customer', task.customer);
    checkProperty('phone', task.phone);
    checkProperty('address', task.address);
    checkProperty('date', task.date);
    checkProperty('time', task.time);
    checkProperty('amount', task.amount);
    checkProperty('status', task.status);
    checkProperty('priority', task.priority);
    checkProperty('issue', task.issue);
    checkProperty('assignDate', task.assignDate);
    checkProperty('assignTime', task.assignTime);
    checkProperty('vendorStatus', task.vendorStatus);
    checkProperty('bookingStatus', task.bookingStatus);
    checkProperty('vendorResponse', task.vendorResponse);
  }, [task]);
  
  // Local state to track immediate status changes
  const [localTaskStatus, setLocalTaskStatus] = useState(task.vendorStatus || task.bookingStatus);

  // Update local status when task prop changes
  useEffect(() => {
    setLocalTaskStatus(task.vendorStatus || task.bookingStatus);
  }, [task.vendorStatus, task.bookingStatus]);

  const getPriorityBadge = (priority: string) => {
    const safePriority = safeRender(priority, 'Unknown');
    switch (safePriority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-blue-100 text-blue-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{safePriority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    const safeStatus = safeRender(status, 'Unknown');
    switch (safeStatus) {
      case 'Emergency':
        return <Badge className="bg-red-100 text-red-800">Emergency</Badge>;
      case 'High Priority':
        return <Badge className="bg-orange-100 text-orange-800">High Priority</Badge>;
      case 'Normal':
        return <Badge className="bg-blue-100 text-blue-800">Normal</Badge>;
      case 'Low Priority':
        return <Badge className="bg-gray-100 text-gray-800">Low Priority</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{safeStatus}</Badge>;
    }
  };

  const handleAcceptTask = async () => {
    setIsProcessing(true);
    try {
      let response;
      
      if (task.isSupportTicket) {
        response = await vendorApi.acceptSupportTicket(task.id);
      } else {
        response = await vendorApi.acceptTask(task.id);
      }
      
      if (response.success) {
        toast({
          title: "Task Accepted",
          description: "You have successfully accepted this task. You can now view the details and start working on it.",
          variant: "default"
        });
        
        // Immediately update local status for instant UI update
        setLocalTaskStatus(task.isSupportTicket ? 'Accepted' : 'in_progress');
        
        onStatusUpdate(task.id, 'accepted');
        setIsAcceptModalOpen(false);
        
        // Dispatch support ticket update event for admin interface
        if (task.isSupportTicket) {
          window.dispatchEvent(new CustomEvent('supportTicketUpdated', { 
            detail: { 
              ticketId: task.id,
              type: 'accepted',
              vendorStatus: 'Accepted'
            } 
          }));
        }
      } else {
        // Check if it's a mandatory deposit requirement error
        if (response.error === 'MANDATORY_DEPOSIT_REQUIRED') {
          setIsDepositRequiredModalOpen(true);
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to accept task",
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      console.error('Error accepting task:', error);
      
      // SIMPLE TEST - Show alert to verify catch block is working
      alert('CATCH BLOCK EXECUTED - Error: ' + error?.message);
      
      // Check for mandatory deposit error using the custom property from vendorApi
      if (error?.isMandatoryDepositError || error?.message?.includes('Mandatory deposit')) {
        console.log('🚨 MANDATORY DEPOSIT ERROR DETECTED - SHOWING MODAL');
        alert('MANDATORY DEPOSIT ERROR DETECTED - SHOWING MODAL');
        setIsDepositRequiredModalOpen(true);
        console.log('Modal state set to true:', isDepositRequiredModalOpen);
        alert('Modal state set to true - check if modal appears');
        return; // Exit early to prevent showing toast
      }
      
      // Show generic error toast for other errors
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to accept task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMakeDeposit = async () => {
    if (!vendor) {
      toast({
        title: "Error",
        description: "Vendor information not available.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingDeposit(true);
    
    try {
      const depositAmount = 2000; // Mandatory deposit amount
      
      await vendorDepositService.processDepositPayment(
        depositAmount,
        vendor.fullName,
        vendor.email,
        vendor.phone,
        (response) => {
          // Payment successful
          toast({
            title: "Deposit Successful!",
            description: `₹${depositAmount.toLocaleString()} has been added to your wallet. You can now accept tasks.`,
          });

          // Update vendor context with new wallet data
          if (updateVendor) {
            updateVendor({
              wallet: {
                ...vendor.wallet,
                currentBalance: (vendor.wallet?.currentBalance || 0) + depositAmount,
                hasMandatoryDeposit: true,
                canAcceptTasks: true
              }
            });
          }

          // Close the modal
          setIsDepositRequiredModalOpen(false);
          
          // Show success message
          toast({
            title: "Ready to Accept Tasks!",
            description: "Your mandatory deposit has been completed. You can now accept tasks.",
          });
        },
        (error) => {
          console.error('Deposit payment failed:', error);
          toast({
            title: "Payment Failed",
            description: "Failed to process the deposit payment. Please try again.",
            variant: "destructive"
          });
        }
      );
    } catch (error) {
      console.error('Error processing deposit:', error);
      toast({
        title: "Error",
        description: "An error occurred while processing the deposit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const handleDeclineTask = async () => {
    if (!declineReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for declining this task.",
        variant: "destructive"
      });
      return;
    }

    // Check wallet balance before proceeding
    setIsWalletCheckOpen(true);
  };

  const handleWalletCheckProceed = async () => {
    setIsWalletCheckOpen(false);
    setIsProcessing(true);
    
    try {
      console.log('handleWalletCheckProceed: Starting decline process for task:', task.id);
      let response;
      
      if (task.isSupportTicket) {
        console.log('handleWalletCheckProceed: Declining support ticket');
        response = await vendorApi.declineSupportTicket(task.id, declineReason);
      } else {
        console.log('handleWalletCheckProceed: Declining booking task');
        response = await vendorApi.declineTask(task.id, declineReason);
      }
      
      if (response.success) {
        const penaltyMessage = response.penalty?.applied 
          ? ` ₹${response.penalty.amount} penalty has been applied to your wallet.`
          : '';
        
        toast({
          title: "Task Declined",
          description: `You have declined this task. The admin will be notified and may assign it to another vendor.${penaltyMessage}`,
          variant: "default"
        });
        
        // Immediately update local status for instant UI update
        setLocalTaskStatus(task.isSupportTicket ? 'Declined' : 'declined');
        
        onStatusUpdate(task.id, 'declined');
        setIsDeclineModalOpen(false);
        setDeclineReason('');
        
        // Dispatch support ticket update event for admin interface
        if (task.isSupportTicket) {
          window.dispatchEvent(new CustomEvent('supportTicketUpdated', { 
            detail: { 
              ticketId: task.id,
              type: 'declined',
              vendorStatus: 'Declined',
              reason: declineReason
            } 
          }));
        }
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to decline task",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('handleWalletCheckProceed: Error declining task:', error);
      console.error('handleWalletCheckProceed: Error message:', error.message);
      
      // Check if task was already declined
      if (error.message && error.message.includes('already been declined')) {
        console.log('handleWalletCheckProceed: Task already declined, updating UI');
        toast({
          title: "Task Already Declined",
          description: "This task has already been declined. Refreshing status...",
          variant: "default"
        });
        
        // Update local status to reflect the declined state
        setLocalTaskStatus(task.isSupportTicket ? 'Declined' : 'declined');
        onStatusUpdate(task.id, 'declined');
        setIsDeclineModalOpen(false);
        setDeclineReason('');
      } else {
        console.log('handleWalletCheckProceed: Other error occurred');
        toast({
          title: "Error",
          description: "Failed to decline task. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };


  const handleViewTask = () => {
    navigate(`/vendor/task/${task.id}`, {
      state: { task, from: 'new' }
    });
  };

  // Use local status for immediate UI updates, fallback to task status
  const currentStatus = localTaskStatus || (task.isSupportTicket ? task.vendorStatus : task.bookingStatus);
  
  // Check if task is declined by vendor (either manually or auto-rejected)
  const isVendorDeclined = task.vendorResponse?.status === 'declined' || 
                          (task.isSupportTicket ? task.vendorStatus === 'Declined' : false);
  
  const isTaskAccepted = task.isSupportTicket 
    ? (currentStatus === 'Accepted' || currentStatus === 'Completed')
    : (currentStatus === 'in_progress' || currentStatus === 'completed');
    
  // Check if task is completed/closed
  const isTaskCompleted = task.isSupportTicket 
    ? (currentStatus === 'Completed')
    : (currentStatus === 'completed');
    
  const isTaskDeclined = isVendorDeclined || 
    (task.isSupportTicket 
      ? (currentStatus === 'Declined' || currentStatus === 'Cancelled')
      : (currentStatus === 'declined'));
    
  const isTaskCancelled = task.isSupportTicket 
    ? (currentStatus === 'Cancelled')
    : (currentStatus === 'declined');
    
  const isTaskPending = task.isSupportTicket 
    ? (currentStatus === 'Pending')
    : !isVendorDeclined && (currentStatus === 'confirmed' || currentStatus === 'waiting_for_engineer');

  return (
    <>
      <Card className="mb-4 border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {safeRender(task.caseId)}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {safeRender(task.title)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getPriorityBadge(task.priority)}
              {getStatusBadge(task.status)}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Customer Information */}
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{safeRender(task.customer)}</span>
              <Phone className="w-4 h-4 text-gray-500 ml-2" />
              <span className="text-gray-600">{safeRender(task.phone)}</span>
            </div>

            {/* Address */}
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
              <span className="text-gray-600">{safeRender(task.address)}</span>
            </div>

            {/* Date and Time */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{safeRender(task.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{safeRender(task.time)}</span>
              </div>
            </div>



            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-3">
              {isTaskPending && (
                <>
                  <Button
                    onClick={() => setIsViewModalOpen(true)}
                    variant="outline"
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Task Details
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsAcceptModalOpen(true)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => setIsDeclineModalOpen(true)}
                      variant="destructive"
                      className="flex-1"
                      size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </>
              )}
              
              {isTaskAccepted && (
                <>
                  <Button
                    onClick={handleViewTask}
                    variant="outline"
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {isTaskCompleted ? 'View' : 'View & Start Task'}
                  </Button>
                </>
              )}

              {isTaskDeclined && (
                <div className="flex-1 text-center">
                  <Badge className="bg-red-100 text-red-800">Task Declined</Badge>
                </div>
              )}

              {isTaskCancelled && (
                <div className="flex-1 text-center">
                  <Badge className="bg-red-100 text-red-800">Task Cancelled</Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accept Task Modal */}
      <Dialog open={isAcceptModalOpen} onOpenChange={setIsAcceptModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mt-20">
          <DialogHeader>
            <DialogTitle>Accept Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Confirm Task Acceptance</h3>
              </div>
              <p className="text-sm text-green-700 mt-2">
                By accepting this task, you agree to complete the service as described. 
                You will be able to view full details and start working on it.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Task Details:</Label>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Customer:</strong> {safeRender(task.customer)}</p>
                <p><strong>Service:</strong> {safeRender(task.title)}</p>
                <p><strong>Date:</strong> {safeRender(task.date)} at {safeRender(task.time)}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAcceptTask}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Task
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAcceptModalOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Decline Task Modal */}
      <Dialog open={isDeclineModalOpen} onOpenChange={setIsDeclineModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mt-20">
          <DialogHeader>
            <DialogTitle>Decline Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-800">Decline Task</h3>
              </div>
              <p className="text-sm text-red-700 mt-2">
                Please provide a reason for declining this task. The admin will be notified 
                and may assign it to another vendor.
              </p>
            </div>

            {/* Penalty Warning */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-orange-800">Penalty Notice</h3>
              </div>
              <p className="text-sm text-orange-700 mt-2">
                <strong>Warning:</strong> Declining this task will result in a <strong>₹100 penalty</strong> 
                being deducted from your wallet balance. This penalty applies to all task rejections 
                in your assigned area.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="declineReason" className="text-sm font-medium">
                Reason for declining *
              </Label>
              <Textarea
                id="declineReason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Please provide a reason for declining this task..."
                rows={3}
                className="w-full"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleDeclineTask}
                variant="destructive"
                className="flex-1"
                disabled={isProcessing || !declineReason.trim()}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Declining...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline Task
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeclineModalOpen(false);
                  setDeclineReason('');
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Task Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col mt-20">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Eye className="w-4 h-4" />
              Task Details - {safeRender(task.caseId)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 overflow-y-auto flex-1 pr-2 pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 min-h-0">
            {/* Task Overview */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Task Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Service:</span>
                  <p className="text-blue-600">{safeRender(task.title)}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Amount:</span>
                  <p className="text-blue-600">{task.isSupportTicket ? safeRender(task.amount) : '₹0'}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Priority:</span>
                  <div className="mt-1">{getPriorityBadge(task.priority)}</div>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Status:</span>
                  <div className="mt-1">{getStatusBadge(task.status)}</div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <p className="text-gray-600">{safeRender(task.customer)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  {(() => {
                    const currentStatus = task.bookingStatus || task.vendorStatus;
                    const isAccepted = currentStatus === 'Accepted' || currentStatus === 'in_progress' || currentStatus === 'completed';
                    
                    if (isAccepted) {
                      return <p className="text-gray-600">{safeRender(task.phone)}</p>;
                    } else {
                      return <p className="text-gray-500">Hidden (Accept task to view)</p>;
                    }
                  })()}
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Complete Address:</span>
                  <div className="mt-1 space-y-1">
                    {(() => {
                      // Try to get address from multiple possible sources
                      const address = task.userId?.address || (typeof task.address === 'object' ? task.address : null);
                      const street = address?.street || task.street || (typeof task.address === 'string' ? task.address : null);
                      const city = address?.city || task.city;
                      const state = address?.state || task.state;
                      const pincode = address?.pincode || task.pincode;
                      const landmark = address?.landmark || task.landmark;
                      
                      if (street || city || state || pincode) {
                        return (
                          <div className="text-sm">
                            {street && (
                              <p className="font-medium text-gray-900">{safeRender(street)}</p>
                            )}
                            <div className="flex flex-wrap gap-2 text-muted-foreground">
                              {city && <span>{safeRender(city)}</span>}
                              {state && <span>{safeRender(state)}</span>}
                              {pincode && <span>{safeRender(pincode)}</span>}
                            </div>
                            {landmark && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <span className="font-medium">Landmark:</span> {safeRender(landmark)}
                              </p>
                            )}
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-sm text-muted-foreground">
                            <p>Address not available</p>
                            <p className="text-xs mt-1">Phone: {safeRender(task.phone)}</p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduling Information */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Scheduling Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-green-700">Scheduled Date:</span>
                  <p className="text-green-600">{safeRender(task.date)}</p>
                </div>
                <div>
                  <span className="font-medium text-green-700">Scheduled Time:</span>
                  <p className="text-green-600">{safeRender(task.time)}</p>
                </div>
                <div>
                  <span className="font-medium text-green-700">Assigned Date:</span>
                  <p className="text-green-600">{safeRender(task.assignDate)}</p>
                </div>
                <div>
                  <span className="font-medium text-green-700">Assigned Time:</span>
                  <p className="text-green-600">{safeRender(task.assignTime)}</p>
                </div>
              </div>
            </div>

            {/* Issue Description */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-800 mb-2">Issue Description</h3>
              <p className="text-orange-700 text-sm">{safeRender(task.issue)}</p>
            </div>
          </div>
          
          {/* Action Buttons - Fixed at bottom */}
          <div className="flex gap-3 p-4 border-t flex-shrink-0 bg-white mt-auto">
            <Button
              onClick={() => setIsAcceptModalOpen(true)}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept Task
            </Button>
            <Button
              onClick={() => {
                setIsViewModalOpen(false);
                navigate(`/vendor/task/${task.id}/cancel`);
              }}
              variant="destructive"
              className="flex-1"
              size="sm"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Decline Task
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsViewModalOpen(false)}
              size="sm"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wallet Balance Check Modal */}
      <WalletBalanceCheck
        isOpen={isWalletCheckOpen}
        onClose={() => setIsWalletCheckOpen(false)}
        onProceed={handleWalletCheckProceed}
        requiredAmount={100}
        action="decline"
        taskDetails={{
          id: task.id,
          caseId: task.caseId,
          title: task.title
        }}
        onDepositSuccess={() => {
          // Refresh wallet balance after successful deposit
          console.log('Deposit successful, wallet balance should be refreshed');
        }}
      />

      {/* Mandatory Deposit Required Modal */}
      <Dialog open={isDepositRequiredModalOpen} onOpenChange={setIsDepositRequiredModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mt-20">
          <DialogHeader>
            <DialogTitle className="text-center text-red-600">Mandatory Deposit Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ₹2000 Deposit Required
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                You need to make a mandatory deposit of ₹2000 to accept tasks. This deposit is required after your first task assignment.
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important:</p>
                  <p>You cannot accept any tasks until this deposit is completed. Please make the deposit to continue accepting tasks.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <Button 
                onClick={handleMakeDeposit}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isProcessingDeposit}
              >
                {isProcessingDeposit ? 'Processing...' : 'Make Deposit Now'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsDepositRequiredModalOpen(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VendorTaskCard;
