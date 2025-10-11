import { Building2, Award, Star, Loader2, MessageSquare, ThumbsUp, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import publicProductApi, { PublicProduct } from '@/services/publicProductApi';
import bannerApiService from '@/services/bannerApi';
import { reviewService, Review } from '@/services/reviewService';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import CitySelectionModal from './CitySelectionModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import cityApiService from '@/services/cityApi';

// Reviews Carousel Component
const ReviewsCarousel = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await reviewService.getReviews({ 
          limit: 10, 
          sort: 'newest'
        });
        setReviews(response.data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  useEffect(() => {
    if (reviews.length > 0) {
      const interval = setInterval(() => {
        setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
      }, 4000); // Change review every 4 seconds

      return () => clearInterval(interval);
    }
  }, [reviews.length]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={`${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-600">Loading reviews...</span>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div>
          <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No reviews yet</p>
        </div>
      </div>
    );
  }

  const currentReview = reviews[currentReviewIndex];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-900">Customer Reviews</h3>
      </div>
      
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-start gap-3 mb-3 animate-fade-in">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-semibold">
              {currentReview.userInitials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {currentReview.userDisplayName}
              </h4>
              <Badge variant="secondary" className="text-xs px-1 py-0">
                {currentReview.category}
              </Badge>
              {currentReview.isVerified && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                  ✓ Verified
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              {renderStars(currentReview.rating)}
              <span className="text-xs text-gray-500">
                {currentReview.formattedDate}
              </span>
            </div>
            
            <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed">
              "{currentReview.comment}"
            </p>
          </div>
        </div>
      </div>
      
      {/* Review Indicators */}
      <div className="flex justify-center space-x-1 mt-3">
        {reviews.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentReviewIndex(index)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              index === currentReviewIndex ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
      
      {/* Review Counter */}
      <div className="text-center mt-2">
        <span className="text-xs text-gray-500">
          Review {currentReviewIndex + 1} of {reviews.length}
        </span>
      </div>
    </div>
  );
};

const Hero = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showMoreProducts, setShowMoreProducts] = useState(false);
  const [allProducts, setAllProducts] = useState<PublicProduct[]>([]);
  const [banners, setBanners] = useState<string[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [isCitySelectionModalOpen, setIsCitySelectionModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [selectedCity, setSelectedCity] = useState<any>(null);

  // Fetch banners from database
  const fetchBanners = async () => {
    try {
      setBannersLoading(true);
      const bannerUrls = await bannerApiService.getBannerImageUrls('user');
      
      if (bannerUrls.length > 0) {
        setBanners(bannerUrls);
        console.log('Loaded banners from database:', bannerUrls.length);
      } else {
        console.log('No banners found in database, using fallback banners');
        setBanners(['/banner1.png', '/banner2.png', '/banner3.png']);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      setBanners(['/banner1.png', '/banner2.png', '/banner3.png']);
    } finally {
      setBannersLoading(false);
    }
  };

  // Fetch featured products from public API
  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      
      // Get featured products for main display (top 3)
      const featuredResponse = await publicProductApi.getFeaturedProducts();
      console.log('Featured Products Response:', featuredResponse);
      
      let featuredProducts = [];
      if (featuredResponse && featuredResponse.data && featuredResponse.data.products) {
        featuredProducts = featuredResponse.data.products;
        console.log('Featured products found:', featuredProducts.length);
      }
      
      // Get all active products for "More Services" section
      const allProductsResponse = await publicProductApi.getAllActiveProducts();
      console.log('All Products Response:', allProductsResponse);
      
      let allActiveProducts = [];
      if (allProductsResponse && allProductsResponse.data && allProductsResponse.data.products) {
        allActiveProducts = allProductsResponse.data.products;
        console.log('All active products found:', allActiveProducts.length);
      }
      
      // Transform featured products for main display
      const transformedFeaturedProducts = featuredProducts.map(product => ({
        ...product,
        name: product.productName,
        primaryImage: product.productImage,
        category: { name: product.serviceType }
      }));
      
      // Transform all products for "More Services" section
      const transformedAllProducts = allActiveProducts.map(product => ({
        ...product,
        name: product.productName,
        primaryImage: product.productImage,
        category: { name: product.serviceType }
      }));
      
      // Filter and set featured products (top 3)
      const validFeaturedProducts = transformedFeaturedProducts.filter(p => p && p.name && p._id);
      console.log('Valid featured products after filtering:', validFeaturedProducts.length);
      setProducts(validFeaturedProducts);
      
      // Filter and set all products for "More Services"
      const validAllProducts = transformedAllProducts.filter(p => p && p.name && p._id);
      console.log('Valid all products after filtering:', validAllProducts.length);
      setAllProducts(validAllProducts);
      
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to empty arrays if API fails
      setProducts([]);
      setAllProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };


  // Banner rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  // Fetch banners and products on component mount
  useEffect(() => {
    fetchBanners();
    fetchProducts();
  }, []);

  // Toggle function for showing more products
  const toggleMoreProducts = () => {
    setShowMoreProducts(!showMoreProducts);
  };

  // Handle product card click
  const handleProductClick = async (product: PublicProduct) => {
    // Check if user is authenticated and has a city in their profile
    if (isAuthenticated && user?.address?.city) {
      try {
        // Fetch available cities for this service
        const citiesResponse = await cityApiService.getActiveCities({ limit: 100 });
        
        if (citiesResponse.success && citiesResponse.data.cities) {
          const availableCities = citiesResponse.data.cities;
          const userCity = user.address.city.toLowerCase().trim();
          
          // Check if user's city is available for this service
          const isUserCityAvailable = availableCities.some(city => 
            city.isActive && city.name.toLowerCase().trim() === userCity
          );
          
          if (!isUserCityAvailable) {
            // Show error popup
            toast({
              title: "Service Not Available",
              description: `Service is not available in your profile City (${user.address.city})`,
              variant: "destructive"
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error checking city availability:', error);
        // If there's an error, proceed with normal flow
      }
    }
    
    // If user is not authenticated, doesn't have a city, or city is available, proceed normally
    setSelectedProduct(product);
    setIsCitySelectionModalOpen(true);
  };

  // Handle city selection
  const handleCitySelect = (city: any) => {
    setSelectedCity(city);
    setIsCitySelectionModalOpen(false);
    if (selectedProduct) {
      navigate(`/product/${selectedProduct._id}`, { 
        state: { 
          product: selectedProduct,
          selectedCity: city 
        } 
      });
    }
    setSelectedProduct(null);
    setSelectedCity(null);
  };

  // Handle close city selection modal
  const handleCloseCitySelectionModal = () => {
    setIsCitySelectionModalOpen(false);
    setSelectedProduct(null);
    setSelectedCity(null);
  };



  return (
    <section className="relative flex items-center justify-center min-h-[90vh] sm:min-h-screen">
      {/* Background Gradient */}
      <div className="absolute inset-0 hero-gradient opacity-10" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-float opacity-20">
        <div className="w-20 h-20 bg-gradient-tech rounded-full blur-xl" />
      </div>
      <div className="absolute bottom-32 right-16 animate-float opacity-30" >
        <div className="w-16 h-16 bg-gradient-primary rounded-full blur-lg" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:pt-14 lg:pt-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Banner Slideshow - Shows first on mobile, second on desktop */}
        <div className="relative animate-fade-in-delay order-1 lg:order-2 lg:absolute lg:right-0 lg:top-48 lg:transform lg:-translate-y-1/2 lg:w-1/2 lg:pr-8 mt-6 lg:mt-0 lg:z-50" data-aos="fade-left" data-aos-delay="200">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-tech rounded-3xl blur-3xl opacity-20 animate-pulse" />
              <div className="relative rounded-3xl overflow-hidden">
                {bannersLoading ? (
                  <div className="w-full h-44 sm:h-56 md:h-64 lg:h-72 xl:h-80 bg-gray-200 rounded-3xl flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Loading banners...</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-44 sm:h-56 md:h-64 lg:h-72 xl:h-80">
                    {banners.map((banner, index) => (
                      <img 
                        key={index}
                        src={banner} 
                        alt={`Fixfly Banner ${index + 1}`} 
                        className={`w-full h-full object-cover object-center rounded-3xl shadow-2xl transition-opacity duration-1000 ${
                          index === currentBanner ? 'opacity-100' : 'opacity-0 absolute top-0 left-0'
                        }`}
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          // Ensure image fills container properly
                          img.style.minHeight = '100%';
                          img.style.minWidth = '100%';
                        }}
                        onError={(e) => {
                          console.error('Banner image failed to load:', banner);
                          // Hide the broken image
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ))}
                  </div>
                )}
                {/* Banner Indicators */}
                {!bannersLoading && banners.length > 1 && (
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
                )}
              </div>
            </div>
          </div>

          {/* User Reviews Display - Desktop Only, Show when More Services is expanded */}
          {showMoreProducts && (
            <div className="hidden lg:block absolute bottom-16 right-14 w-full max-w-2xl">
              <div className="flex justify-end items-end">
                <div className="w-full max-w-xl h-64 bg-white rounded-lg shadow-lg p-4">
                  <ReviewsCarousel />
                </div>
              </div>
            </div>
          )}

          {/* Text Content - Shows second on mobile, first on desktop */}
          <div className="text-center lg:text-left animate-slide-up order-2 lg:order-1 -mt-8 lg:mt-0 lg:w-full lg:pr-8" data-aos="fade-right" data-aos-delay="100">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              All <span className="text-gradient">IT Needs</span> is Here at <span className="text-gradient">your DoorStep </span>
            </h1>
            <p className="hidden sm:block text-lg sm:text-xl text-muted-foreground mb-4 sm:mb-8 max-w-2xl">
              Professional Laptop, Desktop, Electronics repair services at Door Step. 
              Certified technicians and lightning-fast turnaround times.
            </p>

            {/* Top 3 Featured Product Cards */}
            <div className="flex flex-row gap-2 sm:gap-4 mb-6 sm:mb-8 max-w-4xl mx-auto lg:mx-0" data-aos="fade-up" data-aos-delay="300">
              {productsLoading ? (
                // Loading state
                Array.from({ length: 3 }).map((_, index) => (
                  <div 
                    key={index}
                    className="bg-white rounded-xl p-2 sm:p-4 shadow-lg flex-1 flex items-center justify-center" 
                    style={{backgroundColor: '#ffffff'}}
                  >
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 animate-spin text-gray-400" />
                      <h3 className="text-xs sm:text-sm font-bold text-gray-400 leading-tight">Loading...</h3>
                    </div>
                  </div>
                ))
              ) : (
                // Show only top 3 featured products
                Array.from({ length: 3 }).map((_, index) => {
                  const product = products[index];
                  console.log(`Featured Card ${index + 1}:`, product ? `Product: ${product.name}` : 'No product - showing placeholder');
                  
                  if (product) {
                    // Show actual product card
                    const primaryImage = product.primaryImage;
                    return (
                      <div 
                        key={product._id}
                        className="bg-white rounded-xl p-2 sm:p-4 shadow-lg hover:shadow-xl transition-shadow duration-300 flex-1 cursor-pointer" 
                        style={{backgroundColor: '#ffffff'}}
                        onClick={() => handleProductClick(product)}
                      >
                        <div className="text-center">
                          <img 
                            src={primaryImage || '/placeholder.svg'} 
                            alt={product.name} 
                            className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 object-contain rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder.svg';
                            }}
                          />
                          <h3 className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">{product.name}</h3>
                        </div>
                      </div>
                    );
                  } else {
                    // Show placeholder card
                    return (
                      <div 
                        key={`placeholder-${index}`}
                        className="bg-white rounded-xl p-2 sm:p-4 shadow-lg flex-1 flex items-center justify-center" 
                        style={{backgroundColor: '#ffffff'}}
                      >
                        <div className="text-center">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No Product</span>
                          </div>
                          <h3 className="text-xs sm:text-sm font-bold text-gray-400 leading-tight">Coming Soon</h3>
                        </div>
                      </div>
                    );
                  }
                })
              )}
            </div>

            {/* More Services Button */}
            <div className="flex justify-center mb-6 sm:mb-8" data-aos="fade-up" data-aos-delay="400">
              <button
                onClick={toggleMoreProducts}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {showMoreProducts ? 'Show Less' : 'More Services'}
              </button>
            </div>

            {/* Additional Products (Toggle) - Non-featured products */}
            {showMoreProducts && allProducts.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:flex lg:flex-row lg:overflow-x-auto mb-6 sm:mb-8 max-w-4xl mx-auto lg:mx-0" data-aos="fade-up" data-aos-delay="500">
                {allProducts
                  .filter(product => {
                    // Show products that are not in the featured products list
                    const isNotFeatured = !products.some(featuredProduct => featuredProduct._id === product._id);
                    return product && product._id && isNotFeatured;
                  })
                  .map((product) => {
                    console.log('More Services product:', product?.name || 'Unknown Product');
                    const primaryImage = product.primaryImage;
                    return (
                      <div 
                        key={product._id}
                        className="bg-white rounded-xl p-2 sm:p-4 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer lg:flex-shrink-0 lg:min-w-[120px]" 
                        style={{backgroundColor: '#ffffff'}}
                        onClick={() => handleProductClick(product)}
                      >
                        <div className="text-center">
                          <img 
                            src={primaryImage || '/placeholder.svg'} 
                            alt={product.name} 
                            className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 object-contain rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder.svg';
                            }}
                          />
                          <h3 className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">{product.name}</h3>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}


            {/* Company Trust Indicators */}
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto lg:mx-0 lg:ml-16 mb-8" data-aos="fade-up" data-aos-delay="600">
              <div className="text-center">
                <div className="bg-gradient-tech p-3 rounded-xl w-fit mx-auto mb-2">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-semibold">Private Limited</p>
                <p className="text-xs text-muted-foreground">Company</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-tech p-3 rounded-xl w-fit mx-auto mb-2">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-semibold">ISO 9001:2015</p>
                <p className="text-xs text-muted-foreground">Certified</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-tech p-3 rounded-xl w-fit mx-auto mb-2">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-semibold">Positive Rating</p>
                <p className="text-xs text-muted-foreground">Trusted Service</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* City Selection Modal */}
      {selectedProduct && (
        <CitySelectionModal
          isOpen={isCitySelectionModalOpen}
          onClose={handleCloseCitySelectionModal}
          onCitySelect={handleCitySelect}
          serviceName={selectedProduct.productName}
          serviceId={selectedProduct._id}
        />
      )}
    </section>
  );
};

export default Hero;