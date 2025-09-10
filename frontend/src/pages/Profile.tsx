import React, { useState } from 'react';
import { Button } from '@mui/material';
import { User, Phone, MapPin, Building, Map, Navigation, ArrowLeft, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: 'John Doe',
    number: '+91 98765 43210',
    address: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    landmark: 'Near Central Mall'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
        setSaveMessage('Image updated! Click Save Profile to save changes.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setSaveMessage('Changes made! Click Save Profile to save changes.');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would typically save to backend
      console.log('Profile saved:', {
        ...formData,
        profileImage: profileImage
      });
      
      setSaveMessage('Profile saved successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
      
    } catch (error) {
      setSaveMessage('Error saving profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      name: 'John Doe',
      number: '+91 98765 43210',
      address: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      landmark: 'Near Central Mall'
    });
    setProfileImage(null);
    setIsEditing(false);
    setSaveMessage(null);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      handleCancel();
    } else {
      setIsEditing(true);
      setSaveMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="bg-blue-50 rounded-lg shadow-sm p-6 -mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => navigate('/')}
                sx={{
                  minWidth: 'auto',
                  padding: '8px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  '&:hover': {
                    backgroundColor: '#e5e7eb',
                  }
                }}
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              </div>
            </div>
            <Button
              variant={isEditing ? "outlined" : "contained"}
              onClick={handleEditToggle}
              sx={{
                backgroundColor: isEditing ? 'transparent' : '#3b82f6',
                color: isEditing ? '#3b82f6' : 'white',
                borderColor: '#3b82f6',
                '&:hover': {
                  backgroundColor: isEditing ? '#f3f4f6' : '#2563eb',
                }
              }}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </div>

        {/* Profile Image Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 -mb-10">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                id="profile-image-input"
              />
              <Button
                component="label"
                htmlFor="profile-image-input"
                sx={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
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
                  }
                }}
              >
                <Camera size={16} />
              </Button>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">John Doe</h2>
            <p className="text-sm text-gray-600">+91 98765 43210</p>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-lg shadow-sm p-6">
          <form className="space-y-6">
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

            {/* Phone Number Field */}
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="number"
                  value={formData.number}
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

            {/* Address Field */}
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
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
                  name="city"
                  value={formData.city}
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
                  name="state"
                  value={formData.state}
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

            {/* Landmark Field */}
            <div className="flex items-center space-x-3">
              <Navigation className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Landmark
                </label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
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

            {/* Save Button (only visible when editing) */}
            {isEditing && (
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outlined"
                  onClick={handleCancel}
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
                  onClick={handleSave}
                  sx={{
                    backgroundColor: '#3b82f6',
                    '&:hover': {
                      backgroundColor: '#2563eb'
                    }
                  }}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </form>
          
          {/* Status Message */}
          {saveMessage && (
            <div className={`text-center py-3 px-4 rounded-lg mb-4 ${
              saveMessage.includes('successfully') 
                ? 'bg-green-100 text-green-800' 
                : saveMessage.includes('Error')
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {saveMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
