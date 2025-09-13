import { Button } from "@/components/ui/button";
import { ArrowDown, Zap, Shield, Clock, Building2, Award, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const Hero = () => {
  const navigate = useNavigate();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [showMoreServices, setShowMoreServices] = useState(false);
  const banners = ['/banner1.png', '/banner2.png', '/banner3.png'];

  const allServices = [
    { name: "Mac Repair", image: "/laptop.avif", serviceType: "mac" },  
    { name: "CCTV Installation", image: "/cctv.webp", serviceType: "cctv" },
    { name: "Tablet Repair", image: "/tablet.webp", serviceType: "tablet" },
    { name: "TV Repair", image: "/tv.avif", serviceType: "tv" },
    { name: "AC Repair", image: "/ac.png", serviceType: "ac" },
    { name: "Fridge Repair", image: "/fidge.jpeg", serviceType: "fridge" },
    { name: "Washing Machine Repair", image: "/washing.jpg", serviceType: "washing" },
    { name: "Electrician", image: "/electrician.jpg", serviceType: "electrician" },
    { name: "Plumber", image: "/plumber.png", serviceType: "plumber" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <section className={`relative flex items-center justify-center overflow-hidden transition-all duration-500 ${
      showMoreServices ? 'min-h-[120vh] sm:min-h-[130vh]' : 'min-h-[90vh] sm:min-h-screen'
    }`}>
      {/* Background Gradient */}
      <div className="absolute inset-0 hero-gradient opacity-10" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-float opacity-20">
        <div className="w-20 h-20 bg-gradient-tech rounded-full blur-xl" />
      </div>
      <div className="absolute bottom-32 right-16 animate-float opacity-30" >
        <div className="w-16 h-16 bg-gradient-primary rounded-full blur-lg" />
      </div>

      <div className={`container mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 ${
        showMoreServices ? 'mt-24 sm:pt-20 lg:pt-20' : 'mt-12 sm:pt-20 lg:pt-24'
      }`}>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Banner Slideshow - Shows first on mobile, second on desktop */}
          <div className="relative animate-fade-in-delay order-1 lg:order-2 lg:absolute lg:right-0 lg:top-48 lg:transform lg:-translate-y-1/2 lg:w-1/2 lg:pr-8" data-aos="fade-left" data-aos-delay="200">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-tech rounded-3xl blur-3xl opacity-20 animate-pulse" />
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

          {/* Text Content - Shows second on mobile, first on desktop */}
          <div className="text-center lg:text-left animate-slide-up order-2 lg:order-1 -mt-8 lg:mt-0 lg:w-full lg:pr-8" data-aos="fade-right" data-aos-delay="100">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              All <span className="text-gradient">IT Needs</span> is Here at <span className="text-gradient">your DoorStep </span>
            </h1>
            <p className="hidden sm:block text-lg sm:text-xl text-muted-foreground mb-4 sm:mb-8 max-w-2xl">
              Professional Laptop, Desktop, Electronics repair services at Door Step. 
              Certified technicians and lightning-fast turnaround times.
            </p>

            {/* Service Cards */}
            <div className="flex flex-row gap-2 sm:gap-4 mb-6 sm:mb-8 max-w-4xl mx-auto lg:mx-0" data-aos="fade-up" data-aos-delay="300">
              <div 
                className="bg-white rounded-xl p-2 sm:p-4 shadow-lg hover:shadow-xl transition-shadow duration-300 flex-1 cursor-pointer" 
                style={{backgroundColor: '#ffffff'}}
                onClick={() => navigate('/service/laptop')}
              >
                <div className="text-center">
                  <img 
                    src="/laptop.avif" 
                    alt="Laptop Repair" 
                    className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 object-contain rounded-lg"
                  />
                  <h3 className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">Laptop Repair</h3>
                </div>
              </div>
              <div 
                className="bg-white rounded-xl p-2 sm:p-4 shadow-lg hover:shadow-xl transition-shadow duration-300 flex-1 cursor-pointer" 
                style={{backgroundColor: '#ffffff'}}
                onClick={() => navigate('/service/desktop')}
              >
                <div className="text-center">
                  <img 
                    src="/desktop.jpg" 
                    alt="Desktop Repair" 
                    className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 object-contain rounded-lg"
                  />
                  <h3 className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">Desktop Repair</h3>
                </div>
              </div>
              <div 
                className="bg-white rounded-xl p-2 sm:p-4 shadow-lg hover:shadow-xl transition-shadow duration-300 flex-1 cursor-pointer" 
                style={{backgroundColor: '#ffffff'}}
                onClick={() => navigate('/service/printer')}
              >
                <div className="text-center">
                  <img 
                    src="/printer.png" 
                    alt="Printer Repair" 
                    className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 object-contain rounded-lg"
                  />
                  <h3 className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">Printer Repair</h3>
                </div>
              </div>
            </div>
            
            {/* CTA Button */}
            <div className="flex justify-center mb-3 sm:mb-8 lg:mb-6" data-aos="zoom-in" data-aos-delay="400">
              <Button 
                size="lg" 
                className="btn-tech text-white text-lg px-8 py-4"
                onClick={() => setShowMoreServices(!showMoreServices)}
              >
                More Services
                <ArrowDown className={`ml-2 h-5 w-4 transition-transform duration-300 ${showMoreServices ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {/* More Services Grid */}
            {showMoreServices && (
              <div className="mt-6 mb-8 animate-fade-in">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {allServices.map((service, index) => (
                    <div 
                      key={index}
                      className="bg-white rounded-xl p-2 sm:p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                      style={{backgroundColor: '#ffffff'}}
                      onClick={() => navigate(`/service/${service.serviceType}`)}
                    >
                      <div className="text-center">
                        <img 
                          src={service.image} 
                          alt={service.name} 
                          className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 object-contain rounded-lg"
                        />
                        <h3 className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">
                          {service.name}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Company Trust Indicators */}
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto lg:mx-0 lg:ml-16" data-aos="fade-up" data-aos-delay="500">
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
      
      {/* Lottie Animation - Desktop Only, Show when More Services is expanded */}
      {showMoreServices && (
        <div className="hidden lg:block absolute bottom-48 right-14 w-full max-w-4xl">
          <div className="flex justify-end items-end">
            <div className="w-full max-w-3xl h-96">
              <DotLottieReact
                src="https://lottie.host/4b4777ae-24ca-490b-89fc-6a6a49a87b91/RY3zh347Uf.lottie"
                loop
                autoplay
              />
            </div>
          </div>
        </div>
      )}
      
    </section>
  );
};

export default Hero;