import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, MessageCircle, Star, Shield, Clock, Check, Home, ShoppingCart, Loader2 } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import publicProductApi, { PublicProduct } from '@/services/publicProductApi';

interface Service {
  serviceName: string;
  description: string;
  price: number;
  discountPrice?: number;
  isActive: boolean;
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
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [cartItems, setCartItems] = useState<{id: string, title: string, price: number, image: string}[]>([]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
        image: product.productImage || '/placeholder.svg' 
      }]);
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
          <div className="flex items-center justify-between">
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
                 <Button 
                   variant="ghost" 
                   size="sm"
                   onClick={() => navigate('/')}
                   className="p-2"
                 >
                   <Home className="h-5 w-5" />
                 </Button>
               </div>
               <h1 className="text-lg font-semibold">{product.productName}</h1>
             </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="p-2">
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 pt-4">
        {/* Back Button Above Hero Banner */}
        <div className="mb-4 mt-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
        </div>
        
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
                       <span className="text-sm lg:text-base">90 Days Warranty</span>
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
                  <span className="font-semibold text-gray-600">90 DAYS WARRANTY</span>
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
                 className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                   defaultActiveTab === tab
                     ? 'bg-white text-gray-900 shadow-sm'
                     : 'text-gray-600 hover:text-gray-900'
                 }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Services List */}
          <div className="space-y-4 pb-20 md:pb-6">
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
                        src={product.productImage || '/placeholder.svg'} 
                        alt={service.serviceName}
                        className="w-full h-full object-cover rounded-xl hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <Button 
                      size="sm" 
                      className={`w-full text-white ${
                        cartItems.find(item => item.id === service._id) 
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

        {/* Checkout Section */}
        {cartItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:bottom-0 bottom-16">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">
                      {cartItems.length} {cartItems.length === 1 ? 'Service' : 'Services'} Selected
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    Total: ₹{totalPrice}
                  </div>
                </div>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                  onClick={() => {
                    // Navigate to checkout page
                    navigate('/checkout', { state: { cartItems, totalPrice } });
                  }}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
