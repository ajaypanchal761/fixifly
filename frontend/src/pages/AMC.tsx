import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  Timer,
  ArrowRight,
  RefreshCw,
  Phone,
  Monitor,
  BarChart3
} from "lucide-react";
import AMCSubscriptionModal from "@/components/AMCSubscriptionModal";
import AMCSubscriptionDetailsModal from "@/components/AMCSubscriptionDetailsModal";
import { getAMCPlans, getUserAMCSubscriptions } from "@/services/amcApiService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const AMC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for subscription modal
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    planId: string;
  } | null>(null);

  // State for subscription details modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);

  // State for dynamic AMC plans
  const [amcPlans, setAmcPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for user subscriptions
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subscriptionsError, setSubscriptionsError] = useState<string | null>(null);

  // Function to fetch AMC plans
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching AMC plans from API...');
      const response = await getAMCPlans();
      console.log('API Response:', response);
      
      if (response.success && response.data) {
        const plans = response.data.plans || [];
        console.log('Plans received from API:', plans.length, plans);
        
        // Always use the plans from API (no more fallback logic)
        setAmcPlans(plans);
        setError(null);
      } else {
        console.log('API response failed, no plans available');
        setAmcPlans([]);
        setError('Failed to load AMC plans');
      }
    } catch (err: any) {
      console.error('API fetch failed:', err.message);
      setAmcPlans([]);
      setError('Failed to load AMC plans: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []); // Remove loading dependency to prevent infinite loop

  // Function to fetch user subscriptions
  const fetchUserSubscriptions = useCallback(async () => {
    try {
      setSubscriptionsLoading(true);
      console.log('Fetching user AMC subscriptions...');
      
      // Check if user is logged in
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('User not logged in, skipping subscription fetch');
        setUserSubscriptions([]);
        setSubscriptionsError(null);
        return;
      }
      
      const response = await getUserAMCSubscriptions('active');
      console.log('User subscriptions response:', response);

      if (response.success && response.data) {
        const subscriptions = response.data.subscriptions || [];
        console.log('User subscriptions received:', subscriptions.length, subscriptions);
        setUserSubscriptions(subscriptions);
        setSubscriptionsError(null);
      } else {
        console.log('No active subscriptions found');
        setUserSubscriptions([]);
        setSubscriptionsError(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch user subscriptions:', err.message);
      // If it's an authentication error, don't show error to user
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        console.log('User not authenticated, skipping subscription fetch');
        setUserSubscriptions([]);
        setSubscriptionsError(null);
      } else {
        setUserSubscriptions([]);
        setSubscriptionsError('Failed to load your AMC subscriptions');
      }
    } finally {
      setSubscriptionsLoading(false);
    }
  }, []); // Remove subscriptionsLoading dependency to prevent infinite loop

  // Fetch AMC plans and user subscriptions on component mount
  useEffect(() => {
    fetchPlans();
    fetchUserSubscriptions();
  }, [fetchPlans, fetchUserSubscriptions]); // Depend on memoized functions

  // Refresh subscriptions when user logs in/out
  useEffect(() => {
    fetchUserSubscriptions();
  }, [user, fetchUserSubscriptions]); // Depend on user and memoized function

  // Transform user subscriptions to UI format
  const transformSubscriptionData = (subscriptions: any[]) => {
    return subscriptions
      .filter(subscription => {
        // Filter out expired subscriptions
        const endDate = new Date(subscription.endDate || new Date(subscription.createdAt || subscription.startDate || new Date()).getTime() + 365 * 24 * 60 * 60 * 1000);
        const now = new Date();
        return endDate > now; // Only include subscriptions that haven't expired
      })
      .map(subscription => {
        const startDate = new Date(subscription.createdAt || subscription.startDate || new Date());
        const endDate = new Date(subscription.endDate || new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000));
        const now = new Date();
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        
        return {
          id: subscription._id || subscription.id,
          subscriptionId: subscription.subscriptionId || subscription._id || subscription.id,
          planName: subscription.planName,
          status: subscription.status === 'active' ? 'Active' : subscription.status,
          startDate: startDate,
          endDate: endDate,
          nextBilling: subscription.nextBillingDate || endDate,
          amount: `₹${subscription.amount}`,
          devices: subscription.devices?.length || 0,
          usedDevices: subscription.devices?.filter((d: any) => d.isActive).length || 0,
          // Remote Support Usage
          remoteSupport: {
            used: subscription.usage?.remoteSupport?.used || 0,
            limit: subscription.planName === 'TRY PLAN' ? 3 : (subscription.usage?.remoteSupport?.limit || 'unlimited'),
            remaining: subscription.planName === 'TRY PLAN' ? (3 - (subscription.usage?.remoteSupport?.used || 0)) : (subscription.usage?.remoteSupport?.limit === 'unlimited' ? 'unlimited' : ((subscription.usage?.remoteSupport?.limit || 'unlimited') - (subscription.usage?.remoteSupport?.used || 0)))
          },
          // Home Visits Usage
          homeVisits: {
            total: subscription.usage?.homeVisits?.limit || 1,
            used: subscription.usage?.homeVisits?.used || 0,
            remaining: subscription.usage?.homeVisits?.remaining || 1
          },
          // Warranty Claims Usage - Show actual claims count
          warrantyClaims: {
            total: subscription.usage?.warrantyClaims?.limit || subscription.usage?.sparePartsDiscount?.limit || 1,
            used: subscription.usage?.warrantyClaims?.used || subscription.serviceHistory?.filter((service: any) => service.type === 'warranty').length || 0,
            remaining: Math.max(0, (subscription.usage?.warrantyClaims?.limit || subscription.usage?.sparePartsDiscount?.limit || 1) - (subscription.usage?.warrantyClaims?.used || subscription.serviceHistory?.filter((service: any) => service.type === 'warranty').length || 0))
          },
          daysRemaining: daysRemaining,
          paymentStatus: subscription.paymentStatus,
          paymentMethod: subscription.paymentMethod,
          razorpayOrderId: subscription.razorpayOrderId,
          razorpayPaymentId: subscription.razorpayPaymentId,
          rawData: subscription // Keep original data for detailed view
        };
      });
  };

  // Use real subscription data
  const myAMCPlans = transformSubscriptionData(userSubscriptions);

  // Transform API data to UI format
  const transformPlanData = (apiPlans: any[]) => {
    return apiPlans.map(plan => ({
      id: plan._id || plan.id,
      name: plan.name,
      price: `₹${plan.price}`,
      period: `/${plan.period}`,
      description: plan.description,
      popular: plan.isPopular || false,
      features: plan.features ? plan.features.map((feature: any) => 
        typeof feature === 'string' ? feature : feature.title || feature.description
      ) : [],
      notIncluded: [] // We can add this logic later if needed
    }));
  };

  // Use dynamic plans from API or fallback to static data
  const plans = amcPlans.length > 0 ? transformPlanData(amcPlans) : [
    {
      name: "TRY PLAN",
      price: "₹17",
      period: "/yearly",
      description: "",
      popular: false,
      features: [
        "Unlimited Call Support",
        "3 Remote Support Sessions",
        "1 Free Home Visit & Diagnosis",
        "Free Hidden Tips & Tricks"
      ],
      notIncluded: [
        "Antivirus Protection",
        "Software Installation",
        "Spare Parts Discount"
      ]
    },
    {
      name: "CARE PLAN", 
      price: "₹59",
      period: "/yearly",
      description: "Comprehensive AMC plan with advanced features and support",
      popular: true,
      features: [
        "Unlimited Call Support",
        "Unlimited Remote Support",
        "Free Antivirus Pro For 1 Year",
        "6 Free Home Visits",
        "Free Software Installation & Driver Updates",
        "Up to 40% Off on All Spare Parts"
      ],
      notIncluded: [
        "Labor Cost Coverage",
        "Free Spare Parts"
      ]
    },
    {
      name: "RELAX PLAN",
      price: "₹199", 
      period: "/yearly",
      description: "Premium AMC plan with all-inclusive features and maximum benefits",
      popular: false,
      features: [
        "Unlimited Call Support",
        "Unlimited Remote Support",
        "Free Quick Heal Pro Antivirus For 1 Year",
        "Free Windows MS Office Installation with Software Support",
        "12 Free Home Visits and Diagnosis",
        "No Labor Cost for 1 Year",
        "Free Spare Parts up to ₹2000",
        "Up to 60% Off on Premium Spare Parts"
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
  const handleSubscribe = (name: string, price: string, period: string, description: string, features: string[], planId: string) => {
    // Navigate to subscription page instead of opening modal
    navigate(`/amc/subscribe/${planId}`);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsSubscriptionModalOpen(false);
    setSelectedPlan(null);
  };

  // Handle view details button click
  const handleViewDetails = (subscription: any) => {
    setSelectedSubscription(subscription);
    setIsDetailsModalOpen(true);
  };

  // Handle download invoice button click
  const handleDownloadInvoice = async (subscription: any) => {
    try {
      // Create invoice data
      const invoiceData = {
        subscriptionId: subscription.subscriptionId || subscription.id,
        planName: subscription.planName,
        amount: subscription.amount,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        paymentStatus: subscription.paymentStatus,
        paymentMethod: subscription.paymentMethod,
        razorpayOrderId: subscription.razorpayOrderId,
        razorpayPaymentId: subscription.razorpayPaymentId,
        devices: subscription.rawData?.devices || []
      };

      // Use the proper API base URL
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const url = `${API_BASE_URL}/generate-invoice`;

      // Generate and download invoice
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Determine file extension based on content type
        const contentType = response.headers.get('content-type');
        const fileExtension = contentType === 'application/pdf' ? 'pdf' : 'html';
        a.download = `AMC-Invoice-${subscription.subscriptionId || subscription.id}.${fileExtension}`;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Invoice downloaded successfully!");
      } else {
        // Try to get error message from response
        let errorMessage = 'Failed to generate invoice';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          errorMessage = `Server returned ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Invoice download error:', error);
      toast.error(`Failed to download invoice: ${error.message}`);
    }
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

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading AMC plans...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-red-800">{error}</p>
                </div>
                <Button onClick={fetchPlans} variant="outline">
                  Try Again
                </Button>
              </div>
            )}

            {/* AMC Plans Cards */}
            {!loading && !error && amcPlans.length > 0 && (
              <div className="grid md:grid-cols-3 gap-8 items-stretch mb-16 animate-fade-in-delay max-w-5xl mx-auto">
                {amcPlans.map((plan) => (
                  <Card 
                    key={plan._id || plan.id} 
                    className={`relative border-2 hover:shadow-lg transition-shadow flex flex-col h-full ${plan.isPopular ? 'border-blue-500' : ''}`}
                  >
                    {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1 text-sm font-semibold">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
                    )}
                    <CardHeader className={`text-center pb-4 ${plan.isPopular ? 'pt-6' : ''}`}>
                      <CardTitle className="text-xl font-bold text-gray-800">{plan.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                  <div className="mt-4">
                        <span className="text-3xl font-bold text-blue-600">₹{plan.price}</span>
                        <span className="text-gray-500">/{plan.period}</span>
                </div>
              </CardHeader>

                <CardContent className="flex flex-col flex-grow">
                  <div className="space-y-3 flex-grow">
                        {plan.features && plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{feature.title}</span>
                    </div>
                        ))}
                </div>

                  <div className="pt-4 mt-auto space-y-2">
                  <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => navigate(`/amc/plan/${plan._id || plan.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleSubscribe(
                            plan.name, 
                            `₹${plan.price}`, 
                            plan.period, 
                            plan.description, 
                            plan.features ? plan.features.map(f => f.title) : [],
                            plan._id || plan.id
                          )}
                        >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Subscribe Now
                  </Button>
                </div>
              </CardContent>
            </Card>
                ))}
            </div>
            )}

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
          <TabsContent value="my-amc" className="space-y-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
                <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                My <span className="text-gradient">AMC Subscriptions</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto sm:mx-0">
                Manage your active AMC plans, view service history, and track your device coverage.
              </p>
                </div>
              </div>
            </div>

            {/* Active AMC Plans */}
            {subscriptionsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your AMC subscriptions...</p>
              </div>
            ) : subscriptionsError ? (
              <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-red-800">{subscriptionsError}</p>
                </div>
                <Button onClick={fetchUserSubscriptions} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : myAMCPlans.length > 0 ? (
            <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
              {myAMCPlans.map((plan, index) => (
                <Card key={plan.id} className="w-full max-w-4xl mx-auto shadow-sm">
                  {/* Subscription Header */}
                  <CardHeader className="pb-4 px-4 sm:px-6">
                    <div className="flex flex-col gap-3">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                          <CardTitle className="text-lg sm:text-xl">{plan.planName}</CardTitle>
                          <div className="flex gap-2">
                            <Badge 
                              className={`w-fit ${
                                plan.status === 'Active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {plan.status}
                            </Badge>
                          </div>
                        </div>
                        <CardDescription className="text-sm mb-3">
                          Active since {new Date(plan.startDate).toLocaleDateString()}
                        </CardDescription>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="flex items-center space-x-1">
                            <Timer className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-medium text-orange-600">
                              {plan.daysRemaining} days left
                            </span>
                          </div>
                          {plan.daysRemaining <= 30 && (
                            <Badge variant="destructive" className="text-xs w-fit">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Expires Soon
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Action Buttons */}
                    <div className="mb-6 px-4 sm:px-6">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                          onClick={() => handleDownloadInvoice(plan)}
                          className="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-10"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Invoice
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(plan)}
                          className="flex-1 h-10"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>

                    {/* Subscription Details Section */}
                    <div className="mb-6 px-4 sm:px-6">
                      <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Subscription Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <Label className="text-sm font-medium text-muted-foreground">Subscription ID</Label>
                          <p className="text-sm font-medium font-mono mt-1">{plan.subscriptionId}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <Label className="text-sm font-medium text-muted-foreground">Next Billing</Label>
                          <p className="text-sm mt-1">{new Date(plan.nextBilling).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg sm:col-span-2 lg:col-span-1">
                          <Label className="text-sm font-medium text-muted-foreground">Expires</Label>
                          <p className="text-sm mt-1">{new Date(plan.endDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Usage Statistics Section */}
                    <div className="mb-6">
                      <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Usage Statistics
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Remote Support */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Monitor className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium">Remote Support</span>
                            </div>
                            <span className="text-sm">
                              {plan.remoteSupport.used}/{plan.remoteSupport.limit === 'unlimited' ? '∞' : plan.remoteSupport.limit}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: plan.remoteSupport.limit === 'unlimited' ? '100%' : `${Math.min(100, ((plan.remoteSupport.used || 0) / (plan.remoteSupport.limit || 1)) * 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {plan.remoteSupport.limit === 'unlimited' ? 'Unlimited' : `Remaining: ${(plan.remoteSupport.limit || 0) - (plan.remoteSupport.used || 0)}`}
                          </p>
                        </div>

                        {/* Home Visits */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Home className="h-4 w-4 text-purple-500" />
                              <span className="text-sm font-medium">Home Visits</span>
                            </div>
                            <span className="text-sm">{plan.homeVisits.used}/{plan.homeVisits.total}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                plan.homeVisits.remaining === 0 ? 'bg-red-500' : 
                                plan.homeVisits.remaining <= 1 ? 'bg-yellow-500' : 'bg-purple-500'
                              }`}
                              style={{ width: `${plan.homeVisits.total ? Math.min(100, (plan.homeVisits.used / plan.homeVisits.total) * 100) : 0}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Remaining: {plan.homeVisits.remaining}
                          </p>
                        </div>

                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
                  <div className="mb-4">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {userSubscriptions.length > 0 ? 'No Active AMC Subscriptions' : 'No AMC Subscriptions'}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {userSubscriptions.length > 0 
                      ? 'All your AMC subscriptions have expired. Choose a new plan to continue with comprehensive device protection.'
                      : 'You don\'t have any AMC subscriptions yet. Choose a plan to get started with comprehensive device protection.'
                    }
                  </p>
                  <Button 
                    onClick={() => {
                      // Switch to plans tab
                      const plansTab = document.querySelector('[value="plans"]') as HTMLElement;
                      if (plansTab) plansTab.click();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {userSubscriptions.length > 0 ? 'Renew AMC Plan' : 'Browse AMC Plans'}
                  </Button>
                </div>
              </div>
            )}

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
            planId={selectedPlan.planId}
          />
        )}

        {/* Subscription Details Modal */}
        <AMCSubscriptionDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          subscription={selectedSubscription}
        />
      </div>
    </div>
  );
};

export default AMC;