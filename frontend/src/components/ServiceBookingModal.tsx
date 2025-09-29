import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock, User, Phone, MessageCircle } from "lucide-react";
import { Card as CardType } from "@/services/cardApi";

interface ServiceBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: CardType;
  selectedCity?: {
    _id: string;
    name: string;
    state: string;
    isActive: boolean;
    serviceCount: number;
    estimatedDeliveryTime: string;
  };
}

interface FormData {
  customerName: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  preferredDate: string;
  preferredTime: string;
  serviceType: string;
  issueDescription: string;
  urgency: string;
}

const ServiceBookingModal = ({ isOpen, onClose, service, selectedCity }: ServiceBookingModalProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    customerName: "",
    phoneNumber: "",
    email: "",
    address: "",
    city: selectedCity?.name || "",
    pincode: "",
    preferredDate: "",
    preferredTime: "",
    serviceType: "",
    issueDescription: "",
    urgency: "normal"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showThankYou, setShowThankYou] = useState(false);

  const timeSlots = [
    "9:00 AM - 11:00 AM",
    "11:00 AM - 1:00 PM", 
    "1:00 PM - 3:00 PM",
    "3:00 PM - 5:00 PM",
    "5:00 PM - 7:00 PM"
  ];

  const urgencyOptions = [
    { value: "urgent", label: "Urgent (Same Day)", color: "bg-red-100 text-red-800" },
    { value: "normal", label: "Normal (1-2 Days)", color: "bg-blue-100 text-blue-800" },
    { value: "flexible", label: "Flexible (3-5 Days)", color: "bg-green-100 text-green-800" }
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Customer name is required";
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid 10-digit phone number";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Please enter a valid 6-digit pincode";
    }
    if (!formData.preferredDate) {
      newErrors.preferredDate = "Preferred date is required";
    }
    if (!formData.preferredTime) {
      newErrors.preferredTime = "Preferred time slot is required";
    }
    if (!formData.serviceType.trim()) {
      newErrors.serviceType = "Service type is required";
    }
    if (!formData.issueDescription.trim()) {
      newErrors.issueDescription = "Issue description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically send the data to your backend
      console.log("Booking data:", {
        service: service,
        ...formData
      });
      
      // Close modal and navigate to booking page with form data
      onClose();
      navigate('/booking', {
        state: {
          cartItems: [{
            id: Date.now(),
            title: service.name,
            price: service.price,
            image: service.image,
            subtitle: service.subtitle
          }],
          totalPrice: service.price,
          bookingData: {
            service: service,
            ...formData
          },
          fromServiceModal: true
        }
      });
      
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Booking failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseThankYou = () => {
    setShowThankYou(false);
    onClose();
    // Reset form
    setFormData({
      customerName: "",
      phoneNumber: "",
      email: "",
      address: "",
      city: "",
      pincode: "",
      preferredDate: "",
      preferredTime: "",
      serviceType: "",
      issueDescription: "",
      urgency: "normal"
    });
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  if (showThankYou) {
    return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto rounded-xl mt-16">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6">
              Your service booking has been confirmed. Our technician will contact you soon to schedule the visit.
            </p>
            <Button 
              onClick={handleCloseThankYou}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl mx-auto h-[95vh] sm:h-[90vh] rounded-xl mt-20 p-0 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold text-center">
              Book Service
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 px-6 pb-32">
          {/* Service Details Card */}
          <Card className="border-2 border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
                  <p className="text-gray-600 text-sm">{service.subtitle}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {service.speciality}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Customer Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Full Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange("customerName", e.target.value)}
                  placeholder="Enter your full name"
                  className={errors.customerName ? "border-red-500" : ""}
                />
                {errors.customerName && <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>}
              </div>
              
              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  placeholder="Enter 10-digit phone number"
                  className={errors.phoneNumber ? "border-red-500" : ""}
                />
                {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span>Service Address</span>
            </h3>
            
            <div>
              <Label htmlFor="address">Full Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter complete address with landmarks"
                className={errors.address ? "border-red-500" : ""}
                rows={3}
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Enter city name"
                  className={errors.city ? "border-red-500" : ""}
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>
              
              <div>
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange("pincode", e.target.value)}
                  placeholder="Enter 6-digit pincode"
                  className={errors.pincode ? "border-red-500" : ""}
                />
                {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <span>Service Details</span>
            </h3>
            
            <div>
              <Label htmlFor="serviceType">Service Type *</Label>
              <Input
                id="serviceType"
                value={formData.serviceType}
                onChange={(e) => handleInputChange("serviceType", e.target.value)}
                placeholder="e.g., Laptop screen repair, Software installation"
                className={errors.serviceType ? "border-red-500" : ""}
              />
              {errors.serviceType && <p className="text-red-500 text-sm mt-1">{errors.serviceType}</p>}
            </div>
            
            <div>
              <Label htmlFor="issueDescription">Issue Description *</Label>
              <Textarea
                id="issueDescription"
                value={formData.issueDescription}
                onChange={(e) => handleInputChange("issueDescription", e.target.value)}
                placeholder="Describe the issue in detail"
                className={errors.issueDescription ? "border-red-500" : ""}
                rows={4}
              />
              {errors.issueDescription && <p className="text-red-500 text-sm mt-1">{errors.issueDescription}</p>}
            </div>
          </div>

          {/* Scheduling */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Preferred Schedule</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preferredDate">Preferred Date *</Label>
                <Input
                  id="preferredDate"
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => handleInputChange("preferredDate", e.target.value)}
                  min={today}
                  className={errors.preferredDate ? "border-red-500" : ""}
                />
                {errors.preferredDate && <p className="text-red-500 text-sm mt-1">{errors.preferredDate}</p>}
              </div>
              
              <div>
                <Label htmlFor="preferredTime">Preferred Time Slot *</Label>
                <Select value={formData.preferredTime} onValueChange={(value) => handleInputChange("preferredTime", value)}>
                  <SelectTrigger className={errors.preferredTime ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.preferredTime && <p className="text-red-500 text-sm mt-1">{errors.preferredTime}</p>}
              </div>
            </div>
            
            <div>
              <Label>Urgency Level</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {urgencyOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleInputChange("urgency", option.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.urgency === option.value
                        ? option.color
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

           {/* Submit Button */}
           <div className="flex justify-center pb-8">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Booking...</span>
                </div>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceBookingModal;
