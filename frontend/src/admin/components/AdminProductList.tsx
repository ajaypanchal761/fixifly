import React, { useState, useEffect } from 'react';
import { 
  Edit, 
  Trash2, 
  Eye, 
  MoreVertical,
  Search,
  Filter,
  RefreshCw,
  Image as ImageIcon,
  Star,
  StarOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import adminApiService from '@/services/adminApi';

interface Service {
  serviceName: string;
  description: string;
  price: number;
  discountPrice?: number;
  isActive: boolean;
}

interface Product {
  _id: string;
  productName: string;
  productImage?: string;
  serviceType: string;
  categories: {
    A: Service[];
    B: Service[];
    C: Service[];
    D: Service[];
  };
  categoryNames?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  status:'active' | 'inactive' | 'archived';
  isFeatured: boolean;
  totalServices: number;
  createdAt: string;
  updatedAt: string;
}

interface AdminProductListProps {
  onEditProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onRefresh?: () => void;
}

const AdminProductList: React.FC<AdminProductListProps> = ({ 
  onEditProduct, 
  onViewProduct, 
  onRefresh 
}) => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterServiceType, setFilterServiceType] = useState<string>('all');

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await adminApiService.getAllProducts();
      
      if (response.success) {
        setProducts(response.data.products || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch products",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await adminApiService.deleteProduct(productId);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
          variant: "default"
        });
        fetchProducts(); // Refresh the list
        onRefresh?.(); // Call parent refresh if provided
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete product",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  // Toggle featured status
  const handleToggleFeatured = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await adminApiService.toggleProductFeatured(productId);
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Product ${response.data.isFeatured ? 'featured' : 'unfeatured'} successfully`,
          variant: "default"
        });
        fetchProducts(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update featured status",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error toggling featured status:', error);
      toast({
        title: "Error",
        description: "Failed to update featured status",
        variant: "destructive"
      });
    }
  };

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    const matchesServiceType = filterServiceType === 'all' || product.serviceType === filterServiceType;
    
    return matchesSearch && matchesStatus && matchesServiceType;
  });

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'destructive';
      case 'archived': return 'outline';
      default: return 'secondary';
    }
  };

  // Get service type badge variant
  const getServiceTypeBadgeVariant = (serviceType: string) => {
    switch (serviceType) {
      case 'IT Needs': return 'default';
      case 'Home Appliance': return 'secondary';
      default: return 'outline';
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Loading products...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Products ({filteredProducts.length})</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProducts}
              className="flex items-center gap-2 text-xs"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-md text-xs"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
              <select
                value={filterServiceType}
                onChange={(e) => setFilterServiceType(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-md text-xs"
              >
                <option value="all">All Types</option>
                <option value="IT Needs">IT Needs</option>
                <option value="Home Appliance">Home Appliance</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-4">
            <div className="text-center py-8">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                {products.length === 0 ? 'No Products Found' : 'No Products Match Your Filters'}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                {products.length === 0 
                  ? 'Start by adding your first product to get started.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredProducts.map((product) => (
            <Card key={product._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Product Image */}
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.productImage ? (
                        <img
                          src={product.productImage}
                          alt={product.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {product.productName}
                        </h3>
                        {product.isFeatured && (
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getServiceTypeBadgeVariant(product.serviceType)} className="text-xs">
                          {product.serviceType}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(product.status)} className="text-xs">
                          {product.status}
                        </Badge>
                      </div>

                      <div className="text-xs text-gray-600">
                        <p>Total Services: {product.totalServices}</p>
                        <p>Created: {new Date(product.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewProduct(product)}
                      className="text-xs"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditProduct(product)}
                      className="text-xs"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleToggleFeatured(product._id, product.isFeatured)}
                        >
                          {product.isFeatured ? (
                            <>
                              <StarOff className="w-3 h-3 mr-2" />
                              Remove from Featured
                            </>
                          ) : (
                            <>
                              <Star className="w-3 h-3 mr-2" />
                              Mark as Featured
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteProduct(product._id, product.productName)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Delete Product
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProductList;
