import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Upload, 
  X, 
  Laptop, 
  Monitor, 
  Printer, 
  Check,
  CreditCard,
  Shield,
  CheckCircle
} from "lucide-react";

interface AMCSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planPrice: string;
  planPeriod: string;
  planDescription: string;
  planFeatures: string[];
}

interface FormData {
  deviceType: string;
  serialNumber: string;
  modelNumber: string;
  serialNumberPhoto: File | null;
  quantity: number;
}

const AMCSubscriptionModal = ({
  isOpen,
  onClose,
  planName,
  planPrice,
  planPeriod,
  planDescription,
  planFeatures
}: AMCSubscriptionModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    deviceType: "",
    serialNumber: "",
    modelNumber: "",
    serialNumberPhoto: null,
    quantity: 1
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showThankYou, setShowThankYou] = useState(false);

  const deviceTypes = [
    { value: "laptop", label: "Laptop", icon: Laptop },
    { value: "desktop", label: "Desktop", icon: Monitor },
    { value: "printer", label: "Printer", icon: Printer }
  ];

  const handleInputChange = (field: keyof FormData, value: string | File | null | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, serialNumberPhoto: "Please upload an image file" }));
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, serialNumberPhoto: "File size must be less than 5MB" }));
        return;
      }
      handleInputChange('serialNumberPhoto', file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.deviceType) {
      newErrors.deviceType = "Please select a device type";
    }
    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = "Serial number is required";
    }
    if (!formData.modelNumber.trim()) {
      newErrors.modelNumber = "Model number is required";
    }
    if (!formData.serialNumberPhoto) {
      newErrors.serialNumberPhoto = "Please upload a photo of the serial number";
    }
    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = "Quantity must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically send the data to your backend
      console.log("Subscription data:", {
        plan: planName,
        ...formData
      });
      
      // Show thank you message
      setShowThankYou(true);
      
    } catch (error) {
      console.error("Subscription failed:", error);
      alert("Subscription failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseThankYou = () => {
    setShowThankYou(false);
    onClose();
    // Reset form
    setFormData({
      deviceType: "",
      serialNumber: "",
      modelNumber: "",
      serialNumberPhoto: null,
      quantity: 1
    });
  };

  const selectedDeviceType = deviceTypes.find(dt => dt.value === formData.deviceType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-none sm:max-w-2xl max-h-[85vh] overflow-y-auto mx-0 sm:mx-auto mt-4 sm:mt-16 rounded-none sm:rounded-xl border-0 shadow-2xl">
        {!showThankYou ? (
          <>
            <DialogHeader className="pb-6 pt-4 px-4 sm:px-6">
              <DialogTitle className="text-2xl sm:text-3xl font-bold text-center leading-tight">
                Subscribe to <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{planName}</span>
              </DialogTitle>
              <DialogDescription className="text-center text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
                Complete the form below to subscribe to your AMC plan
              </DialogDescription>
            </DialogHeader>

        <div className="space-y-6 sm:space-y-8 px-4 sm:px-6">
          {/* Plan Summary */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">{planName}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{planDescription}</p>
                </div>
                <div className="text-right bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
                  <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">{planPrice}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{planPeriod}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Information Form */}
          <div className="space-y-5 sm:space-y-6">
            <div className="flex items-center space-x-3 pb-2 border-b border-gray-200 dark:border-gray-700">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Device Information
              </h3>
            </div>

            {/* Device Type Selection */}
            <div className="space-y-3">
              <Label htmlFor="deviceType" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Device Type *</Label>
              <Select value={formData.deviceType} onValueChange={(value) => handleInputChange('deviceType', value)}>
                <SelectTrigger className={`h-12 text-base border-2 rounded-lg transition-all duration-200 ${errors.deviceType ? "border-red-500 bg-red-50 dark:bg-red-950/20" : "border-gray-300 dark:border-gray-600 hover:border-blue-400 focus:border-blue-500"}`}>
                  <SelectValue placeholder="Select your device type" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-2 shadow-lg">
                  {deviceTypes.map((device) => {
                    const IconComponent = device.icon;
                    return (
                      <SelectItem key={device.value} value={device.value} className="text-base py-3">
                        <div className="flex items-center space-x-3">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">{device.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {errors.deviceType && (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{errors.deviceType}</p>
              )}
            </div>

            {/* Serial Number */}
            <div className="space-y-3">
              <Label htmlFor="serialNumber" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Serial Number *</Label>
              <Input
                id="serialNumber"
                placeholder="Enter device serial number"
                value={formData.serialNumber}
                onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                className={`h-12 text-base border-2 rounded-lg transition-all duration-200 ${errors.serialNumber ? "border-red-500 bg-red-50 dark:bg-red-950/20" : "border-gray-300 dark:border-gray-600 hover:border-blue-400 focus:border-blue-500"}`}
              />
              {errors.serialNumber && (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{errors.serialNumber}</p>
              )}
            </div>

            {/* Model Number */}
            <div className="space-y-3">
              <Label htmlFor="modelNumber" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Device Model Number *</Label>
              <Input
                id="modelNumber"
                placeholder="Enter device model number"
                value={formData.modelNumber}
                onChange={(e) => handleInputChange('modelNumber', e.target.value)}
                className={`h-12 text-base border-2 rounded-lg transition-all duration-200 ${errors.modelNumber ? "border-red-500 bg-red-50 dark:bg-red-950/20" : "border-gray-300 dark:border-gray-600 hover:border-blue-400 focus:border-blue-500"}`}
              />
              {errors.modelNumber && (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{errors.modelNumber}</p>
              )}
            </div>

            {/* Serial Number Photo Upload */}
            <div className="space-y-3">
              <Label htmlFor="serialPhoto" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Serial Number Photo *</Label>
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <input
                    type="file"
                    id="serialPhoto"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="serialPhoto"
                    className="flex items-center justify-center space-x-3 px-6 py-4 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 min-h-[56px]"
                  >
                    <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-base font-medium text-blue-600 dark:text-blue-400">Upload Photo</span>
                  </label>
                  {formData.serialNumberPhoto && (
                    <div className="flex items-center space-x-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                      <Check className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate flex-1 font-medium">{formData.serialNumberPhoto.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInputChange('serialNumberPhoto', null)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 flex-shrink-0 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Please upload a clear photo of the device's serial number label. 
                  <br className="sm:hidden" />
                  Supported formats: JPG, PNG, GIF (Max 5MB)
                </p>
                {errors.serialNumberPhoto && (
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{errors.serialNumberPhoto}</p>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-3">
              <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Quantity *</Label>
              <div className="flex items-center justify-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInputChange('quantity', Math.max(1, formData.quantity - 1))}
                  disabled={formData.quantity <= 1}
                  className="h-12 w-12 p-0 min-w-[48px] border-2 rounded-lg font-bold text-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 disabled:opacity-50"
                >
                  -
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                  className={`w-24 text-center h-12 text-lg font-bold border-2 rounded-lg ${errors.quantity ? "border-red-500 bg-red-50 dark:bg-red-950/20" : "border-gray-300 dark:border-gray-600"}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInputChange('quantity', formData.quantity + 1)}
                  className="h-12 w-12 p-0 min-w-[48px] border-2 rounded-lg font-bold text-lg hover:bg-blue-50 dark:hover:bg-blue-950/20"
                >
                  +
                </Button>
              </div>
              {errors.quantity && (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium text-center">{errors.quantity}</p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed">
                Number of devices you want to subscribe for this plan
              </p>
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mx-4 sm:mx-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="block">Total Amount</span>
                <span className="text-xs">({formData.quantity} × {planPrice}{planPeriod})</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ₹{(parseFloat(planPrice.replace('₹', '')) * formData.quantity).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{planPeriod}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 pt-2 px-4 sm:px-6">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5" />
                  <span>Subscribe Now - ₹{(parseFloat(planPrice.replace('₹', '')) * formData.quantity).toFixed(2)}</span>
                </div>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full h-12 text-base font-semibold border-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>

          {/* Terms and Conditions */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-4 px-4 sm:px-6 border-t border-gray-200 dark:border-gray-700 leading-relaxed">
            By subscribing, you agree to our{" "}
            <a 
              href="/terms-conditions" 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a 
              href="/privacy-policy" 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>. 
            <br className="sm:hidden" />
            <span className="block sm:inline mt-0 sm:mt-0 font-medium">
              Your subscription will start immediately 
            </span>
          </div>
        </div>
          </>
        ) : (
          /* Thank You Message */
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Thank You!
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-2">
                Your <span className="font-semibold text-blue-600 dark:text-blue-400">{planName}</span> has been activated successfully!
              </p>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-8">
                You will receive a confirmation email shortly with all the details.
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-6 w-full max-w-md">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Subscription Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formData.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{(parseFloat(planPrice.replace('₹', '')) * formData.quantity).toFixed(2)}{planPeriod}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCloseThankYou}
              className="mt-8 w-full max-w-md h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AMCSubscriptionModal;
