import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, MessageCircle, Star, Shield, Clock, Check, Home, ShoppingCart } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { serviceConfigs } from "@/data/serviceConfigs";

const ServicePage = () => {
  const navigate = useNavigate();
  const { serviceType } = useParams();
  const [activeTab, setActiveTab] = useState("");
  const [cartItems, setCartItems] = useState<{id: number, title: string, price: number, image: string}[]>([]);


  const currentService = serviceConfigs[serviceType as keyof typeof serviceConfigs] || serviceConfigs.laptop;
  const services = currentService.services;
  const tabs = currentService.tabs;

  // Set default active tab to first tab if not set
  const defaultActiveTab = activeTab || tabs[0];

  const filteredServices = services.filter(service => 
    defaultActiveTab === tabs[0] ? 
    service.category === tabs[0] : 
    service.category === defaultActiveTab
  );

  const addToCart = (service: any) => {
    const existingItem = cartItems.find(item => item.id === service.id);
    if (!existingItem) {
      setCartItems([...cartItems, { id: service.id, title: service.title, price: service.price, image: service.image }]);
    }
  };

  const removeFromCart = (serviceId: number) => {
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
               <h1 className="text-lg font-semibold">{currentService.title}</h1>
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
                   <h2 className="text-2xl lg:text-3xl font-bold mb-4">{currentService.heroTitle}</h2>
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
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{currentService.title}</h1>
              <p className="text-base lg:text-lg text-gray-600 mb-6">{currentService.subtitle}</p>
              
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
            <div className="flex items-center ml-2">
              <span className="text-gray-400">&gt;</span>
            </div>
          </div>

          {/* Services List */}
          <div className="space-y-4 pb-20 md:pb-6">
            {filteredServices.map((service) => (
              <div key={service.id} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-gray-600 text-sm mb-2 leading-relaxed">{service.description}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900">₹{service.price}</span>
                      <span className="text-sm text-gray-500 line-through">₹{service.originalPrice}</span>
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
                      className={`w-full text-white ${
                        cartItems.find(item => item.id === service.id) 
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
                    // Navigate to checkout or booking page
                    navigate('/booking', { state: { cartItems, totalPrice } });
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

export default ServicePage;
