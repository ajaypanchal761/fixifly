import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import bookingApi, { type Booking } from "@/services/bookingApi";
import { 
  Calendar,
  Clock,
  ArrowLeft,
  Wrench,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const Reschedule = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [booking, setBooking] = useState<Booking | null>(location.state?.booking || null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [reason, setReason] = useState("");
  
  // Time slots
  const timeSlots = [
    { value: "09:00", label: "9:00 AM" },
    { value: "10:00", label: "10:00 AM" },
    { value: "11:00", label: "11:00 AM" },
    { value: "12:00", label: "12:00 PM" },
    { value: "14:00", label: "2:00 PM" },
    { value: "15:00", label: "3:00 PM" },
    { value: "16:00", label: "4:00 PM" },
    { value: "17:00", label: "5:00 PM" },
    { value: "18:00", label: "6:00 PM" }
  ];

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Get maximum date (30 days from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  // Fetch booking details if not provided in state
  useEffect(() => {
    const fetchBooking = async () => {
      if (!booking && id) {
        try {
          setLoading(true);
          setError(null);
          
          const response = await bookingApi.getBookingById(id);
          
          if (response.success && response.data?.booking) {
            setBooking(response.data.booking);
          } else {
            setError(response.message || 'Failed to fetch booking details');
          }
        } catch (error) {
          console.error('Error fetching booking:', error);
          setError('Failed to load booking details. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    if (isAuthenticated) {
      fetchBooking();
    } else {
      setError('Please login to reschedule your booking');
    }
  }, [id, booking, isAuthenticated]);

  // Set initial form values
  useEffect(() => {
    if (booking) {
      // Set current scheduled date or preferred date as default
      const currentDate = booking.scheduling.scheduledDate || booking.scheduling.preferredDate;
      if (currentDate) {
        const date = new Date(currentDate);
        setNewDate(date.toISOString().split('T')[0]);
      }
      
      // Set current scheduled time or preferred time slot as default
      const currentTime = booking.scheduling.scheduledTime || booking.scheduling.preferredTimeSlot;
      if (currentTime) {
        // Convert time slot to time format
        if (currentTime === 'morning') {
          setNewTime('09:00');
        } else if (currentTime === 'afternoon') {
          setNewTime('14:00');
        } else if (currentTime === 'evening') {
          setNewTime('18:00');
        } else {
          setNewTime(currentTime);
        }
      }
    }
  }, [booking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!booking) {
      toast({
        title: "Error",
        description: "Booking information not available",
        variant: "destructive"
      });
      return;
    }

    if (!newDate || !newTime || !reason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await bookingApi.rescheduleBookingByUser(booking._id, {
        newDate,
        newTime,
        reason: reason.trim()
      });
      
      if (response.success) {
        toast({
          title: "Booking Rescheduled",
          description: "Your booking has been rescheduled successfully. The engineer will be notified of the new schedule.",
          variant: "default"
        });
        
        // Navigate back to bookings page
        navigate('/booking');
      } else {
        toast({
          title: "Reschedule Failed",
          description: response.message || "Failed to reschedule booking. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      toast({
        title: "Reschedule Error",
        description: "An error occurred while rescheduling. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-4">Please login to reschedule your booking</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Login Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || "Booking not found"}</p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => navigate('/booking')} className="flex-1">
                Back to Bookings
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if booking can be rescheduled
  if (booking.status === 'completed' || booking.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Cannot Reschedule</h2>
            <p className="text-gray-600 mb-4">
              This booking cannot be rescheduled because it is {booking.status}.
            </p>
            <Button onClick={() => navigate('/booking')} className="w-full">
              Back to Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/booking')}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Reschedule Booking</h1>
              <p className="text-sm text-gray-500">Update your appointment date and time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Booking Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              <span>Current Booking Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Case ID:</span>
                <span className="ml-2 font-bold text-gray-900">
                  {(booking as any).bookingReference || `FIX${booking._id.toString().substring(booking._id.toString().length - 8).toUpperCase()}`}
                </span>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-600">Service:</span>
                <span className="ml-2 text-gray-900">
                  {booking.services.map(s => s.serviceName).join(', ')}
                </span>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-600">Current Date:</span>
                <span className="ml-2 text-gray-900">
                  {booking.scheduling.scheduledDate 
                    ? new Date(booking.scheduling.scheduledDate).toLocaleDateString('en-IN')
                    : new Date(booking.scheduling.preferredDate).toLocaleDateString('en-IN')
                  }
                </span>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-600">Current Time:</span>
                <span className="ml-2 text-gray-900">
                  {booking.scheduling.scheduledTime 
                    ? new Date(`2000-01-01T${booking.scheduling.scheduledTime}`).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })
                    : booking.scheduling.preferredTimeSlot
                  }
                </span>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <span className="ml-2 text-gray-900 capitalize">{booking.status.replace('_', ' ')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reschedule Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <span>New Schedule</span>
            </CardTitle>
            <CardDescription>
              Select a new date and time for your service appointment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Date */}
              <div className="space-y-2">
                <Label htmlFor="newDate" className="text-sm font-medium">
                  New Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="newDate"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  required
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Select a date between tomorrow and 30 days from now
                </p>
              </div>

              {/* New Time */}
              <div className="space-y-2">
                <Label htmlFor="newTime" className="text-sm font-medium">
                  New Time <span className="text-red-500">*</span>
                </Label>
                <Select value={newTime} onValueChange={setNewTime} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{slot.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Choose a convenient time for your service
                </p>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-sm font-medium">
                  Reason for Rescheduling <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a reason for rescheduling your appointment..."
                  required
                  rows={4}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  This helps us understand your needs better
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/booking')}
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={submitting || !newDate || !newTime || !reason.trim()}
                >
                  {submitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Rescheduling...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Reschedule Booking</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Important Information:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• The engineer will be notified of your new schedule</li>
                  <li>• You can reschedule up to 2 hours before your appointment</li>
                  <li>• Multiple reschedules may affect service availability</li>
                  <li>• Contact support if you need immediate assistance</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reschedule;
