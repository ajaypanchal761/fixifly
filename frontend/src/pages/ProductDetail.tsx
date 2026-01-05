import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Shield, Clock, Check, ShoppingCart, Loader2, ChevronDown, ChevronUp, ShoppingBag, ArrowRight } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import publicProductApi, { PublicProduct } from '@/services/publicProductApi';
import reviewService, { Review } from '@/services/reviewService';
import MobileBottomNav from '@/components/MobileBottomNav';

interface Service {
  serviceName: string;
  description: string;
  price: number;
  discountPrice?: number;
  isActive: boolean;
  serviceImage?: string;
  _id: string;
}

interface ProductDetailData extends PublicProduct {
  categories: {
    A: Service[];
    B: Service[];
    C: Service[];
    D: Service[];
  };
  categoryNames: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
}

const ProductDetail = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [cartItems, setCartItems] = useState<{ id: string, title: string, price: number, image: string }[]>([]);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState<{ totalReviews: number; averageRating: number }>({ totalReviews: 0, averageRating: 0 });

  // Fetch reviews from backend
  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      console.log('Fetching reviews...');

      // Get featured reviews (limit to 4 for mobile display)
      const featuredResponse = await reviewService.getFeaturedReviews(4);
      console.log('Featured reviews response:', featuredResponse);

      if (featuredResponse.success && featuredResponse.data.length > 0) {
        setReviews(featuredResponse.data);
        console.log('Reviews set:', featuredResponse.data);
      } else {
        console.log('Featured reviews failed or empty, trying regular reviews...');
        // Fallback to regular reviews if featured reviews are empty
        const regularResponse = await reviewService.getReviews({ limit: 4, sort: 'newest' });
        console.log('Regular reviews response:', regularResponse);

        if (regularResponse.success && regularResponse.data.length > 0) {
          setReviews(regularResponse.data);
          console.log('Regular reviews set:', regularResponse.data);
        } else {
          console.log('No reviews available in database');
          // Set empty reviews when database is empty
          setReviews([]);
        }
      }

      // Get review statistics
      const statsResponse = await reviewService.getReviewStats();
      console.log('Review stats response:', statsResponse);

      if (statsResponse.success && statsResponse.data?.overview) {
        setReviewStats({
          totalReviews: statsResponse.data.overview.totalReviews || 0,
          averageRating: statsResponse.data.overview.averageRating || 0
        });
        console.log('Review stats set:', statsResponse.data.overview);
      } else {
        console.log('Review stats failed:', statsResponse);
        // Set default values if stats fetch fails
        setReviewStats({
          totalReviews: 0,
          averageRating: 0
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Fallback to empty reviews if API fails
      setReviews([]);
      // Set default review stats on error
      setReviewStats({
        totalReviews: 0,
        averageRating: 0
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  // Get product from location state or fetch from API
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        // First try to get from location state
        if (location.state?.product) {
          setProduct(location.state.product);
          setLoading(false);
          return;
        }

        // If not in state, fetch from API
        if (productId) {
          const response = await publicProductApi.getProductById(productId);
          if (response.success && response.data?.product) {
            setProduct(response.data.product as ProductDetailData);
          } else {
            console.error('Failed to fetch product:', response.message);
          }
        }

      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, location.state]);

  // Fetch reviews when component mounts
  useEffect(() => {
    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-36 md:pb-0">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-36 md:pb-0">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  // Get all services from all categories
  const allServices = [
    ...product.categories.A.map(service => ({ ...service, category: product.categoryNames.A })),
    ...product.categories.B.map(service => ({ ...service, category: product.categoryNames.B })),
    ...product.categories.C.map(service => ({ ...service, category: product.categoryNames.C })),
    ...product.categories.D.map(service => ({ ...service, category: product.categoryNames.D }))
  ].filter(service => service.isActive);

  // Get unique categories for tabs
  const tabs = Object.values(product.categoryNames).filter(name =>
    allServices.some(service => service.category === name)
  );

  // Set default active tab
  const defaultActiveTab = activeTab || tabs[0];

  // Filter services by active tab
  const filteredServices = allServices.filter(service =>
    service.category === defaultActiveTab
  );

  const addToCart = (service: any) => {
    const existingItem = cartItems.find(item => item.id === service._id);
    if (!existingItem) {
      setCartItems([...cartItems, {
        id: service._id,
        title: service.serviceName,
        price: service.discountPrice || service.price,
        image: service.serviceImage || product.productImage || '/placeholder.svg'
      }]);
    }
  };

  const removeFromCart = (serviceId: string) => {
    setCartItems(cartItems.filter(item => item.id !== serviceId));
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-36 md:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="p-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-2">

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Hero Section */}
          <div className="space-y-6">
            {/* Hero Banner */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl blur-3xl opacity-20 animate-pulse" />
              <div className="relative bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-6 lg:p-8 text-white overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-2xl lg:text-3xl font-bold mb-4">{product.productName} Services</h2>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center space-x-2">
                      <Check className="h-5 w-5" />
                      <span className="text-sm lg:text-base">All Experienced Engineers</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="h-5 w-5" />
                      <span className="text-sm lg:text-base">Lowest Price Guaranteed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="h-5 w-5" />
                      <span className="text-sm lg:text-base">Upto 1 year Warranty</span>
                    </div>
                  </div>
                </div>

                {/* Product Image */}
                {product.productImage && (
                  <div className="absolute bottom-0 right-0 w-32 h-32 lg:w-48 lg:h-48">
                    <div className="relative w-full h-full">
                      <div className="absolute inset-0 bg-white/10 rounded-full blur-xl"></div>
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img
                          src={product.productImage}
                          alt={product.productName}
                          loading="lazy"
                          decoding="async"
                          className="w-20 h-20 lg:w-32 lg:h-32 object-contain rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-4 w-20 h-20 lg:w-32 lg:h-32 bg-white rounded-full"></div>
                  <div className="absolute bottom-4 left-4 w-16 h-16 lg:w-24 lg:h-24 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Service Info */}
          <div className="space-y-6 -mt-4 lg:mt-0">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{product.productName}</h1>
              <p className="text-base lg:text-lg text-gray-600 mb-6">
                Professional {product.productName.toLowerCase()} repair and maintenance services at your doorstep.
                Expert technicians with years of experience.
              </p>

              {/* Rating and Stats */}
              <div className="flex items-center space-x-6 mb-6">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="font-semibold">4.84 RATING</span>
                </div>
                <div className="font-semibold text-gray-600">10K+ BOOKING</div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span className="font-semibold text-gray-600">Upto 1 year WARRANTY</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Tabs */}
        <div className="mt-0 lg:mt-4">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${defaultActiveTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Services List */}
          <div className="space-y-4 pb-32 md:pb-6">
            {filteredServices.map((service) => (
              <div key={service._id} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.serviceName}</h3>
                    <p className="text-gray-600 text-sm mb-2 leading-relaxed">{service.description}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900">₹{service.discountPrice || service.price}</span>
                      {service.discountPrice && (
                        <span className="text-sm text-gray-500 line-through">₹{service.price}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                      <img
                        src={service.serviceImage || product.productImage || '/placeholder.svg'}
                        alt={service.serviceName}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover rounded-xl hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <Button
                      size="sm"
                      className={`w-full text-white ${cartItems.find(item => item.id === service._id)
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      onClick={() => {
                        const existingItem = cartItems.find(item => item.id === service._id);
                        if (existingItem) {
                          removeFromCart(service._id);
                        } else {
                          addToCart(service);
                        }
                      }}
                    >
                      {cartItems.find(item => item.id === service._id) ? 'Remove' : 'Add Cart'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back Image Section - Mobile Only */}
        <div className="mb-48 -mt-24 md:hidden">
          <div className="flex justify-center">
            <img
              src="/backimage.jpg"
              alt="Background Image"
              loading="lazy"
              decoding="async"
              className="w-full max-w-4xl h-auto rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
            />
          </div>
        </div>

        {/* FAQ Section - Mobile Only */}
        <div className="mb-12 -mt-40 md:hidden">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>

            <div className="space-y-2">
              {[
                {
                  question: "How long does the repair take?",
                  answer: "Most repairs are completed within 2-4 hours depending on the complexity of the issue."
                },
                {
                  question: "Do you provide warranty?",
                  answer: "Yes, we provide up to 1 year warranty on all repairs and genuine parts used."
                },
                {
                  question: "Is my data safe?",
                  answer: "Absolutely! We ensure 100% data safety. No data is accessed, copied, or shared during the repair process."
                },
                {
                  question: "Do you use genuine parts?",
                  answer: "Yes, we only use genuine and OEM parts for all repairs to ensure quality and compatibility."
                },
                {
                  question: "What if the repair doesn't work?",
                  answer: "If the repair doesn't resolve the issue, we will re-diagnose and fix it at no additional cost under warranty."
                }
              ].map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <h4 className="font-semibold text-gray-900 pr-2">{faq.question}</h4>
                    {openFAQ === index ? (
                      <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {openFAQ === index && (
                    <div className="px-4 pb-3">
                      <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Reviews Section - Mobile Only */}
        <div className="mb-8 md:hidden">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Customer Reviews</h3>
            </div>

            {reviewsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-gray-600">Loading reviews...</span>
              </div>
            ) : (
              <>
                {/* Overall Rating */}
                <div className="text-center mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center justify-center mb-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-6 w-6 ${star <= Math.round(reviewStats.averageRating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-2xl font-bold text-gray-900">
                      {(reviewStats.averageRating || 0).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Based on {(reviewStats.totalReviews || 0).toLocaleString()} reviews
                  </p>
                </div>

                {/* Individual Reviews */}
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review, index) => {
                      const borderColors = ['border-blue-500', 'border-green-500', 'border-purple-500', 'border-orange-500'];
                      const borderColor = borderColors[index % borderColors.length];

                      return (
                        <div key={review._id} className={`border-l-4 ${borderColor} pl-4`}>
                          <div className="flex items-center mb-2">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${star <= review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                    }`}
                                />
                              ))}
                            </div>
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {review.rating}.0
                            </span>
                            {review.isVerified && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            "{review.comment}"
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              - {review.isAnonymous ? 'Anonymous' : review.userDisplayName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {review.formattedDate}
                            </p>
                          </div>
                          {review.category && (
                            <p className="text-xs text-blue-600 mt-1">
                              {review.category}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No reviews available yet.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Checkout Section */}
        {cartItems.length > 0 && (
          <div className="fixed bottom-12 left-0 right-0 z-[70] md:bottom-0 md:z-50 transition-all duration-300 ease-out">
            {/* Backdrop blur effect */}
            <div className="absolute inset-0 bg-white/95 backdrop-blur-md border-t border-gray-200/80"></div>

            {/* Content */}
            <div className="relative container mx-auto px-4 py-3 md:py-4">
              <div className="flex items-center justify-between gap-3 md:gap-4">
                {/* Left Section - Cart Info */}
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                  {/* Cart Icon Badge */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                      <ShoppingBag className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    </div>
                    {cartItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                        {cartItems.length}
                      </span>
                    )}
                  </div>

                  {/* Price Info */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs md:text-sm text-gray-500 font-medium">
                      {cartItems.length} {cartItems.length === 1 ? 'Service' : 'Services'}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg md:text-xl font-bold text-gray-900">
                        ₹{totalPrice}
                      </span>
                      <span className="text-xs text-gray-500">total</span>
                    </div>
                  </div>
                </div>

                {/* Right Section - Checkout Button */}
                <Button
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 md:px-6 lg:px-8 py-2.5 md:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-semibold text-sm md:text-base whitespace-nowrap flex-shrink-0"
                  onClick={() => {
                    // Check if user is authenticated before proceeding to checkout
                    if (!isAuthenticated) {
                      toast({
                        title: "Login Required",
                        description: "Please login to proceed with checkout",
                        variant: "destructive"
                      });
                      navigate('/login', { state: { from: { pathname: '/checkout', state: { cartItems, totalPrice } } } });
                      return;
                    }
                    // Navigate to checkout page
                    navigate('/checkout', { state: { cartItems, totalPrice } });
                  }}
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>
            </div>

            {/* Subtle shadow at top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default ProductDetail;
