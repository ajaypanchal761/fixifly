import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MessageCircle, ThumbsUp } from 'lucide-react';
import reviewService from '@/services/reviewService';

interface VendorRatingDisplayProps {
  vendorId: string;
  vendorName: string;
}

interface VendorRatingStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}

interface VendorReview {
  _id: string;
  userId: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  category: string;
  rating: number;
  comment: string;
  likes: number;
  isAnonymous: boolean;
  createdAt: string;
  userDisplayName: string;
  formattedDate: string;
  ratingText: string;
}

const VendorRatingDisplay: React.FC<VendorRatingDisplayProps> = ({ vendorId, vendorName }) => {
  const [ratingStats, setRatingStats] = useState<VendorRatingStats | null>(null);
  const [reviews, setReviews] = useState<VendorReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRatingData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching rating data for vendor:', vendorId);
        
        const [statsResponse, reviewsResponse] = await Promise.all([
          reviewService.getVendorRatingStats(vendorId),
          reviewService.getVendorReviews(vendorId, 5)
        ]);

        console.log('📊 Stats response:', statsResponse);
        console.log('📝 Reviews response:', reviewsResponse);

        if (statsResponse.success) {
          setRatingStats(statsResponse.data);
          console.log('✅ Rating stats set:', statsResponse.data);
        } else {
          console.log('❌ Stats response failed:', statsResponse);
        }

        if (reviewsResponse.success) {
          setReviews(reviewsResponse.data);
          console.log('✅ Reviews set:', reviewsResponse.data);
        } else {
          console.log('❌ Reviews response failed:', reviewsResponse);
        }
      } catch (error) {
        console.error('❌ Error fetching vendor rating data:', error);
        setError('Failed to load rating data');
      } finally {
        setLoading(false);
      }
    };

    if (vendorId) {
      console.log('🚀 Starting to fetch rating data for vendor:', vendorId);
      fetchRatingData();
    } else {
      console.log('❌ No vendorId provided to VendorRatingDisplay');
    }
  }, [vendorId]);

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    };

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            key={value}
            className={`${sizeClasses[size]} ${
              value <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingPercentage = (rating: number) => {
    if (!ratingStats || ratingStats.totalReviews === 0) return 0;
    return Math.round((ratingStats.ratingDistribution[rating] / ratingStats.totalReviews) * 100);
  };

  if (loading) {
    console.log('🔄 VendorRatingDisplay: Loading state');
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Customer Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !ratingStats) {
    console.log('❌ VendorRatingDisplay: Error or no rating stats', { error, ratingStats });
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Customer Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No ratings available yet</p>
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
              ⚠️ Unable to load ratings. This might be because:
              <ul className="mt-1 ml-4 list-disc">
                <li>No reviews have been submitted yet</li>
                <li>Backend service is temporarily unavailable</li>
                <li>Vendor ID format issue</li>
              </ul>
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-600">
                💡 <strong>Note:</strong> Once customers complete bookings and submit ratings, they will appear here with stars and comments.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Customer Ratings
          </CardTitle>
          <CardDescription>Feedback from customers who used your services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {ratingStats.averageRating.toFixed(1)}
              </div>
              {renderStars(Math.round(ratingStats.averageRating), 'lg')}
              <p className="text-sm text-gray-600 mt-2">
                Based on {ratingStats.totalReviews} review{ratingStats.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm font-medium w-6">{rating}</span>
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getRatingPercentage(rating)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8">
                    {ratingStats.ratingDistribution[rating] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              Recent Reviews
            </CardTitle>
            <CardDescription>Latest feedback from customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating, 'sm')}
                        <span className="text-xs text-gray-500">{review.formattedDate}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {review.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                  {review.likes > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{review.likes} helpful</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VendorRatingDisplay;
