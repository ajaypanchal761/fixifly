import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, Shield, Mail, Lock } from 'lucide-react';
import apiService from '@/services/api';
import { registerFCMToken } from '@/services/pushNotificationService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

  // Forgot Password States
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'none' | 'enterEmail' | 'verifyOtp' | 'resetPassword'>('none');
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');

  // Redirect if already authenticated (with guard to prevent loops)
  const hasRedirectedRef = React.useRef(false);
  React.useEffect(() => {
    if (isAuthenticated && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      const from = location.state?.from?.pathname || '/';
      // Use timeout to prevent immediate redirect loops
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    }
    // Reset flag when pathname changes
    return () => {
      if (location.pathname !== '/login') {
        hasRedirectedRef.current = false;
      }
    };
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

  // Helper function to get FCM token
  const getFCMToken = async (): Promise<string | null> => {
    try {
      // Check if Flutter bridge is available (mobile app)
      if (typeof (window as any).flutter_inappwebview !== 'undefined') {
        try {
          const token = await (window as any).flutter_inappwebview.callHandler('getFCMToken');
          return token || null;
        } catch {
          return null;
        }
      } else if (typeof (window as any).Android !== 'undefined') {
        // Android WebView
        const token = (window as any).Android.getFCMToken();
        return token || null;
      } else {
        // For web: Try to get FCM token from localStorage or register
        const savedToken = localStorage.getItem('fcmToken');
        if (savedToken) {
          return savedToken;
        }
        
        // Try to register and get FCM token
        try {
          const token = await registerFCMToken(false);
          return token;
        } catch {
          return null;
        }
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
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
      // Test backend connectivity first (optional check)
      console.log('🔍 Testing backend connectivity...');
      try {
        await apiService.healthCheck();
        console.log('✅ Backend is reachable');
      } catch (healthError: any) {
        console.warn('⚠️ Backend health check failed (this might be normal), continuing with OTP request:', healthError.message);
      }

      // Test SMS configuration
      console.log('📱 Testing SMS configuration...');
      try {
        const smsTest = await apiService.testSMS();
        console.log('✅ SMS configuration:', smsTest.data);
        if (!smsTest.data?.credentials?.isConfigured) {
          console.warn('⚠️ SMS credentials not properly configured');
        } else {
          console.log('✅ SMS credentials are configured properly');
        }
      } catch (smsError: any) {
        console.warn('⚠️ SMS configuration test failed:', smsError.message);
      }

      console.log(`📱 Attempting to send OTP to: ${cleanPhone}`);

      // Check if it's the default test number for development
      const isTestNumber = cleanPhone === '7610416911';
      if (isTestNumber) {
        console.log('🧪 Using test phone number - OTP will be: 110211');
      }

      // Call backend API to send OTP
      const response = await apiService.sendOTP(cleanPhone);

      console.log('📱 OTP Response:', response);

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
        console.error('📱 OTP sending failed:', response.message);
        setError(response.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      // Check if it's an expected error (user not found)
      const isExpectedError = err.message?.includes('User not found') ||
        err.message?.includes('sign up first') ||
        err.message?.includes('complete your signup');

      if (isExpectedError) {
        // Log expected errors as info instead of error
        console.info('ℹ️ User account check:', err.message);
      } else {
        // Log unexpected errors as errors
        console.error('Send OTP Error:', err);
      }

      let errorMessage = 'Failed to send OTP. Please try again.';

      // Parse specific error messages
      if (err.message) {
        if (err.message.includes('User not found') || err.message.includes('sign up first')) {
          errorMessage = 'Account not found. Please sign up first to create an account.';
        } else if (err.message.includes('complete your signup')) {
          errorMessage = 'Please complete your signup first. Name and email are required.';
        } else if (err.message.includes('SMS India Hub')) {
          errorMessage = 'SMS service is currently unavailable. Please try again later.';
        } else if (err.message.includes('Network error')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else if (err.message.includes('rate limit')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
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

      // Get FCM token if available
      const fcmToken = await getFCMToken();
      const platform = (typeof (window as any).flutter_inappwebview !== 'undefined' || typeof (window as any).Android !== 'undefined') ? 'mobile' : 'web';

      // Call backend API to verify OTP and login
      const response = await apiService.login(cleanPhone, formData.otp, fcmToken || undefined, platform || undefined);

      if (response.success && response.data) {
        // Use auth context to login
        login(response.data.user, response.data.token);

        toast({
          title: "Login Successful!",
          description: response.data.message || "Welcome back to Fixfly",
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="bg-white border-0 rounded-2xl shadow-2xl overflow-hidden">
          <CardHeader className="text-center pb-6 pt-4">
            <div className="flex justify-center mb-4">
              <img
                src="/logofixifly.png"
                alt="Fixfly Logo"
                className="w-56 h-32 object-contain -mb-10"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-blue-600 mb-2">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to your Fixfly account
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
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
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
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
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

            <div className="text-center mt-6 space-y-2">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  Sign up here
                </Link>
              </p>

            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordStep !== 'none'} onOpenChange={(open) => !open && setForgotPasswordStep('none')}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {forgotPasswordStep === 'enterEmail' && 'Enter your email address to receive an OTP'}
              {forgotPasswordStep === 'verifyOtp' && 'Enter the OTP sent to your email'}
              {forgotPasswordStep === 'resetPassword' && 'Enter your new password'}
            </DialogDescription>
          </DialogHeader>

          {forgotPasswordError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription className="space-y-2">
                <div>{forgotPasswordError}</div>
                {(forgotPasswordError.includes('Daily email sending limit') ||
                  forgotPasswordError.includes('limit exceeded') ||
                  forgotPasswordError.includes('limit reached')) && (
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <p className="text-sm font-medium mb-1">Need immediate help?</p>
                      <div className="text-sm space-y-1">
                        <p>📧 Email: <a href="mailto:info@fixfly.in" className="underline">info@fixfly.in</a></p>
                        <p>📱 WhatsApp: <a href="https://wa.me/919931354354" target="_blank" rel="noopener noreferrer" className="underline">+91-99313-54354</a></p>
                      </div>
                    </div>
                  )}
              </AlertDescription>
            </Alert>
          )}

          {forgotPasswordStep === 'enterEmail' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (forgotPasswordData.email && !forgotPasswordLoading) {
                  document.getElementById('user-send-otp-btn')?.click();
                }
              }}
              className="space-y-4 mt-4"
            >
              <div className="space-y-2">
                <Label htmlFor="forgotEmail">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="forgotEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={forgotPasswordData.email}
                    onChange={(e) => setForgotPasswordData(prev => ({ ...prev, email: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (forgotPasswordData.email && !forgotPasswordLoading) {
                          document.getElementById('user-send-otp-btn')?.click();
                        }
                      }
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button
                id="user-send-otp-btn"
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  if (!forgotPasswordData.email) {
                    setForgotPasswordError('Please enter your email address');
                    return;
                  }
                  setForgotPasswordLoading(true);
                  setForgotPasswordError('');
                  try {
                    const response = await apiService.sendForgotPasswordOTP(forgotPasswordData.email);
                    if (response.success) {
                      toast({
                        title: "OTP Sent!",
                        description: "OTP has been sent to your email address",
                      });
                      setForgotPasswordStep('verifyOtp');
                    } else {
                      const errorMsg = response.message || 'Failed to send OTP';
                      if (errorMsg.includes('Daily email sending limit') || errorMsg.includes('limit exceeded') || errorMsg.includes('limit reached')) {
                        setForgotPasswordError(
                          'Email service daily limit reached. Please contact support at info@fixfly.in or WhatsApp: +91-99313-54354 for immediate assistance. You can also try again tomorrow.'
                        );
                      } else {
                        setForgotPasswordError(errorMsg);
                      }
                    }
                  } catch (err: any) {
                    const errorMsg = err.message || 'Failed to send OTP';
                    if (errorMsg.includes('Daily email sending limit') || errorMsg.includes('limit exceeded') || errorMsg.includes('limit reached')) {
                      setForgotPasswordError(
                        'Email service daily limit reached. Please contact support at info@fixfly.in or WhatsApp: +91-99313-54354 for immediate assistance. You can also try again tomorrow.'
                      );
                    } else {
                      setForgotPasswordError(errorMsg);
                    }
                  } finally {
                    setForgotPasswordLoading(false);
                  }
                }}
                disabled={forgotPasswordLoading}
                className="w-full"
              >
                {forgotPasswordLoading ? 'Sending...' : 'Send OTP'}
              </Button>
            </form>
          )}

          {forgotPasswordStep === 'verifyOtp' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (forgotPasswordData.otp && forgotPasswordData.otp.length === 6 && !forgotPasswordLoading) {
                  document.getElementById('user-verify-otp-btn')?.click();
                }
              }}
              className="space-y-4 mt-4"
            >
              <div className="space-y-2">
                <Label htmlFor="forgotOtp">Enter OTP</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="forgotOtp"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter 6-digit OTP"
                    value={forgotPasswordData.otp}
                    onChange={(e) => setForgotPasswordData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (forgotPasswordData.otp && forgotPasswordData.otp.length === 6 && !forgotPasswordLoading) {
                          document.getElementById('user-verify-otp-btn')?.click();
                        }
                      }
                    }}
                    className="pl-10"
                    maxLength={6}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForgotPasswordStep('enterEmail')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  id="user-verify-otp-btn"
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (!forgotPasswordData.otp || forgotPasswordData.otp.length !== 6) {
                      setForgotPasswordError('Please enter a valid 6-digit OTP');
                      return;
                    }
                    setForgotPasswordLoading(true);
                    setForgotPasswordError('');
                    try {
                      const response = await apiService.verifyForgotPasswordOTP(forgotPasswordData.email, forgotPasswordData.otp);
                      if (response.success) {
                        toast({
                          title: "OTP Verified!",
                          description: "Please set your new password",
                        });
                        setForgotPasswordStep('resetPassword');
                      } else {
                        setForgotPasswordError(response.message || 'Invalid OTP');
                      }
                    } catch (err: any) {
                      setForgotPasswordError(err.message || 'Failed to verify OTP');
                    } finally {
                      setForgotPasswordLoading(false);
                    }
                  }}
                  disabled={forgotPasswordLoading}
                  className="flex-1"
                >
                  {forgotPasswordLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </div>
            </form>
          )}

          {forgotPasswordStep === 'resetPassword' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (forgotPasswordData.newPassword &&
                  forgotPasswordData.newPassword.length >= 6 &&
                  forgotPasswordData.newPassword === forgotPasswordData.confirmPassword &&
                  !forgotPasswordLoading) {
                  document.getElementById('user-reset-password-btn')?.click();
                }
              }}
              className="space-y-4 mt-4"
            >
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={forgotPasswordData.newPassword}
                    onChange={(e) => setForgotPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (forgotPasswordData.newPassword &&
                          forgotPasswordData.newPassword.length >= 6 &&
                          forgotPasswordData.newPassword === forgotPasswordData.confirmPassword &&
                          !forgotPasswordLoading) {
                          document.getElementById('user-reset-password-btn')?.click();
                        }
                      }
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={forgotPasswordData.confirmPassword}
                    onChange={(e) => setForgotPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (forgotPasswordData.newPassword &&
                          forgotPasswordData.newPassword.length >= 6 &&
                          forgotPasswordData.newPassword === forgotPasswordData.confirmPassword &&
                          !forgotPasswordLoading) {
                          document.getElementById('user-reset-password-btn')?.click();
                        }
                      }
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForgotPasswordStep('verifyOtp')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  id="user-reset-password-btn"
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (!forgotPasswordData.newPassword || forgotPasswordData.newPassword.length < 6) {
                      setForgotPasswordError('Password must be at least 6 characters long');
                      return;
                    }
                    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
                      setForgotPasswordError('Passwords do not match');
                      return;
                    }
                    setForgotPasswordLoading(true);
                    setForgotPasswordError('');
                    try {
                      const response = await apiService.resetPassword(
                        forgotPasswordData.email,
                        forgotPasswordData.otp,
                        forgotPasswordData.newPassword
                      );
                      if (response.success) {
                        toast({
                          title: "Password Reset Successful!",
                          description: "Please login with your new password",
                        });
                        setForgotPasswordStep('none');
                        setForgotPasswordData({
                          email: '',
                          otp: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      } else {
                        setForgotPasswordError(response.message || 'Failed to reset password');
                      }
                    } catch (err: any) {
                      setForgotPasswordError(err.message || 'Failed to reset password');
                    } finally {
                      setForgotPasswordLoading(false);
                    }
                  }}
                  disabled={forgotPasswordLoading}
                  className="flex-1"
                >
                  {forgotPasswordLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
