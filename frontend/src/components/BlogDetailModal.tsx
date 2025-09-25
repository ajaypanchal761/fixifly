import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Star, X } from "lucide-react";

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
  if (!blogPost) return null;

  // Helper function to render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-2 h-2 fill-yellow-400 text-yellow-400" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-2 h-2 fill-yellow-400/50 text-yellow-400" />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-2 h-2 text-gray-300" />
      );
    }
    
    return stars;
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs sm:max-w-sm md:max-w-md max-h-[75vh] overflow-y-auto mx-1 sm:mx-4 mt-6 sm:mt-12 rounded-xl">
        <DialogHeader className="relative pb-1">      
          <DialogTitle className="text-xs sm:text-sm font-bold pr-5 leading-tight">
            {blogPost.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 sm:space-y-2">
          {/* Blog Image */}
          <div className="relative">
            <img 
              src={blogPost.featuredImage || '/placeholder.svg'} 
              alt={blogPost.title}
              className="w-full h-24 sm:h-32 object-cover rounded-lg"
            />
            <Badge className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 bg-primary/90 text-white text-xs px-1 py-0.5 rounded-md">
              {blogPost.category}
            </Badge>
          </div>

          {/* Blog Meta Information */}
          <div className="flex flex-wrap items-center gap-0.5 sm:gap-1 text-xs text-gray-600">
            <div className="flex items-center gap-0.5">
              <Calendar className="w-2 h-2" />
              <span className="text-xs">{blogPost.formattedDate}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Clock className="w-2 h-2" />
              <span className="text-xs">{blogPost.readTime}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="flex items-center gap-0.5">
                {renderStars(blogPost.rating)}
              </div>
              <span className="font-semibold text-xs">{blogPost.rating}</span>
              <span className="text-xs">({blogPost.reviewCount})</span>
            </div>
            <span className="text-xs hidden sm:inline">By {blogPost.author.name}</span>
          </div>


          {/* Blog Content */}
          <div className="prose prose-gray max-w-none prose-xs sm:prose-sm text-xs sm:text-sm">
            <div className="whitespace-pre-wrap">
              {blogPost.content || 'No content available'}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlogDetailModal;
