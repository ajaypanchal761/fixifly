import React, { useState, useEffect } from 'react';
import AdminHeader from '../components/AdminHeader';
import adminBookingApi, { Booking, BookingStats } from '@/services/adminBookingApi';
import adminApiService from '@/services/adminApi';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  MapPin,
  Phone,
  DollarSign,
  Star,
  AlertTriangle,
  UserPlus,
  Users,
  Check,
  GripVertical,
  Loader2,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const AdminBookingManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAssignEngineerOpen, setIsAssignEngineerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [assignedEngineer, setAssignedEngineer] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isEditBookingOpen, setIsEditBookingOpen] = useState(false);
  const [isUpdatePriorityOpen, setIsUpdatePriorityOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');
  const [isCompletedTaskDetailsOpen, setIsCompletedTaskDetailsOpen] = useState(false);
  const [completedTaskDetails, setCompletedTaskDetails] = useState(null);
  
  // Booking data from API
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);

  const services = ['AC Repair & Maintenance', 'Laptop Repair', 'Mobile Phone Repair', 'Washing Machine Repair', 'Plumbing Services'];

  // Vendors data - will be fetched from API
  const [vendors, setVendors] = useState([]);

  // Fetch bookings from API
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await adminBookingApi.getAllBookings({
        page: currentPage,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter,
        paymentStatus: paymentStatusFilter === 'all' ? undefined : paymentStatusFilter,
        search: searchTerm || undefined,
        sortBy,
        sortOrder
      });

      if (response.success && response.data) {
        setBookings(response.data.bookings);
        setStats(response.data.stats);
        setTotalPages(response.data.pagination.totalPages);
        setTotalBookings(response.data.pagination.totalBookings);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch bookings",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch booking statistics
  const fetchStats = async () => {
    try {
      const response = await adminBookingApi.getBookingStats('30d');
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch vendors from API
  const fetchVendors = async () => {
    try {
      console.log('Fetching vendors...');
      const response = await adminApiService.getVendors({
        page: 1,
        limit: 100 // Get all vendors without server-side filtering
      });
      
      console.log('Vendor API response:', response);
      
      if (response.success && response.data) {
        console.log('All fetched vendors:', response.data.vendors);
        // Filter to only include active and verified vendors
        const activeVendors = response.data.vendors.filter((vendor: any) => {
          console.log('Checking vendor:', {
            name: vendor.name,
            status: vendor.status,
            verificationStatus: vendor.verificationStatus,
            isActive: vendor.isActive,
            isApproved: vendor.isApproved
          });
          return vendor.status === 'active' && vendor.verificationStatus === 'verified';
        });
        console.log('Active vendors after filtering:', activeVendors);
        setVendors(activeVendors);
      } else {
        console.error('Failed to fetch vendors:', response);
        setVendors([]);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
    }
  };

  // Update booking status
  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await adminBookingApi.updateBookingStatus(bookingId, newStatus);
      if (response.success) {
        toast({
          title: "Success",
          description: "Booking status updated successfully",
          variant: "default"
        });
        fetchBookings();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update status",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive"
      });
    }
  };

  // Assign vendor
  const handleAssignVendor = async () => {
    if (!selectedBooking || !assignedEngineer) return;

    try {
      const response = await adminBookingApi.assignVendor(selectedBooking._id, assignedEngineer);
      if (response.success) {
        toast({
          title: "Success",
          description: "Vendor assigned successfully",
          variant: "default"
        });
        setIsAssignEngineerOpen(false);
        setSelectedBooking(null);
        setAssignedEngineer('');
        fetchBookings();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to assign vendor",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error assigning vendor:', error);
      toast({
        title: "Error",
        description: "Failed to assign vendor",
        variant: "destructive"
      });
    }
  };

  // Process refund
  const handleProcessRefund = async () => {
    if (!selectedBooking) return;

    try {
      const response = await adminBookingApi.processRefund(
        selectedBooking._id,
        refundAmount || selectedBooking.pricing.totalAmount,
        refundReason || 'Admin processed refund'
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Refund processed successfully",
          variant: "default"
        });
        setIsRefundOpen(false);
        setSelectedBooking(null);
        setRefundAmount(0);
        setRefundReason('');
        fetchBookings();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to process refund",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: "Error",
        description: "Failed to process refund",
        variant: "destructive"
      });
    }
  };

  // Delete booking
  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      const response = await adminBookingApi.deleteBooking(bookingId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Booking deleted successfully",
          variant: "default"
        });
        fetchBookings();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete booking",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({
        title: "Error",
        description: "Failed to delete booking",
        variant: "destructive"
      });
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    // Check admin authentication
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    console.log('Admin authentication check:', {
      hasToken: !!adminToken,
      hasAdminData: !!adminData,
      tokenPreview: adminToken ? `${adminToken.substring(0, 20)}...` : 'none'
    });
    
    if (!adminToken) {
      console.log('No admin token found, redirecting to login...');
      toast({
        title: "Authentication Required",
        description: "Please log in as admin to access this page. Redirecting to login...",
        variant: "destructive"
      });
      // Redirect to admin login
      window.location.href = '/admin/login';
      return;
    }
    
    console.log('Admin token found, fetching bookings...');
    fetchBookings();
  }, [currentPage, statusFilter, paymentStatusFilter, serviceFilter, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    fetchStats();
    fetchVendors();
  }, []);

  const getVendorName = (vendorId: string | object | null) => {
    if (!vendorId) return 'Not Assigned';
    
    // If vendorId is an object (populated vendor), extract name directly
    if (typeof vendorId === 'object' && vendorId !== null) {
      const vendor = vendorId as any;
      if (vendor.firstName && vendor.lastName) {
        return `${vendor.firstName} ${vendor.lastName}`;
      }
      return 'Assigned Vendor';
    }
    
    // If vendorId is a string, find vendor in vendors array
    const vendor = vendors.find(v => (v.id || v._id) === vendorId || v.vendorId === vendorId);
    if (vendor) {
      // Check if vendor has firstName/lastName or name field
      if (vendor.firstName && vendor.lastName) {
        return `${vendor.firstName} ${vendor.lastName}`;
      }
      return vendor.name || 'Unknown Vendor';
    }
    return 'Unknown Vendor';
  };

  const filteredBookings = bookings.filter(booking => {
    const customerName = booking.customer?.name || '';
    const serviceNames = booking.services?.map(service => service.serviceName).join(' ') || '';
    
    // Inline vendor name logic to avoid function dependency
    let vendorName = 'Not Assigned';
    if (booking.vendor?.vendorId) {
      const vendorId = booking.vendor.vendorId;
      if (typeof vendorId === 'object' && vendorId !== null) {
        const vendor = vendorId as any;
        if (vendor.firstName && vendor.lastName) {
          vendorName = `${vendor.firstName} ${vendor.lastName}`;
        } else {
          vendorName = 'Assigned Vendor';
        }
      } else {
        const vendor = vendors.find(v => (v.id || v._id) === vendorId);
        if (vendor) {
          if (vendor.firstName && vendor.lastName) {
            vendorName = `${vendor.firstName} ${vendor.lastName}`;
          } else {
            vendorName = vendor.name || 'Unknown Vendor';
          }
        } else {
          vendorName = 'Unknown Vendor';
        }
      }
    }
    
    const bookingId = booking._id || '';
    
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         serviceNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bookingId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesService = serviceFilter === 'all' || serviceNames.includes(serviceFilter);
    return matchesSearch && matchesStatus && matchesService;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-purple-100 text-purple-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'normal':
        return <Badge className="bg-blue-100 text-blue-800">Normal</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{priority}</Badge>;
    }
  };


  const handleAssignEngineer = (booking: any) => {
    setSelectedBooking(booking);
    // Ensure only single vendor ID is set
    const vendorId = booking.vendor?.vendorId;
    if (Array.isArray(vendorId)) {
      setAssignedEngineer(vendorId[0] || '');
    } else {
      setAssignedEngineer(vendorId || '');
    }
    setAssignmentNotes('');
    // Set default values for easier testing
    setScheduledDate(new Date().toISOString().split('T')[0]); // Today's date
    setScheduledTime('09:00'); // 9:00 AM
    setPriority('medium');
    setIsAssignEngineerOpen(true);
  };

  const handleCloseAssignEngineer = () => {
    setIsAssignEngineerOpen(false);
    setSelectedBooking(null);
    setAssignedEngineer('');
    setAssignmentNotes('');
    setScheduledDate('');
    setScheduledTime('');
    setPriority('medium');
  };

  const handleSubmitAssignment = async () => {
    // Check for minimum required fields
    if (!selectedBooking) {
      toast({
        title: "Error",
        description: "No booking selected",
        variant: "destructive"
      });
      return;
    }

    // Ensure only one vendor is selected
    if (!assignedEngineer) {
      toast({
        title: "Error",
        description: "Please select a vendor before assigning",
        variant: "destructive"
      });
      return;
    }

    if (isAssigning) return; // Prevent multiple submissions

    setIsAssigning(true);
    try {
      // Check admin authentication
      const adminToken = localStorage.getItem('adminToken');
      console.log('Admin token exists:', !!adminToken);
      
      if (!adminToken) {
        toast({
          title: "Authentication Error",
          description: "Admin session expired. Please log in again.",
          variant: "destructive"
        });
        window.location.href = '/admin/login';
        return;
      }
      
      console.log('Submitting assignment:', {
        bookingId: selectedBooking._id,
        vendorId: assignedEngineer,
        scheduledDate,
        scheduledTime,
        priority,
        notes: assignmentNotes
      });

      // Ensure vendor ID is a single string, not an array
      let vendorToAssign = assignedEngineer;
      
      // If assignedEngineer is an array, take the first one
      if (Array.isArray(vendorToAssign)) {
        vendorToAssign = vendorToAssign[0];
        console.warn('Multiple vendors detected, using first vendor:', vendorToAssign);
      }
      
      if (!vendorToAssign) {
        toast({
          title: "Error",
          description: "No vendor available for this service",
          variant: "destructive"
        });
        return;
      }

      // Assign vendor using API with scheduled date and time
      const response = await adminBookingApi.assignVendor(
        selectedBooking._id, 
        vendorToAssign, 
        scheduledDate || undefined, 
        scheduledTime || undefined,
        priority || undefined,
        assignmentNotes || undefined
      );

      console.log('Assignment response:', response);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Engineer assigned successfully and booking confirmed",
          variant: "default"
        });
        
        // Refresh bookings to get updated data
        fetchBookings();
        
        // Close modal and reset form
        setIsAssignEngineerOpen(false);
        setSelectedBooking(null);
        setAssignedEngineer('');
        setAssignmentNotes('');
        setScheduledDate('');
        setScheduledTime('');
        setPriority('medium');
      } else {
        console.error('Assignment failed:', response);
        toast({
          title: "Error",
          description: response.message || "Failed to assign vendor",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error assigning vendor:', error);
      toast({
        title: "Error",
        description: `Failed to assign vendor: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUpdateAssignmentStatus = (bookingId: string, newStatus: string) => {
    setBookings(prev => prev.map(booking => 
      booking._id === bookingId 
        ? { ...booking, assignmentStatus: newStatus }
        : booking
    ));
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const getPaymentModeBadge = (paymentMode: string) => {
    if (!paymentMode) {
      return <span className="text-gray-400">-</span>;
    }

    const modeConfig = {
      online: { color: 'bg-blue-100 text-blue-800', icon: '💳' },
      cash: { color: 'bg-green-100 text-green-800', icon: '💰' }
    };

    const config = modeConfig[paymentMode as keyof typeof modeConfig] || modeConfig.online;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {paymentMode.toUpperCase()}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string, paymentMode: string) => {
    if (!paymentMode) {
      return <span className="text-gray-400">-</span>;
    }

    if (paymentMode === 'online') {
      const statusConfig = {
        pending: { color: 'bg-yellow-100 text-yellow-800' },
        payment_done: { color: 'bg-green-100 text-green-800' }
      };
      const config = statusConfig[paymentStatus as keyof typeof statusConfig] || statusConfig.pending;
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
          {paymentStatus.replace('_', ' ').toUpperCase()}
        </span>
      );
    } else {
      const statusConfig = {
        collected: { color: 'bg-green-100 text-green-800' },
        not_collected: { color: 'bg-red-100 text-red-800' }
      };
      const config = statusConfig[paymentStatus as keyof typeof statusConfig] || statusConfig.not_collected;
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
          {paymentStatus.replace('_', ' ').toUpperCase()}
        </span>
      );
    }
  };

  const getVendorStatusBadge = (response: any) => {
    // Handle both object and string responses
    let vendorResponse = '';
    if (typeof response === 'object' && response !== null) {
      vendorResponse = response.status || '';
    } else if (typeof response === 'string') {
      vendorResponse = response;
    }

    if (!vendorResponse || vendorResponse === 'pending') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Clock className="w-3 h-3 mr-1" />
          PENDING
        </span>
      );
    }

    const statusConfig = {
      accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      declined: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[vendorResponse as keyof typeof statusConfig] || statusConfig.accepted;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {vendorResponse.toUpperCase()}
      </span>
    );
  };

  const handleViewDetails = (booking: any) => {
    // Transform the nested booking data into flat structure for the modal
    const transformedBooking = {
      ...booking,
      // Customer information
      customerName: booking.customer?.name || 'N/A',
      customerEmail: booking.customer?.email || 'N/A',
      customerPhone: booking.customer?.phone || 'N/A',
      address: (() => {
        const addr = booking.customer?.address;
        if (typeof addr === 'object' && addr !== null) {
          return `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');
        }
        return addr || 'N/A';
      })(),
      
      // Service information
      serviceName: booking.services?.map((service: any) => service.serviceName).join(', ') || 'N/A',
      
      // Vendor information
      vendorName: (() => {
        if (!booking.vendor?.vendorId) return 'Not Assigned';
        const vendor = booking.vendor.vendorId as any;
        if (typeof vendor === 'object' && vendor !== null) {
          return vendor.firstName && vendor.lastName 
            ? `${vendor.firstName} ${vendor.lastName}` 
            : 'Assigned Vendor';
        }
        return 'Assigned Vendor';
      })(),
      vendorPhone: (() => {
        if (!booking.vendor?.vendorId) return 'N/A';
        const vendor = booking.vendor.vendorId as any;
        if (typeof vendor === 'object' && vendor !== null) {
          return vendor.phone || 'N/A';
        }
        return 'N/A';
      })(),
      
      // Amount
      totalAmount: booking.pricing?.totalAmount || booking.totalAmount || 0,
      
      // Dates
      bookingDate: booking.createdAt || booking.bookingDate,
      scheduledDate: booking.scheduling?.scheduledDate || booking.scheduling?.preferredDate || 'Not scheduled',
      scheduledTime: booking.scheduling?.scheduledTime 
        ? new Date(`2000-01-01T${booking.scheduling.scheduledTime}`).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        : 'Not scheduled',
      
      // Status and priority
      priority: (booking.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
      paymentStatus: booking.payment?.status || 'pending',
      status: booking.vendor ? 'assigned' : 'unassigned',
      
      // Notes
      notes: (() => {
        const notes = booking.notes || booking.description || '';
        return notes.replace(/Booking created from checkout/gi, '').trim() || '';
      })(),
      
      // Payment information
      paymentMode: booking.paymentMode || '',
      paymentAmount: booking.completionData?.totalAmount || 0,
      
      // Completion data
      completionData: booking.completionData || null,
      resolutionNote: booking.completionData?.resolutionNote || '',
      spareParts: booking.completionData?.spareParts || [],
      
      // Vendor response
      vendorResponse: booking.vendorResponse || booking.vendor?.response || '',
      assignedAt: booking.vendor?.assignedAt || ''
    };
    
    setSelectedBooking(transformedBooking);
    setIsViewDetailsOpen(true);
  };

  const handleEditBooking = (booking: any) => {
    setEditingBooking(booking);
    setIsEditBookingOpen(true);
  };

  const handleUpdatePriority = (booking: any) => {
    setSelectedBooking(booking);
    setSelectedPriority(booking.priority || 'medium');
    setIsUpdatePriorityOpen(true);
  };

  const handleSubmitPriorityUpdate = async () => {
    if (!selectedBooking) return;

    try {
      const response = await adminBookingApi.updateBookingPriority(selectedBooking._id, selectedPriority);

      if (response.success) {
        // Update local state immediately for better UX
        setBookings(prev => prev.map(booking => 
          booking._id === selectedBooking._id 
            ? { ...booking, priority: selectedPriority as 'low' | 'medium' | 'high' | 'urgent' }
            : booking
        ));
        
        toast({
          title: "Success",
          description: "Priority updated successfully",
          variant: "default"
        });
        setIsUpdatePriorityOpen(false);
        setSelectedBooking(null);
        setSelectedPriority('medium');
        fetchBookings();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update priority",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive"
      });
    }
  };

  const handleViewCompletedTaskDetails = (booking: any) => {
    // For now, we'll create mock data for completed task details
    // In a real implementation, this would fetch from an API endpoint
    const mockCompletedTaskDetails = {
      bookingId: booking._id,
      bookingReference: booking.bookingReference || `FIX${booking._id.toString().substring(booking._id.toString().length - 8).toUpperCase()}`,
      customerName: booking.customer?.name || 'N/A',
      serviceName: booking.services?.map((service: any) => service.serviceName).join(', ') || 'N/A',
      resolution: "Laptop display was successfully replaced with a new LCD panel. Keyboard was also repaired by replacing the damaged keys. All functionality has been restored and tested.",
      spareParts: [
        {
          id: 1,
          name: "LCD Display Panel 15.6 inch",
          price: 4500,
          image: "https://via.placeholder.com/150x100?text=LCD+Panel"
        },
        {
          id: 2,
          name: "Keyboard Replacement",
          price: 1200,
          image: "https://via.placeholder.com/150x100?text=Keyboard"
        }
      ],
      travelExpense: 200,
      totalAmount: booking.pricing?.totalAmount || 0,
      completedDate: new Date().toLocaleDateString('en-IN'),
      completedTime: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
    
    setCompletedTaskDetails(mockCompletedTaskDetails);
    setIsCompletedTaskDetailsOpen(true);
  };

  const handleConfirmBooking = (bookingId: string) => {
    setBookings(prev => prev.map(booking => 
      booking._id === bookingId 
        ? { ...booking, status: 'confirmed' }
        : booking
    ));
  };

  const handleCancelBooking = (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      setBookings(prev => prev.map(booking => 
        booking._id === bookingId 
          ? { ...booking, status: 'cancelled', assignmentStatus: 'cancelled' }
          : booking
      ));
    }
  };

  const handleCreateBooking = () => {
    // In a real app, this would open a create booking modal
    console.log('Creating new booking');
  };


  const getAvailableVendors = (serviceName: string) => {
    console.log('=== VENDOR FILTERING DEBUG ===');
    console.log('All vendors in state:', vendors);
    console.log('Filtering for service:', serviceName);
    console.log('Vendors array length:', vendors.length);
    
    if (vendors.length === 0) {
      console.log('No vendors in array, returning empty array');
      return [];
    }
    
    const availableVendors = vendors.filter(vendor => {
      console.log('Checking vendor:', {
        id: vendor.id || vendor._id,
        name: vendor.name,
        status: vendor.status,
        verificationStatus: vendor.verificationStatus
      });
      
      // Check if vendor is active and verified
      const isActive = vendor.status === 'active';
      const isVerified = vendor.verificationStatus === 'verified';
      
      const result = isActive && isVerified;
      console.log('Vendor check result:', {
        name: vendor.name,
        isActive,
        isVerified,
        result
      });
      
      return result;
    });
    
    console.log('Available vendors after filtering:', availableVendors);
    console.log('Available vendors count:', availableVendors.length);
    
    // Return all available vendors instead of just the first one
    console.log('=== END VENDOR FILTERING DEBUG ===');
    return availableVendors;
  };

  // Get only the first available vendor to ensure single vendor assignment
  const getFirstAvailableVendor = (serviceName: string) => {
    const availableVendors = getAvailableVendors(serviceName);
    return availableVendors.length > 0 ? availableVendors[0] : null;
  };

  const getAssignmentStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Badge className="bg-blue-100 text-blue-800">Assigned</Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-100 text-orange-800">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  console.log('AdminBookingManagement rendering with:', {
    bookings: bookings.length,
    loading,
    stats: !!stats,
    vendors: vendors.length
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <main className="ml-72 pt-32 p-6">
        {/* Page Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">
                Booking <span className="text-gradient">Management</span>
              </h1>
              <p className="text-sm text-gray-600">Manage and monitor all service bookings</p>
            </div>           
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Bookings</p>
                  <p className="text-lg font-bold text-gray-900">
                    {loading ? '...' : (stats?.totalBookings || 0)}
                  </p>
                </div>
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Pending Bookings</p>
                  <p className="text-lg font-bold text-gray-900">
                    {loading ? '...' : (stats?.pendingBookings || 0)}
                  </p>
                </div>
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Completed Bookings</p>
                  <p className="text-lg font-bold text-gray-900">
                    {loading ? '...' : (stats?.completedBookings || 0)}
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Revenue</p>
                  <p className="text-lg font-bold text-gray-900">
                    {loading ? '...' : `₹${(stats?.totalRevenue || 0).toLocaleString()}`}
                  </p>
                </div>
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search bookings by customer, service, vendor, or booking ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="completed">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value) => {
                if (value === 'newest') {
                  setSortBy('createdAt');
                  setSortOrder('desc');
                } else if (value === 'oldest') {
                  setSortBy('createdAt');
                  setSortOrder('asc');
                } else if (value === 'amount') {
                  setSortBy('pricing.totalAmount');
                  setSortOrder('desc');
                } else {
                  setSortBy(value);
                  setSortOrder('desc');
                }
              }}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="amount">Amount (High to Low)</SelectItem>
                  <SelectItem value="customer.name">Customer Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Bookings ({filteredBookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Booking & Scheduled Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Engineer</TableHead>
                  <TableHead>Assignment Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.bookingReference || `FIX${booking._id.toString().substring(booking._id.toString().length - 8).toUpperCase()}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{booking.customer?.name || 'N/A'}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          <span>{booking.customer?.phone || 'N/A'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.services?.map(service => service.serviceName).join(', ') || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 max-w-xs truncate">
                          {(() => {
                            const notes = booking.notes || '';
                            return notes.replace(/Booking created from checkout/gi, '').trim() || '';
                          })()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {(() => {
                            if (!booking.vendor?.vendorId) return 'Unassigned';
                            const vendor = booking.vendor.vendorId as any;
                            if (typeof vendor === 'object' && vendor !== null) {
                              return vendor.firstName && vendor.lastName 
                                ? `${vendor.firstName} ${vendor.lastName}` 
                                : 'Assigned Vendor';
                            }
                            return 'Assigned Vendor';
                          })()}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          <span>
                            {(() => {
                              if (!booking.vendor?.vendorId) return 'N/A';
                              const vendor = booking.vendor.vendorId as any;
                              if (typeof vendor === 'object' && vendor !== null) {
                                return vendor.phone || 'N/A';
                              }
                              return 'N/A';
                            })()}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="mb-1">
                          <p className="text-xs font-medium text-gray-500">Booking Date:</p>
                          <p className="text-sm font-medium text-gray-900">
                            {booking.createdAt 
                              ? new Date(booking.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Scheduled Date:</p>
                          <p className="text-sm font-medium text-gray-900">
                            {booking.scheduling?.scheduledDate 
                              ? new Date(booking.scheduling.scheduledDate).toLocaleDateString()
                              : booking.scheduling?.preferredDate 
                              ? new Date(booking.scheduling.preferredDate).toLocaleDateString()
                              : 'Not scheduled'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {booking.scheduling?.scheduledTime 
                              ? new Date(`2000-01-01T${booking.scheduling.scheduledTime}`).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })
                              : booking.scheduling?.preferredTimeSlot || 'Not scheduled'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        <span className="text-sm font-medium">₹{booking.pricing?.totalAmount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>{getPriorityBadge(booking.priority || 'medium')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs">
                          {(() => {
                            if (!booking.vendor?.vendorId) return 'Unassigned';
                            const vendor = booking.vendor.vendorId as any;
                            if (typeof vendor === 'object' && vendor !== null) {
                              return vendor.firstName && vendor.lastName 
                                ? `${vendor.firstName} ${vendor.lastName}` 
                                : 'Assigned Vendor';
                            }
                            return 'Assigned Vendor';
                          })()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getAssignmentStatusBadge(booking.vendor ? 'assigned' : 'unassigned')}</TableCell>
                    <TableCell>{getPaymentStatusBadge(booking.payment?.status || 'pending', booking.payment?.method || 'card')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(booking)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditBooking(booking)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Booking
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAssignEngineer(booking)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            {booking.vendor ? 'Reassign Vendor' : 'Assign Vendor'}
                          </DropdownMenuItem>
                          {booking.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleConfirmBooking(booking._id)}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Confirm Booking
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleUpdatePriority(booking)}>
                            <Star className="w-4 h-4 mr-2" />
                            Update Priority
                          </DropdownMenuItem>
                          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleCancelBooking(booking._id)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancel Booking
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Engineer Assignment Dialog */}
        <Dialog open={isAssignEngineerOpen} onOpenChange={handleCloseAssignEngineer}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto mt-12">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900">Assign Vendor to Booking</DialogTitle>
              <p className="text-xs text-gray-600">Select a vendor and schedule the appointment for this booking</p>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                {/* Booking Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-3 h-3 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">Booking Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Booking ID:</span>
                        <span className="font-semibold text-gray-900">
                          {selectedBooking.bookingReference || `FIX${selectedBooking._id?.toString().substring(selectedBooking._id?.toString().length - 8).toUpperCase()}` || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Customer:</span>
                        <span className="font-semibold text-gray-900">{selectedBooking.customer?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Phone:</span>
                        <span className="font-semibold text-gray-900">{selectedBooking.customer?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Email:</span>
                        <span className="font-semibold text-gray-900">{selectedBooking.customer?.email || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Service:</span>
                        <span className="font-semibold text-gray-900 text-right">
                        {selectedBooking.services?.map(s => s.serviceName).join(', ') || 'N/A'}
                      </span>
                    </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Amount:</span>
                        <span className="font-semibold text-green-600">₹{selectedBooking.pricing?.totalAmount || 'N/A'}</span>
                    </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Preferred Date:</span>
                        <span className="font-semibold text-gray-900">
                        {selectedBooking.scheduling?.preferredDate ? 
                          new Date(selectedBooking.scheduling.preferredDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Time Slot:</span>
                        <span className="font-semibold text-gray-900">{selectedBooking.scheduling?.preferredTimeSlot || 'N/A'}</span>
                    </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 text-blue-600 mt-0.5" />
                      <div>
                        <span className="text-gray-600 font-medium text-xs">Address:</span>
                        <p className="text-gray-900 font-medium text-xs mt-1">
                        {selectedBooking.customer?.address ? 
                          `${selectedBooking.customer.address.street}, ${selectedBooking.customer.address.city}, ${selectedBooking.customer.address.state} - ${selectedBooking.customer.address.pincode}` : 
                          'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Issue Description */}
                  {selectedBooking.notes && selectedBooking.notes.replace(/Booking created from checkout/gi, '').trim() && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <div className="flex items-start gap-2">
                        <div className="w-3 h-3 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-orange-600 text-xs font-bold">!</span>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium text-xs">Issue Description:</span>
                          <p className="text-gray-900 font-medium text-xs mt-1 bg-orange-50 p-2 rounded border border-orange-200">
                            {selectedBooking.notes.replace(/Booking created from checkout/gi, '').trim()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Schedule Date and Time */}
                  {(selectedBooking.scheduling?.scheduledDate || selectedBooking.scheduling?.preferredDate || selectedBooking.scheduling?.scheduledTime || selectedBooking.scheduling?.preferredTimeSlot) && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <div className="flex items-start gap-2">
                        <div className="w-3 h-3 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                          <Clock className="w-2 h-2 text-purple-600" />
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium text-xs">Schedule Details:</span>
                          <div className="text-gray-900 font-medium text-xs mt-1 bg-purple-50 p-2 rounded border border-purple-200">
                            <div className="flex justify-between">
                              <span>Date:</span>
                              <span>
                                {selectedBooking.scheduling?.scheduledDate 
                                  ? new Date(selectedBooking.scheduling.scheduledDate).toLocaleDateString()
                                  : selectedBooking.scheduling?.preferredDate 
                                  ? new Date(selectedBooking.scheduling.preferredDate).toLocaleDateString()
                                  : 'Not scheduled'}
                              </span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span>Time:</span>
                              <span>
                                {selectedBooking.scheduling?.scheduledTime 
                                  ? new Date(`2000-01-01T${selectedBooking.scheduling.scheduledTime}`).toLocaleTimeString('en-IN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    })
                                  : selectedBooking.scheduling?.preferredTimeSlot || 'Not scheduled'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Current Assignment Status */}
                {selectedBooking.vendor && selectedBooking.vendor.vendorId && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Current Assignment</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs">
                          <span className="font-medium">Vendor:</span> {getVendorName(selectedBooking.vendor?.vendorId)}
                        </p>
                        <div className="text-xs">
                          <span className="font-medium">Status:</span> {getAssignmentStatusBadge(selectedBooking.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Vendor Selection */}
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <UserPlus className="w-3 h-3 text-green-600" />
                    </div>
                <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {selectedBooking.vendor ? 'Reassign Vendor' : 'Select Vendor'}
                      </h3>
                      <p className="text-xs text-gray-600">Choose a qualified vendor for this booking</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="vendor" className="text-xs font-medium text-gray-700">
                        Available Vendors from Vendor Management *
                  </Label>
                      {assignedEngineer && (
                        <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="text-xs font-medium text-green-800">
                              Selected: {getVendorName(assignedEngineer)}
                            </span>
                          </div>
                        </div>
                      )}
                  <Select value={assignedEngineer} onValueChange={setAssignedEngineer}>
                        <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                          {getAvailableVendors(selectedBooking.services?.[0]?.serviceName || '').length > 0 ? (
                            getAvailableVendors(selectedBooking.services?.[0]?.serviceName || '').map((vendor) => (
                              <SelectItem key={vendor.id || vendor._id} value={vendor.vendorId}>
                                <div className="flex items-center justify-between w-full py-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                      <User className="w-3 h-3 text-blue-600" />
                                    </div>
                            <div>
                                      <div className="text-xs font-medium text-gray-900">
                                        {vendor.firstName && vendor.lastName 
                                          ? `${vendor.firstName} ${vendor.lastName}` 
                                          : vendor.name || 'Vendor'}
                            </div>
                                      <div className="text-xs text-gray-500">{vendor.specialty || 'General Services'}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500" />
                                    <span className="text-xs font-medium">{vendor.rating || '4.5'}</span>
                            </div>
                          </div>
                        </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-vendors" disabled>
                              <div className="flex items-center gap-2 text-gray-500">
                                <User className="w-3 h-3" />
                                <span className="text-xs">No available vendors found</span>
                              </div>
                            </SelectItem>
                          )}
                    </SelectContent>
                  </Select>
                    </div>
                    
                  {getAvailableVendors(selectedBooking.services?.[0]?.serviceName || '').length === 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <div>
                            <p className="text-xs font-medium text-yellow-800">No available vendors found</p>
                            <p className="text-xs text-yellow-700 mt-1">
                              Please ensure there are active and approved vendors in the vendor management system.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scheduling Section */}
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <Clock className="w-3 h-3 text-purple-600" />
                    </div>
                  <div>
                      <h3 className="text-sm font-semibold text-gray-900">Schedule Appointment</h3>
                      <p className="text-xs text-gray-600">Set the date and time for the service</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="scheduledDate" className="text-xs font-medium text-gray-700">
                        Scheduled Date *
                      </Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                        className="w-full text-xs"
                      required
                    />
                  </div>
                    <div className="space-y-1">
                      <Label htmlFor="scheduledTime" className="text-xs font-medium text-gray-700">
                        Scheduled Time *
                      </Label>
                    <Select value={scheduledTime} onValueChange={setScheduledTime}>
                        <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="09:00">9:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="11:00">11:00 AM</SelectItem>
                        <SelectItem value="12:00">12:00 PM</SelectItem>
                        <SelectItem value="13:00">1:00 PM</SelectItem>
                        <SelectItem value="14:00">2:00 PM</SelectItem>
                        <SelectItem value="15:00">3:00 PM</SelectItem>
                        <SelectItem value="16:00">4:00 PM</SelectItem>
                        <SelectItem value="17:00">5:00 PM</SelectItem>
                        <SelectItem value="18:00">6:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                    </div>
                  </div>
                </div>

                {/* Priority and Notes Section */}
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-3 h-3 text-orange-600" />
                    </div>
                <div>
                      <h3 className="text-sm font-semibold text-gray-900">Priority & Instructions</h3>
                      <p className="text-xs text-gray-600">Set priority level and add special instructions</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="priority" className="text-xs font-medium text-gray-700">
                        Priority Level *
                      </Label>
                  <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select priority level" />
                    </SelectTrigger>
                    <SelectContent>
                          <SelectItem value="low">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs">Low - Standard service</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-xs">Medium - Normal priority</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <span className="text-xs">High - Important service</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="urgent">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-xs">Urgent - Immediate attention</span>
                            </div>
                          </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                    <div className="space-y-1">
                      <Label htmlFor="notes" className="text-xs font-medium text-gray-700">
                        Assignment Notes (Optional)
                      </Label>
                  <Textarea
                    id="notes"
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                        placeholder="Add any special instructions, customer preferences, or important notes for the vendor..."
                    rows={3}
                        className="w-full text-xs"
                  />
                    </div>
                  </div>
                </div>




                {/* Action Buttons */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={handleSubmitAssignment} 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 text-xs" 
                    disabled={isAssigning}
                    >
                      {isAssigning ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Assigning Vendor...
                        </>
                      ) : (
                        <>
                    <UserPlus className="w-3 h-3 mr-2" />
                          {selectedBooking.vendor ? 'Reassign Vendor' : 'Assign Vendor'}
                        </>
                      )}
                  </Button>
                  
                  <Button 
                    variant="outline"
                      onClick={handleCloseAssignEngineer}
                      className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
                  >
                    Cancel
                  </Button>
                  </div>
                  
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-blue-600 text-xs font-bold">i</span>
                      </div>
                      <div className="text-xs text-blue-800">
                        <p className="font-medium">Assignment Summary:</p>
                        <ul className="mt-1 space-y-1 text-blue-700">
                          <li>• Vendor will be notified immediately after assignment</li>
                          <li>• Customer will receive confirmation with scheduled time</li>
                          <li>• Booking status will be updated to "Confirmed"</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Details Modal */}
        <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto mt-16">
            <DialogHeader>
              <DialogTitle className="text-lg">Booking Details - {selectedBooking?._id}</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-3">
                {/* Customer Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-1">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                      <p className="text-xs">{selectedBooking.customer.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                      <p className="text-xs">{selectedBooking.customer.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                      <p className="text-xs">{selectedBooking.customer.phone}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Address</Label>
                      <p className="text-xs">{selectedBooking.customer.address.street}, {selectedBooking.customer.address.city}</p>
                    </div>
                  </div>
                </div>

                {/* Service Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-1">Service Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Service</Label>
                      <p className="text-xs font-medium">{selectedBooking.services.map(s => s.serviceName).join(', ')}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Vendor</Label>
                      <p className="text-xs">{selectedBooking.vendor?.vendorId ? 
                        (typeof selectedBooking.vendor.vendorId === 'string' ? 
                          selectedBooking.vendor.vendorId : 
                          `${(selectedBooking.vendor.vendorId as any).firstName} ${(selectedBooking.vendor.vendorId as any).lastName}`) : 
                        'Not assigned'}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Vendor Phone</Label>
                      <p className="text-xs">{selectedBooking.vendor?.vendorId && typeof selectedBooking.vendor.vendorId === 'object' ? 
                        (selectedBooking.vendor.vendorId as any).phone : 
                        'Not available'}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Amount</Label>
                      <p className="text-xs font-medium">₹{selectedBooking.pricing.totalAmount}</p>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div>
                  <h3 className="text-sm font-semibold mb-1">Booking Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Booking Date</Label>
                      <p className="text-xs">{new Date(selectedBooking.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Scheduled Date</Label>
                      <p className="text-xs">{selectedBooking.scheduling?.scheduledDate ? 
                        new Date(selectedBooking.scheduling.scheduledDate).toLocaleDateString() : 
                        selectedBooking.scheduling?.preferredDate ?
                        new Date(selectedBooking.scheduling.preferredDate).toLocaleDateString() :
                        'Not scheduled'}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Scheduled Time</Label>
                      <p className="text-xs">
                        {selectedBooking.scheduling?.scheduledTime 
                          ? new Date(`2000-01-01T${selectedBooking.scheduling.scheduledTime}`).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })
                          : selectedBooking.scheduling?.preferredTimeSlot || 'Not scheduled'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Priority</Label>
                      <div className="mt-1">{getPriorityBadge(selectedBooking.priority)}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Payment Status</Label>
                      <div className="mt-1">{getPaymentStatusBadge(selectedBooking.payment?.status || 'pending', selectedBooking.payment?.method || 'card')}</div>
                    </div>
                  </div>
                </div>

                {/* Issue Description */}
                {selectedBooking.notes && selectedBooking.notes.replace(/Booking created from checkout/gi, '').trim() && (
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Issue Description</h3>
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <p className="text-xs text-gray-800">{selectedBooking.notes.replace(/Booking created from checkout/gi, '').trim()}</p>
                    </div>
                  </div>
                )}

                {/* Vendor Assignment */}
                <div>
                  <h3 className="text-sm font-semibold mb-1">Vendor Assignment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Assigned Vendor</Label>
                      <p className="text-xs">{getVendorName(selectedBooking.vendor?.vendorId)}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Assignment Status</Label>
                      <div className="mt-1">{getAssignmentStatusBadge(selectedBooking.status)}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Vendor Response</Label>
                      <div className="mt-1">{getVendorStatusBadge(selectedBooking.vendor?.assignedAt ? 'assigned' : 'not_assigned')}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Assigned Date</Label>
                      <p className="text-xs">{selectedBooking.vendor?.assignedAt ? 
                        new Date(selectedBooking.vendor.assignedAt).toLocaleDateString() : 
                        'Not assigned'}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-1">Payment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Payment Mode</Label>
                      <div className="mt-1">{getPaymentModeBadge(selectedBooking.payment?.method || 'card')}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Payment Status</Label>
                      <div className="mt-1">{getPaymentStatusBadge(selectedBooking.payment?.status || 'pending', selectedBooking.payment?.method || 'card')}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Payment Amount</Label>
                      <p className="text-xs font-medium">₹{selectedBooking.pricing.totalAmount}</p>
                    </div>
                  </div>
                </div>

                {/* Spare Parts */}
                {(selectedBooking as any).completionData?.spareParts && (selectedBooking as any).completionData.spareParts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Spare Parts Used</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(selectedBooking as any).completionData.spareParts.map((part: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-xs text-gray-900">{part.name}</h4>
                            <span className="text-xs font-medium text-green-600">{part.amount}</span>
                          </div>
                          {part.photo && (
                            <div className="mt-1">
                              <img
                                src={part.photo}
                                alt={part.name}
                                className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleImageClick(part.photo)}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-600">Total Spare Parts Amount:</span>
                        <span className="text-xs font-bold text-green-600">
                          ₹{(selectedBooking as any).completionData?.spareParts?.reduce((sum: number, part: any) => 
                            sum + parseInt(part.amount.replace(/[₹,]/g, '')), 0
                          ).toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resolution Note */}
                {(selectedBooking as any).completionData?.resolutionNote && (
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Resolution Note</h3>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-700">{(selectedBooking as any).completionData.resolutionNote}</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedBooking.notes && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Notes</Label>
                  <p className="text-xs mt-1 p-2 bg-gray-50 rounded-lg">{selectedBooking.notes}</p>
                </div>
                )}

                <div className="flex gap-2 pt-3">
                  <Button 
                    onClick={() => handleEditBooking(selectedBooking)} 
                    className="flex-1 text-xs"
                    size="sm"
                  >
                    <Edit className="w-3 h-3 mr-2" />
                    Edit Booking
                  </Button>
                  <Button variant="outline" onClick={() => setIsViewDetailsOpen(false)} size="sm" className="text-xs">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Booking Modal */}
        <Dialog open={isEditBookingOpen} onOpenChange={setIsEditBookingOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Booking - {editingBooking?._id}</DialogTitle>
            </DialogHeader>
            {editingBooking && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      value={editingBooking.customer.name}
                      onChange={(e) => setEditingBooking({...editingBooking, customer: {...editingBooking.customer, name: e.target.value}})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone</Label>
                    <Input
                      id="customerPhone"
                      value={editingBooking.customer.phone}
                      onChange={(e) => setEditingBooking({...editingBooking, customer: {...editingBooking.customer, phone: e.target.value}})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    value={editingBooking.customer.email}
                    onChange={(e) => setEditingBooking({...editingBooking, customer: {...editingBooking.customer, email: e.target.value}})}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={`${editingBooking.customer.address.street}, ${editingBooking.customer.address.city}, ${editingBooking.customer.address.state} - ${editingBooking.customer.address.pincode}`}
                    onChange={(e) => {
                      const addressParts = e.target.value.split(', ');
                      setEditingBooking({
                        ...editingBooking, 
                        customer: {
                          ...editingBooking.customer,
                          address: {
                            ...editingBooking.customer.address,
                            street: addressParts[0] || '',
                            city: addressParts[1] || '',
                            state: addressParts[2]?.split(' - ')[0] || '',
                            pincode: addressParts[2]?.split(' - ')[1] || ''
                          }
                        }
                      });
                    }}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduledDate">Scheduled Date</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={editingBooking.scheduling.scheduledDate ? editingBooking.scheduling.scheduledDate.split('T')[0] : ''}
                      onChange={(e) => setEditingBooking({...editingBooking, scheduling: {...editingBooking.scheduling, scheduledDate: e.target.value} as any})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="scheduledTime">Scheduled Time</Label>
                    <Input
                      id="scheduledTime"
                      value={editingBooking.scheduling.scheduledTime || ''}
                      onChange={(e) => setEditingBooking({...editingBooking, scheduling: {...editingBooking.scheduling, scheduledTime: e.target.value} as any})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editingBooking.notes}
                    onChange={(e) => setEditingBooking({...editingBooking, notes: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      setBookings(prev => prev.map(booking => 
                        booking._id === editingBooking._id ? editingBooking : booking
                      ));
                      setIsEditBookingOpen(false);
                    }} 
                    className="flex-1"
                  >
                    Update Booking
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditBookingOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Update Priority Modal */}
        <Dialog open={isUpdatePriorityOpen} onOpenChange={setIsUpdatePriorityOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Priority - {selectedBooking?._id}</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmitPriorityUpdate}
                    className="flex-1"
                  >
                    Update Priority
                  </Button>
                  <Button variant="outline" onClick={() => setIsUpdatePriorityOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Completed Task Details Modal */}
        <Dialog open={isCompletedTaskDetailsOpen} onOpenChange={setIsCompletedTaskDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">Completed Task Details</DialogTitle>
              <p className="text-sm text-gray-600">Task completion information and billing details</p>
            </DialogHeader>
            {completedTaskDetails && (
              <div className="space-y-6">
                {/* Task Information */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Task Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Booking ID:</span>
                        <span className="font-semibold text-gray-900">{completedTaskDetails.bookingReference}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Customer:</span>
                        <span className="font-semibold text-gray-900">{completedTaskDetails.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Service:</span>
                        <span className="font-semibold text-gray-900">{completedTaskDetails.serviceName}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Completed Date:</span>
                        <span className="font-semibold text-gray-900">{completedTaskDetails.completedDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Completed Time:</span>
                        <span className="font-semibold text-gray-900">{completedTaskDetails.completedTime}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resolution */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Resolution</h3>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-800">{completedTaskDetails.resolution}</p>
                  </div>
                </div>

                {/* Spare Parts */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-orange-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Spare Parts Used</h3>
                  </div>
                  <div className="space-y-3">
                    {completedTaskDetails.spareParts.map((part: any) => (
                      <div key={part.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                        <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                          <img 
                            src={part.image} 
                            alt={part.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{part.name}</h4>
                          <p className="text-sm text-gray-600">Price: ₹{part.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Billing Summary */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Billing Summary</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spare Parts Total:</span>
                      <span className="font-medium">₹{completedTaskDetails.spareParts.reduce((sum: number, part: any) => sum + part.price, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Travel Expense:</span>
                      <span className="font-medium">₹{completedTaskDetails.travelExpense}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Fee:</span>
                      <span className="font-medium">₹{completedTaskDetails.totalAmount - completedTaskDetails.spareParts.reduce((sum: number, part: any) => sum + part.price, 0) - completedTaskDetails.travelExpense}</span>
                    </div>
                    <hr className="border-gray-200" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount:</span>
                      <span className="text-green-600">₹{completedTaskDetails.totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Image Modal */}
        {isImageModalOpen && selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-opacity"
              >
                <XCircle className="w-6 h-6" />
              </button>
              <img
                src={selectedImage}
                alt="Spare Part"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminBookingManagement;
