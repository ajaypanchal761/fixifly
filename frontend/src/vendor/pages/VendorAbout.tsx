import React from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { Info, Users, Target, Award, Phone, Mail, MapPin, Clock, Star, TrendingUp, Shield, Heart } from 'lucide-react';
import VendorHeader from '../components/VendorHeader';
import VendorBottomNav from '../components/VendorBottomNav';
import Footer from '../../components/Footer';
import NotFound from '../../pages/NotFound';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const VendorAbout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  
  // Show 404 error on desktop - must be before any other hooks
  // Show 404 error on desktop
  if (!isMobile) {
    return <NotFound />;
  }

  

  const companyStats = [
    { icon: Users, value: "500+", label: "Active Vendors", color: "bg-blue-500" },
    { icon: TrendingUp, value: "10K+", label: "Services Completed", color: "bg-green-500" },
    { icon: Star, value: "4.8", label: "Average Rating", color: "bg-yellow-500" },
    { icon: Shield, value: "24/7", label: "Support Available", color: "bg-purple-500" }
  ];

  const values = [
    {
      icon: Heart,
      title: "Customer First",
      description: "We prioritize customer satisfaction in every service we provide"
    },
    {
      icon: Shield,
      title: "Trust & Safety",
      description: "Ensuring secure and reliable service delivery for all customers"
    },
    {
      icon: Award,
      title: "Quality Service",
      description: "Maintaining high standards in all our repair and maintenance services"
    },
    {
      icon: Users,
      title: "Community",
      description: "Building a strong network of skilled professionals and satisfied customers"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 pt-16 overflow-y-auto">
        <div className="container mx-auto px-4 py-4">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-3">
              <Info className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">About Fixfly</h1>
            <p className="text-muted-foreground text-sm">Your trusted partner in home appliance services</p>
          </div>

          {/* Company Overview */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Info className="w-4 h-4 text-blue-600" />
                </div>
                Company Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                Fixfly is a leading home appliance repair and maintenance service platform that connects skilled technicians with customers in need of reliable repair services. We specialize in providing quick, professional, and affordable solutions for all your home appliance needs.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Our mission is to make home appliance repair accessible, convenient, and trustworthy for everyone. We believe in delivering exceptional service quality while maintaining the highest standards of professionalism and customer satisfaction.
              </p>
            </CardContent>
          </Card>

          {/* Company Statistics */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                Our Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {companyStats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 ${stat.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-lg font-bold text-gray-800">{stat.value}</p>
                      <p className="text-xs text-gray-600">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Our Values */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-purple-600" />
                </div>
                Our Values
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {values.map((value, index) => {
                  const IconComponent = value.icon;
                  return (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-1">{value.title}</h3>
                        <p className="text-xs text-gray-600">{value.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Services We Offer */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-yellow-600" />
                </div>
                Services We Offer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  "AC Repair & Service",
                  "Washing Machine Repair",
                  "Refrigerator Service",
                  "TV Repair",
                  "Mobile Repair",
                  "Laptop Repair",
                  "Desktop Repair",
                  "Microwave Repair"
                ].map((service, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                    <span className="text-xs text-gray-700">{service}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Why Choose Fixfly */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Award className="w-4 h-4 text-indigo-600" />
                </div>
                Why Choose Fixfly?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Skilled and certified technicians</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Same-day service availability</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Transparent pricing with no hidden charges</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Quality spare parts and genuine components</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Warranty on all repairs and services</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>24/7 customer support</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                  <Phone className="w-4 h-4 text-teal-600" />
                </div>
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Phone</p>
                    <p className="text-xs text-gray-600">+91 98765 43210</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Email</p>
                    <p className="text-xs text-gray-600">info@getfixfly.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Address</p>
                    <p className="text-xs text-gray-600">Sector 15, Gurgaon, Haryana 122001</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Support Hours</p>
                    <p className="text-xs text-gray-600">24/7 Available</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <div className="md:hidden">
        <Footer />
        <VendorBottomNav />
      </div>
    </div>
  );
};

export default VendorAbout;
