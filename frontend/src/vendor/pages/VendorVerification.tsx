import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Shield, Phone } from 'lucide-react';

const VendorVerification = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg border-0 rounded-2xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <Clock className="h-10 w-10 text-blue-600 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Verification in Process</h1>
          <p className="text-blue-100">
            Your profile is currently under review
          </p>
        </div>

        <CardContent className="p-8 text-center space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-left p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <span className="text-gray-700 text-sm">Account Created Successfully</span>
            </div>

            <div className="flex items-center gap-3 text-left p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <span className="text-gray-700 text-sm">Documents Uploaded</span>
            </div>

            <div className="flex items-center gap-3 text-left p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <Clock className="h-5 w-5 text-yellow-600 shrink-0" />
              <span className="text-gray-800 text-sm font-medium">Under Review</span>
            </div>
          </div>

          <div className="py-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What happens next?</h3>
            <p className="text-gray-600">
              Our team will examine your details and call you shortly for the final verification step.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
              <Phone className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Support</span>
            </div>
            <p className="text-gray-900 font-medium">We will contact you soon!</p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/vendor/login')}
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>

      <div className="mt-8 flex items-center gap-2 text-gray-400 text-sm">
        <Shield className="h-4 w-4" />
        <span>Secure Verification Process</span>
      </div>
    </div>
  );
};

export default VendorVerification;
