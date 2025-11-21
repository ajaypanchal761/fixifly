import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  DollarSign,
  CreditCard,
  Banknote,
  Calendar,
  User,
  MapPin,
  Phone,
  Wrench,
  Package,
  Image as ImageIcon,
  MoreVertical
} from 'lucide-react';
import AdminHeader from '../components/AdminHeader';
import adminBookingApi from '@/services/adminBookingApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface ServiceManagementBooking {
  _id: string;
  bookingReference: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: any;
  };
  services: Array<{
    serviceName: string;
  }>;
  pricing: {
    subtotal: number;
    serviceFee: number;
    totalAmount: number;
  };
  scheduling: {
    scheduledDate: string;
    scheduledTime: string;
  };
  priority: string;
  status: string;
  payment: {
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    method: string;
    transactionId?: string;
    paidAt?: string;
  };
  vendor: {
    vendorId: {
      firstName: string;
      lastName: string;
      phone: string;
    };
    assignedAt: string;
    response: string;
  };
  vendorResponse?: {
    status: string;
    respondedAt: string;
    responseNote?: string;
  };
  completionData?: {
    spareParts: Array<{
      name: string;
      amount: string;
      photo: string;
      warranty: string;
    }>;
    resolutionNote: string;
    totalAmount: number;
    billingAmount?: string;
  };
  billingAmount?: string;
  paymentMode?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  createdAt: string;
  updatedAt: string;
}

const AdminServiceManagementDashboard = () => {
  const [bookings, setBookings] = useState<ServiceManagementBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [vendorStatusFilter, setVendorStatusFilter] = useState('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<ServiceManagementBooking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await adminBookingApi.getAllBookings();
      
      if (response.success && response.data?.bookings) {
        const transformedBookings = response.data.bookings.map((booking: any) => {
          // Payment amount is only the service charges (billing amount) paid through "Pay Now"
          const serviceCharges = parseFloat(booking.completionData?.billingAmount || booking.billingAmount || '0') || 0;
          
          console.log('Payment calculation for booking:', booking._id, {
            serviceCharges,
            billingAmount: booking.completionData?.billingAmount || booking.billingAmount,
            pricing: booking.pricing
          });
          
          return {
            ...booking,
            bookingReference: booking.bookingReference || `FIX${booking._id.toString().substring(booking._id.toString().length - 8).toUpperCase()}`,
            paymentMode: (booking as any).paymentMode || (booking.payment?.razorpayPaymentId ? 'card' : booking.payment?.method) || 'card',
            paymentStatus: booking.status === 'completed' ? 'completed' : (booking.payment?.status || 'pending'),
            paymentAmount: serviceCharges
          };
        });
        console.log('Transformed bookings:', transformedBookings);
        setBookings(transformedBookings);
      } else {
        setError('Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Listen for booking updates
  useEffect(() => {
    const handleBookingUpdate = () => {
      fetchBookings();
    };

    window.addEventListener('bookingUpdated', handleBookingUpdate);
    return () => {
      window.removeEventListener('bookingUpdated', handleBookingUpdate);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Wrench },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      rescheduled: { color: 'bg-purple-100 text-purple-800', icon: Calendar }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-green-100 text-green-800' },
      medium: { color: 'bg-yellow-100 text-yellow-800' },
      high: { color: 'bg-red-100 text-red-800' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const getVendorStatusBadge = (booking: any) => {
    // Check vendorResponse.status first, then fallback to vendor.response
    const vendorResponse = booking.vendorResponse?.status || booking.vendor?.response || '';
    
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

  const getPaymentModeBadge = (paymentMode: string) => {
    if (!paymentMode) {
      return <span className="text-gray-400">-</span>;
    }

    const modeConfig = {
      online: { color: 'bg-blue-100 text-blue-800', icon: CreditCard },
      card: { color: 'bg-blue-100 text-blue-800', icon: CreditCard },
      cash: { color: 'bg-green-100 text-green-800', icon: Banknote }
    };

    const config = modeConfig[paymentMode as keyof typeof modeConfig] || modeConfig.online;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
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

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      (booking.bookingReference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.customer?.phone || '').includes(searchTerm) ||
      (booking.services?.[0]?.serviceName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || booking.priority === priorityFilter;
    const vendorResponse = booking.vendorResponse?.status || booking.vendor?.response || '';
    const matchesVendorStatus = vendorStatusFilter === 'all' || 
      (vendorStatusFilter === 'pending' && (!vendorResponse || vendorResponse === 'pending')) ||
      (vendorStatusFilter !== 'pending' && vendorResponse === vendorStatusFilter);
    const matchesPaymentMode = paymentModeFilter === 'all' || booking.paymentMode === paymentModeFilter;
    const matchesPaymentStatus = paymentStatusFilter === 'all' || booking.paymentStatus === paymentStatusFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesVendorStatus && matchesPaymentMode && matchesPaymentStatus;
  });

  const handleViewDetails = (booking: ServiceManagementBooking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <AdminHeader />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <AdminHeader />
        <main className="flex-1 p-6">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchBookings}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pt-24 pl-72">
      <AdminHeader />
      <main className="flex-1 p-3">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-lg font-bold text-gray-900 mb-1">Service Management Dashboard</h1>
            <p className="text-xs text-gray-600">Manage and track all service bookings and vendor assignments</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              {/* Vendor Status Filter */}
              <select
                value={vendorStatusFilter}
                onChange={(e) => setVendorStatusFilter(e.target.value)}
                className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Vendor Status</option>
                 <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
              </select>

              {/* Payment Mode Filter */}
              <select
                value={paymentModeFilter}
                onChange={(e) => setPaymentModeFilter(e.target.value)}
                className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Payment Modes</option>
                <option value="online">Online</option>
                <option value="cash">Cash</option>
              </select>

              {/* Payment Status Filter */}
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Payment Status</option>
                <option value="pending">Pending</option>
                <option value="payment_done">Payment Done</option>
                <option value="collected">Collected</option>
                <option value="not_collected">Not Collected</option>
              </select>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking & Scheduled Date
                    </th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900">
                        {booking.bookingReference || `FIX${booking._id.toString().substring(booking._id.toString().length - 8).toUpperCase()}`}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        <div>
                          <div className="text-xs font-medium text-gray-900">{booking.customer?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{booking.customer?.phone || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                        {booking.services[0]?.serviceName || 'N/A'}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                        <div>
                          <div className="mb-1">
                            <div className="text-xs font-medium text-gray-500">Booking Date:</div>
                            <div>{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500">Scheduled Date:</div>
                            <div>{booking.scheduling?.scheduledDate ? new Date(booking.scheduling.scheduledDate).toLocaleDateString() : 'N/A'}</div>
                            <div className="text-gray-500">{booking.scheduling?.scheduledTime || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        {getPriorityBadge(booking.priority)}
                      </td>
                       <td className="px-2 py-1 whitespace-nowrap">
                         {getVendorStatusBadge(booking)}
                       </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        <div className="space-y-0.5">
                          {getPaymentModeBadge(booking.paymentMode || '')}
                          {getPaymentStatusBadge(booking.paymentStatus || '', booking.paymentMode || '')}
                        </div>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                        {booking.paymentAmount && booking.paymentAmount > 0 
                          ? `₹${booking.paymentAmount}` 
                          : booking.pricing?.totalAmount 
                            ? `₹${booking.pricing.totalAmount}` 
                            : '-'}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs font-medium">
                        <div className="flex flex-col space-y-0.5">
                          <button
                            onClick={() => handleViewDetails(booking)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </button>
                          {booking.completionData?.spareParts && booking.completionData.spareParts.length > 0 && (
                            <button
                              onClick={() => handleViewDetails(booking)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <Package className="w-3 h-3 mr-1" />
                              Parts
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-4">
              <Package className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <h3 className="text-xs font-medium text-gray-900 mb-1">No bookings found</h3>
              <p className="text-xs text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </main>

      {/* View Details Modal */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center pt-2 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-4">
            <div className="p-1">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-base font-bold text-gray-900">Booking Details</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {/* Customer Information */}
                <div className="space-y-0.5">
                  <h3 className="text-xs font-semibold text-gray-900">Customer Information</h3>
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <User className="w-3 h-3 text-gray-500 mr-1" />
                      <span className="text-xs text-gray-600">Name:</span>
                      <span className="text-xs font-medium text-gray-900 ml-1">{selectedBooking.customer.name}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-3 h-3 text-gray-500 mr-1" />
                      <span className="text-xs text-gray-600">Phone:</span>
                      <span className="text-xs font-medium text-gray-900 ml-1">{selectedBooking.customer.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600">Email:</span>
                      <span className="text-xs font-medium text-gray-900 ml-1">{selectedBooking.customer.email}</span>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-3 h-3 text-gray-500 mr-1 mt-0.5" />
                      <div>
                        <span className="text-xs text-gray-600">Address:</span>
                        <p className="text-xs font-medium text-gray-900 ml-1">
                          {typeof selectedBooking.customer.address === 'object' 
                            ? `${selectedBooking.customer.address.street || ''}, ${selectedBooking.customer.address.city || ''}, ${selectedBooking.customer.address.state || ''} - ${selectedBooking.customer.address.pincode || ''}`
                            : selectedBooking.customer.address || 'Not provided'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Information */}
                <div className="space-y-0.5">
                  <h3 className="text-xs font-semibold text-gray-900">Service Information</h3>
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <Wrench className="w-3 h-3 text-gray-500 mr-1" />
                      <span className="text-xs text-gray-600">Service:</span>
                      <span className="text-xs font-medium text-gray-900 ml-1">{selectedBooking.services[0]?.serviceName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 text-gray-500 mr-1" />
                      <span className="text-xs text-gray-600">Scheduled:</span>
                      <span className="text-xs font-medium text-gray-900 ml-1">
                        {new Date(selectedBooking.scheduling.scheduledDate).toLocaleDateString()} at {selectedBooking.scheduling.scheduledTime}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600">Priority:</span>
                      <span className="ml-1">{getPriorityBadge(selectedBooking.priority)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600">Status:</span>
                      <span className="ml-1">{getStatusBadge(selectedBooking.status)}</span>
                    </div>
                  </div>
                </div>

                {/* Vendor Information */}
                <div className="space-y-0.5">
                  <h3 className="text-xs font-semibold text-gray-900">Vendor Information</h3>
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <User className="w-3 h-3 text-gray-500 mr-1" />
                      <span className="text-xs text-gray-600">Assigned Engineer:</span>
                      <span className="text-xs font-medium text-gray-900 ml-1">
                        {selectedBooking.vendor?.vendorId ? 
                          `${selectedBooking.vendor.vendorId.firstName} ${selectedBooking.vendor.vendorId.lastName}` : 
                          'Not assigned'
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-3 h-3 text-gray-500 mr-1" />
                      <span className="text-xs text-gray-600">Phone:</span>
                      <span className="text-xs font-medium text-gray-900 ml-1">
                        {selectedBooking.vendor?.vendorId?.phone || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600">Assigned Date:</span>
                      <span className="text-xs font-medium text-gray-900 ml-1">
                        {selectedBooking.vendor?.assignedAt ? 
                          new Date(selectedBooking.vendor.assignedAt).toLocaleDateString() : 
                          'Not assigned'
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600">Response:</span>
                      <span className="ml-1">{getVendorStatusBadge(selectedBooking)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="space-y-0.5">
                  <h3 className="text-xs font-semibold text-gray-900">Payment Information</h3>
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600">Payment Mode:</span>
                      <span className="ml-1">{getPaymentModeBadge(selectedBooking.paymentMode || '')}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600">Payment Status:</span>
                      <span className="ml-1">{getPaymentStatusBadge(selectedBooking.paymentStatus || '', selectedBooking.paymentMode || '')}</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-3 h-3 text-gray-500 mr-1" />
                      <span className="text-xs text-gray-600">Payment Amount:</span>
                      <span className="text-xs font-medium text-gray-900 ml-1">
                        {selectedBooking.paymentAmount && selectedBooking.paymentAmount > 0 
                          ? `₹${selectedBooking.paymentAmount}` 
                          : selectedBooking.pricing?.totalAmount 
                            ? `₹${selectedBooking.pricing.totalAmount}` 
                            : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spare Parts */}
              {selectedBooking.completionData?.spareParts && selectedBooking.completionData.spareParts.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Spare Parts Used</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedBooking.completionData.spareParts.map((part, index) => {
                      console.log('Spare part in admin service management:', part);
                      return (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-medium text-gray-900">{part.name}</h4>
                          <span className="text-xs font-medium text-green-600">{part.amount}</span>
                        </div>
                        {part.warranty && (
                          <div className="flex items-center space-x-1 mt-1">
                            <span className="text-xs text-gray-500">Warranty:</span>
                            <span className="text-xs font-medium text-blue-600">{part.warranty}</span>
                          </div>
                        )}
                        {part.photo && (
                          <div className="mt-1">
                            <img
                              src={part.photo}
                              alt={part.name}
                              className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleImageClick(part.photo)}
                            />
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-600">Total Spare Parts Amount:</span>
                      <span className="text-sm font-bold text-green-600">
                        ₹{selectedBooking.completionData.spareParts.reduce((sum, part) => 
                          sum + parseInt(part.amount.replace(/[₹,]/g, '')), 0
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Resolution Note */}
              {selectedBooking.completionData?.resolutionNote && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Resolution Note</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-700">{selectedBooking.completionData.resolutionNote}</p>
                  </div>
                </div>
              )}

              {/* Cancellation Reason */}
              {selectedBooking.status === 'cancelled' && (selectedBooking as any).cancellationData?.cancellationReason && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Cancellation Details</h3>
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <p className="text-xs text-red-800 font-medium mb-1">Cancellation Reason:</p>
                    <p className="text-xs text-red-700 mb-1">{(selectedBooking as any).cancellationData.cancellationReason}</p>
                    <p className="text-xs text-red-600">
                      Cancelled by: {(selectedBooking as any).cancellationData.cancelledBy} on{' '}
                      {(selectedBooking as any).cancellationData.cancelledAt 
                        ? new Date((selectedBooking as any).cancellationData.cancelledAt).toLocaleDateString()
                        : 'Unknown date'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {isImageModalOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <img
              src={selectedImage}
              alt="Spare part"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServiceManagementDashboard;