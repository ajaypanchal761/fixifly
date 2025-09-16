import React from 'react';
import AdminHeader from '../components/AdminHeader';
import { 
  Users, 
  UserCheck, 
  Car, 
  Calendar, 
  DollarSign, 
  Clock, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Gift
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {
  // Sample data - in real app this would come from API
  const dashboardData = {
    totalUsers: 1247,
    totalVendors: 89,
    totalServices: 156,
    totalBookings: 3421,
    totalRevenue: 1250000,
    monthlyRevenue: 180000,
    pendingVerifications: 23,
    availableServices: 142,
    pendingBookings: 45,
    completedBookings: 3376,
    cancelledBookings: 67,
    activeVendors: 76,
    inactiveVendors: 13
  };

  const kpiCards = [
    {
      title: "Total Users",
      value: dashboardData.totalUsers.toLocaleString(),
      change: "+86% from month",
      icon: Users,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Total Vendors",
      value: dashboardData.totalVendors.toLocaleString(),
      change: "+100% from month",
      icon: UserCheck,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Total Services",
      value: dashboardData.totalServices.toLocaleString(),
      change: "26 currently available",
      icon: Car,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      title: "Total Bookings",
      value: dashboardData.totalBookings.toLocaleString(),
      change: "+0% from month",
      icon: Calendar,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600"
    },
    {
      title: "Total Revenue",
      value: `₹${dashboardData.totalRevenue.toLocaleString()}`,
      change: "All time completed bookings",
      icon: DollarSign,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600"
    },
    {
      title: "Month Revenue",
      value: `₹${dashboardData.monthlyRevenue.toLocaleString()}`,
      change: "From month bookings",
      icon: TrendingUp,
      color: "bg-indigo-500",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600"
    },
    {
      title: "Pending Verifications",
      value: dashboardData.pendingVerifications.toLocaleString(),
      change: "Vendors need verification",
      icon: Clock,
      color: "bg-cyan-500",
      bgColor: "bg-cyan-50",
      textColor: "text-cyan-600"
    },
    {
      title: "Available Services",
      value: dashboardData.availableServices.toLocaleString(),
      change: "Ready for booking",
      icon: CheckCircle,
      color: "bg-pink-500",
      bgColor: "bg-pink-50",
      textColor: "text-pink-600"
    },
    {
      title: "Pending Bookings",
      value: dashboardData.pendingBookings.toLocaleString(),
      change: "Awaiting confirmation",
      icon: AlertCircle,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600"
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: "user_registration",
      message: "New user registered: John Doe",
      time: "2 minutes ago",
      status: "success"
    },
    {
      id: 2,
      type: "vendor_verification",
      message: "Vendor verification pending: ABC Electronics",
      time: "15 minutes ago",
      status: "warning"
    },
    {
      id: 3,
      type: "booking_completed",
      message: "Booking completed: AC Repair Service",
      time: "1 hour ago",
      status: "success"
    },
    {
      id: 4,
      type: "payment_received",
      message: "Payment received: ₹2,500",
      time: "2 hours ago",
      status: "success"
    },
    {
      id: 5,
      type: "service_added",
      message: "New service added: Smart TV Repair",
      time: "3 hours ago",
      status: "info"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      {/* Main Content */}
      <main className="ml-72 pt-32 p-6">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Admin <span className="text-gradient">Dashboard</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Welcome back! Here's what's happening with your business today.
              </p>
              <div className="flex items-center mt-2">
                <div className="w-2 h-2 bg-accent rounded-full mr-2"></div>
                <span className="text-sm text-muted-foreground">System Status: Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <Card key={index} className="service-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">{card.title}</p>
                      <p className="text-2xl font-bold text-foreground mb-1">{card.value}</p>
                      <p className="text-xs text-muted-foreground">{card.change}</p>
                    </div>
                    <div className={`w-12 h-12 ${card.bgColor} rounded-full flex items-center justify-center`}>
                      <IconComponent className={`w-6 h-6 ${card.textColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts and Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Revenue Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Revenue chart will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Status Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Booking Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Booking status chart will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'success' ? 'bg-accent' :
                      activity.status === 'warning' ? 'bg-yellow-500' :
                      activity.status === 'error' ? 'bg-destructive' : 'bg-primary'
                    }`}></div>
                    <span className="text-sm text-foreground">{activity.message}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center gap-2" variant="outline">
              <Users className="w-6 h-6" />
              <span>Manage Users</span>
            </Button>
            <Button className="h-20 flex flex-col items-center justify-center gap-2" variant="outline">
              <UserCheck className="w-6 h-6" />
              <span>Verify Vendors</span>
            </Button>
            <Button className="h-20 flex flex-col items-center justify-center gap-2" variant="outline">
              <Car className="w-6 h-6" />
              <span>Add Services</span>
            </Button>
            <Button className="h-20 flex flex-col items-center justify-center gap-2" variant="outline">
              <Gift className="w-6 h-6" />
              <span>Create Offers</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
