import { Button } from "@/components/ui/button";
import { 
  Tv, 
  AirVent, 
  Refrigerator, 
  WashingMachine,
  ArrowRight,
  Star,
  Clock
} from "lucide-react";

const ApplianceServices = () => {
  const appliances = [
    {
      icon: Tv,
      title: "TV Repair",
      description: "LED, LCD, Smart TV repair services",
      rating: 4.9,
      avgTime: "2-3 hours",
      price: "$79"
    },
    {
      icon: AirVent,
      title: "AC Repair",
      description: "Installation, repair, and maintenance",
      rating: 4.8,
      avgTime: "1-2 hours",
      price: "$99"
    },
    {
      icon: Refrigerator,
      title: "Fridge Repair",
      description: "All brands refrigerator repair services",
      rating: 4.9,
      avgTime: "2-4 hours",
      price: "$89"
    },
    {
      icon: WashingMachine,
      title: "Washing Machine",
      description: "Repair and maintenance for all models",
      rating: 4.7,
      avgTime: "1-3 hours",
      price: "$69"
    }
  ];

  return (
    <section className="pt-8 pb-0">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Home <span className="text-gradient">Appliance Services</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional home appliance repair services with certified technicians 
            and genuine spare parts. Same-day service available.
          </p>
        </div>

        {/* Appliances Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {appliances.map((appliance, index) => {
            const IconComponent = appliance.icon;
            return (
              <div
                key={appliance.title}
                className="service-card group animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-center">
                  <div className="bg-gradient-primary p-4 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {appliance.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm mb-4">
                    {appliance.description}
                  </p>

                  {/* Rating and Time */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{appliance.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{appliance.avgTime}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-bold text-lg">
                      Starting {appliance.price}
                    </span>
                    <Button 
                      size="sm" 
                      className="bg-primary hover:bg-primary-dark text-primary-foreground rounded-full px-4 transition-all duration-300"
                    >
                      Book
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Statistics */}
        <div className="bg-gradient-card rounded-3xl p-8 mb-12 animate-fade-in-delay">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">10K+</div>
              <div className="text-muted-foreground">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">98%</div>
              <div className="text-muted-foreground">Success Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Support Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">1 Year</div>
              <div className="text-muted-foreground">Service Warranty</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" className="btn-tech text-white text-lg px-8 py-4">
            Schedule Service
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ApplianceServices;