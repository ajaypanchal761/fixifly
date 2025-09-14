import React from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { FileText, Shield, AlertTriangle, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import VendorHeader from '../components/VendorHeader';
import VendorBottomNav from '../components/VendorBottomNav';
import Footer from '../../components/Footer';
import NotFound from '../../pages/NotFound';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const VendorTermsConditions = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Show 404 error on desktop
  if (!isMobile) {
    return <NotFound />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 pt-20">
        <div className="container mx-auto px-4 py-4">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-3">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Terms & Conditions</h1>
            <p className="text-muted-foreground text-sm">Vendor Agreement and Service Terms</p>
            <p className="text-muted-foreground text-xs">Last Updated: 2025</p>
          </div>

          {/* Introduction */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                Welcome to Fixfly's Vendor Terms and Conditions. By registering as a vendor and using our platform, you agree to be bound by these terms and conditions. Please read them carefully.
              </p>
            </CardContent>
          </Card>

          {/* Vendor Responsibilities */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                Vendor Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Provide accurate and up-to-date information during registration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Maintain professional standards in all customer interactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Complete assigned tasks within the specified timeframe</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Use proper tools and equipment for service delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Provide detailed service reports and documentation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Maintain confidentiality of customer information</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Service Standards */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                Service Standards
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Arrive at customer location within the scheduled time window</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Wear proper identification and company uniform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Explain service procedures to customers before starting work</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Clean up work area after service completion</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Provide warranty information for parts and services</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-yellow-600" />
                </div>
                Payment Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Payment will be processed within 2-3 business days after task completion</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Service charges are determined by Fixfly based on task complexity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Additional charges for parts and materials must be approved by customer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Withdrawal requests are processed weekly on Fridays</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Minimum withdrawal amount is ₹500</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Penalties and Violations */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                Penalties and Violations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Task cancellation after acceptance: ₹350 penalty</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Not accepting assigned tasks: ₹100 penalty</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Incorrect task closure: ₹100 penalty</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Repeated violations may result in account suspension</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Fraudulent activities will lead to immediate termination</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Termination Policy */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-gray-600" />
                </div>
                Termination Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Either party may terminate this agreement with 7 days notice</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Immediate termination for serious violations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Outstanding payments will be settled within 30 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Confidentiality obligations continue after termination</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 mb-3">
                For any questions regarding these terms and conditions, please contact us:
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Email:</strong> vendor-support@fixfly.com</p>
                <p><strong>Phone:</strong> +91 98765 43210</p>
                <p><strong>Support Hours:</strong> 9:00 AM - 6:00 PM (Monday to Friday)</p>
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

export default VendorTermsConditions;
