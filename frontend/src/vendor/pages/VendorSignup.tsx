import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Clock, ChevronLeft, ChevronRight, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import vendorApiService from '@/services/vendorApi';
import { registerFCMToken } from '@/services/pushNotificationService';

const VendorSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    fatherName: '',
    homePhone: '',
    currentAddress: '',
    password: '',
    confirmPassword: '',
    serviceCategories: [] as string[],
    experience: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState({
    aadhaarFront: null as File | null,
    aadhaarBack: null as File | null,
    profilePhoto: null as File | null
  });

  // Carousel data
  const carouselSlides = [
    {
      image: '/loginFixflylogo.png',
      alt: 'Fixfly Worker on Paper Airplane',
      title: 'Welcome To Fixfly',
      subtitle: 'India\'s Most Trusted Service Provider Brand'
    },
    {
      image: '/loginlogo2.png',
      alt: 'Financial Growth and Success',
      title: 'Double your earnings –',
      subtitle: 'grow with us!'
    },
    {
      image: '/loginlogo3.png',
      alt: 'Daily Earning Success',
      title: 'Daily Earning, Daily Payment',
      subtitle: '-- 50% Partnership!'
    }
  ];

  const serviceCategories = [
    'Laptop, Computers, Tab',
    'Macbook, iMac, Surface',
    'Printer Repair',
    'CCTV',
    'Server & Networking',
    'Software App Developer',
    'AC Repair',
    'Fridge, Washing Machine, Home Appliance Repair',
    'Electrician',
    'Plumber',
    'Cleaning'
  ];

  const experienceLevels = [
    'Less than 1 year',
    '1-2 years',
    '3-5 years',
    '5-10 years',
    'More than 10 years'
  ];

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [carouselSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

  const handleFileUpload = (field: keyof typeof uploadedFiles, file: File) => {
    // Validate file existence
    if (!file) {
      return;
    }

    // Check for empty file
    if (file.size === 0) {
      toast({
        title: "Empty File",
        description: "The selected file is empty. Please choose a valid image.",
        variant: "destructive"
      });
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a valid image file (JPG, JPEG, PNG, WEBP).",
        variant: "destructive"
      });
      return;
    }

    setUploadedFiles(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const removeFile = (field: keyof typeof uploadedFiles) => {
    setUploadedFiles(prev => ({
      ...prev,
      [field]: null
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Special handling for phone numbers
    if (['phone', 'alternatePhone', 'homePhone'].includes(name)) {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 10) {
        setFormData(prev => ({
          ...prev,
          [name]: numericValue
        }));
      }
      return;
    }

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
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone ||
      !formData.alternatePhone || !formData.fatherName || !formData.homePhone || !formData.currentAddress) {
      setError('Please fill in all required fields');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    // Normalize phone numbers for validation
    const normalizePhone = (phone) => {
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 11 && digits.startsWith('0')) {
        return digits.substring(1);
      }
      return digits;
    };

    const normalizedPhone = normalizePhone(formData.phone);
    const normalizedAlternatePhone = normalizePhone(formData.alternatePhone);
    const normalizedHomePhone = normalizePhone(formData.homePhone);

    if (normalizedPhone.length !== 10 || normalizedAlternatePhone.length !== 10 || normalizedHomePhone.length !== 10) {
      setError('Please enter valid 10-digit phone numbers (without country code or leading 0)');
      return false;
    }

    if (normalizedPhone === normalizedAlternatePhone) {
      setError('Primary and Alternate phone numbers cannot be the same');
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
      setError('Please select service categories and experience level');
      return false;
    }
    if (!uploadedFiles.aadhaarFront || !uploadedFiles.aadhaarBack || !uploadedFiles.profilePhoto) {
      setError('Please upload all required documents (Aadhaar front, Aadhaar back, and profile photo)');
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

    // Helper to upload a file securely with retry
    const uploadImageSafely = async (file: File, label: string): Promise<string | null> => {
      const uploadWithRetry = async (retryCount = 0): Promise<string | null> => {
        try {
          // Toast notification
          if (retryCount > 0) {
            toast({
              title: `Retrying ${label}...`,
              description: "Network issue detected. Retrying upload...",
            });
          } else {
            toast({
              title: `Uploading ${label}...`,
              description: "Please wait, do not close the app.",
            });
          }

          // Use the service method for upload
          const response = await vendorApiService.uploadDocument(file);

          if (response.success && response.data?.url) {
            return response.data.url;
          }

          throw new Error(response.message || 'Upload failed');
        } catch (error: any) {
          console.error(`Error uploading ${label} (Attempt ${retryCount + 1}):`, error);

          // Retry logic: Retry once
          if (retryCount < 1) {
            console.log(`Retrying ${label} upload...`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
            return await uploadWithRetry(retryCount + 1);
          }

          return null;
        }
      };

      return await uploadWithRetry();
    };


    try {
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

      // Sequential Uploads
      let aadhaarFrontUrl = '';
      if (uploadedFiles.aadhaarFront) {
        const url = await uploadImageSafely(uploadedFiles.aadhaarFront, 'Aadhaar Front');
        if (!url) {
          setError(`Failed to upload Aadhaar Front image. Please check your connection and try again. ${url}`);
          setIsLoading(false);
          return;
        }
        aadhaarFrontUrl = url;
      }

      let aadhaarBackUrl = '';
      if (uploadedFiles.aadhaarBack) {
        const url = await uploadImageSafely(uploadedFiles.aadhaarBack, 'Aadhaar Back');
        if (!url) {
          setError(`Failed to upload Aadhaar Back image. Please check your connection and try again. ${url}`);
          setIsLoading(false);
          return;
        }
        aadhaarBackUrl = url;
      }

      let profilePhotoUrl = '';
      if (uploadedFiles.profilePhoto) {
        const url = await uploadImageSafely(uploadedFiles.profilePhoto, 'Profile Photo');
        if (!url) {
          setError('Failed to upload Profile Photo. Please check your connection and try again.');
          setIsLoading(false);
          return;
        }
        profilePhotoUrl = url;
      }

      // Normalize phone numbers
      const normalizePhone = (phone: string) => {
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 11 && digits.startsWith('0')) {
          return digits.substring(1);
        }
        return digits;
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

      // Get FCM token if available
      const fcmToken = await getFCMToken();
      const deviceToken = fcmToken; // Use same token for deviceToken field

      // Prepare final registration data
      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: normalizePhone(formData.phone.trim()),
        alternatePhone: normalizePhone(formData.alternatePhone.trim()),
        fatherName: formData.fatherName.trim(),
        homePhone: normalizePhone(formData.homePhone.trim()),
        currentAddress: formData.currentAddress.trim(),
        password: formData.password,
        serviceCategories: formData.serviceCategories,
        experience: formData.experience,
        // Add uploaded file URLs
        aadhaarFrontUrl,
        aadhaarBackUrl,
        profileImageUrl: profilePhotoUrl,
        // Add FCM token if available
        ...(deviceToken && { deviceToken }),
        ...(fcmToken && { fcmToken })
      };

      console.log('Sending registration data with URLs:', registrationData);

      const response = await vendorApiService.register(registrationData);

      if (response.success) {
        toast({
          title: "Account Created Successfully!",
          description: "Your vendor account has been created and approved instantly. You can now login and access all features!",
        });

        // Redirect to verification page
        navigate('/vendor/verification');
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
              className="pl-10 h-12 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-yellow-400 rounded-xl text-black placeholder:text-gray-600 focus:border-yellow-500 focus:ring-0"
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
              className="pl-10 h-12 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-yellow-400 rounded-xl text-black placeholder:text-gray-600 focus:border-yellow-500 focus:ring-0"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            className="pl-10 h-12 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-yellow-400 rounded-xl text-black placeholder:text-gray-600 focus:border-yellow-500 focus:ring-0"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone *</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Enter 10-digit number"
            value={formData.phone}
            onChange={handleInputChange}
            className="pl-10 h-12 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-yellow-400 rounded-xl text-black placeholder:text-gray-600 focus:border-yellow-500 focus:ring-0"
            maxLength={10}
            pattern="[0-9]*"
            required
          />
        </div>
        <p className="text-xs text-gray-500">10-digit mobile number</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="alternatePhone">Alt Phone *</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="alternatePhone"
            name="alternatePhone"
            type="tel"
            placeholder="Enter alternate number"
            value={formData.alternatePhone}
            onChange={handleInputChange}
            className="pl-10 h-12 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-yellow-400 rounded-xl text-black placeholder:text-gray-600 focus:border-yellow-500 focus:ring-0"
            maxLength={10}
            pattern="[0-9]*"
            required
          />
        </div>
        <p className="text-xs text-gray-500">10-digit mobile number</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fatherName">Father's Name *</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="fatherName"
            name="fatherName"
            placeholder="Enter father's name"
            value={formData.fatherName}
            onChange={handleInputChange}
            className="pl-10 h-12 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-yellow-400 rounded-xl text-black placeholder:text-gray-600 focus:border-yellow-500 focus:ring-0"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="homePhone">Home Phone *</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="homePhone"
            name="homePhone"
            type="tel"
            placeholder="Enter home number"
            value={formData.homePhone}
            onChange={handleInputChange}
            className="pl-10 h-12 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-yellow-400 rounded-xl text-black placeholder:text-gray-600 focus:border-yellow-500 focus:ring-0"
            maxLength={10}
            pattern="[0-9]*"
            required
          />
        </div>
        <p className="text-xs text-gray-500">10-digit mobile/landline</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currentAddress">Address *</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Textarea
            id="currentAddress"
            name="currentAddress"
            placeholder="Enter your complete current address"
            value={formData.currentAddress}
            onChange={handleInputChange}
            className="pl-10 h-20 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-yellow-400 rounded-xl text-black placeholder:text-gray-600 focus:border-yellow-500 focus:ring-0 resize-none"
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
            className="pl-10 pr-12 h-12 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-yellow-400 rounded-xl text-black placeholder:text-gray-600 focus:border-yellow-500 focus:ring-0"
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
            className="pl-10 pr-12 h-12 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-yellow-400 rounded-xl text-black placeholder:text-gray-600 focus:border-yellow-500 focus:ring-0"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-600" />
            ) : (
              <Eye className="h-4 w-4 text-gray-600" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Service Categories */}
      <div className="space-y-3">
        <Label>Service Categories *</Label>
        <p className="text-sm text-gray-600">Select all the services you can provide (you can choose multiple)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto border-2 border-yellow-400 rounded-xl p-4 bg-gradient-to-r from-blue-50 to-blue-100">
          {serviceCategories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={category}
                checked={formData.serviceCategories.includes(category)}
                onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                className="border-yellow-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <Label
                htmlFor={category}
                className="text-sm font-normal cursor-pointer flex-1 text-gray-700"
              >
                {category}
              </Label>
            </div>
          ))}
        </div>
        {formData.serviceCategories.length > 0 && (
          <div className="text-sm text-blue-600 font-medium">
            Selected: {formData.serviceCategories.join(', ')}
          </div>
        )}
      </div>

      {/* Experience Level */}
      <div className="space-y-2">
        <Label htmlFor="experience">Experience Level *</Label>
        <Select value={formData.experience} onValueChange={(value) => handleSelectChange('experience', value)}>
          <SelectTrigger className="h-12 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-yellow-400 rounded-xl focus:border-yellow-500">
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

      {/* File Uploads */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Required Documents *</Label>

        {/* Aadhaar Front */}
        <div className="space-y-2">
          <Label>Aadhaar Front Photo *</Label>
          <div className="border-2 border-dashed border-yellow-400 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100">
            {uploadedFiles.aadhaarFront ? (
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-2">
                  <Upload className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">{uploadedFiles.aadhaarFront.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('aadhaarFront')}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload('aadhaarFront', e.target.files[0]);
                      e.target.value = ''; // Reset input so same file can be selected again
                    }
                  }}
                  className="hidden"
                  id="aadhaarFront"
                />
                <label htmlFor="aadhaarFront" className="cursor-pointer block p-4">
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">
                      Click to upload Aadhaar front photo
                    </span>
                  </div>
                </label>
              </>
            )}
          </div>
        </div>

        {/* Aadhaar Back */}
        <div className="space-y-2">
          <Label>Aadhaar Back Photo *</Label>
          <div className="border-2 border-dashed border-yellow-400 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100">
            {uploadedFiles.aadhaarBack ? (
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-2">
                  <Upload className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">{uploadedFiles.aadhaarBack.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('aadhaarBack')}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload('aadhaarBack', e.target.files[0]);
                      e.target.value = ''; // Reset input so same file can be selected again
                    }
                  }}
                  className="hidden"
                  id="aadhaarBack"
                />
                <label htmlFor="aadhaarBack" className="cursor-pointer block p-4">
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">
                      Click to upload Aadhaar back photo
                    </span>
                  </div>
                </label>
              </>
            )}
          </div>
        </div>

        {/* Profile Photo */}
        <div className="space-y-2">
          <Label>Profile Photo *</Label>
          <div className="border-2 border-dashed border-yellow-400 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100">
            {uploadedFiles.profilePhoto ? (
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-2">
                  <Upload className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">{uploadedFiles.profilePhoto.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('profilePhoto')}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload('profilePhoto', e.target.files[0]);
                      e.target.value = ''; // Reset input so same file can be selected again
                    }
                  }}
                  className="hidden"
                  id="profilePhoto"
                />
                <label htmlFor="profilePhoto" className="cursor-pointer block p-4">
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">
                      Click to upload profile photo
                    </span>
                  </div>
                </label>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

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
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${index === currentSlide ? 'bg-orange-500' : 'bg-gray-400'
                  }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>

        {/* Registration Form */}
        <div className="w-full max-w-2xl">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep} of 3</span>
              <span>{currentStep === 1 ? 'Personal Information' : currentStep === 2 ? 'Security' : 'Service details'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          <form onSubmit={currentStep === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6">


            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 mb-4">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="h-12 px-6 border-2 border-yellow-400 text-gray-700 hover:bg-yellow-50"
              >
                Previous
              </Button>

              {currentStep < 3 ? (
                <Button
                  type="submit"
                  className="h-12 px-6 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 px-6 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              )}
            </div>
          </form>

          {/* Sign In Link */}
          <div className="text-center mt-6">
            <p className="text-gray-700">
              Already have an account?{' '}
              <Link
                to="/vendor/login"
                className="text-blue-600 font-medium hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>

          {/* Account Creation Information */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <Clock className="h-4 w-4" />
              <p className="text-sm font-medium">Instant Account Creation</p>
            </div>
            <p className="text-xs text-green-700">
              Your vendor account will be created instantly! You can login immediately after registration
              and start accessing all features. No admin approval required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorSignup;
