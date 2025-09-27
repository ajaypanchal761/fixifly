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

  const [formData, setFormData] = useState({
    title: '',
    order: 0,
    image: null as File | null
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

    try {
      setUploading(true);
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('order', formData.order.toString());
      formDataToSend.append('image', formData.image);

      const response = await adminApiService.makeAuthenticatedRequest(`${API_BASE_URL}/admin/banners`, {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const response = await adminApiService.makeAuthenticatedRequest(`${API_BASE_URL}/admin/banners/${editingBanner._id}`, {
        method: 'PUT',
        body: formDataToSend
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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
              <p className="text-sm text-muted-foreground mt-1">Manage hero section banners</p>
            </div>
            
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
                        className="w-full h-40 object-cover rounded-lg border"
                      />
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

        {/* Banners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {banners.map((banner) => (
            <Card key={banner._id} className="overflow-hidden">
              <div className="relative bg-gray-100">
                <img
                  src={banner.image.url}
                  alt={banner.title}
                  className="w-full h-40 object-cover"
                />
                <Badge 
                  className={`absolute top-1 right-1 text-xs ${
                    banner.isActive ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                >
                  {banner.isActive ? 'Active' : 'Inactive'}
                </Badge>
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

        {banners.length === 0 && (
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
                      className="w-full h-40 object-cover rounded-lg border"
                    />
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
      </main>
    </div>
  );
};

export default AdminBannerManagement;
