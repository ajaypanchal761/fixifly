import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Star, X, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  category: string;
  readTime: string;
  formattedDate: string;
  author: {
    name: string;
  };
  rating: number;
  reviewCount: number;
}

interface BlogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  blogPost: BlogPost | null;
}

const BlogDetailModal = ({ isOpen, onClose, blogPost }: BlogDetailModalProps) => {
  const navigate = useNavigate();
  
  // Handle browser back button when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePopState = (event: PopStateEvent) => {
      // Prevent default back navigation, just close the modal
      event.preventDefault();
      onClose();
      // Push current state to prevent going back further
      window.history.pushState(null, '', window.location.href);
    };

    // Push a state when modal opens to handle back button
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);
  
  if (!blogPost) return null;

  const handleBack = () => {
    onClose();
  };

  // Helper function to render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      );
    }
    
    return stars;
  };


  return (
    <>
      <style>{`
        [data-radix-dialog-overlay] {
          z-index: 9999 !important;
          background-color: white !important;
          left: 0 !important;
          right: 0 !important;
          top: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
        }
        [data-radix-dialog-content] {
          z-index: 10000 !important;
        }
      `}</style>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg sm:max-w-2xl md:max-w-4xl max-h-[90vh] mx-auto mt-6 sm:mt-12 rounded-xl p-0 flex flex-col">
          <DialogHeader className="relative pb-3 px-6 pt-6 flex-shrink-0">
            {/* Back Button - Desktop Only */}
            <div className="hidden md:block mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold pr-5 leading-tight">
              {blogPost.title}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 min-h-0">
            <div className="space-y-3 sm:space-y-4 pb-24">
              {/* Blog Image */}
              <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                <img 
                  src={blogPost.featuredImage || '/placeholder.svg'} 
                  alt={blogPost.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-40 sm:h-48 md:h-56 object-cover"
                />
                <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-primary/90 text-white text-sm px-2 py-1 rounded-md">
                  {blogPost.category}
                </Badge>
              </div>

              {/* Blog Meta Information */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{blogPost.formattedDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{blogPost.readTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-0.5">
                    {renderStars(blogPost.rating)}
                  </div>
                  <span className="font-semibold text-sm">{blogPost.rating}</span>
                  <span className="text-sm">({blogPost.reviewCount})</span>
                </div>
                <span className="text-sm hidden sm:inline">By {blogPost.author.name}</span>
              </div>


              {/* Blog Content */}
              <div className="prose prose-gray max-w-none prose-sm sm:prose-base md:prose-lg text-sm sm:text-base md:text-lg">
                <div className="whitespace-pre-wrap leading-relaxed">
                  {blogPost.content || 'No content available'}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BlogDetailModal;
