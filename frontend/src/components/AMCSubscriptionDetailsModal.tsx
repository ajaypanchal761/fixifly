import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  CreditCard, 
  Download, 
  Shield, 
  Clock, 
  Home, 
  FileText,
  Smartphone,
  Monitor,
  Printer,
  Laptop,
  X,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

interface AMCSubscriptionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: any;
}

const AMCSubscriptionDetailsModal = ({ isOpen, onClose, subscription }: AMCSubscriptionDetailsModalProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!subscription) return null;

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'laptop':
        return Laptop;
      case 'desktop':
        return Monitor;
      case 'mobile':
      case 'smartphone':
        return Smartphone;
      case 'printer':
        return Printer;
      default:
        return Monitor;
    }
  };

  const handleDownloadInvoice = async () => {
    setIsDownloading(true);
    try {
      // Create invoice data
      const invoiceData = {
        subscriptionId: subscription.subscriptionId || subscription.id,
        planName: subscription.planName,
        amount: subscription.amount,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        paymentStatus: subscription.paymentStatus,
        paymentMethod: subscription.paymentMethod,
        razorpayOrderId: subscription.razorpayOrderId,
        razorpayPaymentId: subscription.razorpayPaymentId,
        devices: subscription.rawData?.devices || []
      };

      // Use the proper API base URL
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const url = `${API_BASE_URL}/generate-invoice`;

      // Generate and download invoice as PDF
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Determine file extension based on content type
        const contentType = response.headers.get('content-type');
        const fileExtension = contentType === 'application/pdf' ? 'pdf' : 'html';
        a.download = `AMC-Invoice-${subscription.subscriptionId || subscription.id}.${fileExtension}`;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Invoice downloaded successfully!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate invoice');
      }
    } catch (error) {
      console.error('Invoice download error:', error);
      toast.error("Failed to download invoice. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto pt-16">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-2xl font-bold">
              AMC Subscription Details
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Subscription Overview */}
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{subscription.planName}</CardTitle>
                <Badge 
                  className={`${
                    subscription.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {subscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subscription ID */}
              <div className="mb-4 p-3 bg-gray-50 rounded-md border">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Subscription ID:</span>
                  <span className="text-sm font-mono font-semibold text-blue-600">
                    {subscription.subscriptionId || subscription._id || subscription.id || 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Start Date:</span>
                    <span className="text-sm">{formatDate(subscription.startDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">End Date:</span>
                    <span className="text-sm">{formatDate(subscription.endDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Days Remaining:</span>
                    <span className={`text-sm font-semibold ${
                      subscription.daysRemaining <= 30 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {subscription.daysRemaining} days
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Amount:</span>
                    <span className="text-sm font-semibold">{subscription.amount}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Payment Status:</span>
                    <Badge 
                      className={`${
                        subscription.paymentStatus === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {subscription.paymentStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Payment Method:</span>
                    <span className="text-sm capitalize">{subscription.paymentMethod}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Registered Devices</CardTitle>
            </CardHeader>
            <CardContent>
              {subscription.rawData?.devices?.length > 0 ? (
                <div className="space-y-4">
                  {subscription.rawData.devices.map((device: any, index: number) => {
                    const DeviceIcon = getDeviceIcon(device.deviceType);
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <DeviceIcon className="h-6 w-6 text-blue-600" />
                            <div>
                              <h4 className="font-semibold capitalize">{device.deviceType}</h4>
                              <p className="text-sm text-muted-foreground">
                                Serial: {device.serialNumber}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            className={`${
                              device.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {device.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Model Number:</span>
                            <p className="text-muted-foreground">{device.modelNumber}</p>
                          </div>
                          <div>
                            <span className="font-medium">Brand:</span>
                            <p className="text-muted-foreground">{device.brand || 'Not specified'}</p>
                          </div>
                        </div>
                        {device.serialNumberPhoto && (
                          <div className="mt-3">
                            <span className="font-medium text-sm">Serial Number Photo:</span>
                            <div className="mt-2">
                              <img 
                                src={device.serialNumberPhoto} 
                                alt="Serial number" 
                                className="w-32 h-24 object-cover rounded border"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No devices registered</p>
              )}
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Home Visits */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Home className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold">Free Home Visits</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used: {subscription.homeVisits.used}</span>
                      <span>Total: {subscription.homeVisits.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          subscription.homeVisits.remaining === 0 
                            ? 'bg-red-500' 
                            : subscription.homeVisits.remaining <= 1 
                              ? 'bg-yellow-500' 
                              : 'bg-blue-500'
                        }`}
                        style={{ width: `${(subscription.homeVisits.used / subscription.homeVisits.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Remaining: {subscription.homeVisits.remaining}
                    </p>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subscription.razorpayOrderId && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Razorpay Order ID:</span>
                    <span className="text-sm font-mono">{subscription.razorpayOrderId}</span>
                  </div>
                )}
                {subscription.razorpayPaymentId && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Payment ID:</span>
                    <span className="text-sm font-mono">{subscription.razorpayPaymentId}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={handleDownloadInvoice}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </>
              )}
            </Button>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AMCSubscriptionDetailsModal;
