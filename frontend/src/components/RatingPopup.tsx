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



  // Reset state only when popup opens or bookingId changes
  useEffect(() => {
    if (isOpen) {
      // Reset all state to initial values
      setRating(0);
      setHoveredRating(0);
      setComment('');
      setIsSubmitting(false);
    }
  }, [isOpen, bookingId]);


  const ratingTexts = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  const handleRatingClick = (value: number, event?: React.MouseEvent) => {
    // Prevent default and stop propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setRating(value);
    setHoveredRating(0); // Clear hover state after click
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

      let token = localStorage.getItem('accessToken');

      // Robust token cleaning
      if (token) {
        token = token.trim();
        // Remove quotes if present at both start and end
        if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
          token = token.slice(1, -1);
        }
      }

      // Check for invalid token strings that might be stored literally
      if (!token || token === 'undefined' || token === 'null') {
        toast({
          title: "Authentication Required",
          description: "Please login to submit a rating.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }


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


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" style={{ zIndex: 9999 }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Rate Your
          </DialogTitle>
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
              <div className="flex justify-center space-x-2 mb-3">
                {[1, 2, 3, 4, 5].map((value) => {
                  const isFilled = displayRating > 0 && value <= displayRating;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setRating(value);
                        setHoveredRating(0);
                      }}
                      onMouseEnter={() => setHoveredRating(value)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="focus:outline-none transition-all duration-200 hover:scale-110 p-1 cursor-pointer hover:bg-yellow-50 rounded-full active:scale-95"
                      style={{
                        pointerEvents: 'auto',
                        touchAction: 'manipulation'
                      }}
                      aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`h-8 w-8 transition-all duration-200 ${isFilled
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300 hover:text-yellow-300'
                          }`}
                        fill={isFilled ? 'currentColor' : 'none'}
                        strokeWidth={isFilled ? 0 : 1.5}
                      />
                    </button>
                  );
                })}
              </div>
              {displayRating > 0 ? (
                <div className="text-sm font-medium text-gray-700">
                  <p className="text-lg font-semibold text-yellow-600">{ratingTexts[displayRating as keyof typeof ratingTexts]}</p>
                  <p className="text-xs text-gray-500">Rating: {displayRating}/5</p>
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
              autoFocus={false}
              onFocus={(e) => e.target.setSelectionRange(e.target.value.length, e.target.value.length)}
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
