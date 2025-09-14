import { Button } from "@/vendor/components/ui/button";
import { Users, TrendingUp, Clock, Shield, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMediaQuery, useTheme } from "@mui/material";

const VendorHero = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [currentStat, setCurrentStat] = useState(0);
  const [currentBanner, setCurrentBanner] = useState(0);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const banners = ['/banner1.png', '/banner2.png', '/banner3.png'];

  const vendorStats = [
    { icon: Users, value: "500+", label: "Active Customers", color: "bg-blue-500" },
    { icon: TrendingUp, value: "₹2.5L+", label: "Monthly Revenue", color: "bg-green-500" },
    { icon: Star, value: "4.8", label: "Average Rating", color: "bg-yellow-500" },
    { icon: Clock, value: "24/7", label: "Support Available", color: "bg-purple-500" }
  ];


  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % vendorStats.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  // Only show hero section on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <section className="relative flex items-start justify-center overflow-hidden min-h-[60vh] sm:min-h-[70vh]">
      {/* Background Gradient */}
      <div className="absolute bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-50" />
      
      <div className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Banner Slideshow - Shows first on mobile */}
          <div className="relative animate-fade-in-delay order-1 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-3xl opacity-20 animate-pulse" />
              <div className="relative rounded-3xl overflow-hidden">
                <div className="relative w-full h-auto">
                  {banners.map((banner, index) => (
                    <img 
                      key={index}
                      src={banner} 
                      alt={`Fixifly Banner ${index + 1}`} 
                      className={`w-full h-auto rounded-3xl shadow-2xl transition-opacity duration-1000 ${
                        index === currentBanner ? 'opacity-100' : 'opacity-0 absolute top-0 left-0'
                      }`}
                    />
                  ))}
                </div>
                {/* Banner Indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBanner(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentBanner ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center lg:text-left animate-slide-up order-2 lg:w-full lg:pr-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Welcome to Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Vendor Portal</span>
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VendorHero;
