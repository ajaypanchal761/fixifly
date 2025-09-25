import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  ArrowLeft,
  Users,
  TrendingUp
} from "lucide-react";
import { getAMCPlan } from "@/services/amcApiService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const AMCPlanDetails = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userHasActiveSubscription, setUserHasActiveSubscription] = useState(false);

  useEffect(() => {
    if (planId) {
      fetchPlanDetails();
    }
  }, [planId]);

  const fetchPlanDetails = async () => {
    try {
      setLoading(true);
      const response = await getAMCPlan(planId);
      
      if (response.success && response.data) {
        setPlan(response.data.plan);
        setUserHasActiveSubscription(response.data.userHasActiveSubscription || false);
        setError(null);
      } else {
        setError('Failed to load plan details');
      }
    } catch (err: any) {
      console.error('Error fetching plan details:', err);
      setError(err.message || 'Failed to load plan details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      toast.error("Please login to subscribe to AMC plans");
      navigate('/login');
      return;
    }

    if (userHasActiveSubscription) {
      toast.info("You already have an active subscription for this plan");
      return;
    }

    // Navigate to subscription modal or page
    navigate(`/amc/subscribe/${planId}`);
  };

  const getFeatureIcon = (featureTitle: string) => {
    const title = featureTitle.toLowerCase();
    if (title.includes('call') || title.includes('support')) return Headphones;
    if (title.includes('remote')) return Settings;
    if (title.includes('home') || title.includes('visit')) return Home;
    if (title.includes('antivirus')) return Shield;
    if (title.includes('software') || title.includes('installation')) return Download;
    if (title.includes('spare') || title.includes('parts')) return Wrench;
    if (title.includes('labor') || title.includes('cost')) return CreditCard;
    if (title.includes('discount')) return TrendingUp;
    return Check;
  };

  const getBenefitIcon = (benefitKey: string) => {
    switch (benefitKey) {
      case 'callSupport': return Headphones;
      case 'remoteSupport': return Settings;
      case 'homeVisits': return Home;
      case 'antivirus': return Shield;
      case 'softwareInstallation': return Download;
      case 'sparePartsDiscount': return TrendingUp;
      case 'freeSpareParts': return Wrench;
      case 'laborCost': return CreditCard;
      default: return Check;
    }
  };

  const formatBenefitValue = (benefitKey: string, value: any) => {
    switch (benefitKey) {
      case 'callSupport':
      case 'remoteSupport':
        return value === 'unlimited' ? 'Unlimited' : value;
      case 'homeVisits':
        return value.count > 0 ? `${value.count} Free Visits` : 'No Home Visits';
      case 'antivirus':
        return value.included ? (value.name || 'Antivirus Included') : 'Not Included';
      case 'softwareInstallation':
        return value.included ? 'Included' : 'Not Included';
      case 'sparePartsDiscount':
        return value.percentage > 0 ? `${value.percentage}% Discount` : 'No Discount';
      case 'freeSpareParts':
        return value.amount > 0 ? `₹${value.amount} Free Parts` : 'No Free Parts';
      case 'laborCost':
        return value.included ? 'Labor Cost Included' : 'Labor Cost Not Included';
      default:
        return value;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plan details...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Plan Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested AMC plan could not be found.'}</p>
          <Button onClick={() => navigate('/amc')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to AMC Plans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => navigate('/amc')} 
                variant="ghost" 
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Plans
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{plan.name}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {plan.isPopular && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  <Star className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              )}
              {plan.isRecommended && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Award className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Plan Image */}
            {plan.image && (
              <Card>
                <CardContent className="p-0">
                  <img 
                    src={plan.image} 
                    alt={plan.name}
                    className="w-full h-64 object-cover rounded-t-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Plan Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  Plan Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Plan Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{plan.period === 'yearly' ? '1 Year' : '1 Month'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Validity:</span>
                        <span className="font-medium">{plan.validityPeriod} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                          {plan.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Benefits Summary</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm text-gray-600">
                          {plan.benefits?.callSupport === 'unlimited' ? 'Unlimited' : 'Limited'} Call Support
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm text-gray-600">
                          {plan.benefits?.remoteSupport === 'unlimited' ? 'Unlimited' : 'Limited'} Remote Support
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm text-gray-600">
                          {plan.benefits?.homeVisits?.count || 0} Home Visits
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            {plan.features && plan.features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                    Features & Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plan.features.map((feature: any, index: number) => {
                      const IconComponent = getFeatureIcon(feature.title);
                      return (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <IconComponent className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-gray-900">{feature.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Limitations */}
            {plan.limitations && plan.limitations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                    Limitations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {plan.limitations.map((limitation: any, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-gray-900">{limitation.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{limitation.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card className="sticky top-8">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-gray-900">
                  ₹{plan.price}
                </CardTitle>
                <CardDescription className="text-lg">
                  per {plan.period === 'yearly' ? 'year' : 'month'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  
                  {userHasActiveSubscription ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <Check className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-medium text-green-800">Active Subscription</span>
                      </div>
                      <p className="text-sm text-green-700">You already have an active subscription for this plan.</p>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleSubscribe}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                      size="lg"
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Subscribe Now
                    </Button>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-center text-sm text-gray-500">
                    <Shield className="h-4 w-4 mr-1" />
                    Secure Payment by Razorpay
                  </div>
                </div>

              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AMCPlanDetails;
