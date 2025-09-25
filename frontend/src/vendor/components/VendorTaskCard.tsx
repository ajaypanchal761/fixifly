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
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import vendorApi from '@/services/vendorApi';
import { useToast } from '@/hooks/use-toast';

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
    issue: string;
    assignDate: string;
    assignTime: string;
    priority: string;
    bookingStatus?: string;
    vendorStatus?: string;
    isSupportTicket?: boolean;
  };
  onStatusUpdate: (taskId: string, newStatus: string) => void;
}

const VendorTaskCard: React.FC<VendorTaskCardProps> = ({ task, onStatusUpdate }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Local state to track immediate status changes
  const [localTaskStatus, setLocalTaskStatus] = useState(task.vendorStatus || task.bookingStatus);

  // Update local status when task prop changes
  useEffect(() => {
    setLocalTaskStatus(task.vendorStatus || task.bookingStatus);
  }, [task.vendorStatus, task.bookingStatus]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-blue-100 text-blue-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Emergency':
        return <Badge className="bg-red-100 text-red-800">Emergency</Badge>;
      case 'High Priority':
        return <Badge className="bg-orange-100 text-orange-800">High Priority</Badge>;
      case 'Normal':
        return <Badge className="bg-blue-100 text-blue-800">Normal</Badge>;
      case 'Low Priority':
        return <Badge className="bg-gray-100 text-gray-800">Low Priority</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
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
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to accept task",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error accepting task:', error);
      toast({
        title: "Error",
        description: "Failed to accept task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
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

    setIsProcessing(true);
    try {
      let response;
      
      if (task.isSupportTicket) {
        response = await vendorApi.declineSupportTicket(task.id, declineReason);
      } else {
        response = await vendorApi.declineTask(task.id, declineReason);
      }
      
      if (response.success) {
        toast({
          title: "Task Declined",
          description: "You have declined this task. The admin will be notified and may assign it to another vendor.",
          variant: "default"
        });
        
        // Immediately update local status for instant UI update
        setLocalTaskStatus(task.isSupportTicket ? 'Declined' : 'cancelled');
        
        onStatusUpdate(task.id, 'declined');
        setIsDeclineModalOpen(false);
        setDeclineReason('');
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to decline task",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error declining task:', error);
      toast({
        title: "Error",
        description: "Failed to decline task. Please try again.",
        variant: "destructive"
      });
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
  
  const isTaskAccepted = task.isSupportTicket 
    ? (currentStatus === 'Accepted' || currentStatus === 'Completed')
    : (currentStatus === 'in_progress' || currentStatus === 'completed');
    
  const isTaskDeclined = task.isSupportTicket 
    ? (currentStatus === 'Declined' || currentStatus === 'Cancelled')
    : (currentStatus === 'cancelled');
    
  const isTaskCancelled = task.isSupportTicket 
    ? (currentStatus === 'Cancelled')
    : (currentStatus === 'cancelled');
    
  const isTaskPending = task.isSupportTicket 
    ? (currentStatus === 'Pending')
    : (currentStatus === 'confirmed' || currentStatus === 'waiting_for_engineer');

  return (
    <>
      <Card className="mb-4 border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {task.caseId}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {task.title}
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
              <span className="font-medium">{task.customer}</span>
              <Phone className="w-4 h-4 text-gray-500 ml-2" />
              <span className="text-gray-600">{task.phone}</span>
            </div>

            {/* Address */}
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
              <span className="text-gray-600">{task.address}</span>
            </div>

            {/* Date and Time */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{task.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{task.time}</span>
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
                    View & Start Task
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
        <DialogContent className="max-w-md">
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
                <p><strong>Customer:</strong> {task.customer}</p>
                <p><strong>Service:</strong> {task.title}</p>
                <p><strong>Date:</strong> {task.date} at {task.time}</p>
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
        <DialogContent className="max-w-md">
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
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Task Details - {task.caseId}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 overflow-y-auto flex-1 pr-2 pb-2">
            {/* Task Overview */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Task Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Service:</span>
                  <p className="text-blue-600">{task.title}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Amount:</span>
                  <p className="text-blue-600">{task.isSupportTicket ? task.amount : '₹0'}</p>
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
                  <p className="text-gray-600">{task.customer}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <p className="text-gray-600">{task.phone}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Address:</span>
                  <p className="text-gray-600 mt-1">{task.address}</p>
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
                  <p className="text-green-600">{task.date}</p>
                </div>
                <div>
                  <span className="font-medium text-green-700">Scheduled Time:</span>
                  <p className="text-green-600">{task.time}</p>
                </div>
                <div>
                  <span className="font-medium text-green-700">Assigned Date:</span>
                  <p className="text-green-600">{task.assignDate}</p>
                </div>
                <div>
                  <span className="font-medium text-green-700">Assigned Time:</span>
                  <p className="text-green-600">{task.assignTime}</p>
                </div>
              </div>
            </div>

            {/* Issue Description */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-800 mb-2">Issue Description</h3>
              <p className="text-orange-700 text-sm">{task.issue}</p>
            </div>
          </div>
          
          {/* Action Buttons - Fixed at bottom */}
          <div className="flex gap-3 pb-4 border-t flex-shrink-0 bg-white">
            <Button
              onClick={() => setIsAcceptModalOpen(true)}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept Task
            </Button>
            <Button
              onClick={() => setIsDeclineModalOpen(true)}
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
    </>
  );
};

export default VendorTaskCard;
