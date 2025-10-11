import React from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { DollarSign, Shield, AlertTriangle, CheckCircle, XCircle, Clock, FileText, CreditCard, Banknote, TrendingUp } from 'lucide-react';
import VendorHeader from '../components/VendorHeader';
import VendorBottomNav from '../components/VendorBottomNav';
import Footer from '../../components/Footer';
import NotFound from '../../pages/NotFound';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const VendorDepositPenalty = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  
  // Show 404 error on desktop - must be before any other hooks
  // Show 404 error on desktop
  if (!isMobile) {
    return <NotFound />;
  }

  

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 pt-16 overflow-y-auto">
        <div className="container mx-auto px-4 py-4">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-3">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Fixfly Partner – Security Deposit & Penalty Policy</h1>
            <p className="text-muted-foreground text-sm">Company Name: Pixfly Innovations Private Limited</p>
            <p className="text-muted-foreground text-xs">Brand Name: Fixfly™</p>
            <p className="text-muted-foreground text-xs">Effective From: October 2025</p>
          </div>

          {/* 1. Security Deposit Policy */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                1. Security Deposit Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Every Fixfly Partner must pay an initial security deposit of <span className="font-bold text-blue-600">₹2000</span> before activation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>The minimum withdrawal limit is <span className="font-bold text-blue-600">₹5000</span>. Amounts below ₹5000 cannot be withdrawn.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span><span className="font-bold text-blue-600">₹5000</span> will always remain in your Fixfly wallet as a refundable deposit balance — this belongs to you.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>When you end your partnership with Fixfly, the remaining deposit amount will be refunded back to you after verification and clearance of all tasks.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 2. Payment & Withdrawals */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-green-600" />
                </div>
                2. Payment & Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Partner payments are settled every <span className="font-bold text-green-600">Sunday</span>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>You can withdraw your earnings once your wallet balance crosses <span className="font-bold text-green-600">₹5000</span>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>All payments are transferred directly to your verified bank account.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 3. Penalty & Deductions */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                3. Penalty & Deductions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 mb-3">To maintain fairness and professionalism, the following penalties apply:</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span><span className="font-bold text-red-600">Task Cancellation:</span> ₹100</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span><span className="font-bold text-red-600">Task Declined after Assignment:</span> ₹100</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span><span className="font-bold text-red-600">Wrong Update / False Task Closure:</span> ₹100</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span><span className="font-bold text-red-600">Fraud / Wrong Activity / Misguiding Customer:</span> ID Block + Legal Action</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span><span className="font-bold text-red-600">Providing Wrong Payment Info or Misusing Customer Payment:</span> ID Block + Legal Case</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 4. Refund on Partnership Closure */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Banknote className="w-4 h-4 text-purple-600" />
                </div>
                4. Refund on Partnership Closure
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 mb-3">
                When a partner decides to discontinue working with Fixfly, the deposit amount (<span className="font-bold text-purple-600">₹5000</span>) will be refunded after review of:
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Completed and pending tasks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>No fraud or violation reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>No outstanding penalties or dues</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 5. Important Notes */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                5. Important Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>The deposit and penalties ensure trust, responsibility, and quality service for customers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Partners must maintain transparency and professionalism at all times.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Fixfly reserves the right to deduct penalties or hold deposits in case of fraud, misconduct, or policy violation.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="mb-4 shadow-lg border-0 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader className="border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                Quick Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Initial Deposit</span>
                  <span className="text-sm font-bold text-blue-600">₹2000</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Minimum Withdrawal</span>
                  <span className="text-sm font-bold text-green-600">₹5000</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Penalty Amount</span>
                  <span className="text-sm font-bold text-red-600">₹100</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Payment Day</span>
                  <span className="text-sm font-bold text-purple-600">Every Sunday</span>
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

export default VendorDepositPenalty;
