import React, { useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import { 
  Package, 
  Plus, 
  Save,
  X,
  ArrowLeft,
  FolderPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

const AdminAddCategory = () => {
  const navigate = useNavigate();

  // Sample product data - in real app this would come from API
  const [products] = useState([
    {
      id: 'P001',
      name: 'iPhone 15 Pro Max',
      category: 'IT Needs',
      image: '/tablet.webp'
    },
    {
      id: 'P002',
      name: 'MacBook Pro M3',
      category: 'Home Appliance',
      image: '/laptop.avif'
    },
    {
      id: 'P003',
      name: 'Samsung Galaxy S24 Ultra',
      category: 'IT Needs',
      image: '/tv.avif'
    }
  ]);

  const [newCategory, setNewCategory] = useState({
    name: '',
    selectedProducts: [] as string[],
    serviceTabs: [] as Array<{
      id: string;
      name: string;
      services: Array<{
        id: string;
        name: string;
        description: string;
        price: string;
        discountPrice: string;
      }>
    }>
  });


  const handleAddServiceTab = () => {
    const newTab = {
      id: `tab_${Date.now()}`,
      name: `Service Tab ${newCategory.serviceTabs.length + 1}`,
      services: []
    };
    setNewCategory(prev => ({
      ...prev,
      serviceTabs: [...prev.serviceTabs, newTab]
    }));
  };

  const handleUpdateServiceTab = (tabId: string, name: string) => {
    setNewCategory(prev => ({
      ...prev,
      serviceTabs: prev.serviceTabs.map(tab =>
        tab.id === tabId ? { ...tab, name } : tab
      )
    }));
  };

  const handleRemoveServiceTab = (tabId: string) => {
    setNewCategory(prev => ({
      ...prev,
      serviceTabs: prev.serviceTabs.filter(tab => tab.id !== tabId)
    }));
  };

  const handleAddServiceItem = (tabId: string) => {
    const newService = {
      id: `service_${Date.now()}`,
      name: '',
      description: '',
      price: '',
      discountPrice: ''
    };
    setNewCategory(prev => ({
      ...prev,
      serviceTabs: prev.serviceTabs.map(tab =>
        tab.id === tabId ? { ...tab, services: [...tab.services, newService] } : tab
      )
    }));
  };

  const handleUpdateServiceItem = (tabId: string, serviceId: string, field: string, value: string) => {
    setNewCategory(prev => ({
      ...prev,
      serviceTabs: prev.serviceTabs.map(tab =>
        tab.id === tabId
          ? {
              ...tab,
              services: tab.services.map(service =>
                service.id === serviceId ? { ...service, [field]: value } : service
              )
            }
          : tab
      )
    }));
  };

  const handleRemoveServiceItem = (tabId: string, serviceId: string) => {
    setNewCategory(prev => ({
      ...prev,
      serviceTabs: prev.serviceTabs.map(tab =>
        tab.id === tabId
          ? { ...tab, services: tab.services.filter(service => service.id !== serviceId) }
          : tab
      )
    }));
  };

  const handleAddCategory = () => {
    // Use the category name from input, or generate a fallback name
    let categoryName = newCategory.name.trim() || 'New Category';
    
    if (!newCategory.name.trim()) {
      // Generate a meaningful fallback name
      if (newCategory.serviceTabs.length > 0) {
        const firstTab = newCategory.serviceTabs[0];
        if (firstTab.name && firstTab.name.trim() !== '') {
          categoryName = firstTab.name;
        } else if (firstTab.services.length > 0) {
          categoryName = firstTab.services[0].name || 'New Category';
        }
      } else if (newCategory.selectedProducts.length > 0) {
        const firstProduct = products.find(p => p.id === newCategory.selectedProducts[0]);
        categoryName = firstProduct ? `${firstProduct.name} Category` : 'New Category';
      }
    }

    // Create a new category object
    const categoryData = {
      id: `C${String(Date.now()).slice(-3)}`,
      name: categoryName,
      productCount: newCategory.selectedProducts.length,
      image: '/placeholder.svg',
      selectedProducts: newCategory.selectedProducts,
      serviceTabs: newCategory.serviceTabs
    };
    
    // Here you would typically make an API call to save the category
    console.log('Adding category:', categoryData);
    
    // Navigate back to product management with the new category data
    navigate('/admin/products', { 
      state: { 
        newCategory: categoryData 
      } 
    });
  };

  const handleCancel = () => {
    navigate('/admin/products');
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="ml-72 pt-32 p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/products')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Add New <span className="text-gradient">Category</span>
              </h1>
              <p className="text-muted-foreground">Create a new product category with services and products</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5" />
                Category Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category Name */}
              <div>
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name"
                  className="mt-1"
                />
              </div>

              {/* Product Selection */}
              <div>
                <Label htmlFor="productSelect">Product Select</Label>
                <Select 
                  value={newCategory.selectedProducts.length > 0 ? newCategory.selectedProducts[0] : ""} 
                  onValueChange={(value) => {
                    if (value && !newCategory.selectedProducts.includes(value)) {
                      setNewCategory(prev => ({ 
                        ...prev, 
                        selectedProducts: [...prev.selectedProducts, value] 
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select products to add to this category" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newCategory.selectedProducts.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted-foreground">Selected Products:</p>
                    <div className="flex flex-wrap gap-1">
                      {newCategory.selectedProducts.map(productId => {
                        const product = products.find(p => p.id === productId);
                        return product ? (
                          <Badge key={productId} variant="secondary" className="text-xs">
                            {product.name}
                            <button
                              onClick={() => setNewCategory(prev => ({
                                ...prev,
                                selectedProducts: prev.selectedProducts.filter(id => id !== productId)
                              }))}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Services Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-medium">Service Tabs</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddServiceTab}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Service Tab
                  </Button>
                </div>
                
                {newCategory.serviceTabs.length > 0 && (
                  <div className="space-y-4">
                    {newCategory.serviceTabs.map((tab, tabIndex) => (
                      <div key={tab.id} className="border rounded-lg p-4 space-y-4">
                        {/* Service Tab Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Input
                              value={tab.name}
                              onChange={(e) => handleUpdateServiceTab(tab.id, e.target.value)}
                              className="text-sm font-medium border-none p-0 h-auto"
                              placeholder="Service Tab Name"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveServiceTab(tab.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Add Service Item Button */}
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddServiceItem(tab.id)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Service Item
                          </Button>
                        </div>
                        
                        {/* Service Items */}
                        {tab.services.length > 0 && (
                          <div className="space-y-3">
                            {tab.services.map((service, serviceIndex) => (
                              <div key={service.id} className="bg-muted/50 rounded-lg p-3 space-y-3">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-xs font-medium text-muted-foreground">Service Item {serviceIndex + 1}</h5>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveServiceItem(tab.id, service.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label htmlFor={`service-name-${service.id}`} className="text-xs">Service Name</Label>
                                    <Input
                                      id={`service-name-${service.id}`}
                                      value={service.name}
                                      onChange={(e) => handleUpdateServiceItem(tab.id, service.id, 'name', e.target.value)}
                                      placeholder="Enter service name"
                                      className="text-xs h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`service-price-${service.id}`} className="text-xs">Price (₹)</Label>
                                    <Input
                                      id={`service-price-${service.id}`}
                                      type="number"
                                      value={service.price}
                                      onChange={(e) => handleUpdateServiceItem(tab.id, service.id, 'price', e.target.value)}
                                      placeholder="Enter price"
                                      className="text-xs h-8"
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <Label htmlFor={`service-description-${service.id}`} className="text-xs">Description</Label>
                                  <Input
                                    id={`service-description-${service.id}`}
                                    value={service.description}
                                    onChange={(e) => handleUpdateServiceItem(tab.id, service.id, 'description', e.target.value)}
                                    placeholder="Enter service description"
                                    className="text-xs h-8"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`service-discount-${service.id}`} className="text-xs">Discount Price (₹)</Label>
                                  <Input
                                    id={`service-discount-${service.id}`}
                                    type="number"
                                    value={service.discountPrice}
                                    onChange={(e) => handleUpdateServiceItem(tab.id, service.id, 'discountPrice', e.target.value)}
                                    placeholder="Enter discount price"
                                    className="text-xs h-8"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {tab.services.length === 0 && (
                          <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-lg">
                            <Package className="w-6 h-6 mx-auto mb-1" />
                            <p className="text-xs">No service items added yet</p>
                            <p className="text-xs">Click "Add Service Item" to add services to this tab</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {newCategory.serviceTabs.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Package className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No service tabs added yet</p>
                    <p className="text-xs">Click "Add Service Tab" to add service tabs to this category</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t">
                <Button onClick={handleAddCategory} className="flex-1" size="lg">
                  <Save className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
                <Button variant="outline" onClick={handleCancel} size="lg">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminAddCategory;
