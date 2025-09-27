import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, User, Phone, Shield } from 'lucide-react';
import apiService from '@/services/api';

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
      if (!formData.name || !formData.email || !formData.phone || !formData.otp) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
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

      // Call backend API to verify OTP and complete registration
      const response = await apiService.verifyOTP(
        cleanPhone,
        formData.otp,
        formData.name,
        formData.email
      );

      if (response.success && response.data) {
        // Use auth context to login
        login(response.data.user, response.data.token);

        toast({
          title: "Account Created Successfully!",
          description: response.data.message || "Welcome to Fixifly! Your account has been created.",
        });

        // Redirect based on backend response
        const redirectTo = response.data.redirectTo || '/';
        navigate(redirectTo);
      } else {
        setError(response.message || 'Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      console.error('Registration Error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center p-4 overflow-hidden" style={{ overflow: 'hidden' }}>
      <div className="w-screen max-w-2xl animate-slide-up max-h-screen overflow-hidden">
        <Card className="bg-white border-0 rounded-2xl shadow-2xl overflow-hidden">
          <CardHeader className="text-center pb-6 pt-4">
            <div className="flex justify-center mb-4">
              <img 
                src="/logofixifly.png" 
                alt="Fixifly Logo" 
                className="w-56 h-32 object-contain -mb-10"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-blue-600 mb-2">Create Account</CardTitle>
            <CardDescription className="text-gray-600">
              Join Fixifly and get started with our services
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-6 pb-8">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10 h-12 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10 h-12 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              </div>

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
                  'Verify & Create Account'
                )}
              </Button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors duration-200"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
