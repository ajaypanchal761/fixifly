import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Crown, 
  Star, 
  TrendingUp, 
  Users, 
  Zap,
  ArrowRight,
  Gift,
  Target,
  Shield
} from 'lucide-react';
import { useVendor } from '@/contexts/VendorContext';

const VendorVerified = () => {
  const navigate = useNavigate();
  const { vendor } = useVendor();

  const benefits = [
    {
      icon: <Crown className="h-6 w-6 text-yellow-500" />,
      title: "Verified Partner Badge",
      description: "Your profile now displays the official verified partner badge"
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
      description: "Customers trust verified partners more, leading to more bookings"
    }
  ];

  const handleGetStarted = () => {
    navigate('/vendor/dashboard');
  };

  const handleViewProfile = () => {
    navigate('/vendor/profile');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-full mb-6">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Congratulations!
          </h1>
          <h2 className="text-2xl font-semibold text-green-600 mb-4">
            You are now a Verified Fixfly Partner
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Welcome to the elite group of verified partners. Get ready for new tasks and enjoy 50% partnership of revenue!
          </p>
        </div>

        {/* Verification Badge */}
        <Card className="max-w-2xl mx-auto mb-8 border-0 shadow-2xl bg-gradient-to-r from-green-500 to-blue-600 text-white">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 mr-3" />
              <span className="text-2xl font-bold">Verified Partner</span>
            </div>
            <p className="text-green-100 mb-4">
              Your account has been successfully verified and approved by our admin team.
            </p>
            <Badge variant="secondary" className="bg-white text-green-600 font-semibold">
              <CheckCircle className="h-4 w-4 mr-1" />
              Verification Complete
            </Badge>
          </CardContent>
        </Card>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
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

        {/* Revenue Share Highlight */}
        <Card className="max-w-2xl mx-auto mb-8 border-0 shadow-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 mr-3" />
              <span className="text-2xl font-bold">50% Revenue Share</span>
            </div>
            <p className="text-yellow-100 mb-4">
              For every task you complete, you'll earn 50% of the total revenue generated.
            </p>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm text-yellow-100">
                Example: If a task generates ₹1000, you earn ₹500!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="max-w-2xl mx-auto mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              What's Next?
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Here's what you can do now as a verified partner
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Complete Your Profile</h4>
                <p className="text-sm text-gray-600">Add your service locations and working hours</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Start Accepting Tasks</h4>
                <p className="text-sm text-gray-600">Browse and accept high-value tasks from customers</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Earn More Revenue</h4>
                <p className="text-sm text-gray-600">Enjoy 50% revenue share on every completed task</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleGetStarted}
            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            <Target className="h-5 w-5 mr-2" />
            Get Started with Tasks
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          
          <Button
            onClick={handleViewProfile}
            variant="outline"
            className="h-12 px-8 border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Users className="h-5 w-5 mr-2" />
            View My Profile
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-6 text-gray-500">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm">Verified Partner</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span className="text-sm">Premium Benefits</span>
            </div>
            <div className="flex items-center space-x-2">
              <Gift className="h-5 w-5" />
              <span className="text-sm">50% Revenue Share</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorVerified;
