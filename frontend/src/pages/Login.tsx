import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, Shield } from 'lucide-react';
import apiService from '@/services/api';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    phone: '',
    otp: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // OTP Timer
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const sendOTP = async () => {
    if (!formData.phone) {
      setError('Please enter your phone number first');
      return;
    }

    // Phone validation (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Call backend API to send OTP
      const response = await apiService.sendOTP(cleanPhone);
      
      if (response.success) {
        setOtpSent(true);
        setOtpTimer(60); // 60 seconds timer
        
        toast({
          title: "OTP Sent!",
          description: `OTP has been sent to +91 ${cleanPhone}`,
        });

        // In development, show OTP in console
        if (response.data?.otp) {
          console.log(`🔧 Development Mode - OTP for ${cleanPhone}: ${response.data.otp}`);
        }
      } else {
        setError(response.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      console.error('Send OTP Error:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Basic validation
      if (!formData.phone || !formData.otp) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      // Phone validation (Indian format)
      const phoneRegex = /^[6-9]\d{9}$/;
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        setError('Please enter a valid 10-digit phone number');
        setIsLoading(false);
        return;
      }

      // OTP validation
      if (formData.otp.length !== 6) {
        setError('Please enter a valid 6-digit OTP');
        setIsLoading(false);
        return;
      }

      // Call backend API to verify OTP and login
      const response = await apiService.login(cleanPhone, formData.otp);

      if (response.success && response.data) {
        // Use auth context to login
        login(response.data.user, response.data.token);

        toast({
          title: "Login Successful!",
          description: response.data.message || "Welcome back to Fixifly",
        });

        // Redirect based on backend response or intended page
        const redirectTo = response.data.redirectTo || location.state?.from?.pathname || '/';
        navigate(redirectTo, { replace: true });
      } else {
        setError(response.message || 'Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      console.error('Login Error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-teal-500 flex items-start justify-center pt-32 p-4">
      <div className="w-full max-w-xl animate-slide-up">
        <Card className="bg-white border-0 rounded-2xl shadow-2xl overflow-hidden">
          <CardHeader className="text-center pb-0 pt-0">
            <div className="flex justify-center -mb-10">
              <img 
                src="/logofixifly.png" 
                alt="Fixifly Logo" 
                className="w-36 h-36 object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-blue-600 mb-2">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to your Fixifly account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-6 pb-8">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10 h-12 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                  OTP Verification
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={formData.otp}
                    onChange={handleInputChange}
                    className="pl-10 h-12 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg transition-all duration-200"
                    maxLength={6}
                    required
                    disabled={!otpSent}
                  />
                </div>
                {!otpSent ? (
                  <Button
                    type="button"
                    onClick={sendOTP}
                    disabled={isLoading || !formData.phone}
                    className="w-full h-10 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg font-medium transition-all duration-200"
                  >
                    {isLoading ? 'Sending...' : 'Send OTP'}
                  </Button>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <p className="text-gray-600">
                      OTP sent to {formData.phone}
                    </p>
                    <Button
                      type="button"
                      onClick={sendOTP}
                      disabled={otpTimer > 0}
                      variant="ghost"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded px-2 py-1 h-auto"
                    >
                      {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend OTP'}
                    </Button>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 mt-6"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying OTP...</span>
                  </div>
                ) : (
                  'Verify & Sign In'
                )}
              </Button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors duration-200"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
