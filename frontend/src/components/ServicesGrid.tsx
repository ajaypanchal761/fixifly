import { Button } from "@/components/ui/button";
import { 
  Laptop, 
  Monitor, 
  Apple, 
  Printer, 
  Camera, 
  HardDrive,
  Smartphone,
  Tablet,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ServiceBookingModal from "./ServiceBookingModal";
import cardApiService, { Card } from "@/services/cardApi";

const ServicesGrid = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Card | null>(null);
  const [services, setServices] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollToCard = (index: number) => {
    if (cardRefs.current[index] && scrollContainerRef.current) {
      const card = cardRefs.current[index];
      const container = scrollContainerRef.current;
      const cardWidth = card.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollLeft = card.offsetLeft - (containerWidth - cardWidth) / 2;
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
      setCurrentIndex(index);
    }
  };

  const nextCard = () => {
    const nextIndex = (currentIndex + 1) % services.length;
    scrollToCard(nextIndex);
  };

  const prevCard = () => {
    const prevIndex = currentIndex === 0 ? services.length - 1 : currentIndex - 1;
    scrollToCard(prevIndex);
  };

  const startAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
    
    // Different timing for mobile vs desktop
    const isMobile = window.innerWidth <= 768;
    const scrollInterval = isMobile ? 3000 : 4000; // Faster on mobile, slower on desktop
    
    autoScrollInterval.current = setInterval(() => {
      nextCard();
    }, scrollInterval);
  };

  const stopAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
  };

  const handleBookService = (service: Card) => {
    // Only increment click count - no modal opening
    cardApiService.incrementCardClicks(service._id).catch(console.error);
  };

  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedService(null);
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const containerWidth = container.offsetWidth;
      const scrollLeft = container.scrollLeft;
      
      // Find the card closest to center
      let closestIndex = 0;
      let minDistance = Infinity;
      
      cardRefs.current.forEach((card, index) => {
        if (card) {
          const cardLeft = card.offsetLeft;
          const cardCenter = cardLeft + card.offsetWidth / 2;
          const containerCenter = scrollLeft + containerWidth / 2;
          const distance = Math.abs(cardCenter - containerCenter);
          
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        }
      });
      
      setCurrentIndex(closestIndex);
    }
  };

  // Fetch cards from API
  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to get popular cards first, fallback to all cards
        const response = await cardApiService.getPopularCards(20);
        setServices(response.data.cards);
        
        // If no popular cards, get featured cards
        if (response.data.cards.length === 0) {
          const featuredResponse = await cardApiService.getFeaturedCards(20);
          setServices(featuredResponse.data.cards);
        }
        
        // If still no cards, get all active cards
        if (services.length === 0) {
          const allCardsResponse = await cardApiService.getCards({ limit: 20 });
          setServices(allCardsResponse.data.cards);
        }
      } catch (err: any) {
        console.error('Error fetching cards:', err);
        setError(err.message || 'Failed to load service cards');
        
        // Fallback to static data if API fails
        setServices([
          {
            _id: 'fallback-1',
            name: "Rajesh Kumar",
            speciality: "Laptop Repair",
            subtitle: "Laptop Repair Specialist",
            rating: 4.8,
            price: 199,
            priceDisplay: "Starting at ₹199",
            image: "/cardImage.png",
            status: "active" as const,
            isPopular: true,
            isFeatured: false,
            totalReviews: 0,
            completedJobs: 0,
            totalJobs: 0,
            tags: [],
            displayOrder: 0,
            stats: { views: 0, clicks: 0, bookings: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: 'fallback-2',
            name: "Priya Sharma",
            speciality: "Desktop Specialist",
            subtitle: "Desktop Specialist",
            rating: 4.5,
            price: 299,
            priceDisplay: "Starting at ₹299",
            image: "/cardImage.png",
            status: "active" as const,
            isPopular: false,
            isFeatured: false,
            totalReviews: 0,
            completedJobs: 0,
            totalJobs: 0,
            tags: [],
            displayOrder: 0,
            stats: { views: 0, clicks: 0, bookings: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && services.length > 0) {
      container.addEventListener('scroll', handleScroll);
      
      // Start auto-scroll when component mounts and has services
      startAutoScroll();
      
      return () => {
        container.removeEventListener('scroll', handleScroll);
        stopAutoScroll();
      };
    }
  }, [services]);

  // Update auto-scroll when currentIndex changes
  useEffect(() => {
    if (autoScrollInterval.current) {
      startAutoScroll();
    }
  }, [currentIndex]);

  return (
    <section className="pt-8 pb-20 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 animate-slide-up" data-aos="fade-up" data-aos-delay="100">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Top Booking <span className="text-gradient">IT Services </span>Here
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Professional repair services at your DoorStep for all your electronic devices. 
            Our certified technicians ensure quality repairs with genuine parts and warranty.
          </p>
        </div>

        {/* Services Carousel */}
        <div 
          className="relative"
          onMouseEnter={stopAutoScroll}
          onMouseLeave={startAutoScroll}
          data-aos="fade-up" 
          data-aos-delay="200"
        >
          {loading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading services...</span>
            </div>
          )}
          
          {error && (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">{error}</p>
              <p className="text-muted-foreground">Showing fallback services</p>
            </div>
          )}
          {/* Navigation Buttons */}
          <button
            onClick={() => {
              stopAutoScroll();
              prevCard();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-slate-800 rounded-full p-2 shadow-lg transition-all duration-300"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button
            onClick={() => {
              stopAutoScroll();
              nextCard();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-slate-800 rounded-full p-2 shadow-lg transition-all duration-300"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Scrollable Container */}
          {!loading && (
            <div 
              ref={scrollContainerRef}
              className="services-carousel flex gap-6 overflow-x-auto snap-x snap-mandatory py-8"
            >
              {services.map((service, index) => {
                const isCenter = index === currentIndex;
                return (
                  <div
                    key={service._id}
                    ref={(el) => (cardRefs.current[index] = el)}
                    className={`bg-slate-800 rounded-2xl p-6 shadow-lg transition-all duration-500 group relative flex-shrink-0 snap-center cursor-pointer ${
                      isCenter 
                        ? 'scale-110 shadow-2xl border-2 border-blue-400' 
                        : 'scale-95 hover:scale-100'
                    }`}
                    style={{ width: '280px' }}
                    onClick={() => handleBookService(service)}
                  >
                    <div className="text-center">
                      {service.isPopular && (
                        <div className="mb-4">
                          <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                            Popular
                          </span>
                        </div>
                      )}
                      {service.isFeatured && (
                        <div className="mb-4">
                          <span className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                            Featured
                          </span>
                        </div>
                      )}
                      {/* Profile Image */}
                      <div className={`w-32 h-32 rounded-full mx-auto mb-4 border-2 border-white shadow-lg transition-transform duration-300 overflow-hidden ${
                        isCenter ? 'group-hover:scale-110' : 'group-hover:scale-105'
                      }`}>
                        <img 
                          src={service.image} 
                          alt={service.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/cardImage.png';
                          }}
                        />
                      </div>
                      
                      {/* Name */}
                      <h3 className={`text-xl font-bold text-white mb-2 transition-colors ${
                        isCenter ? 'group-hover:text-blue-300' : 'group-hover:text-gray-300'
                      }`}>
                        {service.name}
                      </h3>
                      
                      {/* Subtitle */}
                      <p className="text-gray-300 text-sm mb-3">
                        {service.subtitle}
                      </p>
                      
                      
                      {/* Speciality */}
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-semibold">
                          {service.speciality}
                        </span>
                      </div>
                      
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dots Indicator */}
          {!loading && services.length > 0 && (
            <div className="flex justify-center gap-2 mt-6">
              {services.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    stopAutoScroll();
                    scrollToCard(index);
                  }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-blue-500 scale-125' 
                      : 'bg-gray-400 hover:bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Service Booking Modal */}
      {selectedService && (
        <ServiceBookingModal
          isOpen={isBookingModalOpen}
          onClose={handleCloseBookingModal}
          service={selectedService}
        />
      )}
    </section>
  );
};

export default ServicesGrid;