import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  Star, 
  Shield, 
  Users, 
  CreditCard,
  ArrowRight,
  Crown,
  Eye
} from 'lucide-react';

const VendorVerification = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Minimum 1 second loading time
  useEffect(() => {
    const loadingStartTime = Date.now();
    setLoading(true);
    
    const timer = setTimeout(() => {
      const elapsedTime = Date.now() - loadingStartTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      
      if (remainingTime > 0) {
        setTimeout(() => {
          setLoading(false);
        }, remainingTime);
      } else {
        setLoading(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handlePayment = async () => {
    // Redirect to login page immediately when button is clicked
    navigate('/vendor/login');
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
          <Button 
            variant="outline" 
            className="h-12 px-8 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold"
            onClick={() => navigate('/vendor/benefits')}
          >
            <Eye className="h-5 w-5 mr-2" />
            View All Benefits
          </Button>
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
