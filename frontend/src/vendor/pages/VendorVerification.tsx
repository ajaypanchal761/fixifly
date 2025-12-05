import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  CreditCard,
  ArrowRight,
  Crown,
  Zap,
  Target,
  Eye
} from 'lucide-react';

const VendorVerification = () => {
  const navigate = useNavigate();

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
    // Redirect to login page immediately when button is clicked
    navigate('/vendor/login');
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
                className="w-full max-w-md h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Pay ₹3,999 & Get Verified</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
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
