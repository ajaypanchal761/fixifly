import React from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Calendar, 
  Tag, 
  Star,
  StarOff,
  DollarSign,
  Package,
  Settings,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

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

interface AdminProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const AdminProductDetailModal: React.FC<AdminProductDetailModalProps> = ({ 
  product, 
  isOpen, 
  onClose 
}) => {
  if (!product) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceTypeColor = (serviceType: string) => {
    switch (serviceType) {
      case 'IT Needs': return 'bg-blue-100 text-blue-800';
      case 'Home Appliance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryName = (categoryKey: string) => {
    return product.categoryNames?.[categoryKey as keyof typeof product.categoryNames] || `Category ${categoryKey}`;
  };

  const getTotalServices = () => {
    return product.categories.A.length + product.categories.B.length + 
           product.categories.C.length + product.categories.D.length;
  };

  const getTotalRevenue = () => {
    let total = 0;
    Object.values(product.categories).forEach(category => {
      category.forEach(service => {
        total += service.price;
      });
    });
    return total;
  };

  const getTotalDiscountRevenue = () => {
    let total = 0;
    Object.values(product.categories).forEach(category => {
      category.forEach(service => {
        total += service.discountPrice || service.price;
      });
    });
    return total;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] mt-16 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-blue-600" />
              <span className="text-2xl font-bold">{product.productName}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Product Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Tag className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Service Type</p>
                    <Badge className={getServiceTypeColor(product.serviceType)}>
                      {product.serviceType}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Package className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Services</p>
                    <p className="font-medium text-lg">{getTotalServices()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {product.isFeatured ? (
                    <Star className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <StarOff className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Featured Status</p>
                    <Badge className={product.isFeatured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                      {product.isFeatured ? 'Featured' : 'Not Featured'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  Created: {formatDate(product.createdAt)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  Updated: {formatDate(product.updatedAt)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Image */}
          {product.productImage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Product Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <img 
                    src={product.productImage} 
                    alt={product.productName}
                    className="max-w-md max-h-64 object-contain rounded-lg border"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories and Services */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Categories & Services</h3>
            
            {Object.entries(product.categories).map(([categoryKey, services]) => {
              if (services.length === 0) return null;
              
              return (
                <Card key={categoryKey}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-blue-600" />
                        {getCategoryName(categoryKey)}
                      </div>
                      <Badge variant="secondary">
                        {services.length} service{services.length !== 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {services.map((service, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{service.serviceName}</h4>
                              {service.description && (
                                <p className="text-gray-600 mt-1">{service.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-green-600">
                                  ₹{service.price.toLocaleString()}
                                </span>
                                {service.discountPrice && service.discountPrice !== service.price && (
                                  <span className="text-sm text-gray-500 line-through">
                                    ₹{service.discountPrice.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge 
                                  variant={service.isActive ? "default" : "secondary"}
                                  className={service.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                                >
                                  {service.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                {service.discountPrice && service.discountPrice !== service.price && (
                                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                                    {Math.round(((service.price - service.discountPrice) / service.price) * 100)}% OFF
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty Categories Message */}
          {getTotalServices() === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Services Added</h3>
                <p className="text-gray-500">This product doesn't have any services configured yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminProductDetailModal;
