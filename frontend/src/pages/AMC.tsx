import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Award,
  Calendar,
  CreditCard,
  Settings,
  Download,
  Eye,
  Home,
  AlertTriangle,
  FileText,
  Timer
} from "lucide-react";
import AMCSubscriptionModal from "@/components/AMCSubscriptionModal";

const AMC = () => {
  // State for subscription modal
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
  } | null>(null);

  // Mock data for user's current AMC subscriptions
  const myAMCPlans = [
    {
      id: "1",
      planName: "Care Plan",
      status: "Active",
      startDate: "2024-01-15",
      endDate: "2025-01-15",
      nextBilling: "2024-12-15",
      amount: "$79",
      devices: 3,
      usedDevices: 2,
      lastService: "2024-11-20",
      nextService: "2024-12-05",
      homeVisits: {
        total: 4,
        used: 1,
        remaining: 3
      },
      warrantyClaims: {
        total: 2,
        used: 0,
        remaining: 2
      },
      daysRemaining: 45
    },
    {
      id: "2", 
      planName: "Try Plan",
      status: "Active",
      startDate: "2024-10-01",
      endDate: "2025-10-01",
      nextBilling: "2024-12-01",
      amount: "$29",
      devices: 1,
      usedDevices: 1,
      lastService: "2024-11-15",
      nextService: "2024-12-01",
      homeVisits: {
        total: 2,
        used: 2,
        remaining: 0
      },
      warrantyClaims: {
        total: 1,
        used: 1,
        remaining: 0
      },
      daysRemaining: 305
    }
  ];

  const plans = [
    {
      name: "Try Plan",
      price: "₹29",
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
      price: "₹79",
      period: "/month",
      description: "Best for small businesses and power users",
      popular: true,
      features: [
        "1 Device Coverage",
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
      price: "₹149", 
      period: "/month",
      description: "Complete peace of mind for enterprises",
      popular: false,
      features: [
        "1 Device Coverage",
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

  // Handle subscription button click
  const handleSubscribeClick = (plan: typeof plans[0]) => {
    setSelectedPlan({
      name: plan.name,
      price: plan.price,
      period: plan.period,
      description: plan.description,
      features: plan.features
    });
    setIsSubscriptionModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsSubscriptionModalOpen(false);
    setSelectedPlan(null);
  };

  return (
    <div className="min-h-screen pt-16 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-8 md:mb-16 animate-slide-up">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-gradient">AMC</span> Management
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8 hidden md:block">
            Manage your Annual Maintenance Contracts and explore new plans. 
            Keep your devices running smoothly with comprehensive coverage.
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="plans" className="text-base font-semibold">
              AMC Plans
            </TabsTrigger>
            <TabsTrigger value="my-amc" className="text-base font-semibold">
              My AMC
            </TabsTrigger>
          </TabsList>

          {/* AMC Plans Tab */}
          <TabsContent value="plans" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Choose Your <span className="text-gradient">AMC Plan</span>
              </h2>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-16 animate-fade-in-delay max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`service-card relative max-w-sm mx-auto md:max-w-none flex flex-col h-full ${plan.popular ? 'ring-2 ring-primary scale-105' : ''}`}
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

              <CardHeader className="text-center pb-2 md:pb-4 px-3 md:px-4">
                <CardTitle className="text-lg md:text-xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-xs md:text-sm mb-1 md:mb-2">
                  {plan.description}
                </CardDescription>
                <div className="text-center">
                  <span className="text-xl md:text-2xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 md:space-y-3 px-3 md:px-4 flex flex-col flex-1">
                {/* Included Features */}
                <div className="flex-1">
                  <h4 className="font-semibold mb-1 md:mb-2 text-green-700 text-xs md:text-sm">✓ What's Included</h4>
                  <ul className="space-y-0.5 md:space-y-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center space-x-1 md:space-x-2 text-xs">
                        <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-green-500 flex-shrink-0" />
                        <span className="leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Subscribe Button - Always at bottom */}
                <div className="mt-auto pt-3">
                  <Button 
                    className="w-full py-2 md:py-3 text-xs md:text-sm bg-primary hover:bg-primary-dark text-primary-foreground"
                    size="sm"
                    onClick={() => handleSubscribeClick(plan)}
                  >
                    Subscribe to {plan.name}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

            {/* Benefits Section */}
            <div className="mb-16 animate-slide-up hidden md:block">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Why Choose <span className="text-gradient">FixFly AMC</span>?
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

          </TabsContent>

          {/* My AMC Tab */}
          <TabsContent value="my-amc" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                My <span className="text-gradient">AMC Subscriptions</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto hidden md:block">
                Manage your active AMC plans, view service history, and track your device coverage.
              </p>
            </div>

            {/* Active AMC Plans */}
            <div className="space-y-4">
              {myAMCPlans.map((plan, index) => (
                <Card key={plan.id} className="service-card">
                  <CardHeader className="pb-3 px-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{plan.planName}</CardTitle>
                        <CardDescription className="text-sm">
                          Active since {new Date(plan.startDate).toLocaleDateString()}
                        </CardDescription>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                          <div className="flex items-center space-x-1">
                            <Timer className="h-3 w-3 text-orange-500 flex-shrink-0" />
                            <span className="text-xs font-medium text-orange-600">
                              {plan.daysRemaining} days left
                            </span>
                          </div>
                          {plan.daysRemaining <= 30 && (
                            <Badge variant="destructive" className="text-xs px-2 py-0.5 w-fit">
                              <AlertTriangle className="h-2 w-2 mr-1" />
                              Expires Soon
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge 
                        className={`text-xs px-2 py-1 w-fit ${
                          plan.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {plan.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Plan Details */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-xs text-muted-foreground">Plan Details</h4>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs">{plan.amount}/month</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs">Next billing: {new Date(plan.nextBilling).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs">Expires: {new Date(plan.endDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Device Coverage */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-xs text-muted-foreground">Device Coverage</h4>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Devices Used</span>
                            <span className="text-xs font-medium">{plan.usedDevices}/{plan.devices}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-primary h-1.5 rounded-full" 
                              style={{ width: `${(plan.usedDevices / plan.devices) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Service History */}
                      <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                        <h4 className="font-semibold text-xs text-muted-foreground">Service History</h4>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs">Last: {new Date(plan.lastService).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs">Next: {new Date(plan.nextService).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Benefits Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
                      {/* Free Home Visits */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-xs text-muted-foreground">Free Home Visits</h4>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <Home className="h-3 w-3 text-blue-500 flex-shrink-0" />
                              <span className="text-xs">Used</span>
                            </div>
                            <span className="text-xs font-medium">
                              {plan.homeVisits.used}/{plan.homeVisits.total}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                plan.homeVisits.remaining === 0 
                                  ? 'bg-red-500' 
                                  : plan.homeVisits.remaining <= 1 
                                    ? 'bg-yellow-500' 
                                    : 'bg-blue-500'
                              }`}
                              style={{ width: `${(plan.homeVisits.used / plan.homeVisits.total) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Left: {plan.homeVisits.remaining}</span>
                            {plan.homeVisits.remaining === 0 && (
                              <Badge variant="destructive" className="text-xs px-1 py-0.5">
                                All Used
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Warranty Claims */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-xs text-muted-foreground">Warranty Claims</h4>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <Shield className="h-3 w-3 text-green-500 flex-shrink-0" />
                              <span className="text-xs">Used</span>
                            </div>
                            <span className="text-xs font-medium">
                              {plan.warrantyClaims.used}/{plan.warrantyClaims.total}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                plan.warrantyClaims.remaining === 0 
                                  ? 'bg-red-500' 
                                  : plan.warrantyClaims.remaining <= 1 
                                    ? 'bg-yellow-500' 
                                    : 'bg-green-500'
                              }`}
                              style={{ width: `${(plan.warrantyClaims.used / plan.warrantyClaims.total) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Left: {plan.warrantyClaims.remaining}</span>
                            {plan.warrantyClaims.remaining === 0 && (
                              <Badge variant="destructive" className="text-xs px-1 py-0.5">
                                All Used
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <h4 className="font-semibold text-xs text-muted-foreground mb-2">Actions</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" className="w-full text-xs h-8">
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="w-full text-xs h-8">
                          <Download className="h-3 w-3 mr-1" />
                          Download Invoice
                        </Button>
                        <Button 
                          variant={plan.warrantyClaims.remaining > 0 ? "default" : "outline"} 
                          size="sm" 
                          className="w-full text-xs h-8 sm:col-span-2 lg:col-span-1"
                          disabled={plan.warrantyClaims.remaining === 0}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Claim Warranty
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

          </TabsContent>
        </Tabs>

        {/* Subscription Modal */}
        {selectedPlan && (
          <AMCSubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={handleModalClose}
            planName={selectedPlan.name}
            planPrice={selectedPlan.price}
            planPeriod={selectedPlan.period}
            planDescription={selectedPlan.description}
            planFeatures={selectedPlan.features}
          />
        )}
      </div>
    </div>
  );
};

export default AMC;