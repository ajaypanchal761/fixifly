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
            className={`${star <= rating
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
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentReviewIndex ? 'bg-blue-600' : 'bg-gray-300'
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
    <section
      className={`relative flex items-start lg:items-center justify-center pt-4 lg:pt-0 ${showMoreProducts ? 'min-h-fit' : 'min-h-fit lg:min-h-[calc(100vh-76px)]'
        }`}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 hero-gradient opacity-10" />

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-float opacity-20">
        <div className="w-20 h-20 bg-gradient-tech rounded-full blur-xl" />
      </div>
      <div className="absolute bottom-32 right-16 animate-float opacity-30" >
        <div className="w-16 h-16 bg-gradient-primary rounded-full blur-lg" />
      </div>

      <div className={`relative z-10 container mx-auto px-4 sm:px-6 md:px-8 lg:px-8 pt-0 sm:pt-0 md:pt-0 lg:pt-0`}>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-center">

          {/* LEFT COLUMN – Text + Products + Buttons + Trust */}
          <div className="order-2 lg:order-1 p-4">

            {/* Text Content */}
            <div
              className="text-center lg:text-left animate-slide-up -mt-4 sm:-mt-3 md:-mt-2 lg:mt-0 lg:w-full lg:pr-8 pb-4"
              data-aos="fade-right"
              data-aos-delay="100"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6">
                All <span className="text-gradient">IT Needs</span> is here<br className="hidden lg:block" />
                at <span className="text-gradient">your DoorStep</span>
              </h1>

              <p className="hidden sm:block text-md sm:text-md md:text-md text-muted-foreground mb-6 max-w-2xl mx-auto lg:mx-0">
                Professional Laptop, Desktop, Electronics repair services at Door Step.
                Certified technicians and lightning-fast turnaround times.
              </p>
            </div>

            {/* Top 3 Featured Products */}
            <div
              className="flex gap-2 sm:gap-3 md:gap-4 mb-4 max-w-4xl mx-auto lg:mx-0"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              {productsLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-lg flex-1 flex justify-center">
                    <Loader2 className="animate-spin text-gray-400" />
                  </div>
                ))
                : products.slice(0, 3).map(product => (
                  <div
                    key={product._id}
                    className="bg-white rounded-xl p-1 shadow-lg hover:shadow-xl transition cursor-pointer flex-1"
                    onClick={() => handleProductClick(product)}
                  >
                    <div className="text-center">
                      <img
                        src={product.primaryImage || "/placeholder.svg"}
                        alt={product.name}
                        className="w-16 h-16 mx-auto mb-2 object-contain"
                      />
                      <h3 className="text-sm font-bold">{product.name}</h3>
                    </div>
                  </div>
                ))}
            </div>


          </div>

          {/* RIGHT COLUMN – Banner */}
          <div
            className="relative animate-fade-in-delay order-1 lg:order-2 lg:flex lg:justify-end"
            data-aos="fade-left"
            data-aos-delay="200"
          >
            <div className="relative rounded-3xl overflow-hidden w-full max-w-2xl">
              {banners.map((banner, index) => (
                <img
                  key={index}
                  src={banner}
                  alt="Banner"
                  className={`transition-opacity duration-1000 ${index === currentBanner ? "opacity-100" : "opacity-0 absolute inset-0"
                    }`}
                />
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Full Width Section */}
        <div className="w-full md:mt-12 mb-2">
          {/* More Services Button */}
          <div
            className="flex justify-center mx-auto mb-8"
            data-aos="fade-up"
            data-aos-delay="400"
          >
            <button
              onClick={toggleMoreProducts}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg"
            >
              {showMoreProducts ? "Show Less" : "More Services"}
            </button>
          </div>

          {/* Additional Products */}
          {showMoreProducts && (
            <div
              className="grid grid-cols-3 gap-3 md:flex md:overflow-x-auto md:gap-6 mb-12 animate-fade-in pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]"
              data-aos="fade-up"
              data-aos-delay="500"
            >
              {allProducts.map(product => (
                <div
                  key={product._id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 md:p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 border border-white/20 md:min-w-[180px]"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="text-center">
                    <div className="bg-gray-50 rounded-xl p-2 mb-3 h-16 md:h-20 flex items-center justify-center">
                      <img
                        src={product.primaryImage || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <h3 className="text-xs md:text-sm font-bold text-gray-800 line-clamp-2">{product.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trust Indicators */}
          <div
            className="grid grid-cols-3 gap-2 md:flex md:justify-center md:items-center md:gap-16 max-w-5xl mx-auto px-2 md:px-4"
            data-aos="fade-up"
            data-aos-delay="600"
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mb-3 text-white shadow-lg shadow-blue-500/20">
                <Building2 className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h4 className="text-xs md:text-sm font-bold text-gray-900 leading-tight">Private Limited</h4>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Company</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mb-3 text-white shadow-lg shadow-blue-500/20">
                <Award className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h4 className="text-xs md:text-sm font-bold text-gray-900 leading-tight">ISO 9001:2015</h4>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Certified</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mb-3 text-white shadow-lg shadow-blue-500/20">
                <Star className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h4 className="text-xs md:text-sm font-bold text-gray-900 leading-tight">Positive Rating</h4>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Trusted Service</p>
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