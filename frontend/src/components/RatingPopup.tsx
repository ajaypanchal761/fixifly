import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import reviewService from '@/services/reviewService';

interface RatingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  vendorId: string;
  vendorName: string;
  serviceName: string;
  onRatingSubmitted?: () => void;
}

const RatingPopup: React.FC<RatingPopupProps> = ({
  isOpen,
  onClose,
  bookingId,
  vendorId,
  vendorName,
  serviceName,
  onRatingSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();


  // Debug initial state
  console.log('RatingPopup component initialized with rating:', rating, 'hoveredRating:', hoveredRating);
  console.log('RatingPopup props:', { isOpen, bookingId, vendorId, vendorName, serviceName });

  // Debug component lifecycle and state changes
  useEffect(() => {
    console.log('RatingPopup mounted/updated - isOpen:', isOpen, 'rating:', rating);
  }, [isOpen, rating]);

  useEffect(() => {
    if (isOpen) {
      console.log('RatingPopup opened - resetting state');
      // Reset all state to initial values
      setRating(0);
      setHoveredRating(0);
      setComment('');
      setIsSubmitting(false);
    } else {
      console.log('RatingPopup closed');
    }
  }, [isOpen]);

  // Reset state when bookingId changes (new booking)
  useEffect(() => {
    console.log('RatingPopup bookingId changed - resetting state for booking:', bookingId);
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setIsSubmitting(false);
  }, [bookingId]);

  // Force reset on component mount
  useEffect(() => {
    console.log('RatingPopup component mounted - forcing reset');
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setIsSubmitting(false);
  }, []);

  // Additional safety check - force reset if rating is not 0
  useEffect(() => {
    if (rating !== 0) {
      console.log('RatingPopup: Rating is not 0, forcing to 0. Current rating:', rating);
      setRating(0);
    }
    if (hoveredRating !== 0) {
      console.log('RatingPopup: HoveredRating is not 0, forcing to 0. Current hoveredRating:', hoveredRating);
      setHoveredRating(0);
    }
  }, [rating, hoveredRating]);


  const ratingTexts = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  const handleRatingClick = (value: number, event?: React.MouseEvent) => {
    console.log('=== STAR CLICK EVENT ===');
    console.log('Star clicked:', value);
    console.log('Current rating before update:', rating);
    console.log('Event target:', event?.target);
    
    // Prevent default and stop propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Force update the rating - use functional update to ensure we get the latest state
    setRating(prevRating => {
      console.log('Setting rating from', prevRating, 'to', value);
      return value;
    });
    setHoveredRating(0); // Clear hover state after click
    
    // Verify the update
    setTimeout(() => {
      console.log('Rating after update (delayed check):', value);
    }, 100);
  };

  const handleRatingHover = (value: number) => {
    setHoveredRating(value);
  };

  const handleRatingLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive"
      });
      return;
    }

    if (comment.trim().length < 10) {
      toast({
        title: "Comment Required",
        description: "Please write at least 10 characters for your review.",
        variant: "destructive"
      });
      return;
    }

    if (!vendorId || vendorId.trim() === '') {
      toast({
        title: "Vendor Information Missing",
        description: "Unable to submit rating - vendor information is missing.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please login to submit a rating.",
          variant: "destructive"
        });
        return;
      }

      console.log('Token found:', token ? 'Yes' : 'No');
      console.log('Token length:', token ? token.length : 0);

      // Map service name to valid category
      const getCategoryFromService = (serviceName: string): string => {
        const service = serviceName.toLowerCase();
        if (service.includes('ac') || service.includes('air conditioner')) return 'AC Repair';
        if (service.includes('washing machine') || service.includes('washing')) return 'Washing Machine Repair';
        if (service.includes('refrigerator') || service.includes('fridge')) return 'Refrigerator Repair';
        if (service.includes('tv') || service.includes('television')) return 'TV Repair';
        if (service.includes('laptop')) return 'Laptop Repair';
        if (service.includes('desktop') || service.includes('computer')) return 'Desktop Repair';
        if (service.includes('printer')) return 'Printer Repair';
        if (service.includes('mobile') || service.includes('phone')) return 'Mobile Specialist';
        if (service.includes('tablet')) return 'Tablet Specialist';
        if (service.includes('mac') || service.includes('apple')) return 'Mac Specialist';
        if (service.includes('plumbing') || service.includes('pipe')) return 'Plumbing Services';
        if (service.includes('electrical') || service.includes('electric')) return 'Electrical Work';
        if (service.includes('carpentry') || service.includes('wood')) return 'Carpentry';
        if (service.includes('security') || service.includes('camera')) return 'Security Specialist';
        if (service.includes('data') || service.includes('recovery')) return 'Data Specialist';
        return 'General Service';
      };

      const reviewData = {
        category: getCategoryFromService(serviceName || 'General Service'),
        rating: rating,
        comment: comment.trim(),
        bookingId: bookingId,
        vendorId: vendorId
      };

      console.log('Submitting review with data:', reviewData);
      console.log('Token being sent:', token);
      console.log('Token type:', typeof token);
      console.log('Token length:', token ? token.length : 'undefined');

      await reviewService.createReview(reviewData, token);
      
      toast({
        title: "Rating Submitted!",
        description: "Thank you for your feedback. Your rating has been submitted successfully.",
        variant: "default"
      });

      // Reset form
      setRating(0);
      setComment('');
      setHoveredRating(0);
      
      // Close popup and notify parent
      onClose();
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
      
      } catch (error: any) {
        console.error('Error submitting rating:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.errors?.join(', ') || 
                           "Failed to submit rating. Please try again.";
        
        // Handle specific error cases
        if (errorMessage.includes('already reviewed')) {
          toast({
            title: "Rating Already Submitted",
            description: "You have already rated this service. Thank you for your feedback!",
            variant: "default"
          });
          // Close the popup since rating was already submitted
          onClose();
          // Notify parent that rating was already submitted
          if (onRatingSubmitted) {
            onRatingSubmitted();
          }
          return;
        }
        
        toast({
          title: "Submission Failed",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
  };

  const handleSkip = () => {
    setRating(0);
    setComment('');
    setHoveredRating(0);
    onClose();
  };

  const displayRating = hoveredRating || rating;
  
  // Debug current state
  console.log('RatingPopup render - rating:', rating, 'hoveredRating:', hoveredRating, 'displayRating:', displayRating);
  console.log('RatingPopup render - isOpen:', isOpen, 'rating === 0:', rating === 0, 'hoveredRating === 0:', hoveredRating === 0);
  
  // Force displayRating to be 0 if both rating and hoveredRating are 0
  const finalDisplayRating = (rating === 0 && hoveredRating === 0) ? 0 : displayRating;
  console.log('RatingPopup render - finalDisplayRating:', finalDisplayRating);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" style={{ zIndex: 9999 }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Rate Your Experience</DialogTitle>
          <DialogDescription className="mt-2">
            How was your service with <span className="font-medium">{vendorName}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">
              <div className="font-medium">Service: {serviceName}</div>
              <div>Vendor: {vendorName}</div>
            </div>
          </div>

          {/* Star Rating */}
          <div className="space-y-3">
            <div className="text-center">
              <div className="flex justify-center space-x-1 mb-2">
                {[1, 2, 3, 4, 5].map((value) => {
                  const isFilled = finalDisplayRating > 0 && value <= finalDisplayRating;
                  console.log(`Star ${value}: isFilled=${isFilled}, finalDisplayRating=${finalDisplayRating}, value=${value}, rating=${rating}, hoveredRating=${hoveredRating}`);
                  
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={(e) => {
                        console.log('Button clicked for star:', value);
                        handleRatingClick(value, e);
                      }}
                      onMouseEnter={() => {
                        console.log('Mouse enter star:', value);
                        handleRatingHover(value);
                      }}
                      onMouseLeave={() => {
                        console.log('Mouse leave star:', value);
                        handleRatingLeave();
                      }}
                      className="focus:outline-none transition-all duration-200 hover:scale-110 p-2 cursor-pointer hover:bg-yellow-50 rounded-full active:scale-95"
                      style={{ 
                        pointerEvents: 'auto',
                        touchAction: 'manipulation'
                      }}
                      aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`h-8 w-8 transition-colors duration-200 ${
                          isFilled
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 hover:text-yellow-200'
                        }`}
                        fill={isFilled ? 'currentColor' : 'none'}
                      />
                    </button>
                  );
                })}
              </div>
              {finalDisplayRating > 0 ? (
                <div className="text-sm font-medium text-gray-700">
                  <p>{ratingTexts[finalDisplayRating as keyof typeof ratingTexts]}</p>
                  <p className="text-xs text-gray-500">Rating: {finalDisplayRating}/5</p>
                </div>
              ) : (
                <div className="text-sm font-medium text-gray-500">
                  <p>Please select a rating</p>
                </div>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Share your experience (required)
            </label>
            <Textarea
              placeholder="Tell us about your experience with this service..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {comment.length}/500 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
              disabled={isSubmitting}
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingPopup;
