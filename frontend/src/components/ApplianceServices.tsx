import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ApplianceServices = () => {
  const navigate = useNavigate();
  
  const appliances = [
    {
      title: "TV Repair",
      image: "/tv.avif",
      serviceType: "tv"
    },
    {
      title: "AC Repair",
      image: "/ac.png",
      serviceType: "ac"
    },
    {
      title: "Fridge Repair",
      image: "/fidge.jpeg",
      serviceType: "fridge"
    },
    {
      title: "Washing Machine",
      image: "/washing.jpg",
      serviceType: "washing"
    },
    {
      title: "Electrician",
      image: "/electrician.jpg",
      serviceType: "electrician"
    },
    {
      title: "Plumber",
      image: "/plumber.png",
      serviceType: "plumber"
    }
  ];

  return (
    <section className="pt-8 pb-0">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 animate-slide-up" data-aos="fade-up" data-aos-delay="100">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Home <span className="text-gradient">Appliance Services</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional home appliance repair services with certified technicians 
            and genuine spare parts. Same-day service available.
          </p>
        </div>

        {/* Appliances Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-6 sm:mb-8 max-w-6xl mx-auto" data-aos="fade-up" data-aos-delay="200">
          {appliances.map((appliance, index) => {
            return (
              <div
                key={appliance.title}
                className="bg-white rounded-xl p-2 sm:p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer animate-slide-up"
                style={{ backgroundColor: '#ffffff', animationDelay: `${index * 0.1}s` }}
                data-aos="zoom-in"
                data-aos-delay={300 + (index * 100)}
                onClick={() => navigate(`/service/${appliance.serviceType}`)}
              >
                <div className="text-center">
                  <img 
                    src={appliance.image} 
                    alt={appliance.title} 
                    className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3 object-contain rounded-lg"
                  />
                  <h3 className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">{appliance.title}</h3>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ApplianceServices;