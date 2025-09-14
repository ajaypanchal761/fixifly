import React, { useState, useRef } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
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
  Calendar
} from 'lucide-react';
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

interface VendorProfileData {
  name: string;
  phone: string;
  email: string;
  address: string;
  rating: number;
  totalReviews: number;
  profileImage: string | null;
  vendorId: string;
  joinDate: string;
  isVerified: boolean;
}

const VendorProfile = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<VendorProfileData>({
    name: "John Doe",
    phone: "+91 98765 43210",
    email: "john.doe@fixifly.com",
    address: "123 Main Street, Sector 15, Gurgaon, Haryana 122001",
    rating: 4.8,
    totalReviews: 127,
    profileImage: null,
    vendorId: "V001",
    joinDate: "2023-01-15",
    isVerified: true
  });

  const [formData, setFormData] = useState(profileData);
  const [imagePreview, setImagePreview] = useState<string | null>(profileData.profileImage);

  // Show 404 error on desktop
  if (!isMobile) {
    return <NotFound />;
  }

  const handleEdit = () => {
    setIsEditing(true);
    setFormData(profileData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(profileData);
    setImagePreview(profileData.profileImage);
  };

  const handleSave = () => {
    // Validate form data
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "Error",
        description: "Phone number is required",
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

    if (!formData.address.trim()) {
      toast({
        title: "Error",
        description: "Address is required",
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

    // Phone validation (basic)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    setProfileData({
      ...formData,
      profileImage: imagePreview
    });
    setIsEditing(false);

    toast({
      title: "Success",
      description: "Profile updated successfully!",
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      <main className="flex-1 pb-24 pt-20">
        <div className="container mx-auto px-4 py-4">
          {/* Profile Header */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">Vendor <span className="text-2xl font-bold text-gradient mb-1"> Profile</span></h1>         
          </div>

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
                    <Button onClick={handleSave} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1">
                      <Save className="w-3 h-3 mr-1" />
                      Save
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
                    {imagePreview ? (
                      <img
                        src={imagePreview}
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
                      {imagePreview && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-full w-8 h-8 p-0 bg-white shadow-md border border-red-200 hover:bg-red-50"
                          onClick={handleRemoveImage}
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
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-blue-600" />
                    </div>
                    Full Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                      className="h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  ) : (
                    <div className="h-9 flex items-center px-3 bg-gray-50 rounded-lg border text-sm">
                      <p className="text-foreground font-medium">{profileData.name}</p>
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
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                      className="h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  ) : (
                    <div className="h-9 flex items-center px-3 bg-gray-50 rounded-lg border text-sm">
                      <p className="text-foreground font-medium">{profileData.phone}</p>
                    </div>
                  )}
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
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email address"
                      className="h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  ) : (
                    <div className="h-9 flex items-center px-3 bg-gray-50 rounded-lg border text-sm">
                      <p className="text-foreground font-medium">{profileData.email}</p>
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-3 h-3 text-orange-600" />
                    </div>
                    Address
                  </Label>
                  {isEditing ? (
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter your complete address"
                      rows={2}
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  ) : (
                    <div className="min-h-[60px] flex items-start px-3 py-2 bg-gray-50 rounded-lg border text-sm">
                      <p className="text-foreground font-medium">{profileData.address}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rating & Stats Card */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b py-1">
              <CardTitle className="flex items-center gap-1 text-sm">
                <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="w-3 h-3 text-yellow-600" />
                </div>
                Performance & Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="grid grid-cols-2 gap-1 mb-2">
                {/* Rating Card */}
                <div className="text-center p-1 bg-gradient-to-br from-yellow-50 to-orange-50 rounded border border-yellow-200">
                  <div className="flex justify-center mb-1">
                    {renderStars(profileData.rating)}
                  </div>
                  <p className="text-base font-bold text-yellow-600 mb-1">{profileData.rating}</p>
                  <p className="text-xs text-yellow-700 font-medium">
                    {profileData.totalReviews} reviews
                  </p>
                </div>
                
                {/* Vendor ID Card */}
                <div className="text-center p-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded border border-blue-200">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <User className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="text-base font-bold text-blue-600 mb-1">V{profileData.vendorId}</p>
                  <p className="text-xs text-blue-700 font-medium">Vendor ID</p>
                </div>
              </div>
              
              {/* Status Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1">
                {profileData.isVerified && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 px-1 py-0.5 text-xs font-medium">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                <Badge variant="outline" className="border-gray-200 text-gray-700 px-1 py-0.5 text-xs font-medium">
                  <Calendar className="w-3 h-3 mr-1" />
                  Joined {new Date(profileData.joinDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short'
                  })}
                </Badge>
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
