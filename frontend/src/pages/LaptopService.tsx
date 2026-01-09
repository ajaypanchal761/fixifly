import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Shield, Clock, Check, ShoppingCart, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import publicProductApi, { PublicProduct } from "@/services/publicProductApi";

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
}

const ServicePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceType } = useParams();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("");
  const [cartItems, setCartItems] = useState<{ id: string, title: string, price: number, image: string }[]>([]);

  // Backend data state
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map serviceType to product search query
  const getProductSearchQuery = (urlServiceType: string | undefined): string => {
    if (!urlServiceType) return 'laptop';

    const normalized = urlServiceType.toLowerCase().replace(/\s+/g, '-');

    // Map to product names
    if (normalized.includes('mac') || normalized.includes('macbook') || normalized.includes('imac')) {
      return 'MacBook | Imac';
    }

    if (normalized.includes('desktop')) {
      return 'Desktop';
    }

    if (normalized.includes('printer')) {
      return 'Printer';
    }

    if (normalized.includes('tablet') || normalized.includes('ipad')) {
      return 'Tablet';
    }

    if (normalized.includes('tv') || normalized.includes('television')) {
      return 'TV';
    }

    if (normalized.includes('ac') || normalized.includes('air-conditioner')) {
      return 'AC';
    }

    if (normalized.includes('fridge') || normalized.includes('refrigerator')) {
      return 'Fridge';
    }

    if (normalized.includes('washing') || normalized.includes('washing-machine')) {
      return 'Washing Machine';
    }

    if (normalized.includes('cctv') || normalized.includes('camera')) {
      return 'CCTV';
    }

    if (normalized.includes('electric') || normalized.includes('electrical')) {
      return 'Electrician';
    }

    if (normalized.includes('plumb') || normalized.includes('pipe')) {
      return 'Plumber';
    }

    // Default to laptop
    return 'Laptop | Desktop';
  };

  // Fetch product data from backend
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if product data is passed from navigation
        const productFromState = location.state?.product as PublicProduct | undefined;
        const productIdFromState = location.state?.productId as string | undefined;

        // Priority 1: If productId is provided, fetch that specific product
        if (productIdFromState) {
          console.log('🔍 Fetching product by ID:', productIdFromState);
          const response = await publicProductApi.getProductById(productIdFromState);
          if (response.success && response.data?.product) {
            console.log('✅ Product fetched by ID:', response.data.product.productName);
            setProduct(response.data.product);
            setLoading(false);
            return;
          }
        }

        // Priority 2: If full product data is passed from navigation, use it
        // But verify it has categories data, otherwise fetch by ID
        if (productFromState) {
          console.log('📦 Product from state:', productFromState.productName);

          // Check if product has complete data (categories)
          const hasCategories = productFromState.categories &&
            (productFromState.categories.A?.length > 0 ||
              productFromState.categories.B?.length > 0 ||
              productFromState.categories.C?.length > 0 ||
              productFromState.categories.D?.length > 0);

          if (hasCategories && productFromState._id) {
            console.log('✅ Using product from state with categories');
            setProduct(productFromState);
            setLoading(false);
            return;
          } else if (productFromState._id) {
            // Product passed but missing categories, fetch full data
            console.log('⚠️ Product from state missing categories, fetching full data');
            const response = await publicProductApi.getProductById(productFromState._id);
            if (response.success && response.data?.product) {
              console.log('✅ Full product data fetched:', response.data.product.productName);
              setProduct(response.data.product);
              setLoading(false);
              return;
            }
          }
        }

        // Priority 3: Search for product by serviceType
        const searchQuery = getProductSearchQuery(serviceType);
        console.log('🔍 Searching for product:', searchQuery);
        const response = await publicProductApi.getProducts({ search: searchQuery, limit: 10 });

        if (response.success && response.data?.products && response.data.products.length > 0) {
          // Find exact match first
          const exactMatch = response.data.products.find(p => {
            const productName = (p.productName || '').toLowerCase();
            const searchTerm = searchQuery.toLowerCase();
            return productName === searchTerm || productName.includes(searchTerm);
          });

          const selectedProduct = exactMatch || response.data.products[0];
          console.log('✅ Product found by search:', selectedProduct.productName);

          // If product has ID, fetch full data to ensure we have all categories
          if (selectedProduct._id) {
            const fullProductResponse = await publicProductApi.getProductById(selectedProduct._id);
            if (fullProductResponse.success && fullProductResponse.data?.product) {
              console.log('✅ Full product data loaded:', fullProductResponse.data.product.productName);
              setProduct(fullProductResponse.data.product);
            } else {
              setProduct(selectedProduct);
            }
          } else {
            setProduct(selectedProduct);
          }
        } else {
          // Fallback: try to get products by serviceType
          const serviceTypeValue = serviceType === 'mac' ? 'IT Needs' :
            serviceType === 'it-needs' ? 'IT Needs' :
              'IT Needs';
          console.log('🔍 Fallback: searching by serviceType:', serviceTypeValue);
          const serviceTypeResponse = await publicProductApi.getProducts({
            serviceType: serviceTypeValue,
            limit: 10
          });

          if (serviceTypeResponse.success && serviceTypeResponse.data?.products && serviceTypeResponse.data.products.length > 0) {
            // Find matching product by name
            const matchingProduct = serviceTypeResponse.data.products.find(p => {
              const productName = (p.productName || '').toLowerCase();
              const searchTerm = searchQuery.toLowerCase();
              return productName.includes(searchTerm) || searchTerm.includes(productName);
            });

            const selectedProduct = matchingProduct || serviceTypeResponse.data.products[0];
            console.log('✅ Product found by serviceType:', selectedProduct.productName);

            // Fetch full product data
            if (selectedProduct._id) {
              const fullProductResponse = await publicProductApi.getProductById(selectedProduct._id);
              if (fullProductResponse.success && fullProductResponse.data?.product) {
                console.log('✅ Full product data loaded:', fullProductResponse.data.product.productName);
                setProduct(fullProductResponse.data.product);
              } else {
                setProduct(selectedProduct);
              }
            } else {
              setProduct(selectedProduct);
            }
          } else {
            console.error('❌ Product not found');
            setError('Product not found');
          }
        }
      } catch (err) {
        console.error('❌ Error fetching product:', err);
        setError('Failed to load product data');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [serviceType, location.state]);

  // Transform backend product data to UI format
  const transformProductToServices = (product: PublicProduct | null): ServiceItem[] => {
    if (!product) {
      console.log('⚠️ No product provided to transform');
      return [];
    }

    console.log('🔄 Transforming product to services:', {
      productId: product._id,
      productName: product.productName,
      hasCategories: !!product.categories,
      categoryA: product.categories?.A?.length || 0,
      categoryB: product.categories?.B?.length || 0,
      categoryC: product.categories?.C?.length || 0,
      categoryD: product.categories?.D?.length || 0
    });

    const services: ServiceItem[] = [];
    const categoryKeys = ['A', 'B', 'C', 'D'] as const;

    categoryKeys.forEach((key) => {
      const categoryServices = product.categories?.[key] || [];
      console.log(`  Category ${key}: ${categoryServices.length} services`);

      categoryServices.forEach((service) => {
        if (service.isActive) {
          services.push({
            id: service._id?.toString() || `${key}-${services.length}`,
            title: service.serviceName,
            description: service.description || '',
            price: service.discountPrice || service.price,
            originalPrice: service.price,
            image: service.serviceImage || product.productImage || '/placeholder.svg',
            category: product.categoryNames?.[key] || `Category ${key}`
          });
        }
      });
    });

    console.log(`✅ Transformed ${services.length} active services from product: ${product.productName}`);
    return services;
  };

  // Get tabs from product category names
  const getTabs = (): string[] => {
    if (!product) return [];

    const tabs: string[] = [];
    const categoryKeys = ['A', 'B', 'C', 'D'] as const;

    categoryKeys.forEach((key) => {
      const categoryName = product.categoryNames[key];
      const categoryServices = product.categories[key] || [];
      const activeServices = categoryServices.filter(s => s.isActive);
      const hasServices = activeServices.length > 0;

      if (categoryName && hasServices) {
        tabs.push(categoryName);
        console.log(`  📑 Tab "${categoryName}" (Category ${key}): ${activeServices.length} active services`);
        activeServices.forEach(s => {
          console.log(`    - ${s.serviceName} (₹${s.discountPrice || s.price})`);
        });
      }
    });

    console.log(`📋 Total tabs created: ${tabs.length}`, tabs);
    return tabs.length > 0 ? tabs : ['Services'];
  };

  const allServices = transformProductToServices(product);
  const tabs = getTabs();
  const defaultActiveTab = activeTab || tabs[0] || '';

  // Filter services by active tab category - ALWAYS filter, even for first tab
  const filteredServices = allServices.filter(service => {
    if (!defaultActiveTab) {
      return false; // Don't show anything if no tab is selected
    }
    // Always filter by the active tab's category name
    return service.category === defaultActiveTab;
  });

  console.log('🔍 Service filtering:', {
    totalServices: allServices.length,
    activeTab: defaultActiveTab,
    filteredCount: filteredServices.length,
    servicesByCategory: allServices.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  });

  // Service display data
  const serviceTitle = product?.productName || 'Service';
  const serviceSubtitle = `${product?.productName || 'Service'} In Mumbai`;
  const heroTitle = `${product?.productName || 'Service'} Repair Service`;

  const addToCart = (service: any) => {
    const existingItem = cartItems.find(item => item.id === service.id);
    if (!existingItem) {
      setCartItems([...cartItems, { id: service.id, title: service.title, price: service.price, image: service.image }]);
    }
  };

  const removeFromCart = (serviceId: string) => {
    setCartItems(cartItems.filter(item => item.id !== serviceId));
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
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

      <div className="container mx-auto px-4 py-2">

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Hero Section */}
          <div className="space-y-6">
            {/* Hero Banner */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl blur-3xl opacity-20 animate-pulse" />
              <div className="relative bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-6 lg:p-8 text-white overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-2xl lg:text-3xl font-bold mb-4">{heroTitle}</h2>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center space-x-2">
                      <Check className="h-5 w-5" />
                      <span className="text-sm lg:text-base">All Experienced Engineers</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="h-5 w-5" />
                      <span className="text-sm lg:text-base">Lowest Price Guaranteed</span>
                    </div>
                  </div>
                </div>

                {/* Technician Image */}
                <div className="absolute bottom-0 right-0 w-32 h-32 lg:w-48 lg:h-48">
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 bg-white/10 rounded-full blur-xl"></div>
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="w-20 h-20 lg:w-32 lg:h-32 bg-white/20 rounded-full flex items-center justify-center">
                        <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white/30 rounded-full flex items-center justify-center">
                          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/40 rounded-full flex items-center justify-center">
                            <div className="w-8 h-8 lg:w-12 lg:h-12 bg-white/50 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs lg:text-sm font-bold">TECH</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

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
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{serviceTitle}</h1>
              <p className="text-base lg:text-lg text-gray-600 mb-6">{serviceSubtitle}</p>

              {/* Rating and Stats */}
              <div className="flex items-center space-x-6 mb-6">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="font-semibold">4.84 RATING</span>
                </div>
                <div className="font-semibold text-gray-600">10K++ BOOKING</div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span className="font-semibold text-gray-600">Upto 1 year WARRANTY</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading services...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        )}

        {/* Service Tabs */}
        {!loading && !error && product && (
          <div className="mt-0 lg:mt-4">
            {tabs.length > 0 && (
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
            )}

            {/* Services List */}
            <div className="space-y-4 pb-20 md:pb-6">
              {filteredServices.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No services available for this product.</p>
                </div>
              ) : (
                filteredServices.map((service) => (
                  <div key={service.id} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                        <p className="text-gray-600 text-sm mb-2 leading-relaxed">{service.description}</p>
                        <div className="flex items-center gap-3 mt-3">
                          {service.originalPrice && Number(service.originalPrice) > Number(service.price) ? (
                            <>
                              <span className="text-lg font-bold text-green-600">
                                ₹{Number(service.price).toLocaleString('en-IN')}
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                ₹{Number(service.originalPrice).toLocaleString('en-IN')}
                              </span>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                Save ₹{(Number(service.originalPrice) - Number(service.price)).toLocaleString('en-IN')}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">
                              ₹{Number(service.price).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                          <img
                            src={service.image}
                            alt={service.title}
                            className="w-full h-full object-cover rounded-xl hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        <Button
                          size="sm"
                          className={`w-full text-white ${cartItems.find(item => item.id === service.id)
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          onClick={() => {
                            const existingItem = cartItems.find(item => item.id === service.id);
                            if (existingItem) {
                              removeFromCart(service.id);
                            } else {
                              addToCart(service);
                            }
                          }}
                        >
                          {cartItems.find(item => item.id === service.id) ? 'Remove' : 'Add Cart'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Checkout Section */}
        {cartItems.length > 0 && (
          <div className="fixed bottom-12 left-0 right-0 z-[70] md:bottom-0 md:z-50 transition-all duration-300 ease-out">
            {/* Backdrop blur effect */}
            <div className="absolute inset-0 bg-white/95 backdrop-blur-md border-t border-gray-200/80 pointer-events-none"></div>

            {/* Content */}
            <div className="relative container mx-auto px-4 py-3 md:py-4 pointer-events-auto">
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
                        {totalPrice === 0 ? 'Free' : `₹${totalPrice}`}
                      </span>
                      {totalPrice !== 0 && (
                        <span className="text-xs text-gray-500">total</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Section - Checkout Button */}
                <Button
                  type="button"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 md:px-6 lg:px-8 py-2.5 md:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-semibold text-sm md:text-base whitespace-nowrap flex-shrink-0 relative z-10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Checkout button clicked', { cartItems, totalPrice, isAuthenticated });
                    
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
                    
                    // Ensure cart has items
                    if (!cartItems || cartItems.length === 0) {
                      toast({
                        title: "Cart Empty",
                        description: "Please add items to cart before checkout",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    // Save cart data to localStorage as backup
                    try {
                      localStorage.setItem('checkoutCartData', JSON.stringify({ cartItems, totalPrice }));
                    } catch (error) {
                      console.error('Error saving cart data to localStorage:', error);
                    }
                    
                    // Navigate to checkout page immediately
                    console.log('Navigating to checkout...', { cartItems, totalPrice });
                    try {
                      navigate('/checkout', { 
                        state: { cartItems, totalPrice },
                        replace: false
                      });
                    } catch (error) {
                      console.error('Navigation error:', error);
                      // Fallback to window.location if navigate fails
                      window.location.href = '/checkout';
                    }
                  }}
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>
            </div>

            {/* Subtle shadow at top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent pointer-events-none"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicePage;
