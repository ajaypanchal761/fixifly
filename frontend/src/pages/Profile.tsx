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
  const { user: authUser, logout, updateUser, isAuthenticated } = useAuth();
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
  }, [isAuthenticated]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem('accessToken');
      if (!token || token === 'guest_token') {
        // Handle guest profile from AuthContext/localStorage
        if (authUser) {
          setUserProfile(authUser as UserProfile);
          setFormData({
            name: authUser.name || '',
            email: authUser.email || '',
            address: {
              street: authUser.address?.street || '',
              city: authUser.address?.city || '',
              state: authUser.address?.state || '',
              pincode: authUser.address?.pincode || '',
              landmark: authUser.address?.landmark || ''
            }
          });
        } else {
          // Set a default empty profile for new guests
          setUserProfile({
            id: 'guest',
            name: 'Guest User',
            email: '',
            phone: '',
            role: 'user',
            isPhoneVerified: false,
            isEmailVerified: false,
          });
        }
        setIsLoading(false);
        return;
      }

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
        console.log('Updating AuthContext with user data:', response.data.user);
        console.log('Address data being updated:', response.data.user.address);
        updateUser({
          name: response.data.user.name,
          email: response.data.user.email,
          address: response.data.user.address
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
      <div className="min-h-screen bg-gray-50 pt-16 pb-8 flex items-center justify-center overflow-y-auto">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-8 flex items-center justify-center overflow-y-auto">
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
    <div className="min-h-screen bg-gray-50 pt-16 sm:pt-16 pb-20 sm:pb-8 overflow-y-auto">
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

          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4">
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-4">Personal Information</h3>

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
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isEditing
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
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isEditing
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
                  <p className="text-xs text-gray-500 mt-1">Phone number cannot be changed</p>
                </div>
              </div>

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
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isEditing
                      ? 'border-gray-300 bg-white'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                      }`}
                  />
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default Profile;
