import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import RepairServicesModal from "./RepairServicesModal";

const Hero = () => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [isApplianceModalOpen, setIsApplianceModalOpen] = useState(false);
  const banners = ['/banner1.png', '/banner2.png', '/banner3.png'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 hero-gradient opacity-10" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-float opacity-20">
        <div className="w-20 h-20 bg-gradient-tech rounded-full blur-xl" />
      </div>
      <div className="absolute bottom-32 right-16 animate-float opacity-30" style={{ animationDelay: "1s" }}>
        <div className="w-16 h-16 bg-gradient-primary rounded-full blur-lg" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-20 lg:pt-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Banner Slideshow - Shows first on mobile, second on desktop */}
          <div className="relative animate-fade-in-delay order-1 lg:order-2">
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
          <div className="text-center lg:text-left animate-slide-up order-2 lg:order-1 -mt-8 lg:mt-0">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              All Your <span className="text-gradient">IT Needs</span> is Here
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl">
              Professional Laptop, Desktop, Electronics repair services. 
              Certified technicians and lightning-fast turnaround times.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button 
                size="lg" 
                className="btn-tech text-white text-lg px-8 py-4"
                onClick={() => setIsRepairModalOpen(true)}
              >
                Book Repair Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="btn-tech text-white text-lg px-8 py-4"
                onClick={() => setIsApplianceModalOpen(true)}
              >
                View Services
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
              <div className="text-center">
                <div className="bg-gradient-tech p-3 rounded-xl w-fit mx-auto mb-2">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-semibold">Fast Service</p>
                <p className="text-xs text-muted-foreground">24-48 Hours</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-tech p-3 rounded-xl w-fit mx-auto mb-2">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-semibold">Guaranteed</p>
                <p className="text-xs text-muted-foreground">1 Year Warranty</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-tech p-3 rounded-xl w-fit mx-auto mb-2">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-semibold">Available</p>
                <p className="text-xs text-muted-foreground">24/7 Support</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Repair Services Modal */}
      <RepairServicesModal 
        key="repair-modal"
        isOpen={isRepairModalOpen} 
        onClose={() => setIsRepairModalOpen(false)} 
        serviceType="repair"
      />
      
      {/* Appliance Services Modal */}
      <RepairServicesModal 
        key="appliance-modal"
        isOpen={isApplianceModalOpen} 
        onClose={() => setIsApplianceModalOpen(false)} 
        serviceType="appliance"
      />
    </section>
  );
};

export default Hero;