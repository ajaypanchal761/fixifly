import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight, Star, Search, Filter, ArrowLeft } from "lucide-react";
import BlogDetailModal from "@/components/BlogDetailModal";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const TipsTricks = () => {
  const navigate = useNavigate();
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const handleReadMore = (blogPost: any) => {
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

  // Helper function to render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-3 h-3 fill-yellow-400/50 text-yellow-400" />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-3 h-3 text-gray-300" />
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
      reviewCount: 124,
      content: "Air conditioning systems can develop various issues over time. Here are the most common problems and their solutions:\n\n1. **AC Not Cooling**: Check if the filter is dirty, thermostat settings are correct, and outdoor unit is not blocked.\n\n2. **Strange Noises**: Rattling or buzzing sounds often indicate loose parts or debris in the unit.\n\n3. **Water Leaks**: Usually caused by clogged drain lines or frozen evaporator coils.\n\n4. **High Energy Bills**: Dirty filters and poor maintenance can cause increased energy consumption.\n\nRegular maintenance and timely repairs can prevent most AC problems and extend the life of your unit."
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
      reviewCount: 89,
      content: "Television repair can be tricky, but some issues can be resolved at home:\n\n**DIY Fixes:**\n- Power issues: Check cables and power outlet\n- Remote control problems: Replace batteries or clean contacts\n- Picture quality: Adjust settings and check connections\n- Audio issues: Check volume settings and audio cables\n\n**Call a Pro For:**\n- Screen damage or cracks\n- Internal component failures\n- Complex electrical issues\n- Warranty-covered repairs\n\nAlways prioritize safety and don't attempt repairs that involve opening the TV case unless you're experienced."
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
      reviewCount: 156,
      content: "Proper refrigerator maintenance can significantly extend its lifespan:\n\n**Weekly Tasks:**\n- Clean spills immediately\n- Check door seals for damage\n- Remove expired food items\n\n**Monthly Tasks:**\n- Clean condenser coils\n- Check temperature settings\n- Clean interior surfaces\n\n**Seasonal Tasks:**\n- Deep clean interior and exterior\n- Check and replace water filter\n- Inspect door gaskets\n\n**Energy Saving Tips:**\n- Keep refrigerator full but not overcrowded\n- Set temperature to 37-40°F for fridge, 0°F for freezer\n- Ensure proper ventilation around the unit\n\nRegular maintenance prevents costly repairs and keeps your food fresh and safe."
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
      reviewCount: 203,
      content: "Washing machine issues can often be resolved with basic troubleshooting:\n\n**Common Problems & Solutions:**\n\n1. **Machine Won't Start:**\n   - Check power supply and circuit breaker\n   - Ensure door/lid is properly closed\n   - Check water supply valves\n\n2. **Not Draining:**\n   - Clean drain filter\n   - Check drain hose for kinks\n   - Remove debris from drain pump\n\n3. **Excessive Vibration:**\n   - Level the machine\n   - Check for loose items in drum\n   - Inspect shock absorbers\n\n4. **Water Leaks:**\n   - Check hose connections\n   - Inspect door seal\n   - Look for cracks in tub\n\n**Prevention Tips:**\n- Use appropriate detergent amounts\n- Clean machine monthly\n- Don't overload the machine\n- Check pockets for loose items\n\nFor complex issues or if problems persist, contact a professional technician."
    },
    {
      id: 5,
      title: "Laptop Performance Optimization Tips",
      excerpt: "Simple tricks to boost your laptop's performance and extend its battery life for better productivity.",
      image: "/laptop.avif",
      category: "Laptop",
      readTime: "6 min read",
      date: "Dec 5, 2024",
      author: "Fixifly Team",
      rating: 4.5,
      reviewCount: 98,
      content: "Keep your laptop running smoothly with these optimization tips:\n\n**Performance Boosters:**\n- Close unnecessary programs and browser tabs\n- Clear temporary files and cache regularly\n- Update operating system and drivers\n- Add more RAM if possible\n- Use SSD instead of HDD\n\n**Battery Life Tips:**\n- Reduce screen brightness\n- Turn off Wi-Fi/Bluetooth when not needed\n- Close background applications\n- Use power saving mode\n- Keep laptop cool and well-ventilated\n\n**Maintenance:**\n- Clean keyboard and screen regularly\n- Update antivirus software\n- Defragment hard drive (HDD only)\n- Backup important data\n\nRegular maintenance prevents performance degradation and extends laptop lifespan."
    },
    {
      id: 6,
      title: "Desktop Computer Cleaning & Maintenance",
      excerpt: "Complete guide to cleaning and maintaining your desktop computer for optimal performance and longevity.",
      image: "/desktop.jpg",
      category: "Desktop",
      readTime: "7 min read",
      date: "Dec 3, 2024",
      author: "Fixifly Team",
      rating: 4.8,
      reviewCount: 145,
      content: "Desktop computers require regular maintenance to perform at their best:\n\n**Cleaning Schedule:**\n- **Weekly**: Clean keyboard and mouse\n- **Monthly**: Clean monitor and case exterior\n- **Quarterly**: Clean internal components\n\n**Internal Cleaning Steps:**\n1. Power down and unplug the computer\n2. Remove side panel carefully\n3. Use compressed air to remove dust\n4. Clean fans and heat sinks\n5. Check for loose connections\n\n**Software Maintenance:**\n- Update operating system\n- Run antivirus scans\n- Clear temporary files\n- Update drivers\n- Uninstall unused programs\n\n**Hardware Checks:**\n- Monitor temperatures\n- Check fan operation\n- Inspect cables for damage\n- Test all ports and connections\n\nProper maintenance prevents overheating, improves performance, and extends component life."
    }
  ];

  const categories = ["All", "Air Conditioning", "Television", "Refrigerator", "Washing Machine", "Laptop", "Desktop"];

  // Filter blogs based on search term and category
  const filteredBlogs = blogPosts.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || blog.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 -mb-8">
          {filteredBlogs.map((post, index) => (
            <Card 
              key={post.id} 
              className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-t-lg">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-3 left-3 bg-primary/90 text-white">
                  {post.category}
                </Badge>
              </div>
              
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-gray-800 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                  {post.title}
                </CardTitle>
                <CardDescription className="text-gray-600 line-clamp-3">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Rating Section */}
                <div className="flex items-center gap-1 mb-3">
                  <div className="flex items-center gap-0.5">
                    {renderStars(post.rating)}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{post.rating}</span>
                  <span className="text-sm text-gray-500">({post.reviewCount})</span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">By {post.author}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary/80 group-hover:translate-x-1 transition-transform duration-300"
                    onClick={() => handleReadMore(post)}
                  >
                    Read More
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results Message */}
        {filteredBlogs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No tips found</h3>
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
