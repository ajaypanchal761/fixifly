import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import publicProductApi, { PublicProduct } from '@/services/publicProductApi';
import { Loader2 } from "lucide-react";

const HomeApplianceProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products with "Home Appliance" service type
  const fetchHomeApplianceProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch products with service type filter for "Home Appliance"
      const response = await publicProductApi.getProducts({
        serviceType: "Home Appliance",
        limit: 6 // Limit to 6 products to match the original grid layout
      });
      
      if (response.success && response.data.products) {
        setProducts(response.data.products);
      } else {
        setError("No products found");
      }
    } catch (err) {
      console.error('Error fetching home appliance products:', err);
      console.error('Error details:', err.message);
      setError(`Failed to load products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeApplianceProducts();
  }, []);

  // If loading, show loading state
  if (loading) {
    return (
      <section className="pt-8 pb-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up" data-aos="fade-up" data-aos-delay="100">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Home <span className="text-gradient">Appliance Services</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional home appliance repair services with certified technicians 
              and genuine spare parts. Same-day service available.
            </p>
          </div>
          
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading products...</span>
          </div>
        </div>
      </section>
    );
  }

  // If error or no products, show fallback message
  if (error || products.length === 0) {
    return (
      <section className="pt-8 pb-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up" data-aos="fade-up" data-aos-delay="100">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Home <span className="text-gradient">Appliance Services</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional home appliance repair services with certified technicians 
              and genuine spare parts. Same-day service available.
            </p>
          </div>
          
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {error || "No home appliance products available at the moment."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-8 pb-0">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with slide animation */}
        <div 
          className="text-center mb-16 animate-slide-up"
          data-aos="fade-up" 
          data-aos-delay="100"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Home <span className="text-gradient">Appliance Services</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional home appliance repair services with certified technicians 
            and genuine spare parts. Same-day service available.
          </p>
        </div>

        {/* Products Grid with staggered slide animations */}
        <div 
          className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-6 sm:mb-8 max-w-6xl mx-auto" 
          data-aos="fade-up" 
          data-aos-delay="200"
        >
          {products.map((product, index) => {
            const primaryImage = product.productImage || product.primaryImage;
            
            return (
              <div
                key={product._id}
                className={`bg-white rounded-xl p-2 sm:p-4 shadow-lg hover:shadow-xl transition-all duration-500 ease-out cursor-pointer group animate-slide-left animate-delay-${Math.min(index * 100, 600)}`}
                data-aos="zoom-in"
                data-aos-delay={300 + (index * 100)}
                onClick={() => navigate(`/product/${product._id}`, { state: { product } })}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px) scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                }}
              >
                <div className="text-center">
                  <div 
                    className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3 rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-110 animate-slide-bottom animate-delay-${Math.min((index * 100) + 300, 600)}`}
                  >
                    <img 
                      src={primaryImage || '/placeholder.svg'} 
                      alt={product.productName} 
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <h3 
                    className={`text-xs sm:text-sm font-bold text-gray-800 leading-tight transition-colors duration-300 group-hover:text-primary animate-slide-bottom animate-delay-${Math.min((index * 100) + 400, 600)}`}
                  >
                    {product.productName}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
};

export default HomeApplianceProducts;
