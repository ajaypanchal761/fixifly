import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, AlertTriangle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useVendor } from '@/contexts/VendorContext';
import vendorApiService from '@/services/vendorApi';

const VendorLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated } = useVendor();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');

  // Carousel data
  const carouselSlides = [
    {
      image: '/loginFixflylogo.png',
      alt: 'Fixfly Worker on Paper Airplane',
      title: 'Welcome To Fixfly',
      subtitle: 'India\'s Most Trusted Service Provider Brand'
    },
    {
      image: '/loginlogo2.png', // Financial growth illustration
      alt: 'Financial Growth and Success',
      title: 'Double your earnings –',
      subtitle: 'grow with us!'
    },
    {
      image: '/loginlogo3.png', // Businessman success illustration
      alt: 'Daily Earning Success',
      title: 'Daily Earning, Daily Payment',
      subtitle: '-- 50% Partnership!'
    }
  ];

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [carouselSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/vendor');
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      // Call backend API to login
      const response = await vendorApiService.login(formData.email, formData.password);

      if (response.success && response.data) {
        const vendor = response.data.vendor;
        
        // Admin approval is no longer required for login
        
        if (!vendor.isActive) {
          setError('Your account is currently inactive. Please contact support for assistance.');
          return;
        }
        
        if (vendor.isBlocked) {
          setError('You are blocked by admin. Please contact support for assistance.');
          return;
        }

        // Use vendor context to login - wait for it to complete
        console.log('🔄 VendorLogin: Calling login function...');
        await login(vendor as any, response.data.token);
        console.log('✅ VendorLogin: Login function completed');

        // Wait a bit for state to update
        await new Promise(resolve => setTimeout(resolve, 100));

        toast({
          title: "Login Successful!",
          description: response.data.message || "Welcome back to Fixfly Vendor Portal!",
        });

        // Redirect to vendor earnings page for mandatory deposit
        console.log('🚀 VendorLogin: Navigating to /vendor/earnings');
        
        // APK-safe navigation - use setTimeout to ensure state is updated
        let isAPK = false;
        try {
          isAPK = (typeof navigator !== 'undefined' && /wv|WebView/.test(navigator.userAgent || '')) || 
                  (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
        } catch (error) {
          console.error('Error detecting APK mode:', error);
          isAPK = false;
        }
        
        if (isAPK) {
          // In APK, wait a bit longer for context to sync
          setTimeout(() => {
            console.log('📱 APK: Navigating after delay');
            navigate('/vendor/earnings', { replace: true });
          }, 300);
        } else {
          navigate('/vendor/earnings', { replace: true });
        }
        console.log('✅ VendorLogin: Navigate called');
      } else {
        setError(response.message || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Vendor Login Error:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Carousel Section */}
        <div className="text-center mb-8">
          {/* Welcome Title - Fixed above all slides */}
          <h1 className="text-2xl font-bold text-blue-600 mb-6">Welcome To Fixfly</h1>
          
          {/* Carousel Container */}
          <div className="relative mb-6">
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {carouselSlides.map((slide, index) => (
                  <div key={index} className="w-full flex-shrink-0">
                    <div className="flex flex-col items-center">
                      {/* Image */}
                      <div className="mb-4">
                        <img 
                          src={slide.image} 
                          alt={slide.alt} 
                          className="w-48 h-auto mx-auto"
                        />
                      </div>
                      
                      {/* Subtitle only - title is now fixed above */}
                      <div className="text-center">
                        <div className="text-center">
                          {slide.subtitle.includes('India') ? (
                            <>
                              <p className="text-lg font-bold text-blue-600">India's Most Trusted Service</p>
                              <p className="text-lg font-bold text-red-500">Provider Brand</p>
                            </>
                          ) : slide.subtitle.includes('grow') ? (
                            <>
                              <p className="text-lg font-bold text-blue-600">Double your earnings –</p>
                              <p className="text-lg font-bold text-red-500">grow with us!</p>
                            </>
                          ) : (
                            <>
                              <p className="text-lg font-bold text-blue-600">Daily Earning, Daily Payment</p>
                              <p className="text-lg font-bold text-red-500">-- 50% Partnership!</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Navigation Arrows */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white rounded-full shadow-md"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white rounded-full shadow-md"
              onClick={nextSlide}
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
          
          {/* Page Indicators */}
          <div className="flex justify-center mt-4 space-x-2">
            {carouselSlides.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  index === currentSlide ? 'bg-orange-500' : 'bg-gray-400'
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant={error.includes('approval') ? 'default' : 'destructive'} className={error.includes('approval') ? 'border-orange-200 bg-orange-50' : ''}>
                {error.includes('approval') ? (
                  <Clock className="h-4 w-4 text-orange-600" />
                ) : error.includes('blocked') || error.includes('inactive') ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : null}
                <AlertDescription className={error.includes('approval') ? 'text-orange-800' : ''}>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Email Input */}
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className="h-12 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-yellow-400 rounded-xl text-black placeholder:text-gray-600 focus:border-yellow-500 focus:ring-0"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className="h-12 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-yellow-400 rounded-xl text-black placeholder:text-gray-600 focus:border-yellow-500 focus:ring-0 pr-12"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-600" />
                )}
              </Button>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <p className="text-gray-700">
              No Account?{' '}
              <Link
                to="/vendor/signup"
                className="text-blue-600 font-medium hover:underline"
              >
                Signup Here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {forgotPasswordStep === 'email' && 'Forgot Password'}
                {forgotPasswordStep === 'otp' && 'Enter OTP'}
                {forgotPasswordStep === 'newPassword' && 'Set New Password'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordStep('email');
                  setForgotPasswordData({ email: '', otp: '', newPassword: '', confirmPassword: '' });
                  setForgotPasswordError('');
                  setForgotPasswordSuccess('');
                }}
                className="h-8 w-8 p-0"
              >
                <span className="text-2xl">×</span>
              </Button>
            </div>

            {forgotPasswordError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
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

            {forgotPasswordSuccess && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{forgotPasswordSuccess}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Email Input */}
            {forgotPasswordStep === 'email' && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  // Trigger send OTP on form submit
                  if (forgotPasswordData.email && !forgotPasswordLoading) {
                    document.getElementById('send-otp-btn')?.click();
                  }
                }}
                className="space-y-4"
              >
                <p className="text-gray-600">Enter your vendor email address to receive an OTP for password reset.</p>
                <Input
                  type="email"
                  placeholder="Vendor Email"
                  value={forgotPasswordData.email}
                  onChange={(e) => {
                    setForgotPasswordData({ ...forgotPasswordData, email: e.target.value });
                    setForgotPasswordError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (forgotPasswordData.email && !forgotPasswordLoading) {
                        document.getElementById('send-otp-btn')?.click();
                      }
                    }
                  }}
                  className="h-12 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-yellow-400 rounded-xl text-black placeholder:text-gray-600 focus:border-yellow-500 focus:ring-0"
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordStep('email');
                      setForgotPasswordData({ email: '', otp: '', newPassword: '', confirmPassword: '' });
                      setForgotPasswordError('');
                      setForgotPasswordSuccess('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    id="send-otp-btn"
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
                      setForgotPasswordSuccess('');

                      try {
                        const response = await vendorApiService.sendForgotPasswordOTP(forgotPasswordData.email);
                        
                        if (response.success) {
                          setForgotPasswordSuccess('OTP has been sent to your email. Please check your inbox.');
                          setForgotPasswordStep('otp');
                        } else {
                          // Check for Gmail daily limit error
                          const errorMsg = response.message || 'Failed to send OTP. Please try again.';
                          if (errorMsg.includes('Daily email sending limit') || errorMsg.includes('limit exceeded') || errorMsg.includes('limit reached')) {
                            setForgotPasswordError(
                              'Email service daily limit reached. Please contact support at info@fixfly.in or WhatsApp: +91-99313-54354 for immediate assistance. You can also try again tomorrow.'
                            );
                          } else {
                            setForgotPasswordError(errorMsg);
                          }
                        }
                      } catch (err: any) {
                        const errorMsg = err.message || 'Failed to send OTP. Please try again.';
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
                    className="flex-1 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    {forgotPasswordLoading ? 'Sending...' : 'Send OTP'}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2: OTP Input */}
            {forgotPasswordStep === 'otp' && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (forgotPasswordData.otp && forgotPasswordData.otp.length === 6 && !forgotPasswordLoading) {
                    document.getElementById('verify-otp-btn')?.click();
                  }
                }}
                className="space-y-4"
              >
                <p className="text-gray-600">Enter the 6-digit OTP sent to your email.</p>
                <Input
                  type="text"
                  placeholder="Enter OTP"
                  maxLength={6}
                  value={forgotPasswordData.otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Only numbers
                    setForgotPasswordData({ ...forgotPasswordData, otp: value });
                    setForgotPasswordError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (forgotPasswordData.otp && forgotPasswordData.otp.length === 6 && !forgotPasswordLoading) {
                        document.getElementById('verify-otp-btn')?.click();
                      }
                    }
                  }}
                  className="h-12 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-yellow-400 rounded-xl text-black placeholder:text-gray-600 focus:border-yellow-500 focus:ring-0 text-center text-2xl tracking-widest"
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setForgotPasswordStep('email');
                      setForgotPasswordData({ ...forgotPasswordData, otp: '' });
                      setForgotPasswordError('');
                      setForgotPasswordSuccess('');
                    }}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    id="verify-otp-btn"
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
                      setForgotPasswordSuccess('');

                      try {
                        const response = await vendorApiService.verifyForgotPasswordOTP(
                          forgotPasswordData.email,
                          forgotPasswordData.otp
                        );
                        
                        if (response.success) {
                          setForgotPasswordSuccess('OTP verified successfully!');
                          setForgotPasswordStep('newPassword');
                        } else {
                          setForgotPasswordError(response.message || 'Invalid or expired OTP. Please try again.');
                        }
                      } catch (err: any) {
                        setForgotPasswordError(err.message || 'Failed to verify OTP. Please try again.');
                      } finally {
                        setForgotPasswordLoading(false);
                      }
                    }}
                    disabled={forgotPasswordLoading}
                    className="flex-1 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    {forgotPasswordLoading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: New Password Input */}
            {forgotPasswordStep === 'newPassword' && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (forgotPasswordData.newPassword && 
                      forgotPasswordData.newPassword.length >= 6 && 
                      forgotPasswordData.newPassword === forgotPasswordData.confirmPassword &&
                      !forgotPasswordLoading) {
                    document.getElementById('reset-password-btn')?.click();
                  }
                }}
                className="space-y-4"
              >
                <p className="text-gray-600">Enter your new password.</p>
                <Input
                  type="password"
                  placeholder="New Password"
                  value={forgotPasswordData.newPassword}
                  onChange={(e) => {
                    setForgotPasswordData({ ...forgotPasswordData, newPassword: e.target.value });
                    setForgotPasswordError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (forgotPasswordData.newPassword && 
                          forgotPasswordData.newPassword.length >= 6 && 
                          forgotPasswordData.newPassword === forgotPasswordData.confirmPassword &&
                          !forgotPasswordLoading) {
                        document.getElementById('reset-password-btn')?.click();
                      }
                    }
                  }}
                  className="h-12 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-yellow-400 rounded-xl text-black placeholder:text-gray-600 focus:border-yellow-500 focus:ring-0"
                />
                <Input
                  type="password"
                  placeholder="Confirm New Password"
                  value={forgotPasswordData.confirmPassword}
                  onChange={(e) => {
                    setForgotPasswordData({ ...forgotPasswordData, confirmPassword: e.target.value });
                    setForgotPasswordError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (forgotPasswordData.newPassword && 
                          forgotPasswordData.newPassword.length >= 6 && 
                          forgotPasswordData.newPassword === forgotPasswordData.confirmPassword &&
                          !forgotPasswordLoading) {
                        document.getElementById('reset-password-btn')?.click();
                      }
                    }
                  }}
                  className="h-12 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-yellow-400 rounded-xl text-black placeholder:text-gray-600 focus:border-yellow-500 focus:ring-0"
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setForgotPasswordStep('otp');
                      setForgotPasswordData({ ...forgotPasswordData, newPassword: '', confirmPassword: '' });
                      setForgotPasswordError('');
                      setForgotPasswordSuccess('');
                    }}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    id="reset-password-btn"
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
                      setForgotPasswordSuccess('');

                      try {
                        const response = await vendorApiService.resetPassword(
                          forgotPasswordData.email,
                          forgotPasswordData.otp,
                          forgotPasswordData.newPassword
                        );
                        
                        if (response.success) {
                          setForgotPasswordSuccess('Password reset successfully! Redirecting to login...');
                          setTimeout(() => {
                            setShowForgotPassword(false);
                            setForgotPasswordStep('email');
                            setForgotPasswordData({ email: '', otp: '', newPassword: '', confirmPassword: '' });
                            setForgotPasswordError('');
                            setForgotPasswordSuccess('');
                            toast({
                              title: "Password Reset Successful!",
                              description: "Please login with your new password.",
                            });
                          }, 2000);
                        } else {
                          setForgotPasswordError(response.message || 'Failed to reset password. Please try again.');
                        }
                      } catch (err: any) {
                        setForgotPasswordError(err.message || 'Failed to reset password. Please try again.');
                      } finally {
                        setForgotPasswordLoading(false);
                      }
                    }}
                    disabled={forgotPasswordLoading}
                    className="flex-1 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    {forgotPasswordLoading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorLogin;
