import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import { 
  Package, 
  Plus, 
  Upload, 
  Edit, 
  Trash2, 
  Eye,
  Search, 
  Filter,
  Image as ImageIcon,
  Grid3X3,
  List,
  FolderPlus,
  Save,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminProductManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample product data
  const [products, setProducts] = useState([
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

  // Sample categories
  const [categories, setCategories] = useState([
    { 
      id: 'C001', 
      name: 'IT Needs', 
      productCount: 1, 
      image: '/laptop.avif',
      selectedProducts: [],
      serviceTabs: []
    },
    { 
      id: 'C002', 
      name: 'Home Appliance', 
      productCount: 0, 
      image: '/washing.jpg',
      selectedProducts: ['45151'],
      serviceTabs: []
    }
  ]);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    image: null as File | null
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    image: null as File | null
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Handle new category from AddCategory page
  useEffect(() => {
    if (location.state?.newCategory) {
      const newCategory = location.state.newCategory;
      setCategories(prev => [...prev, newCategory]);
      
      // Clear the state to prevent re-adding on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent, type: 'product' | 'category') => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      if (type === 'product') {
        setNewProduct(prev => ({ ...prev, image: imageFile }));
      } else {
        setNewCategory(prev => ({ ...prev, image: imageFile }));
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'category') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'product') {
        setNewProduct(prev => ({ ...prev, image: file }));
      } else {
        setNewCategory(prev => ({ ...prev, image: file }));
      }
    }
  };

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.category && newProduct.image) {
      const product = {
        id: `P${String(products.length + 1).padStart(3, '0')}`,
        name: newProduct.name,
        category: newProduct.category,
        image: URL.createObjectURL(newProduct.image)
      };
      
      setProducts(prev => [...prev, product]);
      setNewProduct({
        name: '',
        category: '',
        image: null
      });
      setIsAddProductOpen(false);
    }
  };

  const handleEditProduct = (product: any) => {
    // Set the product to edit
    setNewProduct({
      name: product.name,
      category: product.category,
      image: null
    });
    setIsAddProductOpen(true);
    // You can add additional logic here to distinguish between add and edit modes
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(product => product.id !== productId));
    }
  };



  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="ml-72 pt-32 p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Product <span className="text-gradient">Management</span>
              </h1>
              <p className="text-muted-foreground">Manage your product catalog and categories</p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline"
                onClick={() => navigate('/admin/products/add-category')}
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
              
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="productName">Product Name</Label>
                      <Input
                        id="productName"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter product name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="productCategory">Service Category</Label>
                      <Select value={newProduct.category} onValueChange={(value) => setNewProduct(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IT Needs">IT Needs</SelectItem>
                          <SelectItem value="Home Appliance">Home Appliance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Product Image</Label>
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'product')}
                      >
                        {newProduct.image ? (
                          <div className="space-y-2">
                            <img
                              src={URL.createObjectURL(newProduct.image)}
                              alt="Product preview"
                              className="w-32 h-32 object-cover rounded mx-auto"
                            />
                            <p className="text-sm text-muted-foreground">{newProduct.image.name}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNewProduct(prev => ({ ...prev, image: null }))}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Drag & drop product image here or click to browse
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Browse
                            </Button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileInput(e, 'product')}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleAddProduct} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Add Product
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddProductOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search products by name or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

             {/* Products Display */}
             {viewMode === 'grid' ? (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="service-card">
                    <CardContent className="p-3">
                      <div className="aspect-square mb-3 bg-muted rounded-lg flex items-center justify-center">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2">{product.name}</h3>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                        <div className="space-y-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full text-xs"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Products ({filteredProducts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div>
                                <p className="font-medium text-foreground">{product.name}</p>
                                <p className="text-sm text-muted-foreground">{product.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="space-y-6">
              {categories.map((category) => (
                <Card key={category.id} className="w-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{category.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.productCount} products
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Selected Products */}
                    {category.selectedProducts && category.selectedProducts.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-3 text-foreground">Selected Products:</h4>
                        <div className="flex flex-wrap gap-2">
                          {category.selectedProducts.map((productId) => {
                            const product = products.find(p => p.id === productId);
                            return product ? (
                              <Badge key={productId} variant="secondary" className="text-xs">
                                {product.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Service Tabs */}
                    {category.serviceTabs && category.serviceTabs.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-3 text-foreground">Service Tabs:</h4>
                        <div className="space-y-4">
                          {category.serviceTabs.map((tab) => (
                            <div key={tab.id} className="border rounded-lg p-4 bg-muted/30">
                              <h5 className="font-medium text-sm mb-3 text-foreground">{tab.name}</h5>
                              
                              {/* Services */}
                              {tab.services && tab.services.length > 0 && (
                                <div className="space-y-3">
                                  {tab.services.map((service) => (
                                    <div key={service.id} className="bg-background rounded-lg p-3 border">
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground">Service Name</p>
                                          <p className="text-sm font-medium text-foreground">{service.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground">Description</p>
                                          <p className="text-sm text-foreground">{service.description || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground">Price</p>
                                          <p className="text-sm font-medium text-foreground">
                                            {service.price ? `₹${service.price}` : 'N/A'}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground">Discount Price</p>
                                          <p className="text-sm font-medium text-green-600">
                                            {service.discountPrice ? `₹${service.discountPrice}` : 'N/A'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminProductManagement;
