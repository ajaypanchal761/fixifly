import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Laptop, 
  Monitor, 
  Apple,
  Star,
  MapPin,
  Phone,
  Calendar,
  MessageCircle,
  Wrench,
  User
} from "lucide-react";

const Booking = () => {
  const [activeTab, setActiveTab] = useState("ongoing");

  const bookings = {
    ongoing: [
      {
        id: "5100000211",
        service: "Service Booking Heading",
        serviceType: "Deep Cleaning",
        technician: "SK Arman",
        rating: 4,
        status: "Engineer Assignment Pending",
        bookingDate: "01/05/2025",
        appointmentDate: "02/05/2025",
        price: "₹1000",
        phone: "9931-354-354",
        icon: Wrench
      },
      {
        id: "5100000212", 
        service: "Laptop Screen Repair",
        serviceType: "Hardware Repair",
        technician: "Rajesh Kumar",
        rating: 4.5,
        status: "In Progress",
        bookingDate: "28/04/2025",
        appointmentDate: "30/04/2025",
        price: "₹2500",
        phone: "022-6964-7030",
        icon: Laptop
      }
    ],
    completed: [
      {
        id: "BK003",
        service: "Laptop Battery Replacement",
        device: "HP Pavilion 15",
        technician: "Mike Wilson",
        rating: 5.0,
        status: "Completed",
        completedDate: "Dec 10, 2024",
        price: "$149",
        icon: Laptop,
        address: "789 Service Blvd, Repair City",
        phone: "022-6964-7030"
      },
      {
        id: "BK004",
        service: "iMac Hard Drive Upgrade",
        device: "iMac 24-inch 2021",
        technician: "Emily Davis",
        rating: 4.9,
        status: "Completed", 
        completedDate: "Dec 8, 2024",
        price: "$399",
        icon: Apple,
        address: "321 Fix Street, Digital Hub",
        phone: "9931-354-354"
      }
    ],
    cancelled: [
      {
        id: "BK005",
        service: "Printer Repair Service",
        device: "Canon PIXMA TS3520",
        technician: "Not Assigned",
        status: "Cancelled",
        cancelledDate: "Dec 5, 2024",
        reason: "Customer Request",
        price: "$59",
        icon: Monitor
      }
    ]
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "In Progress":
      case "Diagnostic":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Diagnostic":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header with Categories */}
      <div className="bg-white shadow-sm border-b pb-0 mb-6">
        <div className="container px-2 py-24">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-0 pt-0">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-0 h-auto rounded-lg">
              <TabsTrigger 
                value="ongoing" 
                className="text-base font-medium py-3 px-4 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all"
              >
                <div className="flex items-center space-x-2">
                  <span>Ongoing</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="text-base font-medium py-3 px-4 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all"
              >
                <div className="flex items-center space-x-2">
                  <span>Completed</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="cancelled" 
                className="text-base font-medium py-3 px-4 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all"
              >
                <div className="flex items-center space-x-2">
                  <span>Cancelled</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-0 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Ongoing Bookings */}
          <TabsContent value="ongoing" className="space-y-4 md:space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              {bookings.ongoing.map((booking) => {
                const IconComponent = booking.icon;
                return (
                  <Card key={booking.id} className="bg-white shadow-lg rounded-xl overflow-hidden h-fit">
                    <CardContent className="p-2 lg:p-3">
                    {/* Case ID */}
                    <div className="mb-1">
                      <span className="font-bold text-gray-800 text-xs">Case ID: {booking.id}</span>
                    </div>

                    {/* Service Details */}
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="bg-blue-100 p-1.5 rounded-full">
                        <IconComponent className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-gray-800">{booking.service}</h3>
                        <p className="text-gray-600 text-xs">{booking.serviceType}</p>
                      </div>
                    </div>

                    {/* Dates and Price */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="text-gray-600">Booking Date</span>
                          <div className="font-medium text-sm">{booking.bookingDate}</div>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-600">Appointment Date</span>
                          <div className="font-medium text-sm">{booking.appointmentDate}</div>
                        </div>
                      </div>
                      <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-semibold text-sm">
                        {booking.price}
                      </div>
                    </div>

                    {/* Assigned Person Details */}
                    <div className="bg-gray-50 rounded-lg p-1.5 mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="bg-blue-100 p-1 rounded-full">
                            <User className="h-3 w-3 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 text-xs">{booking.technician}</div>
                            <div className="text-gray-600 text-xs">{booking.phone}</div>
                            <div className="flex items-center space-x-1 mt-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-3 w-3 ${i < booking.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" className="p-1">
                            <Phone className="h-3 w-3 text-blue-600" />
                          </Button>
                          <Button size="sm" variant="outline" className="p-1">
                            <MessageCircle className="h-3 w-3 text-blue-600" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-1 mb-1">
                      <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1.5">
                        Cancel Booking
                      </Button>
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5">
                        Reschedule
                      </Button>
                    </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Completed Bookings */}
          <TabsContent value="completed" className="space-y-4 md:space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              {bookings.completed.map((booking) => {
                const IconComponent = booking.icon;
                return (
                  <Card key={booking.id} className="bg-white shadow-lg rounded-xl overflow-hidden h-fit">
                  <CardContent className="p-3 lg:p-4">
                    {/* Case ID */}
                    <div className="mb-1">
                      <span className="font-bold text-gray-800 text-xs">Case ID: {booking.id}</span>
                    </div>

                    {/* Service Details */}
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="bg-green-100 p-1.5 rounded-full">
                        <IconComponent className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-gray-800">{booking.service}</h3>
                        <p className="text-gray-600 text-xs">{booking.device}</p>
                      </div>
                    </div>

                    {/* Dates and Price */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="text-gray-600">Completed Date</span>
                          <div className="font-medium text-sm">{booking.completedDate}</div>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-600">Technician</span>
                          <div className="font-medium text-sm">{booking.technician}</div>
                        </div>
                      </div>
                      <div className="bg-green-100 text-green-600 px-3 py-1 rounded-full font-semibold text-sm">
                        {booking.price}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-1 mb-1">
                      <Button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-xs py-1.5">
                        Download Receipt
                      </Button>
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5">
                        Book Again
                      </Button>
                    </div>

                      {/* Status Tag */}
                      <div className="text-center">
                        <Badge className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs">
                          {booking.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Cancelled Bookings */}
          <TabsContent value="cancelled" className="space-y-4 md:space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              {bookings.cancelled.map((booking) => {
                const IconComponent = booking.icon;
                return (
                  <Card key={booking.id} className="bg-white shadow-lg rounded-xl overflow-hidden opacity-75 h-fit">
                  <CardContent className="p-4">
                    {/* Case ID */}
                    <div className="mb-1">
                      <span className="font-bold text-gray-800 text-xs">Case ID: {booking.id}</span>
                    </div>

                    {/* Service Details */}
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="bg-gray-100 p-1.5 rounded-full">
                        <IconComponent className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-gray-800">{booking.service}</h3>
                        <p className="text-gray-600 text-xs">{booking.device}</p>
                      </div>
                    </div>

                    {/* Dates and Price */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="text-gray-600">Cancelled Date</span>
                          <div className="font-medium text-sm">{booking.cancelledDate}</div>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-600">Reason</span>
                          <div className="font-medium text-sm">{booking.reason}</div>
                        </div>
                      </div>
                      <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-semibold text-sm">
                        {booking.price}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-1 mb-1">
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5">
                        Book Similar Service
                      </Button>
                    </div>

                      {/* Status Tag */}
                      <div className="text-center">
                        <Badge className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs">
                          {booking.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Booking;
