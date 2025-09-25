import React from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { Phone, Mail, Headphones } from 'lucide-react';
import VendorHeader from '../components/VendorHeader';
import VendorBottomNav from '../components/VendorBottomNav';

const VendorSupport = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleCall = () => {
    window.open('tel:+919876543210', '_self');
  };

  const handleEmail = () => {
    window.open('mailto:support@fixifly.com?subject=Vendor Support Request', '_self');
  };

  // Show 404 error on desktop
  if (!isMobile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h1>
          <p className="text-gray-600">This page is only available on mobile devices.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 md:pb-0 pt-20 md:pt-0">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Headphones className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Vendor Support</h1>
            <p className="text-gray-600 text-sm">
              Need help? Contact our support team directly
            </p>
          </div>

          {/* Support Options */}
          <div className="space-y-4 mb-8">
            {/* Call Support */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Call Support</h3>
                    <p className="text-sm text-gray-600">Speak directly with our team</p>
                    <p className="text-sm font-medium text-gray-800">+91 98765 43210</p>
                  </div>
                </div>
                <button
                  onClick={handleCall}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Phone className="h-4 w-4" />
                  <span>Call Now</span>
                </button>
              </div>
            </div>

            {/* Email Support */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Email Support</h3>
                    <p className="text-sm text-gray-600">Send us your queries</p>
                    <p className="text-sm font-medium text-gray-800">support@fixifly.com</p>
                  </div>
                </div>
                <button
                  onClick={handleEmail}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Mail className="h-4 w-4" />
                  <span>Send Email</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
      <VendorBottomNav />
    </div>
  );
};

export default VendorSupport;
