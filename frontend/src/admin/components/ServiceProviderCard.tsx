import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  MapPin, 
  Users, 
  Edit, 
  Trash2, 
  TrendingUp,
  Award
} from 'lucide-react';

export interface ServiceProviderCardData {
  _id: string;
  name: string;
  speciality: string;
  subtitle: string;
  price?: number;
  image: string;
  status: 'active' | 'inactive';
  isPopular: boolean;
  isFeatured: boolean;
  rating: number;
  totalReviews: number;
  completedJobs: number;
  totalJobs: number;
  location?: {
    city: string;
    state: string;
    pincode: string;
  };
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface ServiceProviderCardProps {
  card: ServiceProviderCardData;
  onEdit: (card: ServiceProviderCardData) => void;
  onDelete: (cardId: string) => void;
  onToggleStatus: (cardId: string, currentStatus: string) => void;
  onTogglePopular: (cardId: string, currentPopular: boolean) => void;
  onToggleFeatured: (cardId: string, currentFeatured: boolean) => void;
  viewMode?: 'grid' | 'list';
}

const ServiceProviderCard: React.FC<ServiceProviderCardProps> = ({
  card,
  onEdit,
  onDelete,
  onToggleStatus,
  onTogglePopular,
  onToggleFeatured,
  viewMode = 'grid'
}) => {
  const successRate = card.totalJobs > 0 ? Math.round((card.completedJobs / card.totalJobs) * 100) : 0;

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Image */}
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shadow-sm">
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/cardImage.png';
                  }}
                />
              </div>
              {/* Status indicator */}
              <div className="absolute -top-1 -right-1">
                <div className={`w-4 h-4 rounded-full border-2 border-white ${
                  card.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
              </div>
            </div>
            
            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-xl text-gray-900 truncate">{card.name}</h3>
                <div className="flex gap-2">
                  {card.isPopular && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                  {card.isFeatured && (
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                      <Award className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{card.subtitle}</p>
              
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  <span>{card.speciality}</span>
                </div>
                {card.location?.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>{card.location.city}, {card.location.state}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <span>{card.completedJobs} completed jobs</span>
                </div>
              </div>
              
              {/* Tags */}
              {card.tags && card.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {card.tags.slice(0, 4).map((tag, index) => (
                    <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                      #{tag}
                    </span>
                  ))}
                  {card.tags.length > 4 && (
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                      +{card.tags.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Stats and Actions */}
          <div className="flex items-center gap-8">
            {/* Subtitle */}
            <div className="text-center">
              <div className="flex items-center gap-1 text-blue-600 mb-1">
                <span className="font-bold text-lg text-blue-700">{card.subtitle}</span>
              </div>
              <Badge 
                variant={card.status === 'active' ? 'default' : 'secondary'}
                className={`text-xs font-medium ${
                  card.status === 'active' 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
              >
                {card.status}
              </Badge>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                  onClick={() => onEdit(card)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                  onClick={() => onToggleStatus(card._id, card.status)}
                >
                  {card.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
                  onClick={() => onTogglePopular(card._id, card.isPopular)}
                >
                  {card.isPopular ? 'Unpopular' : 'Popular'}
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="hover:bg-red-600"
                  onClick={() => onDelete(card._id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:scale-[1.02]">
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative">
          <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg overflow-hidden">
            <img
              src={card.image}
              alt={card.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/cardImage.png';
              }}
            />
          </div>
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <Badge 
              variant={card.status === 'active' ? 'default' : 'secondary'} 
              className={`text-xs font-medium ${
                card.status === 'active' 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
            >
              {card.status}
            </Badge>
          </div>
          
          {/* Popular/Featured Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {card.isPopular && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                <TrendingUp className="w-3 h-3 mr-1" />
                Popular
              </Badge>
            )}
            {card.isFeatured && (
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                <Award className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="space-y-2">
            <h3 className="font-bold text-base text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {card.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Briefcase className="w-4 h-4 text-blue-500" />
              <span className="line-clamp-1">{card.speciality}</span>
            </div>
          </div>
          
          
          {/* Location */}
          {card.location?.city && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="line-clamp-1">{card.location.city}, {card.location.state}</span>
            </div>
          )}
          
          {/* Tags */}
          {card.tags && card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {card.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                  #{tag}
                </span>
              ))}
              {card.tags.length > 2 && (
                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                  +{card.tags.length - 2} more
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-8 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                onClick={() => onEdit(card)}
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-8 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                onClick={() => onDelete(card._id)}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-8 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                onClick={() => onToggleStatus(card._id, card.status)}
              >
                {card.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-8 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
                onClick={() => onTogglePopular(card._id, card.isPopular)}
              >
                {card.isPopular ? 'Unpopular' : 'Popular'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceProviderCard;
