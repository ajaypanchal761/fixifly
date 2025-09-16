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
  AlertCircle
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



      </main>
    </div>
  );
};

export default AdminDashboard;
