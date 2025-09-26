import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CreditCard, Shield, Check, Loader2, User, Mail, Phone, MapPin, LogIn } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import razorpayService, { BookingData } from "@/services/razorpayService";

interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
}

interface CheckoutData {
  cartItems: CartItem[];
  totalPrice: number;
}

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  
  // Customer form data - initialize with user data if available
  const [customerData, setCustomerData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: {
      street: user?.address?.street || "",
      city: user?.address?.city || "",
      state: user?.address?.state || "",
      pincode: user?.address?.pincode || ""
    },
    notes: ""
  });

  // Update customer data when user changes
  useEffect(() => {
    if (user) {
      setCustomerData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email, // Always use user's email if available
        phone: user.phone || prev.phone,
        address: {
          street: user.address?.street || prev.address.street,
          city: user.address?.city || prev.address.city,
          state: user.address?.state || prev.address.state,
          pincode: user.address?.pincode || prev.address.pincode
        }
      }));
    }
  }, [user]);
  
  const SERVICE_FEE = 100;

  // Helper function to format phone number
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // If it starts with 91, add + prefix
    if (digits.startsWith('91') && digits.length === 12) {
      return `+${digits}`;
    }
    
    // If it doesn't start with 91, add +91 prefix
    if (digits.length === 10) {
      return `+91${digits}`;
    }
    
    // If it already has +91, keep it
    if (value.startsWith('+91')) {
      return value;
    }
    
    return value;
  };

  // Update customer data when user changes
  useEffect(() => {
    if (user) {
      setCustomerData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          pincode: user.address?.pincode || ""
        },
        notes: ""
      });
    }
  }, [user]);

  useEffect(() => {
    if (location.state?.cartItems && location.state?.totalPrice) {
      setCheckoutData({
        cartItems: location.state.cartItems,
        totalPrice: location.state.totalPrice
      });
    } else {
      // Redirect to home if no cart data
      navigate('/');
    }
  }, [location.state, navigate]);

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  const subtotal = checkoutData.totalPrice;
  const serviceFee = SERVICE_FEE;
  const totalAmount = subtotal + serviceFee;

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!customerData.name || !customerData.email || !customerData.phone) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields (Name, Email, Phone)",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      // Debug: Log the email being used
      console.log('Creating booking with email:', customerData.email);
      console.log('Logged in user email:', user?.email);
      
      // Validate phone number format (should start with +91)
      if (!customerData.phone.startsWith('+91') || customerData.phone.length !== 13) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid Indian phone number starting with +91",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      // Create booking data for Razorpay
      const bookingData: BookingData = {
        customer: customerData,
        services: checkoutData.cartItems.map(item => ({
          serviceId: item.id,
          serviceName: item.title,
          price: item.price
        })),
        pricing: {
          subtotal: subtotal,
          serviceFee: serviceFee,
          totalAmount: totalAmount
        },
        scheduling: {
          preferredDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          preferredTimeSlot: 'morning'
        },
        notes: customerData.notes || "Booking created from checkout"
      };

      // Process payment with Razorpay
      await razorpayService.processBookingPayment(
        bookingData,
        // Success callback
        (response) => {
          toast({
            title: "Payment Successful!",
            description: `Your booking has been confirmed. Reference: ${response.bookingReference}`,
            variant: "default"
          });

          // Redirect to booking page with booking data
          navigate('/booking', { 
            state: { 
              booking: response.booking,
              bookingReference: response.bookingReference,
              fromCheckout: true 
            } 
          });
        },
        // Failure callback
        (error) => {
          console.error('Payment failed:', error);
          toast({
            title: "Payment Failed",
            description: error instanceof Error ? error.message : "Please try again or contact support.",
            variant: "destructive"
          });
        },
        // Close callback
        () => {
          console.log('Payment modal closed');
        }
      );
      
    } catch (error) {
      console.error('Payment initialization failed:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Checkout</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Services</span>
            </Button>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Customer Information</h2>
              {!isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="flex items-center space-x-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login to Auto-fill</span>
                </Button>
              )}
            </div>
            
            {isAuthenticated && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ Logged in as <strong>{user?.name}</strong> - Your profile information has been loaded
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Full Name</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={customerData.name}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email Address</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  readOnly={Boolean(isAuthenticated && user?.email)} // Make read-only if user is logged in
                  className={isAuthenticated && user?.email ? "bg-gray-100" : ""}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>Phone Number</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setCustomerData(prev => ({ ...prev, phone: formatted }));
                  }}
                  placeholder="+91 98765 43210"
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Address</span>
                </Label>
                <Input
                  id="address"
                  type="text"
                  value={customerData.address.street}
                  onChange={(e) => setCustomerData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, street: e.target.value }
                  }))}
                  placeholder="Enter your address"
                />
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  value={customerData.address.city}
                  onChange={(e) => setCustomerData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, city: e.target.value }
                  }))}
                  placeholder="Enter your city"
                />
              </div>

              {/* State */}
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  type="text"
                  value={customerData.address.state}
                  onChange={(e) => setCustomerData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, state: e.target.value }
                  }))}
                  placeholder="Enter your state"
                />
              </div>

              {/* Pincode */}
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  type="text"
                  value={customerData.address.pincode}
                  onChange={(e) => setCustomerData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, pincode: e.target.value }
                  }))}
                  placeholder="Enter your pincode"
                />
              </div>
            </div>

            {/* Issue Description */}
            <div className="space-y-2">
              <Label htmlFor="notes">Issue Description</Label>
              <Textarea
                id="notes"
                value={customerData.notes}
                onChange={(e) => setCustomerData(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                placeholder="Describe the issue or problem you're facing..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            
            {/* Services List */}
            <div className="space-y-3 mb-6">
              {checkoutData.cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">₹{item.price}</span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Service Fee</span>
                <span>₹{serviceFee}</span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total Amount</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Book Now Button */}
          <Button 
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay with Razorpay - ₹${totalAmount}`
            )}
          </Button>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-4">
            By clicking "Book Now", you agree to our Terms of Service and Privacy Policy.
            Your payment will be processed securely.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
