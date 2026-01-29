import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Shield, Check, Loader2, User, Mail, Phone, MapPin, LogIn, Banknote } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import bookingApi from "@/services/bookingApi";
import type { BookingData } from "@/services/razorpayService";
import { generateDynamicTimeSlots, getTimeSlotDisplayText } from "@/utils/timeSlotUtils";

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
  const { user, isAuthenticated, refreshUserData, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  // First-time user free service feature has been removed
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean>(false);
  const [checkingFirstTime, setCheckingFirstTime] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Customer form data - initialize with user data if available
  const [customerData, setCustomerData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: {
      street: user?.address?.street || "",
      city: user?.address?.city || "",
      state: user?.address?.state || "N/A", // Default state if not provided
      pincode: user?.address?.pincode || ""
    },
    notes: "",
    scheduledDate: "",
    scheduledTime: ""
  });

  // Refresh user data when component mounts to ensure we have latest address info
  useEffect(() => {
    if (isAuthenticated && refreshUserData) {
      refreshUserData();
    }
  }, [isAuthenticated, refreshUserData]);

  // Initialize customer data with user profile only once on mount
  // After initialization, user can edit freely without profile data overwriting
  useEffect(() => {
    if (!isInitialized && user && isAuthenticated) {
      console.log('Initializing customer data from user profile:', user);
      setCustomerData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        address: {
          street: user.address?.street || prev.address.street,
          city: user.address?.city || prev.address.city,
          state: user.address?.state || prev.address.state,
          pincode: user.address?.pincode || prev.address.pincode
        }
      }));
      setIsInitialized(true);
    }
  }, [user, isAuthenticated, isInitialized]);

  // Generate dynamic time slots based on selected date - using useMemo after customerData is declared
  const timeSlots = useMemo(() => {
    if (!customerData.scheduledDate) {
      // Default slots if no date selected
      return [
        "9:00 AM - 11:00 AM",
        "11:00 AM - 1:00 PM",
        "1:00 PM - 3:00 PM",
        "3:00 PM - 5:00 PM",
        "5:00 PM - 7:00 PM",
        "7:00 PM - 9:00 PM"
      ];
    }
    // Generate dynamic slots for entire day (24 hours) - max 12 slots for full day coverage
    return generateDynamicTimeSlots(customerData.scheduledDate, 2, 12);
  }, [customerData.scheduledDate]);

  // Clear selected time slot if it's not in available slots when date changes
  useEffect(() => {
    if (customerData.scheduledDate && customerData.scheduledTime) {
      const isSlotAvailable = timeSlots.includes(customerData.scheduledTime);

      // If current time slot is not available, clear it
      if (!isSlotAvailable) {
        setCustomerData(prev => ({ ...prev, scheduledTime: "" }));
      }
    }
  }, [customerData.scheduledDate, customerData.scheduledTime, timeSlots]);

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

  useEffect(() => {
    // Check for cart data in location state first
    if (location.state?.cartItems && location.state?.totalPrice !== undefined) {
      console.log('Cart data from location.state:', location.state);
      setCheckoutData({
        cartItems: location.state.cartItems,
        totalPrice: location.state.totalPrice
      });
      return;
    }

    // Fallback: Try to get cart data from localStorage
    let cartDataFound = false;
    try {
      const savedCartData = localStorage.getItem('checkoutCartData');
      if (savedCartData) {
        const parsed = JSON.parse(savedCartData);
        if (parsed.cartItems && parsed.totalPrice !== undefined) {
          console.log('Cart data from localStorage:', parsed);
          setCheckoutData({
            cartItems: parsed.cartItems,
            totalPrice: parsed.totalPrice
          });
          cartDataFound = true;
        }
      }
    } catch (error) {
      console.error('Error reading cart data from localStorage:', error);
    }

    // Only redirect if no cart data found after checking both sources
    // Give it a small delay to allow state to propagate
    if (!cartDataFound && !location.state?.cartItems) {
      const redirectTimer = setTimeout(() => {
        console.log('No cart data found, redirecting to home');
        toast({
          title: "No Items in Cart",
          description: "Please add items to cart before checkout",
          variant: "destructive"
        });
        navigate('/');
      }, 200);

      return () => clearTimeout(redirectTimer);
    }
  }, [location.state, navigate, isAuthenticated, toast, location]);

  // First-time user check removed - all users pay regular pricing

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
  // GST removed from customer pricing – use subtotal as final payable amount
  const totalAmount = subtotal;
  const displaySubtotal = subtotal;

  const handleCashPayment = async (bookingData: BookingData) => {
    try {
      // Create booking with cash payment - restructure data to match backend expectations
      const requestData = {
        customer: {
          ...bookingData.customer,
          phone: bookingData.customer.phone.replace(/^\+91/, '').replace(/^91/, ''), // Remove +91 or 91 prefix for backend
        },
        services: bookingData.services,
        pricing: bookingData.pricing,
        scheduling: bookingData.scheduling,
        notes: bookingData.notes,
        payment: {
          status: 'pending', // Explicitly pending for cash
          method: 'cash',
          transactionId: `CASH_${Date.now()}`,
          paidAt: null
        }
      };

      // Use bookingApi to ensure consistent URL and headers
      // We cast to any because bookingApi's type definition might be strict about payment field
      const response = await bookingApi.createBooking(requestData as any);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create booking');
      }

      const booking = response.data.booking;

      // Save user info for "My Profile" (Guest Login)
      const guestUser = {
        id: (booking.customer as any).id || (booking.customer as any)._id || 'guest_' + Date.now(),
        name: booking.customer.name,
        email: booking.customer.email,
        phone: booking.customer.phone,
        role: 'user',
        address: booking.customer.address
      };

      // Locally "log in" the guest so their info shows in profile
      login(guestUser as any, 'guest_token');

      // Navigate IMMEDIATELY to booking page - instant booking
      navigate('/booking', {
        replace: true,
        state: {
          booking: booking,
          bookingReference: booking.bookingReference,
          fromCheckout: true
        }
      });

      // Show success toast (non-blocking, after navigation)
      setTimeout(() => {
        toast({
          title: "Booking Confirmed!",
          description: `Your booking reference: ${booking.bookingReference}`,
          variant: "default"
        });
      }, 100);

    } catch (error) {
      setLoading(false);
      console.error('Booking creation error:', error);
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to create booking. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!customerData.name || !customerData.email || !customerData.phone ||
        !customerData.address.street || !customerData.address.city ||
        !customerData.address.pincode ||
        !customerData.scheduledDate) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields (Name, Email, Phone, Address, City, Pincode, Schedule Date)",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

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

      // Create booking data
      const bookingData: BookingData = {
        customer: customerData,
        services: checkoutData.cartItems.map(item => ({
          serviceId: item.id,
          serviceName: item.title,
          price: item.price
        })),
        pricing: {
          subtotal: displaySubtotal,
          serviceFee: 0, // Service fee removed
          gstAmount: 0, // GST removed from pricing
          totalAmount: totalAmount
        },
        scheduling: {
          preferredDate: customerData.scheduledDate,
          preferredTimeSlot: customerData.scheduledTime || "Flexible" // Default if not selected
        },
        notes: customerData.notes || "Booking created from checkout"
      };

      // Handle cash payment
      await handleCashPayment(bookingData);

    } catch (error) {
      setLoading(false);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Please try again or contact support.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 pb-24">
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
                  <span>Address *</span>
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
                  required
                />
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center space-x-2">
                  <span>City *</span>
                </Label>
                <Input
                  id="city"
                  type="text"
                  value={customerData.address.city}
                  onChange={(e) => setCustomerData(prev => ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value }
                  }))}
                  placeholder="Enter your city"
                  required
                />
              </div>

              {/* State - Hidden and set to defaults */}
              {/* <div className="space-y-2">
                <Label htmlFor="state" className="flex items-center space-x-2">
                  <span>State *</span>
                </Label>
                <Input
                  id="state"
                  type="text"
                  value={customerData.address.state}
                  onChange={(e) => setCustomerData(prev => ({
                    ...prev,
                    address: { ...prev.address, state: e.target.value }
                  }))}
                  placeholder="Enter your state"
                  required
                />
              </div> */}

              {/* Pincode */}
              <div className="space-y-2">
                <Label htmlFor="pincode" className="flex items-center space-x-2">
                  <span>Pincode *</span>
                </Label>
                <Input
                  id="pincode"
                  type="text"
                  value={customerData.address.pincode}
                  onChange={(e) => setCustomerData(prev => ({
                    ...prev,
                    address: { ...prev.address, pincode: e.target.value }
                  }))}
                  placeholder="Enter your pincode"
                  required
                />
              </div>
            </div>

            {/* Issue Description */}
            <div className="space-y-2">
              <Label htmlFor="notes">Issue Description (Optional)</Label>
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

            {/* Schedule Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Schedule Date */}
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Schedule Date *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={customerData.scheduledDate}
                  onChange={(e) => setCustomerData(prev => ({
                    ...prev,
                    scheduledDate: e.target.value
                  }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {/* Schedule Time */}
              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Schedule Time (Optional)</Label>
                <select
                  id="scheduledTime"
                  value={customerData.scheduledTime}
                  onChange={(e) => setCustomerData(prev => ({
                    ...prev,
                    scheduledTime: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select time slot (Optional)</option>
                  {timeSlots.map((slot) => (
                    <option
                      key={slot}
                      value={slot}
                    >
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Service Delay Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-amber-800">
                    <strong>Service Notice:</strong> Due to high service demand, there might be a slight delay. We appreciate your cooperation.
                  </p>
                </div>
              </div>
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

            {/* Price Breakdown (GST removed from UI) */}
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{displaySubtotal}</span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total Amount</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          {/* Cash on Delivery Button */}
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <Banknote className="h-5 w-5 mr-2" />
                Book Now
              </>
            )}
          </Button>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-4 mb-8">
            By clicking 'Book Now', you agree to our Terms of Service and Privacy Policy. Your payment will be processed securely.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
