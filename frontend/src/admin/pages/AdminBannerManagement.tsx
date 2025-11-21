import React, { useState, useEffect } from 'react';
import AdminHeader from '../components/AdminHeader';
import { 
  Image, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Upload,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import adminApiService from '@/services/adminApi';

interface Banner {
  _id: string;
  title: string;
  image: {
    public_id: string;
    url: string;
  };
  isActive: boolean;
  order: number;
  targetAudience: 'user' | 'vendor';
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const AdminBannerManagement = () => {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddBannerOpen, setIsAddBannerOpen] = useState(false);
  const [isEditBannerOpen, setIsEditBannerOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  // Debug modal state
  console.log('Modal state:', { isImagePreviewOpen, previewImageUrl });

  const [formData, setFormData] = useState({
    title: '',
    order: 0,
    targetAudience: 'user' as 'user' | 'vendor',
    image: null as File | null
  });

  const [audienceFilter, setAudienceFilter] = useState<'all' | 'user' | 'vendor'>('all');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Filter banners based on target audience
  const filteredBanners = banners.filter(banner => {
    if (audienceFilter === 'all') return true;
    return banner.targetAudience === audienceFilter;
  });

  const userBanners = banners.filter(banner => banner.targetAudience === 'user');
  const vendorBanners = banners.filter(banner => banner.targetAudience === 'vendor');

  // Fetch banners
  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await adminApiService.makeAuthenticatedRequest(`${API_BASE_URL}/admin/banners`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setBanners(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch banners');
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Clear form
  const clearForm = () => {
    setFormData({
      title: '',
      order: 0,
      targetAudience: 'user',
      image: null
    });
    setPreviewUrl(null);
  };

  // Add banner
  const handleAddBanner = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a banner title",
        variant: "destructive"
      });
      return;
    }

    if (!formData.image) {
      toast({
        title: "Error",
        description: "Please select an image",
        variant: "destructive"
      });
      return;
    }

    // Validate file
    if (formData.image.size === 0) {
      toast({
        title: "Error",
        description: "Selected file is empty",
        variant: "destructive"
      });
      return;
    }

    if (formData.image.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Error",
        description: "File size too large. Maximum size is 10MB",
        variant: "destructive"
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(formData.image.type)) {
      toast({
        title: "Error",
        description: "Invalid file type. Only JPEG, PNG, and WebP images are allowed",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('order', formData.order.toString());
      formDataToSend.append('targetAudience', formData.targetAudience);
      formDataToSend.append('image', formData.image);

      console.log('FormData contents:', {
        title: formData.title,
        order: formData.order,
        imageFile: formData.image ? {
          name: formData.image.name,
          size: formData.image.size,
          type: formData.image.type
        } : null
      });

      // Debug FormData entries
      console.log('FormData entries:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await adminApiService.makeAuthenticatedRequest(`${API_BASE_URL}/admin/banners`, {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        let errorData = {};
        let responseText = '';
        
        try {
          responseText = await response.text();
          errorData = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON:', jsonError);
          errorData = { message: `Server error: ${response.status} ${response.statusText}` };
        }
        
        console.error('Banner upload error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          responseText
        });
        
        const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Banner upload response:', data);
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Banner added successfully",
          variant: "default"
        });
        clearForm();
        setIsAddBannerOpen(false);
        fetchBanners();
      } else {
        throw new Error(data.message || 'Failed to add banner');
      }
    } catch (error) {
      console.error('Error adding banner:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to add banner',
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Edit banner
  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      order: banner.order,
      targetAudience: banner.targetAudience,
      image: null
    });
    setPreviewUrl(banner.image.url);
    setIsEditBannerOpen(true);
  };

  // Update banner
  const handleUpdateBanner = async () => {
    if (!editingBanner) return;

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a banner title",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('order', formData.order.toString());
      formDataToSend.append('targetAudience', formData.targetAudience);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      console.log('Update FormData contents:', {
        title: formData.title,
        order: formData.order,
        hasNewImage: !!formData.image,
        imageFile: formData.image ? {
          name: formData.image.name,
          size: formData.image.size,
          type: formData.image.type
        } : null
      });

      const response = await adminApiService.makeAuthenticatedRequest(`${API_BASE_URL}/admin/banners/${editingBanner._id}`, {
        method: 'PUT',
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Banner update error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Banner update response:', data);
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Banner updated successfully",
          variant: "default"
        });
        clearForm();
        setIsEditBannerOpen(false);
        setEditingBanner(null);
        fetchBanners();
      } else {
        throw new Error(data.message || 'Failed to update banner');
      }
    } catch (error) {
      console.error('Error updating banner:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update banner',
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Delete banner
  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await adminApiService.makeAuthenticatedRequest(`${API_BASE_URL}/admin/banners/${bannerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Banner deleted successfully",
          variant: "default"
        });
        fetchBanners();
      } else {
        throw new Error(data.message || 'Failed to delete banner');
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete banner',
        variant: "destructive"
      });
    }
  };

  // Open image preview
  const handleImagePreview = (imageUrl: string) => {
    console.log('Opening image preview for URL:', imageUrl);
    setPreviewImageUrl(imageUrl);
    setIsImagePreviewOpen(true);
    
    // Force a small delay to ensure state updates
    setTimeout(() => {
      console.log('Modal should be open now:', isImagePreviewOpen);
    }, 100);
  };

  // Toggle banner status
  const handleToggleStatus = async (bannerId: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await adminApiService.makeAuthenticatedRequest(`${API_BASE_URL}/admin/banners/${bannerId}/toggle`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
          variant: "default"
        });
        fetchBanners();
      } else {
        throw new Error(data.message || 'Failed to toggle banner status');
      }
    } catch (error) {
      console.error('Error toggling banner status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to toggle banner status',
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading banners...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="container mx-auto px-4 py-6 pt-32 pl-72">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Banner Management</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage hero section banners for users and vendors</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={audienceFilter} onValueChange={(value: 'all' | 'user' | 'vendor') => setAudienceFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Banners</SelectItem>
                  <SelectItem value="user">User Banners</SelectItem>
                  <SelectItem value="vendor">Vendor Banners</SelectItem>
                </SelectContent>
              </Select>
            
            <Dialog open={isAddBannerOpen} onOpenChange={setIsAddBannerOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" size="sm">
                  <Plus className="w-3 h-3" />
                  Add Banner
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] mt-12">
              <DialogHeader>
                <DialogTitle className="text-lg">Add New Banner</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="title" className="text-sm">Banner Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter banner title"
                    className="text-sm"
                  />
                </div>
                
                <div>
                  <Label htmlFor="order" className="text-sm">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="targetAudience" className="text-sm">Target Audience</Label>
                  <Select value={formData.targetAudience} onValueChange={(value: 'user' | 'vendor') => setFormData(prev => ({ ...prev, targetAudience: value }))}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select target audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User Banners</SelectItem>
                      <SelectItem value="vendor">Vendor Banners</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="image" className="text-sm">Banner Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer text-sm"
                  />
                  {previewUrl && (
                    <div className="mt-3">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-40 object-contain rounded-lg border cursor-pointer hover:opacity-90 transition-opacity bg-gray-50"
                        onClick={() => handleImagePreview(previewUrl)}
                      />
                      <p className="text-xs text-gray-500 mt-1">Click image to view full size</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddBannerOpen(false)} size="sm" className="text-xs">
                    Cancel
                  </Button>
                  <Button onClick={handleAddBanner} disabled={uploading} size="sm" className="text-xs">
                    {uploading ? 'Adding...' : 'Add Banner'}
                  </Button>
                </div>
              </div>
            </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>

        {/* Banner Summary */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Banners</p>
                  <p className="text-2xl font-bold text-gray-900">{banners.length}</p>
                </div>
                <Image className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">User Banners</p>
                  <p className="text-2xl font-bold text-blue-600">{userBanners.length}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-bold">U</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vendor Banners</p>
                  <p className="text-2xl font-bold text-purple-600">{vendorBanners.length}</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm font-bold">V</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Banners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredBanners.map((banner) => (
            <Card key={banner._id} className="overflow-hidden">
              <div className="relative bg-gray-100">
                <img
                  src={banner.image.url}
                  alt={banner.title}
                  className="w-full h-40 object-contain"
                />
                <div className="absolute top-1 right-1 flex flex-col gap-1">
                  <Badge 
                    className={`text-xs ${
                      banner.isActive ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                  >
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge 
                    className={`text-xs ${
                      banner.targetAudience === 'user' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}
                  >
                    {banner.targetAudience === 'user' ? 'User' : 'Vendor'}
                  </Badge>
                </div>
              </div>
              
              <CardHeader className="p-2">
                <CardTitle className="text-xs">{banner.title}</CardTitle>
                <div className="text-xs text-muted-foreground">
                  <p>Order: {banner.order}</p>
                  <p>Created: {new Date(banner.createdAt).toLocaleDateString()}</p>
                </div>
              </CardHeader>
              
              <CardContent className="p-2 pt-0">
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditBanner(banner)}
                    className="h-7 w-7 p-0"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(banner._id)}
                    className="h-7 w-7 p-0"
                  >
                    {banner.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteBanner(banner._id)}
                    className="h-7 w-7 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBanners.length === 0 && (
          <div className="text-center py-8">
            <Image className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm font-semibold mb-1">No banners found</h3>
            <p className="text-xs text-muted-foreground mb-3">Get started by adding your first banner</p>
          </div>
        )}


        {/* Edit Banner Dialog */}
        <Dialog open={isEditBannerOpen} onOpenChange={setIsEditBannerOpen}>
          <DialogContent className="sm:max-w-[500px] mt-12">
            <DialogHeader>
              <DialogTitle className="text-lg">Edit Banner</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="edit-title" className="text-sm">Banner Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter banner title"
                  className="text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-order" className="text-sm">Display Order</Label>
                <Input
                  id="edit-order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="edit-targetAudience" className="text-sm">Target Audience</Label>
                <Select value={formData.targetAudience} onValueChange={(value: 'user' | 'vendor') => setFormData(prev => ({ ...prev, targetAudience: value }))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User Banners</SelectItem>
                    <SelectItem value="vendor">Vendor Banners</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-image" className="text-sm">Banner Image (Optional - leave empty to keep current)</Label>
                <Input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer text-sm"
                />
                {previewUrl && (
                  <div className="mt-3">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-40 object-contain rounded-lg border cursor-pointer hover:opacity-90 transition-opacity bg-gray-50"
                      onClick={() => {
                        console.log('Image clicked, previewUrl:', previewUrl);
                        handleImagePreview(previewUrl);
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Click image to view full size</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditBannerOpen(false)} size="sm" className="text-xs">
                  Cancel
                </Button>
                <Button onClick={handleUpdateBanner} disabled={uploading} size="sm" className="text-xs">
                  {uploading ? 'Updating...' : 'Update Banner'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Preview Modal */}
        <Dialog open={isImagePreviewOpen} onOpenChange={(open) => {
          console.log('Dialog onOpenChange called with:', open);
          setIsImagePreviewOpen(open);
        }}>
          <DialogContent className="sm:max-w-[60vw] sm:max-h-[50vh] mt-12 p-3">
            <DialogHeader>
              <DialogTitle className="text-sm">Banner Preview</DialogTitle>
            </DialogHeader>
            <div className="relative flex justify-center items-center bg-gray-50 rounded-lg p-3">
              <Button
                variant="outline"
                size="sm"
                className="absolute top-1 right-1 z-10 bg-white/90 hover:bg-white h-6 w-6 p-0"
                onClick={() => {
                  console.log('Closing image preview modal');
                  setIsImagePreviewOpen(false);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
              {previewImageUrl && (
                <img
                  src={previewImageUrl}
                  alt="Banner preview"
                  className="max-w-full max-h-[35vh] object-contain rounded shadow-sm"
                  onLoad={() => console.log('Preview image loaded successfully')}
                  onError={(e) => console.error('Preview image failed to load:', e)}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminBannerManagement;
