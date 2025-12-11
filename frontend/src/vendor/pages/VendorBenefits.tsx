import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  Shield, 
  TrendingUp, 
  Users, 
  ArrowLeft,
  Crown,
  Zap,
  Target,
  Package,
  Briefcase,
  Shirt,
  BookOpen,
  Award,
  Tag
} from 'lucide-react';

const VendorBenefits = () => {
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

  const benefits = [
    {
      icon: <Shield className="h-6 w-6 text-blue-600" />,
      title: "5 Lakh Insurance Coverage",
      description: "Comprehensive insurance coverage worth ₹5,00,000 for your protection"
    },
    {
      icon: <Package className="h-6 w-6 text-orange-500" />,
      title: "Branded Bag",
      description: "Professional branded bag to carry your tools and equipment"
    },
    {
      icon: <Briefcase className="h-6 w-6 text-purple-500" />,
      title: "Professional ID Card",
      description: "Official Fixfly verified partner ID card for professional identification"
    },
    {
      icon: <Shirt className="h-6 w-6 text-green-500" />,
      title: "2 Branded Shirts",
      description: "Two high-quality branded shirts for a professional appearance"
    },
    {
      icon: <BookOpen className="h-6 w-6 text-red-500" />,
      title: "2 Bill Books",
      description: "Two professional bill books for maintaining your service records"
    },
    {
      icon: <Award className="h-6 w-6 text-yellow-500" />,
      title: "Certificate",
      description: "Official Fixfly certified partner certificate for your credentials"
    },
    {
      icon: <Tag className="h-6 w-6 text-pink-500" />,
      title: "Stickers",
      description: "Branded stickers to promote your verified partner status"
    },
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Verified Partner Benefits</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Verified Partner Benefits
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Unlock these exclusive benefits as a verified Fixfly partner
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

        {/* Footer Section */}
        <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-center space-x-2 text-green-700">
            <Crown className="h-5 w-5" />
            <span className="font-semibold text-lg">Plus many more exclusive benefits!</span>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <Button
            onClick={() => navigate('/vendor/verification')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2"
          >
            Get Verified Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VendorBenefits;

