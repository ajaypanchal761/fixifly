import React, { useState, useRef, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Camera, 
  Edit3, 
  Save, 
  X,
  Upload,
  CheckCircle,
  Calendar,
  Building,
  Briefcase,
  MapPin as LocationIcon,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import VendorHeader from '../components/VendorHeader';
import VendorBottomNav from '../components/VendorBottomNav';
import Footer from '../../components/Footer';
import NotFound from '../../pages/NotFound';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useVendor } from '@/contexts/VendorContext';
import vendorApiService from '@/services/vendorApi';
import type { Vendor, ServiceLocation } from '@/services/vendorApi';

const VendorProfile = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Show 404 error on desktop - must be before any other hooks
  if (!isMobile) {
    return <NotFound />;
  }

  const { toast } = useToast();
  const { vendor, updateVendor } = useVendor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileData, setProfileData] = useState<Vendor | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialty: '',
    bio: '',
    serviceCategories: [] as string[],
    customServiceCategory: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      landmark: ''
    }
  });

  // Service locations state
  const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>([]);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({ from: '', to: '' });
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editingLocation, setEditingLocation] = useState({ from: '', to: '' });

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

  // Load vendor profile data
  useEffect(() => {
    loadVendorProfile();
  }, []);

  const loadVendorProfile = async () => {
    try {
      setIsLoading(true);
      const response = await vendorApiService.getVendorProfile();
      
      if (response.success && response.data) {
        const vendorData = response.data.vendor;
        setProfileData(vendorData);
        setServiceLocations(vendorData.serviceLocations || []);
        setFormData({
          firstName: vendorData.firstName || '',
          lastName: vendorData.lastName || '',
          email: vendorData.email || '',
          phone: vendorData.phone || '',
          specialty: vendorData.specialty || '',
          bio: vendorData.bio || '',
          serviceCategories: vendorData.serviceCategories || [],
          customServiceCategory: vendorData.customServiceCategory || '',
          address: {
            street: vendorData.address?.street || '',
            city: vendorData.address?.city || '',
            state: vendorData.address?.state || '',
            pincode: vendorData.address?.pincode || '',
            landmark: vendorData.address?.landmark || ''
          }
        });
      }
    } catch (error: any) {
      console.error('Error loading vendor profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <VendorHeader />
        <main className="flex-1 pb-24 pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <VendorHeader />
        <main className="flex-1 pb-24 pt-20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Failed to load profile</p>
            <Button onClick={loadVendorProfile} variant="outline">
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original values
    if (profileData) {
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        specialty: profileData.specialty || '',
        bio: profileData.bio || '',
        serviceCategories: profileData.serviceCategories || [],
        customServiceCategory: profileData.customServiceCategory || '',
        address: {
          street: profileData.address?.street || '',
          city: profileData.address?.city || '',
          state: profileData.address?.state || '',
          pincode: profileData.address?.pincode || '',
          landmark: profileData.address?.landmark || ''
        }
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
  };

  const handleSave = async () => {
    // Validate form data
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: "Error",
        description: "First name and last name are required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const response = await vendorApiService.updateVendorProfile(formData);
      
      if (response.success) {
        setProfileData(response.data.vendor);
        
        // Update vendor context
        updateVendor({
          firstName: response.data.vendor.firstName,
          lastName: response.data.vendor.lastName,
          email: response.data.vendor.email,
          specialty: response.data.vendor.specialty,
          bio: response.data.vendor.bio,
          serviceCategories: response.data.vendor.serviceCategories,
          address: response.data.vendor.address,
          serviceLocations: response.data.vendor.serviceLocations
        });
        
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select a valid image file",
        variant: "destructive"
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image size should be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await vendorApiService.uploadProfileImage(formData);
      
      if (response.success) {
        setProfileData(prev => prev ? {
          ...prev,
          profileImage: response.data.profileImage
        } : null);
        
        // Update vendor context
        updateVendor({ profileImage: response.data.profileImage });
        
        toast({
          title: "Success",
          description: "Profile image updated successfully"
        });
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    try {
      const response = await vendorApiService.deleteProfileImage();
      
      if (response.success) {
        setProfileData(prev => prev ? {
          ...prev,
          profileImage: undefined
        } : null);
        
        // Update vendor context
        updateVendor({ profileImage: undefined });
        
        toast({
          title: "Success",
          description: "Profile image deleted successfully"
        });
      }
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete image",
        variant: "destructive"
      });
    }
  };

  // Service location handlers
  const handleAddLocation = async () => {
    if (!newLocation.from.trim() || !newLocation.to.trim()) {
      toast({
        title: "Error",
        description: "Please enter both from and to locations",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await vendorApiService.addServiceLocation(newLocation.from.trim(), newLocation.to.trim());
      
      if (response.success) {
        setServiceLocations(response.data.serviceLocations);
        setNewLocation({ from: '', to: '' });
        setIsAddingLocation(false);
        toast({
          title: "Success",
          description: "Service location added successfully"
        });
      }
    } catch (error: any) {
      console.error('Error adding service location:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add service location",
        variant: "destructive"
      });
    }
  };

  const handleEditLocation = (location: ServiceLocation) => {
    setEditingLocationId(location._id);
    setEditingLocation({ from: location.from, to: location.to });
  };

  const handleUpdateLocation = async () => {
    if (!editingLocation.from.trim() || !editingLocation.to.trim()) {
      toast({
        title: "Error",
        description: "Please enter both from and to locations",
        variant: "destructive"
      });
      return;
    }

    if (!editingLocationId) return;

    try {
      const response = await vendorApiService.updateServiceLocation(
        editingLocationId,
        editingLocation.from.trim(),
        editingLocation.to.trim()
      );
      
      if (response.success) {
        setServiceLocations(response.data.serviceLocations);
        setEditingLocationId(null);
        setEditingLocation({ from: '', to: '' });
        toast({
          title: "Success",
          description: "Service location updated successfully"
        });
      }
    } catch (error: any) {
      console.error('Error updating service location:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update service location",
        variant: "destructive"
      });
    }
  };

  const handleRemoveLocation = async (locationId: string) => {
    try {
      const response = await vendorApiService.removeServiceLocation(locationId);
      
      if (response.success) {
        setServiceLocations(response.data.serviceLocations);
        toast({
          title: "Success",
          description: "Service location removed successfully"
        });
      }
    } catch (error: any) {
      console.error('Error removing service location:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove service location",
        variant: "destructive"
      });
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : index < rating
            ? 'text-yellow-400 fill-current opacity-50'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 pt-20 overflow-y-auto">
        <div className="container mx-auto px-4 py-4">
          {/* Profile Header */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">Vendor <span className="text-2xl font-bold text-gradient mb-1"> Profile</span></h1>         
          </div>

          {/* Approval Status */}
          {profileData && !profileData.isApproved && (
            <Card className="mb-4 border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-800">Account Pending Approval</h3>
                    <p className="text-sm text-yellow-700">
                      Your account is currently under review by our admin team. You will be notified once approved.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {profileData && profileData.isApproved && !profileData.isActive && (
            <Card className="mb-4 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-800">Account Deactivated</h3>
                    <p className="text-sm text-red-700">
                      Your account has been deactivated. Please contact support for assistance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {profileData && profileData.isBlocked && (
            <Card className="mb-4 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-800">Account Blocked</h3>
                    <p className="text-sm text-red-700">
                      Your account has been blocked. Please contact support for assistance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile Card */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  Personal Information
                </CardTitle>
                {!isEditing ? (
                  <Button onClick={handleEdit} variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs px-3 py-1">
                    <Edit3 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button onClick={handleCancel} variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-3 py-1">
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Profile Image Section */}
              <div className="flex flex-col items-center space-y-3 mb-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center shadow-md">
                    {profileData.profileImage ? (
                      <img
                        src={profileData.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-blue-400" />
                    )}
                  </div>
                  {isEditing && (
                    <div className="absolute -bottom-1 -right-1 flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-full w-8 h-8 p-0 bg-white shadow-md border border-blue-200 hover:bg-blue-50"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="w-4 h-4 text-blue-600" />
                      </Button>
                      {profileData.profileImage && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-full w-8 h-8 p-0 bg-white shadow-md border border-red-200 hover:bg-red-50"
                          onClick={handleDeleteImage}
                          disabled={isUploadingImage}
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploadingImage}
                />
                {isEditing && (
                  <div className="text-center bg-blue-50 rounded-lg p-2 max-w-xs">
                    <p className="text-xs text-blue-700 font-medium mb-1">
                      Upload Photo
                    </p>
                    <p className="text-xs text-blue-600">
                      Max 5MB • JPG, PNG, GIF
                    </p>
                  </div>
                )}
              </div>

              {/* Profile Fields */}
              <div className="grid gap-3">
                {/* First Name */}
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-blue-600" />
                    </div>
                    First Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                      className="h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  ) : (
                    <div className="h-9 flex items-center px-3 bg-gray-50 rounded-lg border text-sm">
                      <p className="text-foreground font-medium">{profileData.firstName}</p>
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-blue-600" />
                    </div>
                    Last Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                      className="h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  ) : (
                    <div className="h-9 flex items-center px-3 bg-gray-50 rounded-lg border text-sm">
                      <p className="text-foreground font-medium">{profileData.lastName}</p>
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Phone className="w-3 h-3 text-green-600" />
                    </div>
                    Phone Number
                  </Label>
                  <div className="h-9 flex items-center px-3 bg-gray-50 rounded-lg border text-sm">
                    <p className="text-foreground font-medium">{profileData.phone}</p>
                  </div>
                  <p className="text-xs text-gray-500">Phone number cannot be changed</p>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <Mail className="w-3 h-3 text-purple-600" />
                    </div>
                    Email Address
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      className="h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  ) : (
                    <div className="h-9 flex items-center px-3 bg-gray-50 rounded-lg border text-sm">
                      <p className="text-foreground font-medium">{profileData.email}</p>
                    </div>
                  )}
                </div>

                {/* Specialty */}
                <div className="space-y-2">
                  <Label htmlFor="specialty" className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <Briefcase className="w-3 h-3 text-orange-600" />
                    </div>
                    Specialty
                  </Label>
                  {isEditing ? (
                    <Input
                      id="specialty"
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleInputChange}
                      placeholder="Enter your specialty (e.g., AC Repair, Plumbing, etc.)"
                      className="h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  ) : (
                    <div className="h-9 flex items-center px-3 bg-gray-50 rounded-lg border text-sm">
                      <p className="text-foreground font-medium">{profileData.specialty || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                {/* Service Categories */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <Briefcase className="w-3 h-3 text-purple-600" />
                    </div>
                    Service Categories
                  </Label>
                  {isEditing ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">Select all the services you can provide (you can choose multiple)</p>
                      <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto border rounded-md p-3">
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
                  ) : (
                    <div className="min-h-[40px] flex items-start px-3 py-2 bg-gray-50 rounded-lg border text-sm">
                      {profileData.serviceCategories && profileData.serviceCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {profileData.serviceCategories.map((category, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {category === 'Other' && profileData.customServiceCategory 
                                ? `${category} (${profileData.customServiceCategory})` 
                                : category}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-foreground font-medium">No service categories selected</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-indigo-600" />
                    </div>
                    Bio
                  </Label>
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself and your experience"
                      rows={3}
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  ) : (
                    <div className="min-h-[60px] flex items-start px-3 py-2 bg-gray-50 rounded-lg border text-sm">
                      <p className="text-foreground font-medium">{profileData.bio || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <LocationIcon className="w-3 h-3 text-orange-600" />
                    </div>
                    Address
                  </Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        name="address.street"
                        value={formData.address.street}
                        onChange={handleInputChange}
                        placeholder="Street address"
                        className="h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleInputChange}
                          placeholder="City"
                          className="h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                        <Input
                          name="address.state"
                          value={formData.address.state}
                          onChange={handleInputChange}
                          placeholder="State"
                          className="h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          name="address.pincode"
                          value={formData.address.pincode}
                          onChange={handleInputChange}
                          placeholder="Pincode"
                          className="h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                        <Input
                          name="address.landmark"
                          value={formData.address.landmark}
                          onChange={handleInputChange}
                          placeholder="Landmark"
                          className="h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="min-h-[60px] flex items-start px-3 py-2 bg-gray-50 rounded-lg border text-sm">
                      <div className="text-foreground font-medium">
                        {profileData.address ? (
                          <div>
                            <p>{profileData.address.street}</p>
                            <p>{profileData.address.city}, {profileData.address.state} - {profileData.address.pincode}</p>
                            {profileData.address.landmark && <p>Near {profileData.address.landmark}</p>}
                          </div>
                        ) : (
                          <p>No address provided</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Locations Card */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <LocationIcon className="w-4 h-4 text-green-600" />
                </div>
                Service Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Add new location form */}
                {isAddingLocation ? (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-blue-800">Add Service Route</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="From (e.g., Thane)"
                          value={newLocation.from}
                          onChange={(e) => setNewLocation(prev => ({ ...prev, from: e.target.value }))}
                          className="h-9 border-blue-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                        <Input
                          placeholder="To (e.g., CST)"
                          value={newLocation.to}
                          onChange={(e) => setNewLocation(prev => ({ ...prev, to: e.target.value }))}
                          className="h-9 border-blue-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAddLocation}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Add Route
                        </Button>
                        <Button
                          onClick={() => {
                            setIsAddingLocation(false);
                            setNewLocation({ from: '', to: '' });
                          }}
                          variant="outline"
                          size="sm"
                          className="border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-3 py-1"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsAddingLocation(true)}
                    variant="outline"
                    size="sm"
                    className="border-green-200 text-green-600 hover:bg-green-50 text-xs px-3 py-1"
                  >
                    <LocationIcon className="w-3 h-3 mr-1" />
                    Add Service Route
                  </Button>
                )}

                {/* Service locations list */}
                {serviceLocations.length > 0 ? (
                  <div className="space-y-2">
                    {serviceLocations.map((location) => (
                      <div key={location._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        {editingLocationId === location._id ? (
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={editingLocation.from}
                                onChange={(e) => setEditingLocation(prev => ({ ...prev, from: e.target.value }))}
                                className="h-8 text-sm"
                              />
                              <Input
                                value={editingLocation.to}
                                onChange={(e) => setEditingLocation(prev => ({ ...prev, to: e.target.value }))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="flex gap-1">
                              <Button
                                onClick={handleUpdateLocation}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                              >
                                <Save className="w-3 h-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                onClick={() => {
                                  setEditingLocationId(null);
                                  setEditingLocation({ from: '', to: '' });
                                }}
                                variant="outline"
                                size="sm"
                                className="border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-2 py-1"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <LocationIcon className="w-3 h-3 text-green-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {location.from} → {location.to}
                              </span>
                              {location.isActive && (
                                <Badge className="bg-green-100 text-green-800 border-green-200 px-1 py-0.5 text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                onClick={() => handleEditLocation(location)}
                                variant="outline"
                                size="sm"
                                className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs px-2 py-1"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                onClick={() => handleRemoveLocation(location._id)}
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-600 hover:bg-red-50 text-xs px-2 py-1"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <LocationIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No service locations added yet</p>
                    <p className="text-xs text-gray-400">Add your service routes to help customers find you</p>
                  </div>
                )}
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

export default VendorProfile;
