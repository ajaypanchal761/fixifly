import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight, Star } from "lucide-react";
import BlogDetailModal from "./BlogDetailModal";
import { useState } from "react";

const Blog = () => {
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleReadMore = (blogPost: any) => {
    setSelectedBlog(blogPost);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBlog(null);
  };

  // Helper function to render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-400 text-yellow-400" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-400/50 text-yellow-400" />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-300" />
      );
    }
    
    return stars;
  };

  const blogPosts = [
    {
      id: 1,
      title: "Common AC Problems and How to Fix Them",
      excerpt: "Learn about the most common air conditioning issues and simple troubleshooting steps you can take before calling a professional.",
      image: "/ac.png",
      category: "Air Conditioning",
      readTime: "5 min read",
      date: "Dec 15, 2024",
      author: "Fixifly Team",
      rating: 4.8,
      reviewCount: 124
    },
    {
      id: 2,
      title: "TV Repair Guide: When to DIY vs Call a Pro",
      excerpt: "Discover which TV problems you can fix yourself and when it's time to call in the experts for professional repair services.",
      image: "/tv.avif",
      category: "Television",
      readTime: "7 min read",
      date: "Dec 12, 2024",
      author: "Fixifly Team",
      rating: 4.6,
      reviewCount: 89
    },
    {
      id: 3,
      title: "Refrigerator Maintenance Tips for Longevity",
      excerpt: "Essential maintenance tips to keep your refrigerator running efficiently and extend its lifespan for years to come.",
      image: "/fidge.jpeg",
      category: "Refrigerator",
      readTime: "6 min read",
      date: "Dec 10, 2024",
      author: "Fixifly Team",
      rating: 4.9,
      reviewCount: 156
    },
    {
      id: 4,
      title: "Washing Machine Troubleshooting Guide",
      excerpt: "Step-by-step guide to diagnose and fix common washing machine problems without professional help.",
      image: "/washing.jpg",
      category: "Washing Machine",
      readTime: "8 min read",
      date: "Dec 8, 2024",
      author: "Fixifly Team",
      rating: 4.7,
      reviewCount: 203
    },
  ];

  return (
    <section className="pt-8 pb-0 sm:pb-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 animate-slide-up" data-aos="fade-up" data-aos-delay="100">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Latest <span className="text-gradient">Blog Posts</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay updated with expert tips, maintenance guides, and troubleshooting advice 
            for all your home appliance needs.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-12" data-aos="fade-up" data-aos-delay="200">
          {blogPosts.map((post, index) => (
            <Card 
              key={post.id} 
              className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up group cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
              data-aos="zoom-in"
              data-aos-delay={300 + (index * 100)}
            >
              <div className="relative overflow-hidden rounded-t-lg">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-24 sm:h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-primary/90 text-white text-xs px-1 py-0.5 sm:px-2 sm:py-1">
                  {post.category}
                </Badge>
              </div>
              
              <CardHeader className="pb-1 px-2 sm:px-4 pt-2 sm:pt-3">
                <CardTitle className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                  {post.title}
                </CardTitle>
                <CardDescription className="text-gray-600 text-xs line-clamp-1 sm:line-clamp-2">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0 px-2 sm:px-4 pb-2 sm:pb-4">
                {/* Rating Section */}
                <div className="flex items-center gap-0.5 mb-1 sm:mb-2">
                  <div className="flex items-center gap-0.5">
                    {renderStars(post.rating)}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{post.rating}</span>
                  <span className="text-xs text-gray-500">({post.reviewCount})</span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-2 sm:mb-3">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="text-xs">{post.date}</span>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="text-xs">{post.readTime}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 hidden sm:inline">By {post.author}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary/80 group-hover:translate-x-1 transition-transform duration-300 text-xs px-1 py-0.5 h-5 sm:h-6 sm:px-2 sm:py-1"
                    onClick={() => handleReadMore(post)}
                  >
                    <span className="hidden sm:inline">Read More</span>
                    <span className="sm:hidden">Read</span>
                    <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5 sm:ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Statistics */}
        <div className="hidden md:block bg-gradient-card rounded-3xl p-6 sm:p-8 pb-6 sm:pb-8 animate-fade-in-delay" data-aos="fade-up" data-aos-delay="400">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">10K+</div>
              <div className="text-muted-foreground text-sm sm:text-base">Happy Customers</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">98%</div>
              <div className="text-muted-foreground text-sm sm:text-base">Success Rate</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground text-sm sm:text-base">Support Available</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">1 Year</div>
              <div className="text-muted-foreground text-sm sm:text-base">Service Warranty</div>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Detail Modal */}
      <BlogDetailModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        blogPost={selectedBlog}
      />
    </section>
  );
};

export default Blog;
