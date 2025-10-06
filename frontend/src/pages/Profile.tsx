import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { 
  User, Phone, MapPin, Building, Map, Navigation, ArrowLeft, Camera, Mail, Hash
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/api';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  profileImage?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark: string;
  };
}

const Profile = () => {
  const navigate = useNavigate();
  const { user: authUser, logout, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile'>('profile');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      landmark: ''
    }
  });


  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getUserProfile();
      
      if (response.success && response.data) {
        const user = response.data.user;
        setUserProfile(user);
        setFormData({
          name: user.name || '',
          email: user.email || '',
          address: {
            street: user.address?.street || '',
            city: user.address?.city || '',
            state: user.address?.state || '',
            pincode: user.address?.pincode || '',
            landmark: user.address?.landmark || ''
          }
        });
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      
      const response = await apiService.uploadProfileImage(formData);
      
      if (response.success) {
        setUserProfile(prev => prev ? {
          ...prev,
          profileImage: response.data.profileImage
        } : null);
        
        // Update AuthContext with new profile image
        updateUser({ profileImage: response.data.profileImage });
        
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
      const response = await apiService.deleteProfileImage();
      
      if (response.success) {
        setUserProfile(prev => prev ? {
          ...prev,
          profileImage: undefined
        } : null);
        
        // Update AuthContext to remove profile image
        updateUser({ profileImage: undefined });
        
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

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      
      const response = await apiService.updateUserProfile(formData);
      
      if (response.success) {
        setUserProfile(response.data.user);
        
        // Update AuthContext with updated user data
        updateUser({
          name: response.data.user.name,
          email: response.data.user.email
        });
        
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Profile updated successfully"
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




  const handleCancel = () => {
    if (userProfile) {
    setFormData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        address: {
          street: userProfile.address?.street || '',
          city: userProfile.address?.city || '',
          state: userProfile.address?.state || '',
          pincode: userProfile.address?.pincode || '',
          landmark: userProfile.address?.landmark || ''
        }
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-8 flex items-center justify-center overflow-y-auto">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-8 flex items-center justify-center overflow-y-auto">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Failed to load profile</p>
          <Button onClick={loadUserProfile} variant="contained">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-20 pb-20 sm:pb-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 min-h-full">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => navigate('/')}
                sx={{
                  minWidth: 'auto',
                  padding: '6px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  '&:hover': {
                    backgroundColor: '#e5e7eb',
                  }
                }}
              >
                <ArrowLeft size={18} />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Profile</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Manage your account settings</p>
              </div>
            </div>
            <Button
              variant={isEditing ? "outlined" : "contained"}
              onClick={() => setIsEditing(!isEditing)}
              size="small"
              sx={{
                backgroundColor: isEditing ? 'transparent' : '#3b82f6',
                color: isEditing ? '#3b82f6' : 'white',
                borderColor: '#3b82f6',
                fontSize: '0.875rem',
                padding: '6px 12px',
                '&:hover': {
                  backgroundColor: isEditing ? '#f3f4f6' : '#2563eb',
                }
              }}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </div>

        {/* Profile Image Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 border-3 border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center mb-3 sm:mb-4 overflow-hidden">
                {userProfile.profileImage ? (
                  <img 
                    src={userProfile.profileImage}
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="profile-image-input"
                disabled={isUploadingImage}
              />
              <Button
                component="label"
                htmlFor="profile-image-input"
                disabled={isUploadingImage}
                sx={{
                  position: 'absolute',
                  bottom: '6px',
                  right: '6px',
                  minWidth: 'auto',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: 0,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#2563eb',
                  },
                  '&:disabled': {
                    backgroundColor: '#9ca3af'
                  }
                }}
              >
                {isUploadingImage ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                <Camera size={16} />
                )}
              </Button>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 text-center">{userProfile.name}</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-2 text-center">{userProfile.email}</p>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm">
              <span className={`px-2 py-1 rounded-full ${
                userProfile.isPhoneVerified 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {userProfile.isPhoneVerified ? 'Phone Verified' : 'Phone Unverified'}
              </span>
            </div>
            
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4">
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Name Field */}
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isEditing 
                      ? 'border-gray-300 bg-white' 
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isEditing 
                      ? 'border-gray-300 bg-white' 
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                />
              </div>
            </div>

            {/* Phone Number Field */}
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                        value={userProfile.phone}
                        disabled
                        className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-600 rounded-md"
                      />
                      <p className="text-xs text-gray-500 mt-1">Phone number cannot be changed here</p>
                    </div>
              </div>
            </div>

                <div className="border-t pt-4 sm:pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Address Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Address Field */}
                    <div className="flex items-center space-x-3 sm:col-span-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address
                </label>
                <input
                  type="text"
                          name="address.street"
                          value={formData.address.street}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isEditing 
                      ? 'border-gray-300 bg-white' 
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                />
              </div>
            </div>

            {/* City Field */}
            <div className="flex items-center space-x-3">
              <Building className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                          name="address.city"
                          value={formData.address.city}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isEditing 
                      ? 'border-gray-300 bg-white' 
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                />
              </div>
            </div>

            {/* State Field */}
            <div className="flex items-center space-x-3">
              <Map className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                          name="address.state"
                          value={formData.address.state}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isEditing 
                      ? 'border-gray-300 bg-white' 
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                />
              </div>
            </div>

            {/* Pincode Field */}
            <div className="flex items-center space-x-3">
              <Hash className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                          name="address.pincode"
                          value={formData.address.pincode}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  maxLength={6}
                  placeholder="Enter 6-digit pincode"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isEditing 
                      ? 'border-gray-300 bg-white' 
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                />
              </div>
            </div>

            {/* Landmark Field */}
            <div className="flex items-center space-x-3">
              <Navigation className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Landmark
                </label>
                <input
                  type="text"
                          name="address.landmark"
                          value={formData.address.landmark}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isEditing 
                      ? 'border-gray-300 bg-white' 
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                />
                      </div>
                    </div>
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6 border-t">
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  className="w-full sm:w-auto"
                  sx={{
                    color: '#6b7280',
                    borderColor: '#d1d5db',
                    '&:hover': {
                      backgroundColor: '#f9fafb',
                      borderColor: '#9ca3af'
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                  sx={{
                    backgroundColor: '#3b82f6',
                    '&:hover': {
                      backgroundColor: '#2563eb'
                    },
                    '&:disabled': {
                      backgroundColor: '#9ca3af'
                    }
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
