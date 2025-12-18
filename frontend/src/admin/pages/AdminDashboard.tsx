import React, { useState, useEffect, useCallback } from 'react';
import AdminHeader from '../components/AdminHeader';
import { 
  Users, 
  UserCheck, 
  Calendar,
  DollarSign, 
  Clock, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Car,
  Wallet
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import adminApiService from '@/services/adminApi';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface RevenueEntry {
  source: 'booking' | 'supportTicket';
  reference: string;
  vendorId?: string;
  vendorName?: string;
  paymentMethod?: string;
  billingAmount?: number;
  gstAmount?: number;
  includeGST?: boolean;
  effectiveBilling?: number;
  adminCommission: number;
  adminCommissionWithGST?: number;
  createdAt?: string;
}

interface DashboardData {
  overview: {
    totalUsers: number;
    totalVendors: number;
    totalServices: number;
    totalBookings: number;
    totalRevenue: number;
    monthlyRevenue: number;
    pendingVendors: number;
    activeVendors: number;
    blockedVendors: number;
    pendingBookings: number;
    activeAMCSubscriptions: number;
    totalAMCAmount: number;
    pendingWithdrawalRequests: number;
  };
  recentActivity: {
    recentUsers: number;
    recentVendors: number;
    recentBookings: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
    month: number;
    year: number;
  };
  revenueBreakdown: {
    monthly: RevenueEntry[];
    total: RevenueEntry[];
  };
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [revenueEntries, setRevenueEntries] = useState<RevenueEntry[]>([]);
  const [revenueMode, setRevenueMode] = useState<'total' | 'monthly'>('total');

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (month?: number, year?: number) => {
    try {
      setRefreshing(true);
      const response = await adminApiService.getDashboardStats(month, year);
      
      if (response.success && response.data) {
        const breakdown = (response.data as any).revenueBreakdown || { monthly: [], total: [] };
        // Fallback calculation if API overview totals are zero but breakdown has entries
        const calcFromBreakdown = (entries: RevenueEntry[]) => {
          if (!entries || entries.length === 0) return 0;
          return entries.reduce((sum, item) => {
            if (typeof item.adminCommissionWithGST === 'number') {
              return sum + (item.adminCommissionWithGST || 0);
            }
            return sum + (item.adminCommission || 0);
          }, 0);
        };
        const fallbackMonthly = calcFromBreakdown(breakdown.monthly);
        const fallbackTotal = calcFromBreakdown(breakdown.total);

        // Validate and sanitize the data
        const validatedData = {
          ...response.data,
          overview: {
            totalUsers: Math.max(0, response.data.overview.totalUsers || 0),
            totalVendors: Math.max(0, response.data.overview.totalVendors || 0),
            totalServices: Math.max(0, response.data.overview.totalServices || 0),
            totalBookings: Math.max(0, response.data.overview.totalBookings || 0),
            totalRevenue: Math.max(0, (response.data.overview.totalRevenue || 0) || fallbackTotal),
            monthlyRevenue: Math.max(0, (response.data.overview.monthlyRevenue || 0) || fallbackMonthly),
            pendingVendors: Math.max(0, response.data.overview.pendingVendors || 0),
            activeVendors: Math.max(0, response.data.overview.activeVendors || 0),
            blockedVendors: Math.max(0, response.data.overview.blockedVendors || 0),
            pendingBookings: Math.max(0, response.data.overview.pendingBookings || 0),
            activeAMCSubscriptions: Math.max(0, response.data.overview.activeAMCSubscriptions || 0),
            totalAMCAmount: Math.max(0, response.data.overview.totalAMCAmount || 0),
            pendingWithdrawalRequests: Math.max(0, response.data.overview.pendingWithdrawalRequests || 0)
          },
          recentActivity: {
            recentUsers: Math.max(0, response.data.recentActivity.recentUsers || 0),
            recentVendors: Math.max(0, response.data.recentActivity.recentVendors || 0),
            recentBookings: Math.max(0, response.data.recentActivity.recentBookings || 0)
          },
          revenueBreakdown: {
            monthly: breakdown.monthly || [],
            total: breakdown.total || []
          }
        };
        
        setDashboardData(validatedData);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  // Load data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle month/year change
  const handleDateChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    fetchDashboardData(month, year);
  };

  const openRevenueModal = (mode: 'total' | 'monthly') => {
    if (!dashboardData) return;
    const entries = mode === 'total' ? dashboardData.revenueBreakdown.total : dashboardData.revenueBreakdown.monthly;
    setRevenueEntries(entries || []);
    setRevenueMode(mode);
    setRevenueModalOpen(true);
  };

  const formatCurrency = (value: number | undefined) => `₹${(value || 0).toLocaleString()}`;
  const formatBookingId = (ref?: string) => {
    if (!ref) return '—';
    // Show booking reference as-is when it matches expected prefix (e.g., FIXBXXXX)
    if (/^fixb/i.test(ref)) return ref.toUpperCase();
    // If it's a Mongo ObjectId, shorten for readability
    if (ref.length === 24) return `#${ref.slice(0, 4)}...${ref.slice(-4)}`;
    return ref;
  };
  const formatBilling = (item: RevenueEntry) => {
    const base = typeof item.effectiveBilling === 'number' ? item.effectiveBilling : item.billingAmount || 0;
    const gst = item.gstAmount || 0;
    const hasGST = !!gst;
    return hasGST ? `${formatCurrency(base)} (GST ${formatCurrency(gst)})` : formatCurrency(base);
  };
  const formatCommission = (item: RevenueEntry) => {
    const base = typeof item.adminCommissionWithGST === 'number' ? item.adminCommissionWithGST : item.adminCommission || 0;
    const gst = item.gstAmount || 0;
    const hasGST = !!gst;
    return hasGST ? `${formatCurrency(base)} (incl. GST ${formatCurrency(gst)})` : formatCurrency(base);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchDashboardData(selectedMonth, selectedYear);
  };

  // Generate month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Generate year options (current year and previous 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <main className="ml-72 pt-32 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <main className="ml-72 pt-32 p-6">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Failed to load dashboard data</p>
            <Button onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Users",
      value: dashboardData.overview.totalUsers.toLocaleString(),
      change: `${dashboardData.recentActivity.recentUsers} new this week`,
      icon: Users,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Total Vendors",
      value: dashboardData.overview.totalVendors.toLocaleString(),
      change: `${dashboardData.recentActivity.recentVendors} new this week`,
      icon: UserCheck,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Total Services",
      value: dashboardData.overview.totalServices.toLocaleString(),
      change: "Active service cards",
      icon: Car,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      title: "Total Bookings",
      value: dashboardData.overview.totalBookings.toLocaleString(),
      change: `${dashboardData.recentActivity.recentBookings} new this week`,
      icon: Calendar,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600"
    },
    {
      title: "Total Revenue",
      value: `₹${dashboardData.overview.totalRevenue.toLocaleString()}`,
      change: "All time revenue",
      icon: DollarSign,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      onClick: () => openRevenueModal('total')
    },
    {
      title: "Monthly Revenue",
      value: `₹${dashboardData.overview.monthlyRevenue.toLocaleString()}`,
      change: `${monthOptions[selectedMonth - 1]?.label} ${selectedYear}`,
      icon: TrendingUp,
      color: "bg-indigo-500",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      onClick: () => openRevenueModal('monthly')
    },
    {
      title: "Pending Verifications",
      value: dashboardData.overview.pendingVendors.toLocaleString(),
      change: "Vendors awaiting approval",
      icon: Clock,
      color: "bg-cyan-500",
      bgColor: "bg-cyan-50",
      textColor: "text-cyan-600"
    },
    {
      title: "Active Vendors",
      value: dashboardData.overview.activeVendors.toLocaleString(),
      change: "Approved and active",
      icon: CheckCircle,
      color: "bg-pink-500",
      bgColor: "bg-pink-50",
      textColor: "text-pink-600"
    },
    {
      title: "Blocked Vendors",
      value: dashboardData.overview.blockedVendors.toLocaleString(),
      change: "Blocked by admin",
      icon: AlertCircle,
      color: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-600"
    },
    {
      title: "Pending Bookings",
      value: dashboardData.overview.pendingBookings.toLocaleString(),
      change: "Awaiting confirmation",
      icon: Clock,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600"
    },
    {
      title: "AMC Subscriptions",
      value: `₹${dashboardData.overview.totalAMCAmount.toLocaleString()}`,
      change: `${dashboardData.overview.activeAMCSubscriptions} active subscriptions`,
      icon: TrendingUp,
      color: "bg-teal-500",
      bgColor: "bg-teal-50",
      textColor: "text-teal-600"
    },
    {
      title: "Pending Withdrawal Requests",
      value: dashboardData.overview.pendingWithdrawalRequests.toLocaleString(),
      change: "Awaiting admin approval",
      icon: Wallet,
      color: "bg-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600"
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
            <div className="flex items-center gap-4">
              {/* Month/Year Filters */}
              <div className="flex items-center gap-2">
                <Select value={selectedMonth.toString()} onValueChange={(value) => handleDateChange(parseInt(value), selectedYear)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear.toString()} onValueChange={(value) => handleDateChange(selectedMonth, parseInt(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Refresh Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          {kpiCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <Card 
                key={index} 
                className={`service-card ${card.onClick ? 'cursor-pointer hover:shadow-lg transition' : ''}`}
                onClick={card.onClick}
                role={card.onClick ? 'button' : undefined}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{card.title}</p>
                      <p className="text-lg font-bold text-foreground mb-1">{card.value}</p>
                      <p className="text-xs text-muted-foreground">{card.change}</p>
                    </div>
                    <div className={`w-8 h-8 ${card.bgColor} rounded-full flex items-center justify-center`}>
                      <IconComponent className={`w-4 h-4 ${card.textColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Revenue Breakdown Modal */}
        <Dialog open={revenueModalOpen} onOpenChange={setRevenueModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{revenueMode === 'total' ? 'Total Revenue Breakdown' : 'Monthly Revenue Breakdown'}</DialogTitle>
              <DialogDescription>
                {revenueMode === 'total' ? 'All time commissions grouped by bookings and support tickets.' : 'Commissions for the selected month/year.'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                Entries: {revenueEntries.length}
              </span>
              <span className="text-sm font-semibold">
                Total Commission: {formatCurrency(revenueEntries.reduce((sum, item) => sum + (item.adminCommission || 0), 0))}
              </span>
            </div>

            <div className="border rounded-md max-h-[420px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-3 py-2">Source</th>
                    <th className="text-left px-3 py-2">Booking ID</th>
                    <th className="text-left px-3 py-2">Vendor</th>
                    <th className="text-left px-3 py-2">Payment</th>
                    <th className="text-left px-3 py-2">Billing</th>
                    <th className="text-left px-3 py-2">Commission</th>
                    <th className="text-left px-3 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueEntries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted-foreground py-4">
                        No revenue records found.
                      </td>
                    </tr>
                  )}
                  {revenueEntries.map((item, idx) => (
                    <tr key={`${item.reference}-${idx}`} className="border-t">
                      <td className="px-3 py-2 capitalize">{item.source === 'supportTicket' ? 'Support Ticket' : 'Booking'}</td>
                      <td className="px-3 py-2 font-medium">{formatBookingId(item.reference)}</td>
                      <td className="px-3 py-2">
                        {item.vendorName?.trim() ? item.vendorName : (item.vendorId || 'N/A')}
                      </td>
                      <td className="px-3 py-2 capitalize">{item.paymentMethod || 'N/A'}</td>
                      <td className="px-3 py-2">{formatBilling(item)}</td>
                      <td className="px-3 py-2 font-semibold text-emerald-700">{formatCommission(item)}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>


      </main>
    </div>
  );
};

export default AdminDashboard;
