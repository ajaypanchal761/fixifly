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
  React.useEffect(() => {
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

        // Use vendor context to login
        login(vendor as any, response.data.token);

        toast({
          title: "Login Successful!",
          description: response.data.message || "Welcome back to Fixfly Vendor Portal!",
        });

        // Redirect to vendor earnings page for mandatory deposit
        navigate('/vendor/earnings');
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
    </div>
  );
};

export default VendorLogin;
