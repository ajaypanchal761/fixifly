import React from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { AlertTriangle, XCircle, CheckCircle, FileText, DollarSign, Shield } from 'lucide-react';
import VendorHeader from '../components/VendorHeader';
import VendorBottomNav from '../components/VendorBottomNav';
import Footer from '../../components/Footer';
import NotFound from '../../pages/NotFound';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const VendorPenaltyCharges = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Show 404 error on desktop
  if (!isMobile) {
    return <NotFound />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 pt-20 overflow-y-auto">
        <div className="container mx-auto px-4 py-4">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-red-500 to-orange-600 rounded-full mb-3">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Penalty & Charges</h1>
            <p className="text-muted-foreground text-sm">Important information about penalties and charges</p>
          </div>

          {/* Task Cancellation Penalty */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                Task Cancellation Penalty
                <Badge className="bg-red-100 text-red-800 border-red-200 ml-auto">
                  ₹100
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 mb-3">
                If you accept a task and later cancel it for any reason, a flat penalty of <span className="font-bold text-red-600">₹100</span> will be charged.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-green-800 font-medium mb-1">Refund Policy</p>
                    <p className="text-xs text-green-700">
                      However, if you can provide valid proof that the cancellation was not your fault and the validation confirms it, the company will refund the penalty.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task Not Accepting Penalty */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
                Task Not Accepting Penalty
                <Badge className="bg-orange-100 text-orange-800 border-orange-200 ml-auto">
                  ₹100
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 mb-3">
                If a task is assigned in your area and you do not accept it, a penalty of <span className="font-bold text-orange-600">₹100</span> will be charged.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-800 font-medium mb-1">No Exceptions</p>
                    <p className="text-xs text-red-700">
                      No validation or exception will be considered in this case.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wrong Closure Penalty */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                Wrong Closure Penalty
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 ml-auto">
                  ₹100
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 mb-3">
                If a customer's issue is not resolved and you close the call without proper action, such as:
              </p>
              <ul className="space-y-2 text-sm text-gray-700 mb-4">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Not filling the bill/report</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Closing the task with incorrect updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Selecting the wrong payment mode</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Uploading fake or irrelevant photos</span>
                </li>
              </ul>
              <p className="text-sm text-gray-700 mb-3">
                Then a penalty of <span className="font-bold text-purple-600">₹100</span> will be charged.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-800 font-medium mb-1">Account Suspension Warning</p>
                    <p className="text-xs text-red-700">
                      If this happens repeatedly, your ID/account may be suspended.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium mb-1">Please Note</p>
                    <p className="text-xs text-blue-700">
                      All penalties are automatically deducted from your earnings. Please ensure you follow proper procedures to avoid unnecessary charges.
                    </p>
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

export default VendorPenaltyCharges;
