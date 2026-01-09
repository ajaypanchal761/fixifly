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
  serviceImage?: string;
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
      <DialogContent className="max-w-3xl max-h-[65vh] mt-10 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-bold">{product.productName}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-4 h-4" />
                Product Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Tag className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-600">Service Type</p>
                    <Badge className={`${getServiceTypeColor(product.serviceType)} text-xs`}>
                      {product.serviceType}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Package className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-600">Total Services</p>
                    <p className="font-medium text-sm">{getTotalServices()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  {product.isFeatured ? (
                    <Star className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <StarOff className="w-4 h-4 text-gray-400" />
                  )}
                  <div>
                    <p className="text-xs text-gray-600">Featured Status</p>
                    <Badge className={`${product.isFeatured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'} text-xs`}>
                      {product.isFeatured ? 'Featured' : 'Not Featured'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Calendar className="w-3 h-3" />
                  Created: {formatDate(product.createdAt)}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  Updated: {formatDate(product.updatedAt)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Image */}
          {product.productImage && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ImageIcon className="w-4 h-4" />
                  Product Image
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-center">
                  <img 
                    src={product.productImage} 
                    alt={product.productName}
                    className="max-w-md max-h-48 object-contain rounded-lg border"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories and Services */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Categories & Services</h3>
            
            {Object.entries(product.categories).map(([categoryKey, services]) => {
              if (services.length === 0) return null;
              
              return (
                <Card key={categoryKey}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-blue-600" />
                        {getCategoryName(categoryKey)}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {services.length} service{services.length !== 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {services.map((service, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-start gap-3">
                                {service.serviceImage && (
                                  <img 
                                    src={service.serviceImage} 
                                    alt={service.serviceName}
                                    className="w-12 h-12 object-cover rounded-lg border"
                                  />
                                )}
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm">{service.serviceName}</h4>
                                  {service.description && (
                                    <p className="text-xs text-gray-600 mt-1">{service.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant={service.isActive ? "default" : "secondary"}
                                  className={`${service.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"} text-xs`}
                                >
                                  {service.isActive ? 'Active' : 'Inactive'}
                                </Badge>
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
              <CardContent className="text-center py-6 p-4">
                <Package className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-600 mb-1">No Services Added</h3>
                <p className="text-xs text-gray-500">This product doesn't have any services configured yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminProductDetailModal;
