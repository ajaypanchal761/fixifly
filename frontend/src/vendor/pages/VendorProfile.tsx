import React, { useState, useEffect, useRef } from 'react';
import { useVendor } from '@/contexts/VendorContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Shield, 
  Star, 
  Edit,
  Camera, 
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import vendorApiService from '@/services/vendorApi';
import reviewService from '@/services/reviewService';
import VendorHeader from '../components/VendorHeader';
import VendorBottomNav from '../components/VendorBottomNav';
import VendorBenefitsModal from '../components/VendorBenefitsModal';
import VendorRatingDisplay from '../../components/VendorRatingDisplay';
import Footer from '../../components/Footer';

const VendorProfile = () => {
  const { vendor, isAuthenticated, updateVendor } = useVendor();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vendorData, setVendorData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [editingRouteIndex, setEditingRouteIndex] = useState<number | null>(null);
  const [newRoute, setNewRoute] = useState({
    from: '',
    to: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [ratingSummary, setRatingSummary] = useState<{ average: number | null; totalReviews: number | null }>({
    average: null,
    totalReviews: null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated && vendor) {
      console.log('Vendor data from context:', vendor);
      setVendorData(vendor);

      // Fetch complete vendor profile data
      const fetchVendorProfile = async () => {
    try {
          setLoading(true);
      const response = await vendorApiService.getVendorProfile();
      if (response.success && response.data) {
            console.log('Complete vendor profile data:', response.data);
            setVendorData(response.data.vendor);
          }
        } catch (error) {
          console.error('Error fetching vendor profile:', error);
          // Keep using context data as fallback
    } finally {
          setLoading(false);
        }
      };
      
      fetchVendorProfile();
    }
  }, [isAuthenticated, vendor]);

  useEffect(() => {
    const vendorId = vendorData?._id || vendorData?.id;
    if (!vendorId) return;

    const fetchRatingSummary = async () => {
      try {
        const response = await reviewService.getVendorRatingStats(vendorId);
        if (response.success && response.data) {
          setRatingSummary({
            average: response.data.averageRating ?? null,
            totalReviews: response.data.totalReviews ?? null
          });
        }
      } catch (error) {
        console.error('Error fetching vendor rating summary:', error);
      }
    };

    fetchRatingSummary();
  }, [vendorData?._id, vendorData?.id]);

  const getStatusBadge = (isApproved: boolean, isActive: boolean, isBlocked: boolean) => {
    if (isBlocked) {
      return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Blocked</Badge>;
    }
    if (!isApproved) {
      return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending Approval</Badge>;
    }
    if (isActive) {
      return <Badge variant="default" className="flex items-center gap-1 bg-green-600 text-xs px-2 py-1"><CheckCircle className="h-3 w-3" />Active</Badge>;
    }
    return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Inactive</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPhone = (phone: string) => {
    if (phone.startsWith('+91')) {
      return `+91 ${phone.slice(3, 8)} ${phone.slice(8)}`;
    } else if (phone.startsWith('91')) {
      return `+91 ${phone.slice(2, 7)} ${phone.slice(7)}`;
    } else {
      return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
  };

  const handleEdit = () => {
    console.log('Vendor data when editing:', vendorData);
    setEditData({
      firstName: vendorData.firstName || '',
      lastName: vendorData.lastName || '',
      fatherName: vendorData.fatherName || '',
      phone: vendorData.phone || '',
      alternatePhone: vendorData.alternatePhone || '',
      homePhone: vendorData.homePhone || '',
      currentAddress: vendorData.currentAddress || '',
      serviceCategories: vendorData.serviceCategories || [],
      experience: vendorData.experience || '',
      specialty: vendorData.specialty || ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
        setIsEditing(false);
    setEditData({});
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Clean phone numbers - remove all non-digit characters
      const cleanedData = { ...editData };
      
      // Remove bio field if it exists
      delete cleanedData.bio;
      
      // Ensure required fields are not empty
      if (!cleanedData.fatherName || cleanedData.fatherName.trim() === '') {
      toast({
          title: "Validation Error",
          description: "Father's name is required.",
        variant: "destructive",
      });
        setSaving(false);
      return;
    }

      if (!cleanedData.alternatePhone || cleanedData.alternatePhone.trim() === '') {
      toast({
          title: "Validation Error",
          description: "Alternate phone number is required.",
        variant: "destructive",
      });
        setSaving(false);
      return;
    }

      if (!cleanedData.currentAddress || cleanedData.currentAddress.trim() === '') {
        toast({
          title: "Validation Error",
          description: "Current address is required.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      
      if (!cleanedData.homePhone || cleanedData.homePhone.trim() === '') {
        toast({
          title: "Validation Error",
          description: "Home phone number is required.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      
      if (!cleanedData.serviceCategories || cleanedData.serviceCategories.length === 0) {
        toast({
          title: "Validation Error",
          description: "At least one service category is required.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      if (cleanedData.phone) {
        cleanedData.phone = cleanedData.phone.replace(/\D/g, '');
        if (cleanedData.phone.length !== 10) {
        toast({
            title: "Validation Error",
            description: "Primary phone number must be exactly 10 digits.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
      }
      if (cleanedData.alternatePhone) {
        cleanedData.alternatePhone = cleanedData.alternatePhone.replace(/\D/g, '');
        if (cleanedData.alternatePhone.length !== 10) {
      toast({
            title: "Validation Error",
            description: "Alternate phone number must be exactly 10 digits.",
            variant: "destructive",
          });
          setSaving(false);
      return;
    }
      }
      if (cleanedData.homePhone) {
        cleanedData.homePhone = cleanedData.homePhone.replace(/\D/g, '');
        if (cleanedData.homePhone.length !== 10) {
        toast({
            title: "Validation Error",
            description: "Home phone number must be exactly 10 digits.",
            variant: "destructive",
          });
          setSaving(false);
      return;
    }
      }
      
      console.log('Original edit data:', editData);
      console.log('Sending cleaned data:', cleanedData);
      
      const response = await vendorApiService.updateVendorProfile(cleanedData);
      if (response.success) {
        setVendorData(response.data.vendor);
        
        // Update the vendor context so sidebar also gets updated
        await updateVendor(response.data.vendor);
        
        setIsEditing(false);
        setEditData({});
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
      } else {
        console.log('API response error:', response);
        console.log('Specific validation errors:', response.error);
        const errorMessage = response.error || response.message || "Failed to update profile. Please try again.";
      toast({
          title: "Update Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      console.error('Full error object:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response errors:', error.response?.data?.errors);
      
      // Try to extract error details from the error object
      let errorMessage = "Failed to update profile. Please try again.";
      if (error.response && error.response.data) {
        console.log('Error response data:', error.response.data);
        console.log('Errors array:', error.response.data.errors);
        console.log('Errors array length:', error.response.data.errors?.length);
        if (error.response.data.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
          console.log('First error:', error.response.data.errors[0]);
          errorMessage = error.response.data.errors.join(', ');
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditData(prev => ({
          ...prev,
      [field]: value
    }));
  };

  const handleAddRoute = () => {
    setEditingRouteIndex(null);
    setNewRoute({ from: '', to: '' });
    setShowAddRoute(true);
  };

  const handleEditRoute = (index: number) => {
    const route = vendorData.serviceLocations[index];
    setEditingRouteIndex(index);
    setNewRoute({
      from: route.from || '',
      to: route.to || ''
    });
    setShowAddRoute(true);
  };

  const handleDeleteRoute = async (index: number) => {
    try {
      const updatedServiceLocations = vendorData.serviceLocations.filter((_: any, i: number) => i !== index);
      
      const response = await vendorApiService.updateVendorProfile({
        serviceLocations: updatedServiceLocations
      });

      if (response.success) {
        setVendorData(response.data.vendor);
        
        // Update the vendor context so sidebar also gets updated
        await updateVendor(response.data.vendor);
        
        toast({
          title: "Route Deleted",
          description: "Service route has been deleted successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete service route. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      toast({
        title: "Error",
        description: "Failed to delete service route. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRouteInputChange = (field: string, value: string) => {
    setNewRoute(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveRoute = async () => {
    try {
      // Validate required fields
      if (!newRoute.from || !newRoute.to) {
        toast({
          title: "Validation Error",
          description: "Please fill in both 'From' and 'To' locations.",
          variant: "destructive",
        });
        return;
      }

      // Add or update route in vendor data
      let updatedServiceLocations;
      if (editingRouteIndex !== null) {
        // Editing existing route
        updatedServiceLocations = [...(vendorData.serviceLocations || [])];
        updatedServiceLocations[editingRouteIndex] = {
          name: `${newRoute.from} to ${newRoute.to}`,
          from: newRoute.from,
          to: newRoute.to
        };
      } else {
        // Adding new route
        updatedServiceLocations = [
          ...(vendorData.serviceLocations || []),
          {
            name: `${newRoute.from} to ${newRoute.to}`,
            from: newRoute.from,
            to: newRoute.to
          }
        ];
      }

      // Update vendor profile with new route
      const response = await vendorApiService.updateVendorProfile({
        serviceLocations: updatedServiceLocations
      });

      if (response.success) {
        setVendorData(response.data.vendor);
        
        // Update the vendor context so sidebar also gets updated
        await updateVendor(response.data.vendor);
        
        setNewRoute({
          from: '',
          to: ''
        });
        setEditingRouteIndex(null);
        setShowAddRoute(false);
        toast({
          title: editingRouteIndex !== null ? "Route Updated" : "Route Added",
          description: editingRouteIndex !== null ? "Service route has been updated successfully." : "Service route has been added successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add service route. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding route:', error);
      toast({
        title: "Error",
        description: "Failed to add service route. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelRoute = () => {
    setNewRoute({
      from: '',
      to: ''
    });
    setEditingRouteIndex(null);
    setShowAddRoute(false);
  };

  const handleImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, or WebP image",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingImage(true);
      
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('profileImage', file);

      // Upload the image using the vendor API service
      const response = await vendorApiService.uploadProfileImage(formData);
      
      if (response.success) {
        // Add cache-busting parameter to the image URL
        const imageUrlWithCacheBust = `${response.data.profileImage}?t=${Date.now()}`;
        
        // Update the vendor data with the new image URL
        setVendorData((prev: any) => ({
          ...prev,
          profileImage: imageUrlWithCacheBust
        }));
        
        // Update the vendor context so sidebar also gets updated
        console.log('Updating vendor context with new profile image:', imageUrlWithCacheBust);
        
        await updateVendor({
          profileImage: imageUrlWithCacheBust
        });
        console.log('Vendor context updated successfully');
        
        toast({
          title: "Image Updated",
          description: "Your profile image has been updated successfully.",
        });
      } else {
        toast({
          title: "Upload Failed",
          description: response.message || "Failed to upload image. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isAuthenticated) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to view your profile</h2>
            <p className="text-gray-600">You need to be logged in to access your vendor profile.</p>
          </div>
                  </div>
        <div className="md:hidden">
          <Footer />
          <VendorBottomNav />
                  </div>
                </div>
    );
  }

  if (loading || !vendorData) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <VendorHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading vendor profile...</p>
                  </div>
                  </div>
        <div className="md:hidden">
          <Footer />
          <VendorBottomNav />
                </div>
                  </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 md:pb-0 pt-16 md:pt-0 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
                  <div>
              <h1 className="text-3xl font-bold text-gray-900">Vendor Profile</h1>
                  </div>
            <div className="flex gap-2">
                {!isEditing ? (
                <Button onClick={handleEdit} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                  </Button>
                ) : (
                <div className="flex gap-2">
                    <Button 
                      onClick={handleSave} 
                    disabled={saving}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                    {saving ? (
                        <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                        <CheckCircle className="h-4 w-4" />
                        Save Changes
                        </>
                      )}
                    </Button>
                  <Button 
                    onClick={handleCancel} 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel
                    </Button>
                  </div>
                )}
              </div>
          </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="relative inline-block">
                  {vendorData.profileImage ? (
                    <img
                      src={vendorData.profileImage}
                        alt="Profile"
                      className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
                      />
                    ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mx-auto border-4 border-white shadow-lg">
                      <User className="h-16 w-16 text-gray-400" />
                  </div>
                  )}
                      <Button
                        size="sm"
                    className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                        variant="secondary"
                        onClick={handleImageUpload}
                        disabled={uploadingImage}
                      >
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                      </Button>
                    </div>
                <CardTitle className="mt-4">{vendorData.fullName}</CardTitle>
                <CardDescription>Vendor ID: {vendorData.vendorId}</CardDescription>
                <div className="mt-2 flex justify-center">
                  {getStatusBadge(vendorData.isApproved, vendorData.isActive, vendorData.isBlocked)}
                </div>
              </CardHeader>
              {/* Hidden file input for image upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">
                      {(() => {
                        const averageRating = ratingSummary.average ?? vendorData.rating?.average ?? 0;
                        const totalReviews =
                          ratingSummary.totalReviews ??
                          vendorData.rating?.totalReviews ??
                          vendorData.rating?.count ??
                          0;

                        return `Rating: ${averageRating.toFixed(1)}/5 (${totalReviews} reviews)`;
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">
                      Joined: {formatDate(vendorData.stats?.joinedDate || new Date().toISOString())}
                    </span>
              </div>
                    </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your basic personal details and identification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">First Name</label>
                  {isEditing ? (
                    <Input
                        value={editData.firstName || ''}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="mt-1"
                    />
                  ) : (
                      <p className="text-lg font-semibold">{vendorData.firstName}</p>
                  )}
                </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Name</label>
                  {isEditing ? (
                    <Input
                        value={editData.lastName || ''}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="mt-1"
                    />
                  ) : (
                      <p className="text-lg font-semibold">{vendorData.lastName}</p>
                    )}
                    </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Father's Name</label>
                    {isEditing ? (
                      <Input
                        value={editData.fatherName || ''}
                        onChange={(e) => handleInputChange('fatherName', e.target.value)}
                        className="mt-1"
                        placeholder="Enter father's name"
                      />
                    ) : (
                      <p className="text-lg font-semibold">{vendorData.fatherName || 'Not provided'}</p>
                  )}
                </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {vendorData.email}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                    </div>
                  </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>Your phone numbers and contact details</CardDescription>
            </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Primary Phone</label>
                  {isEditing ? (
                    <Input
                        value={editData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="mt-1"
                        placeholder="Enter primary phone number"
                    />
                  ) : (
                      <p className="text-lg font-semibold flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {formatPhone(vendorData.phone)}
                      </p>
                  )}
                </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Alternate Phone</label>
                  {isEditing ? (
                    <Input
                        value={editData.alternatePhone || ''}
                        onChange={(e) => handleInputChange('alternatePhone', e.target.value)}
                        className="mt-1"
                        placeholder="Enter alternate phone number"
                    />
                  ) : (
                      <p className="text-lg font-semibold flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {vendorData.alternatePhone ? formatPhone(vendorData.alternatePhone) : 'Not provided'}
                      </p>
                  )}
                </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Home Phone</label>
                  {isEditing ? (
                          <Input
                        value={editData.homePhone || ''}
                        onChange={(e) => handleInputChange('homePhone', e.target.value)}
                        className="mt-1"
                        placeholder="Enter home phone number"
                    />
                  ) : (
                      <p className="text-lg font-semibold flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {vendorData.homePhone ? formatPhone(vendorData.homePhone) : 'Not provided'}
                      </p>
                      )}
                    </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </CardTitle>
                <CardDescription>Your current residential address</CardDescription>
            </CardHeader>
              <CardContent>
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Address</label>
                  {isEditing ? (
                    <Textarea
                      value={editData.currentAddress || ''}
                      onChange={(e) => handleInputChange('currentAddress', e.target.value)}
                      className="mt-2"
                      placeholder="Enter your current full address"
                      rows={3}
                    />
                  ) : (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                      <p className="text-lg font-semibold">{vendorData.currentAddress || 'Not provided'}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Service Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Service Information
                </CardTitle>
                <CardDescription>Your professional service categories and experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Service Categories</label>
                  {isEditing ? (
                    <div className="mt-2 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[
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
                        ].map((category) => (
                          <label key={category} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editData.serviceCategories?.includes(category) || false}
                              onChange={(e) => {
                                const currentCategories = editData.serviceCategories || [];
                                if (e.target.checked) {
                                  handleInputChange('serviceCategories', [...currentCategories, category]);
                                } else {
                                  handleInputChange('serviceCategories', currentCategories.filter(c => c !== category));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {vendorData.serviceCategories?.map((category: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-sm">{category}</Badge>
                      ))}
                          </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Experience Level</label>
                  {isEditing ? (
                    <select
                      value={editData.experience || ''}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select experience level</option>
                      <option value="Less than 1 year">Less than 1 year</option>
                      <option value="1-2 years">1-2 years</option>
                      <option value="3-5 years">3-5 years</option>
                      <option value="5-10 years">5-10 years</option>
                      <option value="More than 10 years">More than 10 years</option>
                    </select>
                  ) : (
                    <p className="text-lg font-semibold mt-1">{vendorData.experience || 'Not specified'}</p>
                        )}
                      </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Specialty</label>
                  {isEditing ? (
                    <Input
                      value={editData.specialty || ''}
                      onChange={(e) => handleInputChange('specialty', e.target.value)}
                      className="mt-1"
                      placeholder="Enter your specialty"
                    />
                  ) : (
                    <p className="text-lg font-semibold mt-1">{vendorData.specialty || 'Not specified'}</p>
                  )}
              </div>
            </CardContent>
          </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents
              </CardTitle>
                <CardDescription>Your uploaded documents and verification status</CardDescription>
            </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Aadhaar Front */}
                    <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">Aadhaar Front</label>
                    {vendorData.documents?.aadhaarFront ? (
                      <div className="border rounded-lg p-4 text-center">
                        <img
                          src={vendorData.documents.aadhaarFront}
                          alt="Aadhaar Front"
                          className="w-full h-32 object-cover rounded cursor-pointer"
                          onClick={() => window.open(vendorData.documents.aadhaarFront, '_blank')}
                        />
                        <p className="text-sm text-green-600 mt-2 flex items-center justify-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Uploaded
                        </p>
                  </div>
                ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Not uploaded</p>
                      </div>
                    )}
                  </div>

                  {/* Aadhaar Back */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">Aadhaar Back</label>
                    {vendorData.documents?.aadhaarBack ? (
                      <div className="border rounded-lg p-4 text-center">
                        <img
                          src={vendorData.documents.aadhaarBack}
                          alt="Aadhaar Back"
                          className="w-full h-32 object-cover rounded cursor-pointer"
                          onClick={() => window.open(vendorData.documents.aadhaarBack, '_blank')}
                        />
                        <p className="text-sm text-green-600 mt-2 flex items-center justify-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Uploaded
                        </p>
                          </div>
                        ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Not uploaded</p>
                              </div>
                              )}
                            </div>
              </div>
            </CardContent>
          </Card>

            {/* Service Routes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Service Routes
                </CardTitle>
                <CardDescription>Your service coverage areas and routes</CardDescription>
              </CardHeader>
              <CardContent>
                {vendorData.serviceLocations && vendorData.serviceLocations.length > 0 ? (
                  <div className="space-y-3">
                    {vendorData.serviceLocations.map((location: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">{location.name || `Route ${index + 1}`}</p>
                            {location.from && location.to ? (
                              <p className="text-sm text-gray-600">
                                {location.from} → {location.to}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-600">
                                {location.city}, {location.state} - {location.pincode}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Route
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditRoute(index)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteRoute(index)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4">
                      <Button onClick={handleAddRoute} variant="outline" className="w-full border-dashed border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50">
                        <MapPin className="h-4 w-4 mr-2" />
                        Add Another Route
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Service Routes</h3>
                    <p className="text-gray-600 mb-4">You haven't added any service routes yet.</p>
                    <Button onClick={handleAddRoute} className="bg-blue-600 hover:bg-blue-700">
                      <MapPin className="h-4 w-4 mr-2" />
                      Add Service Route
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </main>
      <div className="md:hidden">
        <Footer />
        <VendorBottomNav />
      </div>

      {/* Add Service Route Modal */}
      <Dialog open={showAddRoute} onOpenChange={setShowAddRoute}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRouteIndex !== null ? 'Edit Service Route' : 'Add Service Route'}</DialogTitle>
            <DialogDescription>
              {editingRouteIndex !== null ? 'Update your service route details.' : 'Add a new service route to expand your coverage area.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">From *</label>
              <Input
                value={newRoute.from}
                onChange={(e) => handleRouteInputChange('from', e.target.value)}
                placeholder="e.g., Connaught Place, Delhi"
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">To *</label>
              <Input
                value={newRoute.to}
                onChange={(e) => handleRouteInputChange('to', e.target.value)}
                placeholder="e.g., Karol Bagh, Delhi"
                className="mt-1"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveRoute} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                {editingRouteIndex !== null ? 'Update Route' : 'Add Route'}
              </Button>
              <Button onClick={handleCancelRoute} variant="outline" className="flex-1">
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Your Benefits Button */}
      <div className="px-4 pb-6 -mt-24 md:hidden">
        <VendorBenefitsModal hasInitialDeposit={vendorData?.wallet?.hasInitialDeposit || false}>
          <Button 
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl shadow-lg"
            size="lg"
          >
            🎁 View Your Benefits
          </Button>
        </VendorBenefitsModal>
      </div>

      {/* Customer Ratings - Below View Your Benefits Button */}
      <div className="px-4 pb-24 md:hidden">
        
        {(vendorData?._id || vendorData?.id) && (
          <VendorRatingDisplay 
            vendorId={vendorData._id || vendorData.id} 
            vendorName={`${vendorData.firstName} ${vendorData.lastName}`}
          />
        )}
        
        {/* Show message if no vendor data */}
        {!vendorData?._id && !vendorData?.id && (
          <div className="text-center py-4 text-gray-500">
            <p>Loading vendor data...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorProfile;