import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Upload,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Edit3,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import adminApiService from '@/services/adminApi';

interface Service {
  serviceName: string;
  description: string;
  price: number | string;
  discountPrice: number | string;
  isActive?: boolean;
  serviceImage?: string;
}

interface ProductFormData {
  productName: string;
  productImage: string;
  serviceType: string;
  isFeatured: boolean;
  categories: {
    A: Service[];
    B: Service[];
    C: Service[];
    D: Service[];
  };
}

interface AdminProductFormProps {
  onProductCreated?: () => void;
  selectedProduct?: any;
  onBackToList?: () => void;
}

// This will be replaced with dynamic categoriesList inside the component
const serviceTypes = [
  'IT Needs',
  'Home Appliance'
];

const AdminProductForm: React.FC<AdminProductFormProps> = ({ onProductCreated, selectedProduct, onBackToList }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [serviceImageFiles, setServiceImageFiles] = useState<Record<string, File | null>>({});
  const [serviceImagePreviews, setServiceImagePreviews] = useState<Record<string, string>>({});

  const [product, setProduct] = useState<ProductFormData>({
    productName: '',
    productImage: '',
    serviceType: '',
    isFeatured: false,
    categories: {
      A: [],
      B: [],
      C: [],
      D: []
    }
  });

  const [activeCategories, setActiveCategories] = useState<string[]>(['A']); // Start with one category
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({
    A: 'Enter Category 1',
    B: 'Enter Category 2',
    C: 'Enter Category 3',
    D: 'Enter Category 4'
  });

  // Create dynamic categoriesList from state
  const categoriesList = [
    { key: 'A', name: categoryNames.A },
    { key: 'B', name: categoryNames.B },
    { key: 'C', name: categoryNames.C },
    { key: 'D', name: categoryNames.D }
  ];

  const addService = (category: string) => {
    const newService: Service = {
      serviceName: '',
      description: '',
      price: '',
      discountPrice: '',
      isActive: true,
      serviceImage: ''
    };

    setProduct(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: [...prev.categories[category as keyof typeof prev.categories], newService]
      }
    }));
  };

  const removeService = (category: string, index: number) => {
    setProduct(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: prev.categories[category as keyof typeof prev.categories].filter((_, i) => i !== index)
      }
    }));
  };

  const handleServiceChange = (category: string, index: number, field: keyof Service, value: string | number | boolean) => {
    const updated = [...product.categories[category as keyof typeof product.categories]];
    updated[index] = { ...updated[index], [field]: value };

    setProduct(prev => ({
      ...prev,
      categories: { ...prev.categories, [category]: updated }
    }));
  };

  const handleServiceImageChange = (category: string, index: number, file: File | null) => {
    const serviceKey = `${category}_${index}`;

    if (file) {
      setServiceImageFiles(prev => ({ ...prev, [serviceKey]: file }));

      const reader = new FileReader();
      reader.onload = (e) => {
        setServiceImagePreviews(prev => ({
          ...prev,
          [serviceKey]: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setServiceImageFiles(prev => ({ ...prev, [serviceKey]: null }));
      setServiceImagePreviews(prev => ({ ...prev, [serviceKey]: '' }));
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: string | boolean) => {
    setProduct(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a JPEG, PNG, or WebP image file",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Clear any existing image URL
      setProduct(prev => ({ ...prev, productImage: '' }));
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview('');
    }
  };

  const addCategory = () => {
    const availableCategories = categoriesList.filter(cat => !activeCategories.includes(cat.key));
    if (availableCategories.length > 0) {
      setActiveCategories(prev => [...prev, availableCategories[0].key]);
    }
  };

  const removeCategory = (categoryKey: string) => {
    if (activeCategories.length > 1) {
      setActiveCategories(prev => prev.filter(key => key !== categoryKey));
      // Clear services in the removed category
      setProduct(prev => ({
        ...prev,
        categories: {
          ...prev.categories,
          [categoryKey]: []
        }
      }));
    }
  };

  const getCategoryName = (categoryKey: string) => {
    return categoryNames[categoryKey] || `Category ${categoryKey}`;
  };

  const handleCategoryNameChange = (categoryKey: string, newName: string) => {
    setCategoryNames(prev => ({
      ...prev,
      [categoryKey]: newName
    }));
  };

  const resetCategoryNames = () => {
    setCategoryNames({
      A: 'Enter Category 1',
      B: 'Enter Category 2',
      C: 'Enter Category 3',
      D: 'Enter Category 4'
    });
  };

  // Populate form when editing existing product
  useEffect(() => {
    if (selectedProduct) {
      setProduct({
        productName: selectedProduct.productName || '',
        productImage: selectedProduct.productImage || '',
        serviceType: selectedProduct.serviceType || 'IT Needs',
        isFeatured: selectedProduct.isFeatured || false,
        categories: {
          A: selectedProduct.categories?.A || [],
          B: selectedProduct.categories?.B || [],
          C: selectedProduct.categories?.C || [],
          D: selectedProduct.categories?.D || []
        }
      });

      // Set category names from database or use defaults
      setCategoryNames({
        A: selectedProduct.categoryNames?.A || 'Enter Category 1',
        B: selectedProduct.categoryNames?.B || 'Enter Category 2',
        C: selectedProduct.categoryNames?.C || 'Enter Category 3',
        D: selectedProduct.categoryNames?.D || 'Enter Category 4'
      });

      // Set active categories based on which ones have services
      const activeCats = [];
      if (selectedProduct.categories?.A?.length > 0) activeCats.push('A');
      if (selectedProduct.categories?.B?.length > 0) activeCats.push('B');
      if (selectedProduct.categories?.C?.length > 0) activeCats.push('C');
      if (selectedProduct.categories?.D?.length > 0) activeCats.push('D');

      // If no categories are active, default to A
      setActiveCategories(activeCats.length > 0 ? activeCats : ['A']);

      // Set image preview if product has an image
      if (selectedProduct.productImage) {
        setImagePreview(selectedProduct.productImage);
      }

      // Set up service image previews for existing services
      const newServiceImagePreviews: Record<string, string> = {};
      Object.entries(selectedProduct.categories || {}).forEach(([categoryKey, services]) => {
        services.forEach((service: any, index: number) => {
          if (service.serviceImage) {
            newServiceImagePreviews[`${categoryKey}_${index}`] = service.serviceImage;
          }
        });
      });
      setServiceImagePreviews(newServiceImagePreviews);
    }
  }, [selectedProduct]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!product.productName.trim()) {
      newErrors.productName = 'Product name is required';
    }

    if (!product.serviceType) {
      newErrors.serviceType = 'Service type is required';
    }

    // Check if at least one category has services
    const hasServices = Object.values(product.categories).some(category => category.length > 0);
    if (!hasServices) {
      newErrors.categories = 'At least one service must be added to any category';
    }

    // Validate services
    Object.entries(product.categories).forEach(([categoryKey, services]) => {
      services.forEach((service, index) => {
        if (!service.serviceName.trim()) {
          newErrors[`${categoryKey}_${index}_serviceName`] = 'Service name is required';
        }
        if (!service.price || Number(service.price) <= 0) {
          newErrors[`${categoryKey}_${index}_price`] = 'Valid price is required';
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert string prices to numbers and include category names
      const processedProduct = {
        ...product,
        categories: Object.entries(product.categories).reduce((acc, [key, services]) => {
          acc[key] = services.map(service => ({
            ...service,
            price: Number(service.price),
            discountPrice: service.discountPrice ? Number(service.discountPrice) : undefined
          }));
          return acc;
        }, {} as typeof product.categories),
        categoryNames: categoryNames // Include the custom category names
      };

      // Create FormData for file upload
      const formData = new FormData();

      // Add product data as JSON string
      formData.append('productData', JSON.stringify(processedProduct));

      // Add image file if selected
      if (selectedFile) {
        formData.append('productImage', selectedFile);
      }

      // Add service images
      const serviceImageKeys: string[] = [];
      Object.entries(serviceImageFiles).forEach(([serviceKey, file]) => {
        if (file) {
          formData.append(`serviceImages`, file);
          serviceImageKeys.push(serviceKey);
        }
      });

      // Add service image keys as a single array
      if (serviceImageKeys.length > 0) {
        serviceImageKeys.forEach(key => {
          formData.append(`serviceImageKeys`, key);
        });
      }

      // Debug: Log FormData contents
      console.log('=== FormData Debug ===');
      console.log('FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const productDataString = formData.get('productData') as string;
      if (productDataString) {
        console.log('Product data found:', JSON.parse(productDataString));
      } else {
        console.log('❌ Product data: NOT FOUND in FormData');
      }
      console.log('Service image files count:', Object.keys(serviceImageFiles).length);
      console.log('Service image keys:', serviceImageKeys);
      console.log('Product image file:', selectedFile ? 'Present' : 'Not present');
      console.log('========================');


      let response;

      if (selectedProduct) {
        // Update existing product
        response = await adminApiService.updateProductWithImage(selectedProduct._id, formData);

        if (response.success) {
          toast({
            title: "Success",
            description: "Product updated successfully!",
            variant: "default"
          });

          // Go back to list view
          if (onBackToList) {
            onBackToList();
          }
        } else {
          throw new Error(response.message || 'Failed to update product');
        }
      } else {
        // Create new product
        response = await adminApiService.createProductWithImage(formData);

        if (response.success) {
          toast({
            title: "Success",
            description: "Product created successfully!",
            variant: "default"
          });

          // Reset form
          setProduct({
            productName: '',
            productImage: '',
            serviceType: '',
            isFeatured: false,
            categories: { A: [], B: [], C: [], D: [] }
          });
          setErrors({});
          setActiveCategories(['A']); // Reset to one category
          setCategoryNames({
            A: 'Enter Category 1',
            B: 'Enter Category 2',
            C: 'Enter Category 3',
            D: 'Enter Category 4'
          });
          removeSelectedFile();
        } else {
          throw new Error(response.message || 'Failed to create product');
        }
      }

      // Notify parent component that product was created/updated
      onProductCreated?.();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${selectedProduct ? 'update' : 'create'} product`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalServices = () => {
    return Object.values(product.categories).reduce((total, category) => total + category.length, 0);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedProduct ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-gray-600 mt-2">
            {selectedProduct ? 'Update product information and services' : 'Create a new product with services organized by categories'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            Total Services: {getTotalServices()}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Product Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Basic Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  placeholder="Enter product name"
                  value={product.productName}
                  onChange={(e) => handleInputChange('productName', e.target.value)}
                  className={errors.productName ? 'border-red-500' : ''}
                />
                {errors.productName && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.productName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type *</Label>
                <Select value={product.serviceType} onValueChange={(value) => handleInputChange('serviceType', value)}>
                  <SelectTrigger className={errors.serviceType ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.serviceType && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.serviceType}
                  </p>
                )}
              </div>
            </div>

            {/* Featured Status */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={product.isFeatured}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <Label htmlFor="isFeatured" className="text-sm font-medium">
                  Featured Product (Show in Hero Section)
                </Label>
              </div>
              <p className="text-xs text-gray-500">
                Featured products will be displayed in the top 3 cards on the homepage hero section
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productImage">Product Image</Label>

              {/* File Upload */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    id="productImage"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeSelectedFile}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Preview:</Label>
                    <div className="mt-2 border rounded-lg p-4 max-w-xs">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Categories and Services */}
        {errors.categories && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.categories}</AlertDescription>
          </Alert>
        )}

        {/* Category Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Service Categories</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Click on category names to edit them</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetCategoryNames}
                  className="flex items-center gap-2"
                  title="Reset category names to default"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Names
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCategory}
                  disabled={activeCategories.length >= categoriesList.length}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activeCategories.map(categoryKey => (
                <Card key={categoryKey}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-blue-500" />
                          <Input
                            value={getCategoryName(categoryKey)}
                            onChange={(e) => handleCategoryNameChange(categoryKey, e.target.value)}
                            className="font-semibold text-lg border-none shadow-none p-0 h-auto focus:ring-0 focus:border-b-2 focus:border-blue-500 bg-transparent hover:bg-gray-50 rounded px-2 py-1 transition-colors"
                            placeholder="Enter category name..."
                            title="Click to edit category name"
                          />
                        </div>
                        <Badge variant="secondary">
                          {product.categories[categoryKey as keyof typeof product.categories].length} services
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addService(categoryKey)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Service
                        </Button>
                        {activeCategories.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCategory(categoryKey)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {product.categories[categoryKey as keyof typeof product.categories].length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No services added yet. Click "Add Service" to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {product.categories[categoryKey as keyof typeof product.categories].map((service, index) => (
                          <div key={index} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Service {index + 1}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeService(categoryKey, index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Service Name *</Label>
                                <Input
                                  placeholder="Enter service name"
                                  value={service.serviceName}
                                  onChange={(e) => handleServiceChange(categoryKey, index, 'serviceName', e.target.value)}
                                  className={errors[`${categoryKey}_${index}_serviceName`] ? 'border-red-500' : ''}
                                />
                                {errors[`${categoryKey}_${index}_serviceName`] && (
                                  <p className="text-sm text-red-500">{errors[`${categoryKey}_${index}_serviceName`]}</p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label>Price *</Label>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  value={service.price}
                                  onChange={(e) => handleServiceChange(categoryKey, index, 'price', e.target.value)}
                                  className={errors[`${categoryKey}_${index}_price`] ? 'border-red-500' : ''}
                                />
                                {errors[`${categoryKey}_${index}_price`] && (
                                  <p className="text-sm text-red-500">{errors[`${categoryKey}_${index}_price`]}</p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea
                                placeholder="Enter service description"
                                value={service.description}
                                onChange={(e) => handleServiceChange(categoryKey, index, 'description', e.target.value)}
                                rows={2}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Service Image</Label>
                              <div className="space-y-4">
                                {/* File Upload */}
                                <div className="space-y-2">
                                  <Input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={(e) => handleServiceImageChange(categoryKey, index, e.target.files?.[0] || null)}
                                    className="cursor-pointer"
                                  />
                                  <p className="text-xs text-gray-500">
                                    Supported formats: JPEG, PNG, WebP (Max 5MB)
                                  </p>
                                </div>

                                {/* Image Preview */}
                                {serviceImagePreviews[`${categoryKey}_${index}`] && (
                                  <div className="space-y-2">
                                    <Label>Preview:</Label>
                                    <div className="relative inline-block">
                                      <img
                                        src={serviceImagePreviews[`${categoryKey}_${index}`]}
                                        alt="Service preview"
                                        className="w-32 h-32 object-cover rounded-lg border"
                                      />
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                        onClick={() => handleServiceImageChange(categoryKey, index, null)}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Discount Price</Label>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  value={service.discountPrice}
                                  onChange={(e) => handleServiceChange(categoryKey, index, 'discountPrice', e.target.value)}
                                />
                              </div>

                              <div className="flex items-center space-x-2 pt-6">
                                <input
                                  type="checkbox"
                                  checked={service.isActive}
                                  onChange={(e) => handleServiceChange(categoryKey, index, 'isActive', e.target.checked)}
                                  className="rounded border-gray-300"
                                />
                                <Label>Active Service</Label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setProduct({
                productName: '',
                productImage: '',
                serviceType: '',
                isFeatured: false,
                categories: { A: [], B: [], C: [], D: [] }
              });
              setErrors({});
            }}
          >
            <X className="w-4 h-4 mr-2" />
            Reset Form
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {selectedProduct ? 'Update Product' : 'Create Product'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
