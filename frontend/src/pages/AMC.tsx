import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <div className="text-center mb-16 animate-slide-up">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Choose Your <span className="text-gradient">AMC Plan</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            Annual Maintenance Contracts designed to keep your devices running smoothly. 
            Preventive care, priority support, and comprehensive coverage all year round.
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
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
        <div className="grid md:grid-cols-3 gap-8 mb-16 animate-fade-in-delay">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`service-card relative ${plan.popular ? 'ring-2 ring-primary scale-105' : ''}`}
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

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-base mb-4">
                  {plan.description}
                </CardDescription>
                <div className="text-center">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Included Features */}
                <div>
                  <h4 className="font-semibold mb-3 text-green-700">✓ What's Included</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center space-x-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Not Included Features */}
                {plan.notIncluded.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-muted-foreground">✗ Not Included</h4>
                    <ul className="space-y-2">
                      {plan.notIncluded.map((feature) => (
                        <li key={feature} className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span className="w-4 h-4 flex-shrink-0">✗</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button 
                  className={`w-full py-6 text-lg ${
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
        <div className="mb-16 animate-slide-up">
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

        {/* Statistics */}
        <div className="bg-gradient-card rounded-3xl p-8 mb-16 animate-fade-in-delay">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Trusted by Thousands</h3>
            <p className="text-muted-foreground">See why businesses choose FixiFly AMC</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">5,000+</div>
              <div className="text-muted-foreground">Active Contracts</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Support Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">15 min</div>
              <div className="text-muted-foreground">Avg Response Time</div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto animate-slide-up">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">
              Common questions about our AMC plans
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="service-card">
              <CardHeader>
                <CardTitle className="text-lg">Can I upgrade my plan anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, you can upgrade your plan at any time. The price difference will be prorated 
                  for the remaining billing period.
                </p>
              </CardContent>
            </Card>

            <Card className="service-card">
              <CardHeader>
                <CardTitle className="text-lg">What devices are covered?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We cover laptops, desktops, Mac computers, printers, and other IT equipment. 
                  Check with our team for specific device compatibility.
                </p>
              </CardContent>
            </Card>

            <Card className="service-card">
              <CardHeader>
                <CardTitle className="text-lg">Is there a setup fee?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No, there are no setup fees for any of our AMC plans. You only pay the monthly 
                  subscription fee with no hidden costs.
                </p>
              </CardContent>
            </Card>

            <Card className="service-card">
              <CardHeader>
                <CardTitle className="text-lg">How does the warranty work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  All repairs and replacements come with our standard warranty. AMC customers 
                  get extended warranty coverage on all services.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 animate-fade-in-delay">
          <Card className="service-card max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
              <CardDescription className="text-lg">
                Join thousands of satisfied customers who trust FixiFly for their IT maintenance needs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="btn-tech text-white">
                  <Zap className="h-5 w-5 mr-2" />
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline">
                  <Headphones className="h-5 w-5 mr-2" />
                  Talk to Sales
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                30-day money back guarantee • No setup fees • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AMC;