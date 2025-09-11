import React, { useState } from 'react';
import { Star, MessageSquare, ThumbsUp, Clock, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

interface Rating {
  id: number;
  userName: string;
  userInitial: string;
  rating: number;
  category: string;
  comment: string;
  date: string;
  likes: number;
}

const RateUs = () => {
  const navigate = useNavigate();
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  // Sample existing ratings data
  const existingRatings: Rating[] = [
    {
      id: 1,
      userName: "Rajesh Kumar",
      userInitial: "RK",
      rating: 5,
      category: "AC Repair",
      comment: "Excellent service! The technician was very professional and fixed my AC quickly. Highly recommended!",
      date: "2 days ago",
      likes: 12
    },
    {
      id: 2,
      userName: "Priya Sharma",
      userInitial: "PS",
      rating: 4,
      category: "Washing Machine Repair",
      comment: "Good service, but took a bit longer than expected. The technician was knowledgeable though.",
      date: "1 week ago",
      likes: 8
    },
    {
      id: 3,
      userName: "Amit Singh",
      userInitial: "AS",
      rating: 5,
      category: "Refrigerator Repair",
      comment: "Amazing service! My fridge is working perfectly now. The technician explained everything clearly.",
      date: "2 weeks ago",
      likes: 15
    },
    {
      id: 4,
      userName: "Sneha Patel",
      userInitial: "SP",
      rating: 3,
      category: "TV Repair",
      comment: "Service was okay, but the technician was late. The repair was done well though.",
      date: "3 weeks ago",
      likes: 5
    },
    {
      id: 5,
      userName: "Vikram Joshi",
      userInitial: "VJ",
      rating: 5,
      category: "Laptop Repair",
      comment: "Outstanding service! Fixed my laptop in no time. Very reasonable pricing too.",
      date: "1 month ago",
      likes: 20
    }
  ];

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

  const handleSubmitRating = () => {
    if (userRating > 0 && selectedCategory && userComment.trim()) {
      // Here you would typically send the data to your backend
      alert('Thank you for your rating! Your feedback has been submitted.');
      setUserRating(0);
      setUserComment('');
      setSelectedCategory('');
    } else {
      alert('Please fill in all fields before submitting.');
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
    <div className="min-h-screen bg-gray-50 pt-20 pb-6 px-4">
      <div className="max-w-4xl mx-auto">
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
                disabled={userRating === 0 || !selectedCategory || !userComment.trim()}
              >
                Submit Rating
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
              {existingRatings.map((rating) => (
                <Card key={rating.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                          {rating.userInitial}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{rating.userName}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {rating.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500 text-sm">
                            <Clock size={14} />
                            {rating.date}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          {renderStars(rating.rating)}
                          <span className="text-sm text-gray-600">
                            {rating.rating === 1 && 'Poor'}
                            {rating.rating === 2 && 'Fair'}
                            {rating.rating === 3 && 'Good'}
                            {rating.rating === 4 && 'Very Good'}
                            {rating.rating === 5 && 'Excellent'}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 text-sm mb-3">{rating.comment}</p>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-gray-600 hover:text-blue-600"
                          >
                            <ThumbsUp size={14} className="mr-1" />
                            {rating.likes}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateUs;
