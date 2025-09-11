import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Check, 
  Star, 
  Shield, 
  Clock, 
  Headphones,
  Wrench,
  Zap,
  Award
} from "lucide-react";

const AMC = () => {
  const plans = [
    {
      name: "Try Plan",
      price: "$29",
      period: "/month",
      description: "Perfect for individual users with basic needs",
      popular: false,
      features: [
        "1 Device Coverage",
        "Basic Support (Email)",
        "Monthly Health Check",
        "Standard Repair Priority",
        "Software Updates",
        "Basic Virus Protection",
        "48-hour Response Time"
      ],
      notIncluded: [
        "Hardware Replacement",
        "On-site Service",
        "24/7 Phone Support"
      ]
    },
    {
      name: "Care Plan", 
      price: "$79",
      period: "/month",
      description: "Best for small businesses and power users",
      popular: true,
      features: [
        "Up to 3 Devices",
        "Priority Support (Phone + Email)",
        "Bi-weekly Health Checks",
        "Priority Repair Queue",
        "Software & Driver Updates",
        "Advanced Security Suite",
        "24-hour Response Time",
        "Hardware Replacement (Once/Year)",
        "Remote Assistance",
        "Data Backup Service"
      ],
      notIncluded: [
        "On-site Service"
      ]
    },
    {
      name: "Relax Plan",
      price: "$149", 
      period: "/month",
      description: "Complete peace of mind for enterprises",
      popular: false,
      features: [
        "Unlimited Devices",
        "24/7 Premium Support",
        "Weekly Health Checks", 
        "Express Repair Priority",
        "All Software Updates",
        "Enterprise Security Suite",
        "2-hour Response Time",
        "Unlimited Hardware Replacements",
        "On-site Service Available",
        "Cloud Data Backup",
        "Dedicated Account Manager",
        "Custom Service Plans",
        "Emergency Weekend Support"
      ],
      notIncluded: []
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Comprehensive Protection",
      description: "Complete coverage for hardware, software, and security issues"
    },
    {
      icon: Clock,
      title: "Fast Response Times",
      description: "Quick resolution with guaranteed response times for all plans"
    },
    {
      icon: Headphones,
      title: "Expert Support",
      description: "Access to certified technicians and IT specialists 24/7"
    },
    {
      icon: Award,
      title: "Guaranteed Quality",
      description: "100% satisfaction guarantee with quality service assurance"
    }
  ];

  return (
    <div className="min-h-screen pt-16 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-8 md:mb-16 animate-slide-up">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Choose Your <span className="text-gradient">AMC Plan</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8 hidden md:block">
            Annual Maintenance Contracts designed to keep your devices running smoothly. 
            Preventive care, priority support, and comprehensive coverage all year round.
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground hidden md:flex">
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>No Setup Fees</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>30-Day Money Back</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-16 animate-fade-in-delay mt-4 md:mt-0">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`service-card relative max-w-sm mx-auto md:max-w-none ${plan.popular ? 'ring-2 ring-primary scale-105' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-tech text-white px-4 py-1 text-sm font-semibold">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2 md:pb-8 px-3 md:px-6">
                <CardTitle className="text-lg md:text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-xs md:text-base mb-1 md:mb-4">
                  {plan.description}
                </CardDescription>
                <div className="text-center">
                  <span className="text-2xl md:text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground text-sm md:text-base">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 md:space-y-6 px-3 md:px-6">
                {/* Included Features */}
                <div>
                  <h4 className="font-semibold mb-1 md:mb-3 text-green-700 text-xs md:text-base">✓ What's Included</h4>
                  <ul className="space-y-0.5 md:space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm">
                        <Check className="h-2.5 w-2.5 md:h-4 md:w-4 text-green-500 flex-shrink-0" />
                        <span className="leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Not Included Features */}
                {plan.notIncluded.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-1 md:mb-3 text-muted-foreground text-xs md:text-base">✗ Not Included</h4>
                    <ul className="space-y-0.5 md:space-y-2">
                      {plan.notIncluded.map((feature) => (
                        <li key={feature} className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-muted-foreground">
                          <span className="w-2.5 h-2.5 md:w-4 md:h-4 flex-shrink-0">✗</span>
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button 
                  className={`w-full py-3 md:py-6 text-xs md:text-lg ${
                    plan.popular 
                      ? 'btn-tech text-white' 
                      : 'bg-primary hover:bg-primary-dark text-primary-foreground'
                  }`}
                  size="lg"
                >
                  Subscribe to {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="mb-16 animate-slide-up hidden md:block">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Why Choose <span className="text-gradient">FixiFly AMC</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our Annual Maintenance Contracts provide comprehensive device care with proven results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <Card 
                  key={benefit.title} 
                  className="service-card text-center"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="pt-6">
                    <div className="bg-gradient-tech p-4 rounded-2xl w-fit mx-auto mb-4">
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto animate-slide-up">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">
              Common questions about our AMC plans and services
            </p>
          </div>

          <Card className="service-card">
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b border-border/50">
                  <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">
                    Can I upgrade or downgrade my plan anytime?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, you can upgrade or downgrade your plan at any time. When upgrading, the price difference will be prorated for the remaining billing period. When downgrading, the change will take effect at your next billing cycle to ensure you get the full value of your current plan.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-b border-border/50">
                  <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">
                    What devices and equipment are covered under AMC?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We cover laptops, desktops, Mac computers, printers, scanners, routers, and other IT equipment. Our coverage includes both hardware and software issues. For specific device compatibility or specialized equipment, please contact our team for detailed information.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border-b border-border/50">
                  <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">
                    Are there any setup fees or hidden costs?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    No, there are absolutely no setup fees for any of our AMC plans. You only pay the monthly subscription fee with complete transparency. All services included in your plan are covered without additional charges, and we'll always inform you upfront if any service falls outside your plan coverage.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border-b border-border/50">
                  <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">
                    How does the warranty and service guarantee work?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    All repairs and replacements come with our standard 90-day warranty. AMC customers receive extended warranty coverage on all services. We also provide a 100% satisfaction guarantee - if you're not completely satisfied with our service, we'll make it right or provide a full refund.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AMC;