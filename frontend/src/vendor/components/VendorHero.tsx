import { Button } from "@/vendor/components/ui/button";
import { Users, TrendingUp, Clock, Shield, Star, Plus, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMediaQuery, useTheme } from "@mui/material";
import vendorApi from "@/services/vendorApi";
import bannerApiService from "@/services/bannerApi";
import { vendorDepositService } from '@/services/vendorDepositService';
import { useToast } from '@/hooks/use-toast';
import { useVendor } from '@/contexts/VendorContext';
import VendorTaskCard from "./VendorTaskCard";
import VendorNotificationStatus from "./VendorNotificationStatus";
// Firebase removed - VendorFCMTokenGenerator disabled
// import VendorFCMTokenGenerator from "./VendorFCMTokenGenerator";
import VendorNotificationEnable from "./VendorNotificationEnable";

const VendorHero = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { vendor, updateVendor } = useVendor();
  const [currentStat, setCurrentStat] = useState(0);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [activeTaskTab, setActiveTaskTab] = useState('new');
  const [completedTasks, setCompletedTasks] = useState([]);
  const [taskData, setTaskData] = useState({
    new: [],
    closed: [...completedTasks],
    cancelled: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [banners, setBanners] = useState<string[]>(['/banner1.png', '/banner2.png', '/banner3.png']); // Fallback banners
  const [bannersLoading, setBannersLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string>('');
  const [vendorDepositStatus, setVendorDepositStatus] = useState<{
    hasFirstTaskAssigned: boolean;
    hasMandatoryDeposit: boolean;
    canAcceptTasks: boolean;
  } | null>(null);
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [vendorStats, setVendorStats] = useState([
    { icon: Users, value: "0", label: "Active Customers", color: "bg-blue-500" },
    { icon: TrendingUp, value: "₹0", label: "Monthly Revenue", color: "bg-green-500" },
    { icon: Star, value: "0.0", label: "Average Rating", color: "bg-yellow-500" },
    { icon: Clock, value: "24/7", label: "Support Available", color: "bg-purple-500" }
  ]);



  // Fetch banners from database
  const fetchBanners = async () => {
    try {
      setBannersLoading(true);
      const bannerUrls = await bannerApiService.getBannerImageUrls('vendor');
      
      if (bannerUrls.length > 0) {
        setBanners(bannerUrls);
        console.log('Loaded banners from database:', bannerUrls.length);
      } else {
        console.log('No banners found in database, using fallback banners');
        // Keep fallback banners
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      // Keep fallback banners on error
    } finally {
      setBannersLoading(false);
    }
  };

  // Fetch vendor statistics
  const fetchVendorStats = async () => {
    // VENDOR STATS API DISABLED - Using default stats
    // This endpoint was causing non-JSON response errors
    return;
    
    // try {
    //   const token = localStorage.getItem('vendorToken');
    //   
    //   if (!token) {
    //     console.warn('No vendor token found for stats');
    //     return;
    //   }

    //   const response = await fetch('/api/vendor/stats', {
    //     headers: {
    //       'Authorization': `Bearer ${token}`,
    //       'Content-Type': 'application/json',
    //     },
    //   });

    //   if (response.ok) {
    //     // Check if response is JSON
    //     const contentType = response.headers.get('content-type');
    //     if (!contentType || !contentType.includes('application/json')) {
    //       console.warn('Server returned non-JSON response, server might not be running');
    //       return;
    //     }

    //     const data = await response.json();
    //     if (data.success && data.data) {
    //       const stats = data.data;
    //       
    //       setVendorStats([
    //         { icon: Users, value: `${stats.totalCustomers || 0}`, label: "Active Customers", color: "bg-blue-500" },
    //         { icon: TrendingUp, value: `₹${(stats.monthlyRevenue || 0).toLocaleString()}`, label: "Monthly Revenue", color: "bg-green-500" },
    //         { icon: Star, value: `${(stats.averageRating || 0).toFixed(1)}`, label: "Average Rating", color: "bg-yellow-500" },
    //         { icon: Clock, value: "24/7", label: "Support Available", color: "bg-purple-500" }
    //       ]);
    //     }
    //   } else if (response.status === 404) {
    //     console.warn('Vendor stats endpoint not found, using default stats');
    //   } else {
    //     console.warn(`Failed to fetch vendor stats: ${response.status}`);
    //   }
    // } catch (error) {
    //   console.error('Error fetching vendor stats:', error);
    //   // Keep default stats on error
    // }
  };

  // Fetch vendor deposit status
  const fetchVendorDepositStatus = async () => {
    try {
      const token = localStorage.getItem('vendorToken');
      
      if (!token) {
        console.warn('No vendor token found for deposit status');
        return;
      }

      const response = await vendorApi.getVendorProfile();
      
      if (response.success && response.data) {
        const vendor = response.data;
        setVendorDepositStatus({
          hasFirstTaskAssigned: !!vendor.wallet?.firstTaskAssignedAt,
          hasMandatoryDeposit: !!vendor.wallet?.hasMandatoryDeposit,
          canAcceptTasks: vendor.wallet?.canAcceptTasks || false
        });
      }
    } catch (error) {
      console.error('Error fetching vendor deposit status:', error);
    }
  };

  const handleMakeDeposit = async () => {
    if (!vendor) {
      toast({
        title: "Error",
        description: "Vendor information not available.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingDeposit(true);
    
    try {
      const depositAmount = 2000; // Mandatory deposit amount
      
      await vendorDepositService.processDepositPayment(
        depositAmount,
        vendor.fullName,
        vendor.email,
        vendor.phone,
        (response) => {
          // Payment successful
          toast({
            title: "Deposit Successful!",
            description: `₹${depositAmount.toLocaleString()} has been added to your wallet. You can now accept tasks.`,
          });

          // Update vendor context with new wallet data
          if (updateVendor) {
            updateVendor({
              wallet: {
                ...vendor.wallet,
                currentBalance: (vendor.wallet?.currentBalance || 0) + depositAmount,
                hasMandatoryDeposit: true,
                canAcceptTasks: true
              }
            });
          }

          // Refresh deposit status
          fetchVendorDepositStatus();
          
          // Show success message
          toast({
            title: "Ready to Accept Tasks!",
            description: "Your mandatory deposit has been completed. You can now accept tasks.",
          });
        },
        (error) => {
          console.error('Deposit payment failed:', error);
          toast({
            title: "Payment Failed",
            description: "Failed to process the deposit payment. Please try again.",
            variant: "destructive"
          });
        }
      );
    } catch (error) {
      console.error('Error processing deposit:', error);
      toast({
        title: "Error",
        description: "An error occurred while processing the deposit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  // Fetch vendor bookings and support tickets and transform them to task format
  const fetchVendorBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching vendor tasks...');
      
      // Check if vendor is logged in
      const vendorToken = localStorage.getItem('vendorToken');
      const vendorData = localStorage.getItem('vendorData');
      
      console.log('Vendor authentication check:', {
        hasToken: !!vendorToken,
        hasVendorData: !!vendorData,
        tokenPreview: vendorToken ? `${vendorToken.substring(0, 20)}...` : 'none',
        vendorData: vendorData ? JSON.parse(vendorData) : null
      });
      
      if (!vendorToken) {
        setError('Please log in as a vendor to view tasks');
        setLoading(false);
        return;
      }
      
      // Fetch both bookings and support tickets
      const [bookingsResponse, supportTicketsResponse] = await Promise.all([
        vendorApi.getVendorBookings(),
        vendorApi.getAssignedSupportTickets()
      ]);
      
      const bookings = bookingsResponse.success ? (bookingsResponse.data?.bookings || []) : [];
      const supportTickets = supportTicketsResponse.success ? (supportTicketsResponse.data?.tickets || []) : [];
      
      console.log('Fetched data:', {
        bookings: bookings.length,
        supportTickets: supportTickets.length
      });
      
      // Transform bookings to task format
      const transformedBookings = bookings.map(booking => ({
        id: booking._id,
        caseId: booking.bookingReference || `FIX${booking._id.toString().substring(booking._id.toString().length - 8).toUpperCase()}`,
        title: booking.services?.[0]?.serviceName || 'Service Request',
        customer: booking.customer?.name || 'Unknown Customer',
        phone: booking.customer?.phone || 'N/A',
        amount: `₹0`,
        date: booking.scheduling?.scheduledDate 
          ? new Date(booking.scheduling.scheduledDate).toLocaleDateString('en-IN')
          : booking.scheduling?.preferredDate 
          ? new Date(booking.scheduling.preferredDate).toLocaleDateString('en-IN')
          : new Date(booking.createdAt).toLocaleDateString('en-IN'),
        time: booking.scheduling?.scheduledTime 
          ? new Date(`2000-01-01T${booking.scheduling.scheduledTime}`).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
                hour12: true
              })
            : booking.scheduling?.preferredTimeSlot || 'Not scheduled',
          status: booking.priority === 'urgent' ? 'Emergency' : 
                 booking.priority === 'high' ? 'High Priority' : 
                 booking.priority === 'low' ? 'Low Priority' : 'Normal',
          address: booking.customer?.address 
            ? typeof booking.customer.address === 'object' 
              ? `${booking.customer.address.street || ''}, ${booking.customer.address.city || ''}, ${booking.customer.address.state || ''} - ${booking.customer.address.pincode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')
              : booking.customer.address
            : 'Address not provided',
          issue: booking.notes || booking.services?.[0]?.serviceName || 'Service request',
          assignDate: booking.vendor?.assignedAt 
            ? new Date(booking.vendor.assignedAt).toLocaleDateString('en-IN')
            : new Date(booking.createdAt).toLocaleDateString('en-IN'),
          assignTime: booking.vendor?.assignedAt 
            ? new Date(booking.vendor.assignedAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
            : 'Not assigned',
          priority: booking.priority || 'medium',
          bookingStatus: booking.status,
          vendorResponse: booking.vendorResponse,
          isSupportTicket: false
        }));

      // Transform support tickets to task format
      const transformedSupportTickets = supportTickets.map(ticket => ({
        id: ticket.id,
        caseId: ticket.id,
        title: ticket.subject || 'Support Request',
        customer: ticket.customerName || 'Unknown Customer',
        phone: ticket.customerPhone || 'N/A',
        amount: 'Support Ticket',
        date: ticket.scheduledDate 
          ? new Date(ticket.scheduledDate).toLocaleDateString('en-IN')
          : ticket.created 
          ? new Date(ticket.created).toLocaleDateString('en-IN')
          : new Date().toLocaleDateString('en-IN'),
        time: ticket.scheduledTime 
          ? (() => {
              // Convert 24-hour format to 12-hour format with AM/PM
              if (ticket.scheduledTime.includes(':')) {
                const [hours, minutes] = ticket.scheduledTime.split(':');
                const hour24 = parseInt(hours);
                const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                const ampm = hour24 >= 12 ? 'PM' : 'AM';
                return `${hour12}:${minutes} ${ampm}`;
              }
              return ticket.scheduledTime;
            })()
          : 'Not scheduled',
        status: ticket.priority === 'High' ? 'High Priority' : 
               ticket.priority === 'Medium' ? 'Normal' : 'Low Priority',
        address: ticket.address || 'Address not provided',
        street: ticket.street || ticket.userId?.address?.street || 'Not provided',
        city: ticket.city || ticket.userId?.address?.city || 'Not provided',
        state: ticket.state || ticket.userId?.address?.state || 'Not provided',
        pincode: ticket.pincode || ticket.userId?.address?.pincode || 'Not provided',
        landmark: ticket.landmark || ticket.userId?.address?.landmark || 'Not provided',
        userId: ticket.userId, // Include full user object for address access
        issue: ticket.description || ticket.subject || 'Support request',
        assignDate: ticket.assignedAt 
          ? new Date(ticket.assignedAt).toLocaleDateString('en-IN')
          : new Date().toLocaleDateString('en-IN'),
        assignTime: ticket.assignedAt 
          ? new Date(ticket.assignedAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          : 'Not assigned',
        priority: ticket.priority?.toLowerCase() || 'medium',
        vendorStatus: ticket.vendorStatus,
        isSupportTicket: true
      }));

      // Combine bookings and support tickets
      const allTasks = [...transformedBookings, ...transformedSupportTickets];

      console.log('Transformed data:', {
        bookings: transformedBookings.length,
        supportTickets: transformedSupportTickets.length,
        total: allTasks.length
      });

      // Categorize tasks based on status
      const newTasks = allTasks.filter(task => {
        if (task.isSupportTicket) {
          // Support tickets: Pending, Accepted statuses are "new"
          return task.vendorStatus === 'Pending' || task.vendorStatus === 'Accepted';
        } else {
          // Bookings: confirmed, waiting_for_engineer, in_progress are "new" (but not if declined)
          const isDeclined = task.vendorResponse?.status === 'declined';
          return !isDeclined && (
            task.bookingStatus === 'confirmed' || 
            task.bookingStatus === 'waiting_for_engineer' ||
            task.bookingStatus === 'in_progress'
          );
        }
      });
      
      const closedTasks = allTasks.filter(task => {
        if (task.isSupportTicket) {
          // Support tickets: Completed status
          return task.vendorStatus === 'Completed';
        } else {
          // Bookings: completed status
          return task.bookingStatus === 'completed';
        }
      });
      
      const cancelledTasks = allTasks.filter(task => {
        if (task.isSupportTicket) {
          // Support tickets: Declined, Cancelled statuses
          return task.vendorStatus === 'Declined' || task.vendorStatus === 'Cancelled';
        } else {
          // Bookings: cancelled status OR declined status OR declined by vendor (auto-rejected)
          return task.bookingStatus === 'cancelled' || task.bookingStatus === 'declined' || task.vendorResponse?.status === 'declined';
        }
      });
      
      console.log('Task categorization:', {
        new: newTasks.length,
        closed: closedTasks.length,
        cancelled: cancelledTasks.length
      });

      setTaskData({
        new: newTasks,
        closed: [...closedTasks, ...completedTasks],
        cancelled: cancelledTasks
      });
  } catch (error) {
    console.error('Error fetching vendor bookings:', error);
    setError('Failed to fetch bookings');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchBanners();
    fetchVendorStats();
    fetchVendorDepositStatus();
    fetchVendorBookings();
    
    // Get vendor ID for notifications
    const getVendorId = async () => {
      try {
        const response = await vendorApi.getVendorProfile();
        if (response.success && (response.data as any)._id) {
          setVendorId((response.data as any)._id);
        }
      } catch (error) {
        console.error('Error getting vendor ID:', error);
      }
    };
    getVendorId();
    
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % vendorStats.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Handle task status update
  const handleTaskStatusUpdate = (taskId: string, newStatus: string) => {
    setTaskData(prev => ({
      ...prev,
      new: prev.new.map(task => {
        if (task.id === taskId) {
          if (task.isSupportTicket) {
            // Update vendorStatus for support tickets
            return { 
              ...task, 
              vendorStatus: newStatus === 'accepted' ? 'Accepted' : 'Declined'
            };
          } else {
            // Update bookingStatus for booking tasks
            return { 
              ...task, 
              bookingStatus: newStatus === 'accepted' ? 'in_progress' : 'cancelled' 
            };
          }
        }
        return task;
      }),
      // Move declined/cancelled tasks to cancelled section
      cancelled: (newStatus === 'declined' || newStatus === 'cancelled')
        ? [...prev.cancelled, ...prev.new.filter(task => task.id === taskId)]
        : prev.cancelled
    }));
    
    // Refresh data after status update
    setTimeout(() => {
      fetchVendorBookings();
    }, 1000);
  };

  // Fetch bookings when component mounts
  useEffect(() => {
    fetchVendorBookings();
  }, []);

  // Handle URL tab parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab && ['new', 'closed', 'cancelled'].includes(tab)) {
      setActiveTaskTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  // Listen for completed tasks from localStorage or other sources
  useEffect(() => {
    const handleTaskCompleted = (event) => {
      const completedTask = event.detail;
      setCompletedTasks(prev => [...prev, completedTask]);
      
      // Also update taskData to move the task to closed tab
      setTaskData(prevData => {
        const newData = { ...prevData };
        
        // Remove from new tasks if it exists there
        newData.new = newData.new.filter(task => task.id !== completedTask.id);
        
        // Add to closed tasks
        newData.closed = [...newData.closed, completedTask];
        
        return newData;
      });
    };

    window.addEventListener('taskCompleted', handleTaskCompleted);
    return () => window.removeEventListener('taskCompleted', handleTaskCompleted);
  }, []);

  // Listen for rescheduled tasks
  useEffect(() => {
    const handleTaskRescheduled = (event) => {
      const rescheduledTask = event.detail;
      
      setTaskData(prevData => {
        const newData = { ...prevData };
        
        // Find and update the task in the appropriate tab
        Object.keys(newData).forEach(tabKey => {
          const taskIndex = newData[tabKey].findIndex(task => task.id === rescheduledTask.id);
          if (taskIndex !== -1) {
            // Update the task with new date, time, and status
            newData[tabKey][taskIndex] = {
              ...newData[tabKey][taskIndex],
              date: rescheduledTask.date,
              time: rescheduledTask.time,
              status: rescheduledTask.status,
              rescheduleReason: rescheduledTask.rescheduleReason,
              originalDate: rescheduledTask.originalDate,
              originalTime: rescheduledTask.originalTime,
              rescheduledAt: rescheduledTask.rescheduledAt
            };
          }
        });
        
        return newData;
      });
    };

    window.addEventListener('taskRescheduled', handleTaskRescheduled);
    return () => window.removeEventListener('taskRescheduled', handleTaskRescheduled);
  }, []);

  // Only show hero section on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <section className="relative flex items-start justify-center overflow-hidden min-h-[20vh] sm:min-h-[25vh] mb-4">
      {/* Background Gradient */}
      <div className="absolute bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-50" />
      
      <div className="container mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="grid lg:grid-cols-2 gap-1 items-start">
          {/* Banner Slideshow - Shows first on mobile */}
          <div className="relative animate-fade-in-delay order-1 mb-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-3xl opacity-20 animate-pulse" />
              <div className="relative rounded-3xl overflow-hidden">
                {bannersLoading ? (
                  <div className="w-full h-40 sm:h-48 md:h-52 bg-gray-200 rounded-3xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Loading banners...</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-40 sm:h-48 md:h-52">
                    {banners.map((banner, index) => (
                      <img 
                        key={index}
                        src={banner} 
                        alt={`Fixfly Banner ${index + 1}`} 
                        className={`w-full h-full object-cover object-center rounded-3xl shadow-2xl transition-opacity duration-1000 ${
                          index === currentBanner ? 'opacity-100' : 'opacity-0 absolute top-0 left-0'
                        }`}
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          // Ensure image fills container properly
                          img.style.minHeight = '100%';
                          img.style.minWidth = '100%';
                        }}
                        onError={(e) => {
                          console.error('Banner image failed to load:', banner);
                          // Hide the broken image
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ))}
                  </div>
                )}
                {/* Banner Indicators */}
                {!bannersLoading && banners.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {banners.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentBanner(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentBanner ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center lg:text-left animate-slide-up order-2 lg:w-full lg:pr-8">
            {/* Task Blocks */}
            <div className="space-y-4">
              {/* Task Tabs */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTaskTab('new')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-md font-medium text-sm transition-all duration-200 ${
                    activeTaskTab === 'new'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Task({taskData.new.length})</span>
                </button>
                <button
                  onClick={() => setActiveTaskTab('closed')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-md font-medium text-sm transition-all duration-200 ${
                    activeTaskTab === 'closed'
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Closed ({taskData.closed.length})</span>
                </button>
                <button
                  onClick={() => setActiveTaskTab('cancelled')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-md font-medium text-sm transition-all duration-200 ${
                    activeTaskTab === 'cancelled'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancelled ({taskData.cancelled.length})</span>
                </button>
              </div>

              {/* Mandatory Deposit Notification */}
              {vendorDepositStatus && vendorDepositStatus.hasFirstTaskAssigned && !vendorDepositStatus.hasMandatoryDeposit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-800 mb-1">
                        Mandatory Deposit Required
                      </h4>
                      <p className="text-sm text-red-700 mb-3">
                        You need to make a mandatory deposit of ₹2000 to accept tasks. This deposit is required after your first task assignment.
                      </p>
                      <Button 
                        onClick={handleMakeDeposit}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2"
                        disabled={isProcessingDeposit}
                      >
                        {isProcessingDeposit ? 'Processing...' : 'Make Deposit Now'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Task List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-3">
                  <h3 className="text-base font-semibold text-gray-800 mb-3 capitalize">
                    {activeTaskTab === 'new' && 'New Tasks'}
                    {activeTaskTab === 'closed' && 'Closed Tasks'}
                    {activeTaskTab === 'cancelled' && 'Cancelled Tasks'}
                  </h3>
                  <div className="space-y-2">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-500">Loading tasks...</p>
                        </div>
                      </div>
                    ) : error ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <p className="text-sm text-red-500 mb-2">{error}</p>
                          {error.includes('log in') ? (
                            <button 
                              onClick={() => navigate('/vendor/login')}
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              Go to Login
                            </button>
                          ) : (
                            <button 
                              onClick={fetchVendorBookings}
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              Retry
                            </button>
                          )}
                        </div>
                      </div>
                    ) : taskData[activeTaskTab as keyof typeof taskData].length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">
                            {activeTaskTab === 'new' && 'No new tasks available'}
                            {activeTaskTab === 'closed' && 'No completed tasks'}
                            {activeTaskTab === 'cancelled' && 'No cancelled tasks'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      activeTaskTab === 'new' ? (
                        taskData.new.map((task) => (
                          // Both booking tasks and support tickets use VendorTaskCard for consistent layout
                          <VendorTaskCard
                            key={task.id}
                            task={task}
                            onStatusUpdate={handleTaskStatusUpdate}
                          />
                        ))
                      ) : (
                        taskData[activeTaskTab as keyof typeof taskData].map((task) => (
                          // Both booking tasks and support tickets use VendorTaskCard for consistent layout
                          <VendorTaskCard
                            key={task.id}
                            task={task}
                            onStatusUpdate={handleTaskStatusUpdate}
                          />
                        ))
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Status */}
            {vendorId && (
              <div className="mt-4">
                <VendorNotificationStatus vendorId={vendorId} />
              </div>
            )}

            {/* Notification Enable Button */}
            {vendorId && (
              <div className="mt-4">
                <VendorNotificationEnable 
                  vendorId={vendorId} 
                  onTokenGenerated={(token) => {
                    console.log('✅ FCM Token generated for vendor:', vendorId);
                    // Refresh the page to update notification status
                    setTimeout(() => {
                      window.location.reload();
                    }, 2000);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VendorHero;
