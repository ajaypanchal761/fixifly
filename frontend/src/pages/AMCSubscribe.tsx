import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  X,
  Laptop,
  Monitor,
  Printer,
  Check,
  Shield,
  CheckCircle,
  ArrowLeft,
  CreditCard,
  Loader2,
  AlertCircle
} from "lucide-react";
import { getAMCPlan, createAMCSubscription, verifyAMCSubscriptionPayment } from "@/services/amcApiService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { uploadImageToCloudinary } from "@/utils/imageUpload";

interface DeviceInfo {
  deviceType: string;
  serialNumber: string;
  modelNumber: string;
  brand?: string;
  serialNumberPhoto?: File | null;
}

interface FormData {
  deviceType: string;
  quantity: number;
  devices: DeviceInfo[];
}

const AMCSubscribe = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    deviceType: "",
    quantity: 1,
    devices: [{
      deviceType: "",
      serialNumber: "",
      modelNumber: "",
      brand: "",
      serialNumberPhoto: null
    }]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [gstDetails, setGstDetails] = useState<{
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
    gstRate: number;
  } | null>(null);

  const deviceTypes = [
    { value: "laptop", label: "Laptop", icon: Laptop },
    { value: "desktop", label: "Desktop", icon: Monitor },
    { value: "printer", label: "Printer", icon: Printer }
  ];

  const fetchPlanDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAMCPlan(planId);

      if (response.success && response.data) {
        setPlan(response.data.plan);
        setError(null);
      } else {
        setError('Failed to load plan details');
      }
    } catch (err: any) {
      console.error('Error fetching plan details:', err);
      setError(err.message || 'Failed to load plan details');
    } finally {
      setLoading(false);
    }
  }, [planId]); // Only depend on planId

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to subscribe to AMC plans");
      navigate('/login');
      return;
    }

    if (planId) {
      fetchPlanDetails();
    }
  }, [planId, isAuthenticated, fetchPlanDetails, navigate]);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    if (field === 'quantity') {
      const newQuantity = value as number;
      const currentDevices = formData.devices;
      let newDevices = [...currentDevices];

      // Add or remove devices based on quantity change
      if (newQuantity > currentDevices.length) {
        // Add new devices
        for (let i = currentDevices.length; i < newQuantity; i++) {
          newDevices.push({
            deviceType: formData.deviceType,
            serialNumber: "",
            modelNumber: "",
            brand: "",
            serialNumberPhoto: null
          });
        }
      } else if (newQuantity < currentDevices.length) {
        // Remove devices
        newDevices = newDevices.slice(0, newQuantity);
      }

      setFormData(prev => ({ ...prev, quantity: newQuantity, devices: newDevices }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));

      // Update device type for all devices
      if (field === 'deviceType') {
        setFormData(prev => ({
          ...prev,
          devices: prev.devices.map(device => ({
            ...device,
            deviceType: value as string
          }))
        }));
      }
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDeviceInputChange = (deviceIndex: number, field: keyof DeviceInfo, value: string | File | null) => {
    const newDevices = [...formData.devices];
    newDevices[deviceIndex] = {
      ...newDevices[deviceIndex],
      [field]: value
    };

    setFormData(prev => ({ ...prev, devices: newDevices }));

    // Clear error when user starts typing
    const errorKey = `device_${deviceIndex}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: undefined }));
    }
  };

  const handleFileUpload = (deviceIndex: number, file: File | null) => {
    handleDeviceInputChange(deviceIndex, 'serialNumberPhoto', file);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.deviceType) {
      newErrors.deviceType = 'Device type is required';
    }

    if (formData.quantity < 1) {
      newErrors.quantity = 'At least 1 device is required';
    }

    formData.devices.forEach((device, index) => {
      if (!device.serialNumber.trim()) {
        newErrors[`device_${index}_serialNumber`] = 'Serial number is required';
      }
      if (!device.modelNumber.trim()) {
        newErrors[`device_${index}_modelNumber`] = 'Model number is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate GST details
  const calculateGSTDetails = () => {
    if (!plan) return null;

    const baseAmount = plan.price * formData.devices.length;
    const gstRate = 0.18; // 18% GST
    const gstAmount = baseAmount * gstRate;
    const totalAmount = baseAmount + gstAmount;

    return {
      baseAmount,
      gstAmount,
      totalAmount,
      gstRate
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if backend server is running (normalize in case VITE_API_URL includes /api)
      try {
        const configuredApiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const serverBase = configuredApiBase.replace(/\/?api\/?$/, '');
        const healthUrl = `${serverBase}/health`;
        const healthCheck = await fetch(healthUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (!healthCheck.ok) {
          console.warn('Backend server health check failed:', { status: healthCheck.status, url: healthUrl });
          console.warn('Continuing with subscription...');
        }
      } catch (healthError) {
        console.warn('Health check error (server may be unreachable). Continuing...', healthError);
      }
      // Upload images to Cloudinary first (optional - subscription can proceed without images)
      const devicesWithUploadedImages = await Promise.all(
        formData.devices.map(async (device) => {
          let uploadedImageUrl = null;

          if (device.serialNumberPhoto) {
            try {
              console.log('Uploading image for device:', device.deviceType);
              const uploadResult = await uploadImageToCloudinary(device.serialNumberPhoto, {
                folder: 'fixifly/amc-device-photos'
              });
              uploadedImageUrl = uploadResult.secure_url;
              console.log('Image uploaded successfully:', uploadResult.secure_url);
            } catch (uploadError) {
              console.error('Image upload failed:', uploadError);
              // Check if it's a network error
              if (uploadError.message.includes('Network error') || uploadError.message.includes('ERR_NETWORK')) {
                toast.warning(`Image upload failed - server connection issue. Subscription will continue without the image.`);
              } else {
                toast.warning(`Image upload failed for ${device.deviceType}. Subscription will continue without the image.`);
              }
              // Set uploadedImageUrl to null so subscription can proceed
              uploadedImageUrl = null;
            }
          }

          return {
            deviceType: device.deviceType,
            serialNumber: device.serialNumber,
            modelNumber: device.modelNumber,
            brand: device.brand || '',
            serialNumberPhoto: uploadedImageUrl
          };
        })
      );

      const subscriptionData = {
        planId: planId,
        devices: devicesWithUploadedImages,
        paymentMethod: 'online',
        autoRenewal: false
      };

      console.log('Submitting subscription data with uploaded images:', subscriptionData);

      const response = await createAMCSubscription(subscriptionData);

      if (response.success) {
        console.log('Subscription created successfully:', response.data.subscription);
        setSubscriptionId(response.data.subscription._id);
        console.log('Set subscription ID:', response.data.subscription._id);

        if (response.data.payment) {
          setPaymentData(response.data.payment);
          setShowPayment(true);
          toast.success("Subscription created! Please complete the payment.");
        } else {
          toast.success("Subscription created successfully!");
          navigate('/amc');
        }
      } else {
        toast.error(response.message || "Failed to create subscription");
      }
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      toast.error(error.message || "Failed to create subscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentResponse: any) => {
    console.log('✅ Payment successful:', paymentResponse);

    // Flutter bridge call for WebView integration
    if ((window as any).flutter_inappwebview) {
      try {
        (window as any).flutter_inappwebview.callHandler('razorpayResponse', paymentResponse);
        console.log('📱 Flutter bridge called with payment response');
      } catch (error) {
        console.error('❌ Error calling Flutter bridge:', error);
      }
    }

    // Show success alert for WebView
    if (isMobileWebView()) {
      alert("Payment Success!");
    }

    if (!subscriptionId) {
      console.error('No subscription ID available for payment verification');
      return;
    }

    try {
      const verificationData = {
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature
      };

      console.log('Verifying payment for subscription ID:', subscriptionId);
      console.log('Payment verification data:', verificationData);

      // Debug: Check if subscription exists before verification
      try {
        const token = localStorage.getItem('accessToken');
        console.log('Debug - Token available:', !!token);
        console.log('Debug - Subscription ID:', subscriptionId);

        const debugResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/amc/subscriptions/${subscriptionId}/debug`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Debug response status:', debugResponse.status);
        console.log('Debug response headers:', debugResponse.headers);

        if (!debugResponse.ok) {
          const errorText = await debugResponse.text();
          console.error('Debug response error:', errorText);
          return;
        }

        const debugData = await debugResponse.json();
        console.log('Debug subscription data:', debugData);
      } catch (debugError) {
        console.error('Debug subscription failed:', debugError);
      }

      const response = await verifyAMCSubscriptionPayment(subscriptionId, verificationData);

      if (response.success) {
        toast.success("Payment verified! Your AMC subscription is now active.");
        navigate('/amc');
      } else {
        toast.error(response.message || "Payment verification failed");
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast.error(error.message || "Payment verification failed");
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    console.error('Payment error details:', JSON.stringify(error, null, 2));

    const errorMessage = error.error?.description || error.error?.reason || error.description || error.message || 'Payment failed. Please try another payment method.';

    // Flutter bridge call for error
    if ((window as any).flutter_inappwebview) {
      try {
        (window as any).flutter_inappwebview.callHandler('razorpayError', {
          error: error.error || error,
          message: errorMessage
        });
        console.log('📱 Flutter bridge called with payment error');
      } catch (bridgeError) {
        console.error('❌ Error calling Flutter bridge for error:', bridgeError);
      }
    }

    // Show error alert for WebView
    if (isMobileWebView()) {
      alert(`Payment Failed: ${errorMessage}`);
    }

    toast.error(`Payment failed: ${errorMessage}`);
  };

  // Detect mobile webview
  const isMobileWebView = () => {
    try {
      const userAgent = navigator.userAgent || '';
      const isWebView = /wv|WebView/i.test(userAgent);
      const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      return isWebView || isStandalone || isIOSStandalone || isMobileDevice;
    } catch {
      return false;
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.Razorpay) {
          console.log('✅ Razorpay script loaded');
          resolve(true);
        } else {
          console.warn('⚠️ Script loaded but window.Razorpay not available');
          resolve(false);
        }
      };
      script.onerror = () => {
        console.error('❌ Failed to load Razorpay script');
        resolve(false);
      };

      if (document.head) {
        document.head.appendChild(script);
      } else if (document.body) {
        document.body.appendChild(script);
      } else {
        resolve(false);
      }
    });
  };

  const openRazorpayPayment = async () => {
    if (!paymentData) {
      console.error('No payment data available');
      toast.error("Payment data not available. Please try again.");
      return;
    }

    const isMobile = isMobileWebView();
    console.log('💳 Opening Razorpay payment, isMobile:', isMobile);

    try {
      // Load Razorpay script with retry for mobile
      let res = await loadRazorpayScript();
      if (!res && isMobile) {
        // Retry for mobile
        console.log('📱 Retrying Razorpay script load for mobile...');
        await new Promise(r => setTimeout(r, 1000));
        res = await loadRazorpayScript();
      }

      if (!res || !window.Razorpay) {
        toast.error("Razorpay payment gateway failed to load. Please check your internet connection and try again.");
        return;
      }

      const options = {
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'Fixifly AMC',
        description: `AMC Subscription - ${plan?.name}`,
        order_id: paymentData.orderId,
        handler: handlePaymentSuccess,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        notes: {
          subscriptionId: subscriptionId,
          planName: plan?.name
        },
        theme: {
          color: '#2563eb'
        },
        retry: {
          enabled: false,
        },
        // @ts-ignore
        webview_intent: true,
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
            toast.info("Payment cancelled");
          }
        },
        // UPI app detection and QR code configuration for mobile APK
        // For Android WebView/APK, UPI apps (PhonePe, Google Pay, Paytm) are auto-detected
        config: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? undefined : {
          display: {
            blocks: {
              upi: {
                name: "UPI",
                instruments: [
                  {
                    method: "upi",
                    flows: ["qr", "intent"],
                  },
                ],
              },
              banks: {
                name: "Other Payment Methods",
                instruments: [
                  {
                    method: "upi",
                    flows: ["collect"],
                  },
                  {
                    method: "card",
                  },
                  {
                    method: "netbanking",
                  },
                  {
                    method: "wallet",
                  },
                ],
              },
            },
            sequence: ["block.upi", "block.banks"],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
      };

      console.log('Razorpay options:', options);

      // Check if Razorpay is available
      if (!window.Razorpay) {
        toast.error("Payment gateway not available. Please refresh the page.");
        return;
      }

      try {
        const paymentObject = new (window as any).Razorpay(options);

        // Add error handlers for WebView/Flutter
        if (paymentObject.on) {
          // Payment failed handler
          paymentObject.on('payment.failed', handlePaymentError);

          // Payment method selection failed handler
          paymentObject.on('payment.method_selection_failed', (error: any) => {
            console.error('❌ Payment method selection failed:', error);
            console.error('❌ Payment method error details:', error);

            const errorMessage = error.error?.description || error.description || 'Please use another payment method';

            // Flutter bridge call for error
            if ((window as any).flutter_inappwebview) {
              try {
                (window as any).flutter_inappwebview.callHandler('razorpayError', {
                  error: error.error || error,
                  message: errorMessage
                });
              } catch (bridgeError) {
                console.error('❌ Error calling Flutter bridge:', bridgeError);
              }
            }

            // Show error alert
            if (isMobileWebView()) {
              alert(`Payment Error: ${errorMessage}`);
            }

            handlePaymentError(error);
          });
        }

        paymentObject.open();
        console.log('✅ Razorpay checkout opened');
      } catch (openError) {
        console.error('❌ Error opening Razorpay checkout:', openError);
        toast.error("Failed to open payment gateway. Please try again.");
      }
    } catch (error) {
      console.error('Error opening Razorpay payment:', error);
      toast.error("Failed to open payment gateway. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plan details...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Plan Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested AMC plan could not be found.'}</p>
          <Button onClick={() => navigate('/amc')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to AMC Plans
          </Button>
        </div>
      </div>
    );
  }

  if (showPayment && paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center">
              <CreditCard className="h-6 w-6 mr-2 text-blue-600" />
              Complete Payment
            </CardTitle>
            <CardDescription>
              Complete your AMC subscription payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <p className="text-2xl font-bold text-blue-600">₹{plan.price}</p>
              <p className="text-sm text-gray-600">per {plan.period === 'yearly' ? 'year' : 'month'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Base Amount ({formData.quantity} device{formData.quantity > 1 ? 's' : ''}):</span>
                <span>₹{plan.price * formData.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%):</span>
                <span>₹{(plan.price * formData.quantity * 0.18).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Amount:</span>
                <span>₹{((plan.price * formData.quantity) * 1.18).toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={openRazorpayPayment}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Pay ₹{((plan.price * formData.quantity) * 1.18).toFixed(2)}
            </Button>

            <Button
              onClick={() => setShowPayment(false)}
              variant="outline"
              className="w-full"
            >
              Back to Form
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedDeviceType = deviceTypes.find(dt => dt.value === formData.deviceType);

  return (
    <div className="min-h-screen bg-gray-50 pb-36 md:pb-8">
      {/* Header */}
      <div className="bg-white border-b pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Button
                onClick={() => navigate(`/amc/plan/${planId}`)}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 mb-2 sm:mb-0"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Plan
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Subscribe to {plan.name}</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Complete the form below to subscribe to your AMC plan</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">₹{plan.price}</div>
              <div className="text-sm text-gray-600">per {plan.period === 'yearly' ? 'year' : 'month'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="w-full">
          {/* Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  Device Information
                </CardTitle>
                <CardDescription>
                  Please provide details for all devices you want to include in your AMC plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Device Type Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="deviceType">Device Type *</Label>
                    <Select
                      value={formData.deviceType}
                      onValueChange={(value) => handleInputChange('deviceType', value)}
                    >
                      <SelectTrigger className={errors.deviceType ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select device type" />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceTypes.map((type) => {
                          const IconComponent = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center">
                                <IconComponent className="h-4 w-4 mr-2" />
                                {type.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors.deviceType && (
                      <p className="text-sm text-red-500">{errors.deviceType}</p>
                    )}
                  </div>

                  {/* Number of Devices (fixed to 1) */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Number of Devices *</Label>
                    <Select
                      value={"1"}
                      disabled
                    >
                      <SelectTrigger className={errors.quantity ? 'border-red-500' : ''}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Device</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.quantity && (
                      <p className="text-sm text-red-500">{errors.quantity}</p>
                    )}
                  </div>

                  {/* Device Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Device Details</h3>
                    {formData.devices.map((device, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            {selectedDeviceType && (
                              <selectedDeviceType.icon className="h-5 w-5 text-blue-600" />
                            )}
                            <h4 className="font-medium">
                              Device {index + 1} - {selectedDeviceType?.label || 'Device'}
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`serialNumber_${index}`}>Serial Number *</Label>
                              <Input
                                id={`serialNumber_${index}`}
                                value={device.serialNumber}
                                onChange={(e) => handleDeviceInputChange(index, 'serialNumber', e.target.value)}
                                placeholder="Enter serial number"
                                className={errors[`device_${index}_serialNumber`] ? 'border-red-500' : ''}
                              />
                              {errors[`device_${index}_serialNumber`] && (
                                <p className="text-sm text-red-500">{errors[`device_${index}_serialNumber`]}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`modelNumber_${index}`}>Model Number *</Label>
                              <Input
                                id={`modelNumber_${index}`}
                                value={device.modelNumber}
                                onChange={(e) => handleDeviceInputChange(index, 'modelNumber', e.target.value)}
                                placeholder="Enter model number"
                                className={errors[`device_${index}_modelNumber`] ? 'border-red-500' : ''}
                              />
                              {errors[`device_${index}_modelNumber`] && (
                                <p className="text-sm text-red-500">{errors[`device_${index}_modelNumber`]}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`brand_${index}`}>Brand (Optional)</Label>
                              <Input
                                id={`brand_${index}`}
                                value={device.brand || ''}
                                onChange={(e) => handleDeviceInputChange(index, 'brand', e.target.value)}
                                placeholder="Enter brand name"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`photo_${index}`}>Serial Number Photo (Optional)</Label>
                              <div className="flex items-center space-x-2 min-w-0">
                                <Input
                                  id={`photo_${index}`}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileUpload(index, e.target.files?.[0] || null)}
                                  className="hidden"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => document.getElementById(`photo_${index}`)?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Photo
                                </Button>
                                {device.serialNumberPhoto && (
                                  <span className="text-sm text-green-600 flex items-center min-w-0 flex-1">
                                    <CheckCircle className="h-4 w-4 inline mr-1 flex-shrink-0" />
                                    <span className="truncate">{device.serialNumberPhoto.name}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* GST Breakdown */}
                  {plan && formData.quantity > 0 && (
                    <Card className="mb-4">
                      <CardHeader>
                        <CardTitle className="text-lg">Pricing Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Base Amount ({formData.quantity} device{formData.quantity > 1 ? 's' : ''}):</span>
                            <span>₹{plan.price * formData.quantity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>GST (18%):</span>
                            <span>₹{(plan.price * formData.quantity * 0.18).toFixed(2)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-semibold text-lg">
                            <span>Total Amount:</span>
                            <span>₹{((plan.price * formData.quantity) * 1.18).toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold whitespace-nowrap overflow-visible mb-4"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Creating Subscription...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Subscribe Now - ₹{plan ? ((plan.price * formData.quantity) * 1.18).toFixed(2) : '0'}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AMCSubscribe;
