import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ThumbsUp, Clock, User, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { reviewService, Review, CreateReviewData } from '@/services/reviewService';
import { toast } from 'sonner';

const RateUs = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());

  const categories = [
    "AC Repair",
    "Washing Machine Repair", 
    "Refrigerator Repair",
    "TV Repair",
    "Laptop Repair",
    "Desktop Repair",
    "Printer Repair",
    "General Service",
    "Customer Support",
    "Overall Experience"
  ];

  const handleStarClick = (rating: number) => {
    setUserRating(rating);
  };

  // Load reviews on component mount
  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewService.getReviews({ limit: 10, sort: 'newest' });
      setReviews(response.data);
      
      // Initialize liked reviews set
      if (user) {
        const likedSet = new Set<string>();
        response.data.forEach(review => {
          if (review.likedBy.includes(user.id)) {
            likedSet.add(review._id);
          }
        });
        setLikedReviews(likedSet);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!user || !token) {
      toast.error('Please login to submit a review');
      return;
    }

    if (userRating > 0 && selectedCategory && userComment.trim()) {
      try {
        setSubmitting(true);
        
        const reviewData: CreateReviewData = {
          category: selectedCategory,
          rating: userRating,
          comment: userComment.trim()
        };

        const response = await reviewService.createReview(reviewData, token);
        
        toast.success('Thank you for your rating! Your feedback has been submitted.');
        setUserRating(0);
        setUserComment('');
        setSelectedCategory('');
        
        // Reload reviews to show the new one
        await loadReviews();
      } catch (error: any) {
        console.error('Error submitting review:', error);
        toast.error(error.response?.data?.message || 'Failed to submit review');
      } finally {
        setSubmitting(false);
      }
    } else {
      toast.error('Please fill in all fields before submitting.');
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    if (!user || !token) {
      toast.error('Please login to like reviews');
      return;
    }

    try {
      const response = await reviewService.toggleLikeReview(reviewId, token);
      
      // Update local state
      setLikedReviews(prev => {
        const newSet = new Set(prev);
        if (response.data.isLiked) {
          newSet.add(reviewId);
        } else {
          newSet.delete(reviewId);
        }
        return newSet;
      });

      // Update reviews array
      setReviews(prev => prev.map(review => 
        review._id === reviewId 
          ? { ...review, likes: response.data.likes }
          : review
      ));
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast.error(error.response?.data?.message || 'Failed to like review');
    }
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={20}
            className={`cursor-pointer transition-colors ${
              interactive
                ? 'hover:text-yellow-400'
                : ''
            } ${
              star <= (interactive ? hoveredStar || userRating : rating)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
            onClick={interactive ? () => handleStarClick(star) : undefined}
            onMouseEnter={interactive ? () => setHoveredStar(star) : undefined}
            onMouseLeave={interactive ? () => setHoveredStar(0) : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-20 sm:pb-6 px-4 overflow-y-auto">
      <div className="max-w-4xl mx-auto min-h-full">
        {/* Back Button */}
        <div className=" pt-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Rate Our <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Service</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rating Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="text-yellow-500" size={24} />
                Share Your Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What are you rating for?
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Rating
                </label>
                <div className="flex items-center gap-2">
                  {renderStars(userRating, true)}
                  <span className="text-sm text-gray-600 ml-2">
                    {userRating > 0 && (
                      <>
                        {userRating === 1 && 'Poor'}
                        {userRating === 2 && 'Fair'}
                        {userRating === 3 && 'Good'}
                        {userRating === 4 && 'Very Good'}
                        {userRating === 5 && 'Excellent'}
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Comment
                </label>
                <Textarea
                  placeholder="Tell us about your experience..."
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleSubmitRating}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={userRating === 0 || !selectedCategory || !userComment.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Rating'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Ratings */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="text-blue-600" size={20} />
              What Others Are Saying
            </h2>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading reviews...</span>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No reviews yet. Be the first to share your experience!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <Card key={review._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                            {review.userInitials}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{review.userDisplayName}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {review.category}
                              </Badge>
                              {review.isVerified && (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                  Verified
                                </Badge>
                              )}
                              {review.isFeatured && (
                                <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-gray-500 text-sm">
                              <Clock size={14} />
                              {review.formattedDate}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-600">
                              {review.ratingText}
                            </span>
                          </div>
                          
                          <p className="text-gray-700 text-sm mb-3">{review.comment}</p>
                          
                          {review.adminResponse && (
                            <div className="bg-blue-50 p-3 rounded-lg mb-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                                  Admin Response
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(review.adminResponse.respondedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-blue-800">{review.adminResponse.message}</p>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 px-2 transition-colors ${
                                likedReviews.has(review._id)
                                  ? 'text-blue-600 hover:text-blue-700'
                                  : 'text-gray-600 hover:text-blue-600'
                              }`}
                              onClick={() => handleLikeReview(review._id)}
                            >
                              <ThumbsUp 
                                size={14} 
                                className={`mr-1 ${
                                  likedReviews.has(review._id) ? 'fill-current' : ''
                                }`} 
                              />
                              {review.likes}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateUs;
