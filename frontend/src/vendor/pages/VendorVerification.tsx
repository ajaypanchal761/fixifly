import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  CheckCircle, 
  Star, 
  Shield, 
  TrendingUp, 
  Users, 
  Clock, 
  CreditCard,
  ArrowRight,
  Crown,
  Zap,
  Target,
  Eye,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import vendorApiService from '@/services/vendorApi';

const VendorVerification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const benefits = [
    {
      icon: <Crown className="h-6 w-6 text-yellow-500" />,
      title: "Verified Partner Badge",
      description: "Get the official Fixfly verified partner badge on your profile"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-green-500" />,
      title: "50% Revenue Share",
      description: "Earn 50% of the total revenue from every completed task"
    },
    {
      icon: <Zap className="h-6 w-6 text-blue-500" />,
      title: "Priority Task Assignment",
      description: "Get priority access to high-value tasks and bookings"
    },
    {
      icon: <Shield className="h-6 w-6 text-purple-500" />,
      title: "Enhanced Trust",
      description: "Build customer trust with verified partner status"
    },
    {
      icon: <Users className="h-6 w-6 text-orange-500" />,
      title: "Premium Support",
      description: "Get dedicated support for all your queries and issues"
    },
    {
      icon: <Target className="h-6 w-6 text-red-500" />,
      title: "Advanced Analytics",
      description: "Access detailed analytics and performance insights"
    }
  ];

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // Create verification payment order
      const response = await vendorApiService.createVerificationPayment();
      
      if (response.success && response.data) {
        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_8sYbzHWidwe5Zw',
            amount: response.data.amount,
            currency: response.data.currency,
            name: 'Fixfly Partner Verification',
            description: 'Partner Verification Fee',
            order_id: response.data.orderId,
            handler: async (paymentResponse: any) => {
              try {
                // Verify payment
                const verifyResponse = await vendorApiService.verifyVerificationPayment({
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_signature: paymentResponse.razorpay_signature
                });

                if (verifyResponse.success) {
                  toast({
                    title: "Payment Successful!",
                    description: "Your verification payment has been processed successfully.",
                  });
                  
                  // Show verification progress popup
                  showVerificationProgress();
                } else {
                  toast({
                    title: "Payment Verification Failed",
                    description: "Please contact support for assistance.",
                    variant: "destructive"
                  });
                }
              } catch (error) {
                console.error('Payment verification error:', error);
                toast({
                  title: "Payment Verification Failed",
                  description: "Please contact support for assistance.",
                  variant: "destructive"
                });
              }
            },
            prefill: {
              name: 'Vendor',
              email: 'vendor@fixfly.com',
            },
            theme: {
              color: '#3B82F6'
            }
          };

          const razorpay = new (window as any).Razorpay(options);
          razorpay.open();
        };
        document.body.appendChild(script);
      } else {
        toast({
          title: "Payment Failed",
          description: "Failed to create payment order. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to create payment order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showVerificationProgress = () => {
    // Create and show verification progress popup
    const popup = document.createElement('div');
    popup.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    popup.innerHTML = `
      <div class="bg-white rounded-xl p-8 max-w-md mx-4 text-center">
        <div class="mb-6">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Account Verification Progress</h3>
          <p class="text-gray-600">Your verification request has been submitted successfully!</p>
        </div>
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div class="flex items-center justify-center mb-2">
            <Clock className="h-5 w-5 text-blue-600 mr-2" />
            <span class="text-blue-800 font-medium">Processing Time</span>
          </div>
          <p class="text-blue-700 text-sm">It will take 24 hours for admin to review and approve your verification request.</p>
        </div>
        
        <div class="space-y-3 text-sm text-gray-600">
          <div class="flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <span>Payment completed successfully</span>
          </div>
          <div class="flex items-center justify-center">
            <Clock className="h-4 w-4 text-yellow-500 mr-2" />
            <span>Under admin review</span>
          </div>
          <div class="flex items-center justify-center">
            <Clock className="h-4 w-4 text-gray-400 mr-2" />
            <span>Verification approval pending</span>
          </div>
        </div>
        
        <Button 
          onClick="this.closest('.fixed').remove(); window.location.href='/vendor/dashboard';"
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
        >
          Go to Dashboard
        </Button>
      </div>
    `;
    
    document.body.appendChild(popup);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Become a Verified Fixfly Partner
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock premium benefits and earn more with our verified partner program
          </p>
        </div>

        {/* View Benefits Button */}
        <div className="text-center mb-8">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="h-12 px-8 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold"
              >
                <Eye className="h-5 w-5 mr-2" />
                View All Benefits
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center text-gray-900">
                  Verified Partner Benefits
                </DialogTitle>
                <DialogDescription className="text-center text-gray-600">
                  Unlock these exclusive benefits as a verified Fixfly partner
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {benefit.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {benefit.title}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-center space-x-2 text-green-700">
                  <Crown className="h-5 w-5" />
                  <span className="font-semibold">Plus many more exclusive benefits!</span>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pricing Card */}
        <Card className="max-w-2xl mx-auto border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Partner Verification Fee
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              One-time payment for lifetime benefits
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                ₹3,999
              </div>
              <p className="text-gray-600">
                One-time verification fee
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Instant verification process</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">24-hour admin review</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Lifetime verified status</span>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full max-w-md h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Pay ₹3,999 & Get Verified</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Secure payment powered by Razorpay. Your payment information is safe and encrypted.
            </p>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-6 text-gray-500">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm">Secure Payment</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span className="text-sm">1000+ Verified Partners</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span className="text-sm">4.8/5 Rating</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorVerification;
