import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight, Star, Search, Filter, ArrowLeft, Loader2, Heart } from "lucide-react";
import BlogDetailModal from "@/components/BlogDetailModal";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { blogApi, Blog } from "@/services/blogApi";
import { toast } from "@/hooks/use-toast";

const TipsTricks = () => {
  const navigate = useNavigate();
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{name: string, count: number}>>([]);
  const [likedBlogs, setLikedBlogs] = useState<Set<string>>(new Set());

  const handleReadMore = (blogPost: Blog) => {
    setSelectedBlog(blogPost);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBlog(null);
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleLike = async (blogId: string) => {
    // Check if user already liked this post
    if (likedBlogs.has(blogId)) {
      toast({
        title: "Already Liked",
        description: "You have already liked this blog post!",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await blogApi.likeBlog(blogId);
      if (response.success) {
        // Update the blog in the state with new likes count
        setBlogs(prevBlogs => 
          prevBlogs.map(blog => 
            blog.id === blogId 
              ? { ...blog, likes: response.data.likes }
              : blog
          )
        );
        // Add to liked blogs set
        setLikedBlogs(prev => new Set(prev).add(blogId));
        toast({
          title: "Liked!",
          description: "Thank you for liking this blog post!",
        });
      }
    } catch (error: any) {
      console.error('Error liking blog:', error);
      if (error.message?.includes('already liked')) {
        toast({
          title: "Already Liked",
          description: "You have already liked this blog post!",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to like the blog post. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Helper function to render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-2.5 h-2.5 fill-yellow-400/50 text-yellow-400" />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-2.5 h-2.5 text-gray-300" />
      );
    }
    
    return stars;
  };

  // Load blogs and categories on component mount
  useEffect(() => {
    loadBlogs();
    loadCategories();
  }, []);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        limit: 50 // Load more blogs for the tips page
      };

      if (selectedCategory !== "All") {
        params.category = selectedCategory;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await blogApi.getBlogs(params);
      
      if (response.success) {
        setBlogs(response.data.blogs);
      }
    } catch (error) {
      console.error('Error loading blogs:', error);
      toast({
        title: "Error",
        description: "Failed to load blog posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await blogApi.getBlogCategories();
      
      if (response.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Reload blogs when search term or category changes
  useEffect(() => {
    loadBlogs();
  }, [searchTerm, selectedCategory]);

  // Get all available categories for the filter
  const allCategories = ["All", ...categories.map(cat => cat.name)];

  return (
    <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20">
      <div className="container mx-auto px-2 sm:px-4 lg:px-8 py-8 sm:py-4">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToHome}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>

        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Tips & <span className="text-gradient">Tricks</span>
          </h1>
        </div>

        {/* Search and Filter Section */}
        <div className="-mt-8 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search tips and tricks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Blog Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading blog posts...</span>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 -mb-8">
            {blogs.map((post, index) => (
            <Card 
              key={post.id} 
              className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-t-lg">
                <img 
                  src={post.featuredImage || '/placeholder.svg'} 
                  alt={post.title}
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-2 left-2 bg-primary/90 text-white text-xs px-2 py-1">
                  {post.category}
                </Badge>
              </div>
              
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm font-bold text-gray-800 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                  {post.title}
                </CardTitle>
                <CardDescription className="text-gray-600 line-clamp-2 text-xs">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0 px-3 pb-3">
                {/* Rating Section */}
                <div className="flex items-center gap-1 mb-2">
                  <div className="flex items-center gap-0.5">
                    {renderStars(post.rating)}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{post.rating}</span>
                  <span className="text-xs text-gray-500">({post.reviewCount})</span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{post.formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">By {post.author.name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`text-xs h-6 px-2 ${
                        likedBlogs.has(post.id) 
                          ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                          : 'text-red-500 hover:text-red-600 hover:bg-red-50'
                      }`}
                      onClick={() => handleLike(post.id)}
                      disabled={likedBlogs.has(post.id)}
                    >
                      <Heart className={`w-3 h-3 mr-1 ${
                        likedBlogs.has(post.id) ? 'fill-current' : ''
                      }`} />
                      <span className="text-xs">{post.likes}</span>
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary/80 group-hover:translate-x-1 transition-transform duration-300 text-xs h-6 px-2"
                    onClick={() => handleReadMore(post)}
                  >
                    Read More
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {/* No Results Message */}
        {!loading && blogs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No blog posts found</h3>
            <p className="text-gray-500">Try adjusting your search terms or category filter.</p>
          </div>
        )}
      </div>

      {/* Blog Detail Modal */}
      <BlogDetailModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        blogPost={selectedBlog}
      />
    </div>
  );
};

export default TipsTricks;
