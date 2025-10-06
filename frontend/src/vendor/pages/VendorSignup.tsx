import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Briefcase, ArrowLeft, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import vendorApiService from '@/services/vendorApi';
import VendorBenefitsModal from '../components/VendorBenefitsModal';

const VendorSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    serviceCategories: [] as string[],
    customServiceCategory: '',
    experience: '',
    address: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const serviceCategories = [
    'Electronics Repair',
    'Home Appliances',
    'Computer & Laptop',
    'Mobile Phone',
    'AC & Refrigeration',
    'Plumbing',
    'Electrical',
    'Carpentry',
    'Painting',
    'Cleaning Services',
    'Other'
  ];

  const experienceLevels = [
    'Less than 1 year',
    '1-2 years',
    '3-5 years',
    '5-10 years',
    'More than 10 years'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    setFormData(prev => {
      let newCategories;
      if (checked) {
        newCategories = [...prev.serviceCategories, category];
      } else {
        newCategories = prev.serviceCategories.filter(c => c !== category);
        // If "Other" is unchecked, clear the custom service category
        if (category === 'Other') {
          return {
            ...prev,
            serviceCategories: newCategories,
            customServiceCategory: ''
          };
        }
      }
      return {
        ...prev,
        serviceCategories: newCategories
      };
    });
    if (error) setError('');
  };

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setError('Please fill in all required fields');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.password || !formData.confirmPassword) {
      setError('Please fill in all password fields');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (formData.serviceCategories.length === 0 || !formData.experience) {
      setError('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate all steps before proceeding
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      setIsLoading(false);
      return;
    }

    try {
      // Prepare registration data
      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        serviceCategories: formData.serviceCategories,
        customServiceCategory: formData.customServiceCategory?.trim(),
        experience: formData.experience,
        address: formData.address ? {
          street: formData.address.trim(),
          city: '',
          state: '',
          pincode: '',
          landmark: ''
        } : undefined
      };

      console.log('Attempting vendor registration with data:', {
        ...registrationData,
        password: '[HIDDEN]' // Don't log the actual password
      });

      // Test backend connectivity first
      try {
        await vendorApiService.test();
        console.log('Backend connectivity test passed');
      } catch (healthError: any) {
        console.error('Backend connectivity test failed:', healthError);
        setError('Unable to connect to server. Please check your internet connection and try again.');
        setIsLoading(false);
        return;
      }

      // Call backend API to register
      const response = await vendorApiService.register(registrationData);

      if (response.success) {
        toast({
          title: "Registration Successful",
          description: "Your vendor account has been created. Please wait for admin approval before you can login.",
        });

        // Redirect to vendor login page
        navigate('/vendor/login');
      } else {
        setError(response.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Vendor Registration Error:', err);
      
      // Extract more detailed error information
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        // Handle validation errors
        errorMessage = Array.isArray(err.response.data.errors) 
          ? err.response.data.errors.join('. ')
          : 'Validation failed. Please check your inputs.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="firstName"
              name="firstName"
              placeholder="Enter first name"
              value={formData.firstName}
              onChange={handleInputChange}
              className="pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="lastName"
              name="lastName"
              placeholder="Enter last name"
              value={formData.lastName}
              onChange={handleInputChange}
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={handleInputChange}
            className="pl-10"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            value={formData.password}
            onChange={handleInputChange}
            className="pl-10 pr-10"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="pl-10 pr-10"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>Service Categories *</Label>
        <p className="text-sm text-gray-600">Select all the services you can provide (you can choose multiple)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-md p-3">
          {serviceCategories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={category}
                checked={formData.serviceCategories.includes(category)}
                onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
              />
              <Label 
                htmlFor={category} 
                className="text-sm font-normal cursor-pointer flex-1"
              >
                {category}
              </Label>
            </div>
          ))}
        </div>
        {formData.serviceCategories.includes('Other') && (
          <div className="space-y-2">
            <Label htmlFor="customServiceCategory" className="text-sm font-medium text-gray-700">
              Specify your service type:
            </Label>
            <Input
              id="customServiceCategory"
              name="customServiceCategory"
              value={formData.customServiceCategory}
              onChange={handleInputChange}
              placeholder="Enter your custom service category"
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>
        )}
        {formData.serviceCategories.length > 0 && (
          <div className="text-sm text-blue-600">
            Selected: {formData.serviceCategories.map(cat => 
              cat === 'Other' && formData.customServiceCategory 
                ? `${cat} (${formData.customServiceCategory})` 
                : cat
            ).join(', ')}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="experience">Experience Level *</Label>
        <Select value={formData.experience} onValueChange={(value) => handleSelectChange('experience', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select your experience level" />
          </SelectTrigger>
          <SelectContent>
            {experienceLevels.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          name="address"
          placeholder="Enter your full address (optional)"
          value={formData.address}
          onChange={handleInputChange}
          rows={3}
        />
      </div>

    </div>
  );

  return (
    <div className="h-screen flex items-center justify-center p-4 pt-16 overflow-hidden">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-4 -mt-16">
          <img 
            src="/logofixifly.png" 
            alt="Fixfly Logo" 
            className="h-32 mx-auto"
          />
          <h1 className="text-2xl font-bold text-gray-900 -mt-6">Vendor Registration</h1>
          <p className="text-gray-600 -mt-2">Join Fixfly as a service provider</p>
        </div>

        <Card className="shadow-lg max-h-[calc(100vh-200px)] overflow-y-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create Your Account</CardTitle>
            <CardDescription className="text-center">
              Step {currentStep} of 3: {currentStep === 1 ? 'Personal Information' : currentStep === 2 ? 'Security' : 'Service Details'}
            </CardDescription>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={currentStep === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              <div className="flex justify-between mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                
                {currentStep < 3 ? (
                  <Button type="submit">
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/vendor/login"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Approval Process Information */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 mb-2">
                <Clock className="h-4 w-4" />
                <p className="text-sm font-medium">Account Approval Required</p>
              </div>
              <p className="text-xs text-blue-700">
                After registration, your vendor account will be reviewed by our admin team. 
                You'll receive an email notification once your account is approved and you can login.
                This process typically takes 1-2 business days.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorSignup;
