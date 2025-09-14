import React from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { MapPin, Users, Phone, Mail, Clock, Star, Navigation } from 'lucide-react';
import VendorHeader from '../components/VendorHeader';
import VendorBottomNav from '../components/VendorBottomNav';
import Footer from '../../components/Footer';
import NotFound from '../../pages/NotFound';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const VendorMyHub = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Show 404 error on desktop
  if (!isMobile) {
    return <NotFound />;
  }

  // Sample hub data - in real app this would come from API
  const vendorHubs = [
    {
      id: "H001",
      name: "Gurgaon Central Hub",
      address: "Sector 15, Gurgaon, Haryana 122001",
      phone: "+91 98765 43210",
      email: "gurgaon@fixifly.com",
      status: "Active",
      assignedDate: "2023-01-15",
      totalTasks: 45,
      completedTasks: 42,
      rating: 4.8,
      workingHours: "9:00 AM - 6:00 PM",
      services: ["AC Repair", "Washing Machine", "Refrigerator", "TV Repair"]
    },
    {
      id: "H002", 
      name: "Delhi North Hub",
      address: "Pitampura, Delhi 110034",
      phone: "+91 98765 43211",
      email: "delhi@fixifly.com",
      status: "Active",
      assignedDate: "2023-02-20",
      totalTasks: 38,
      completedTasks: 35,
      rating: 4.6,
      workingHours: "8:00 AM - 7:00 PM",
      services: ["Mobile Repair", "Laptop Repair", "Desktop Repair"]
    },
    {
      id: "H003",
      name: "Noida Sector 62 Hub", 
      address: "Sector 62, Noida, Uttar Pradesh 201301",
      phone: "+91 98765 43212",
      email: "noida@fixifly.com",
      status: "Active",
      assignedDate: "2023-03-10",
      totalTasks: 52,
      completedTasks: 48,
      rating: 4.9,
      workingHours: "9:00 AM - 6:00 PM",
      services: ["AC Repair", "Washing Machine", "Refrigerator", "TV Repair", "Mobile Repair"]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 border-green-200";
      case "Inactive":
        return "bg-red-100 text-red-800 border-red-200";
      case "Maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-3 h-3 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : index < rating
            ? 'text-yellow-400 fill-current opacity-50'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VendorHeader />
      <main className="flex-1 pb-24 pt-20">
        <div className="container mx-auto px-4 py-4">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">My Hub</h1>
            <p className="text-muted-foreground text-sm">Your assigned service hubs</p>
          </div>

          {/* Hub Statistics */}
          <Card className="mb-4 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-blue-600" />
                </div>
                Hub Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">{vendorHubs.length}</p>
                  <p className="text-xs text-blue-700">Total Hubs</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">
                    {vendorHubs.filter(hub => hub.status === "Active").length}
                  </p>
                  <p className="text-xs text-green-700">Active</p>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <p className="text-lg font-bold text-purple-600">
                    {vendorHubs.reduce((sum, hub) => sum + hub.completedTasks, 0)}
                  </p>
                  <p className="text-xs text-purple-700">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hub List */}
          <div className="space-y-4">
            {vendorHubs.map((hub, index) => (
              <Card key={hub.id} className="shadow-lg border-0 bg-white">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                      {hub.name}
                    </CardTitle>
                    <Badge className={getStatusColor(hub.status)}>
                      {hub.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {/* Hub Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{hub.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{hub.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{hub.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{hub.workingHours}</p>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <p className="text-sm font-bold text-green-600">{hub.completedTasks}/{hub.totalTasks}</p>
                      <p className="text-xs text-green-700">Tasks</p>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded-lg">
                      <div className="flex justify-center mb-1">
                        {renderStars(hub.rating)}
                      </div>
                      <p className="text-xs text-yellow-700">{hub.rating} Rating</p>
                    </div>
                  </div>

                  {/* Services Offered */}
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Services Offered:</p>
                    <div className="flex flex-wrap gap-1">
                      {hub.services.map((service, serviceIndex) => (
                        <Badge key={serviceIndex} variant="secondary" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Assigned Date */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Assigned on: {new Date(hub.assignedDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Hubs Message */}
          {vendorHubs.length === 0 && (
            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Hubs Assigned</h3>
                <p className="text-sm text-gray-500">
                  You don't have any hubs assigned yet. Contact support for more information.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <div className="md:hidden">
        <Footer />
        <VendorBottomNav />
      </div>
    </div>
  );
};

export default VendorMyHub;
