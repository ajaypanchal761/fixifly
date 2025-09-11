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
  Star,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const ServicesGrid = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);

  const services = [
    {
      image: "/cardImage.png",
      name: "Rajesh Kumar",
      subtitle: "Laptop Repair Specialist",
      rating: 4.8,
      price: "Starting at ₹199",
      popular: true
    },
    {
      image: "/cardImage.png",
      name: "Priya Sharma",
      subtitle: "Desktop Specialist",
      rating: 4.5,
      price: "Starting at ₹299",
      popular: false
    },
    {
      image: "/cardImage.png",
      name: "Amit Singh",
      subtitle: "Mac Specialist",
      rating: 4.9,
      price: "Starting at ₹599",
      popular: true
    },
    {
      image: "/cardImage.png",
      name: "Sneha Patel",
      subtitle: "Mobile Specialist",
      rating: 4.6,
      price: "Starting at ₹399",
      popular: false
    },
    {
      image: "/cardImage.png",
      name: "Vikram Joshi",
      subtitle: "Tablet Specialist",
      rating: 4.7,
      price: "Starting at ₹499",
      popular: false
    },
    {
      image: "/cardImage.png",
      name: "Anita Gupta",
      subtitle: "Printer Specialist",
      rating: 4.3,
      price: "Starting at ₹199",
      popular: false
    },
    {
      image: "/cardImage.png",
      name: "Rohit Verma",
      subtitle: "Security Specialist",
      rating: 4.9,
      price: "Starting at ₹999",
      popular: true
    },
    {
      image: "/cardImage.png",
      name: "Deepika Reddy",
      subtitle: "Data Specialist",
      rating: 4.8,
      price: "Starting at ₹799",
      popular: false
    }
  ];

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

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      
      // Start auto-scroll when component mounts
      startAutoScroll();
      
      return () => {
        container.removeEventListener('scroll', handleScroll);
        stopAutoScroll();
      };
    }
  }, []);

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
          <div 
            ref={scrollContainerRef}
            className="services-carousel flex gap-6 overflow-x-auto snap-x snap-mandatory py-8"
          >
            {services.map((service, index) => {
              const isCenter = index === currentIndex;
              return (
                <div
                  key={service.name}
                  ref={(el) => (cardRefs.current[index] = el)}
                  className={`bg-slate-800 rounded-2xl p-6 shadow-lg transition-all duration-500 group relative flex-shrink-0 snap-center ${
                    isCenter 
                      ? 'scale-110 shadow-2xl border-2 border-blue-400' 
                      : 'scale-95 hover:scale-100'
                  }`}
                  style={{ width: '280px' }}
                >
                  <div className="text-center">
                    {service.popular && (
                      <div className="mb-4">
                        <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                          Popular
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
                    
                    {/* Rating */}
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-yellow-400 font-semibold text-sm">
                        {service.rating}
                      </span>
                      <span className="text-gray-400 text-xs">
                        (4.5)
                      </span>
                    </div>
                    
                    {/* Price */}
                    <p className="text-white font-semibold text-lg mb-4">
                      {service.price}
                    </p>
                    
                    {/* Book Service Button */}
                    <Button 
                      className={`w-full font-medium rounded-lg py-2 transition-all duration-300 ${
                        isCenter 
                          ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                          : 'bg-white text-slate-800 hover:bg-gray-100'
                      }`}
                    >
                      Book Service
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots Indicator */}
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
        </div>
      </div>
    </section>
  );
};

export default ServicesGrid;