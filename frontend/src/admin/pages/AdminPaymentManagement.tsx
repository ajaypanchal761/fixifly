import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Eye, Download, CreditCard, Calendar, User, DollarSign } from 'lucide-react';
import AdminHeader from '../components/AdminHeader';
import adminBookingApi from '@/services/adminBookingApi';

interface PaymentRecord {
  _id: string;
  bookingId: string;
  bookingReference?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  services: Array<{
    serviceId: string;
    serviceName: string;
    price: number;
  }>;
  pricing: {
    subtotal: number;
    serviceFee: number;
    totalAmount: number;
  };
  payment: {
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    method: 'card' | 'upi' | 'netbanking' | 'wallet' | 'cash';
    transactionId: string;
    paidAt: Date;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    gatewayResponse: any;
    refundId?: string;
    refundAmount?: number;
    refundReason?: string;
    refundedAt?: Date;
  };
  completionData?: {
    totalAmount: number;
    billingAmount?: string;
    spareParts: Array<{
      id: number;
      name: string;
      amount: string;
      photo?: string;
    }>;
    resolutionNote: string;
    travelingAmount: string;
    paymentMethod: 'online' | 'cash';
    completedAt: Date;
  };
  billingAmount?: string;
  vendor?: {
    vendorId: string;
    assignedAt: Date;
    vendorResponse?: {
      status: 'pending' | 'accepted' | 'declined';
      respondedAt?: Date;
      responseNote?: string;
    };
  };
  status: 'pending' | 'waiting_for_engineer' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  paymentMode?: 'online' | 'cash';
  paymentStatus?: 'pending' | 'payment_done' | 'collected' | 'not_collected';
  scheduling: {
    preferredDate: Date;
    preferredTimeSlot: 'morning' | 'afternoon' | 'evening';
    scheduledDate?: Date;
    scheduledTime?: string;
  };
  notes?: string;
  assignmentNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminPaymentManagement = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const { toast } = useToast();

  // Fetch payment records
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await adminBookingApi.getAllBookings({
        page: 1,
        limit: 1000
      });

      if (response.success && response.data?.bookings) {
        // Filter only bookings with payment data (both initial payments and spare parts payments)
        const paymentRecords = response.data.bookings
          .filter((booking: any) => 
            booking.payment?.razorpayPaymentId || 
            booking.payment?.transactionId ||
            booking.completionData?.totalAmount
          )
          .map((booking: any) => ({
            _id: booking._id,
            bookingId: booking._id,
            bookingReference: booking.bookingReference,
            customer: booking.customer,
            services: booking.services,
            pricing: booking.pricing,
            payment: booking.payment,
            completionData: booking.completionData,
            billingAmount: booking.billingAmount,
            vendor: booking.vendor,
            status: booking.status,
            priority: booking.priority,
            paymentMode: booking.paymentMode,
            paymentStatus: booking.paymentStatus,
            scheduling: booking.scheduling,
            notes: booking.notes,
            assignmentNotes: booking.assignmentNotes,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt
          }));
        
        setPayments(paymentRecords);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine payment mode from payment data
  const getPaymentMode = (payment: PaymentRecord): string => {
    // Get the exact payment ID that's displayed in the table
    // This matches: payment.payment?.razorpayPaymentId || payment.payment?.transactionId
    const displayedPaymentId = payment.payment?.razorpayPaymentId || payment.payment?.transactionId || '';
    
    // Priority 1: Check if the displayed Payment ID starts with "CASH_" - this is the most reliable indicator
    // This is the exact same value shown in the Payment ID column
    if (displayedPaymentId && displayedPaymentId.toString().startsWith('CASH_')) {
      return 'cash';
    }
    
    // Priority 2: Check payment method
    if (payment.payment?.method === 'cash') {
      return 'cash';
    }
    
    // Priority 3: Check completion data payment method
    if (payment.completionData?.paymentMethod === 'cash') {
      return 'cash';
    }
    
    // Priority 4: Check if paymentMode is explicitly set (but ignore if it contradicts CASH_ evidence)
    // If we have CASH_ in the displayed payment ID, always return cash regardless of paymentMode
    if (displayedPaymentId && displayedPaymentId.toString().startsWith('CASH_')) {
      return 'cash';
    }
    
    if (payment.paymentMode) {
      return payment.paymentMode;
    }
    
    // Priority 5: Default to online if razorpayPaymentId exists (and doesn't start with CASH_)
    const razorpayPaymentId = payment.payment?.razorpayPaymentId || '';
    if (razorpayPaymentId && razorpayPaymentId.toString().trim() !== '' && !razorpayPaymentId.toString().startsWith('CASH_')) {
      return 'online';
    }
    
    return '';
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch = 
        payment.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.bookingReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.payment?.razorpayPaymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.payment?.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      const matchesPaymentStatus = paymentStatusFilter === 'all' || payment.paymentStatus === paymentStatusFilter;
      const matchesPaymentMode = paymentModeFilter === 'all' || getPaymentMode(payment) === paymentModeFilter;
      
      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesPaymentMode;
    });
  }, [payments, searchTerm, statusFilter, paymentStatusFilter, paymentModeFilter]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'waiting_for_engineer':
        return <Badge className="bg-yellow-100 text-yellow-800">Waiting for Engineer</Badge>;
      case 'confirmed':
        return <Badge className="bg-purple-100 text-purple-800">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status: string, mode: string, bookingStatus?: string, paymentStatus?: string) => {
    if (mode === 'online') {
      switch (status) {
        case 'payment_done':
          return <Badge className="bg-green-100 text-green-800">Payment Done</Badge>;
        case 'pending':
          return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
        default:
          return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      }
    } else if (mode === 'cash') {
      // For cash payments, check multiple indicators
      // Priority 1: If booking is completed, payment should be collected
      if (bookingStatus === 'completed') {
        return <Badge className="bg-green-100 text-green-800">Collected</Badge>;
      }
      
      // Priority 2: Check if payment.status is completed (set when task is completed with cash)
      if (paymentStatus === 'completed') {
        return <Badge className="bg-green-100 text-green-800">Collected</Badge>;
      }
      
      // Priority 3: Check explicit payment status field
      switch (status) {
        case 'collected':
          return <Badge className="bg-green-100 text-green-800">Collected</Badge>;
        case 'not_collected':
          return <Badge className="bg-red-100 text-red-800">Not Collected</Badge>;
        default:
          // Default to not collected if no indicators found
          return <Badge className="bg-red-100 text-red-800">Not Collected</Badge>;
      }
    } else {
      return <span className="text-gray-400 text-sm">-</span>;
    }
  };

  // Get payment mode badge
  const getPaymentModeBadge = (mode: string) => {
    switch (mode) {
      case 'online':
        return <Badge className="bg-blue-100 text-blue-800">Online</Badge>;
      case 'cash':
        return <Badge className="bg-green-100 text-green-800">Cash</Badge>;
      default:
        return <span className="text-gray-400 text-sm">-</span>;
    }
  };

  // Handle view details
  const handleViewDetails = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setIsViewDetailsOpen(true);
  };

  // Export payments to CSV
  const exportToCSV = () => {
    const csvContent = [
      ['Booking ID', 'Customer Name', 'Email', 'Phone', 'Service', 'Amount', 'Payment ID', 'Date'],
      ...filteredPayments.map(payment => [
        payment.bookingReference || payment.bookingId,
        payment.customer?.name || 'N/A',
        payment.customer?.email || 'N/A',
        payment.customer?.phone || 'N/A',
        payment.services?.map(s => s.serviceName).join(', ') || 'N/A',
        (payment.pricing?.totalAmount || 0) + (parseFloat(payment.completionData?.billingAmount || payment.billingAmount || '0') || 0),
        payment.payment?.razorpayPaymentId || 'N/A',
        new Date(payment.payment?.paidAt || payment.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <main className="ml-72 pt-32 p-6">
        {/* Page Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Payment Management</h1>
          </div>
          <p className="text-sm text-gray-600">Manage and track all Razorpay payments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">Total Payments</CardTitle>
              <CreditCard className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-lg font-bold">{payments.length}</div>
              <p className="text-xs text-muted-foreground">
                {payments.filter(p => p.payment?.status === 'completed').length} completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-lg font-bold">
                ₹{payments.reduce((sum, payment) => {
                  const initialAmount = payment.pricing?.totalAmount || 0;
                  const serviceCharges = parseFloat(payment.completionData?.billingAmount || payment.billingAmount || '0') || 0;
                  return sum + initialAmount + serviceCharges;
                }, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Initial + Service Charges (Pay Now)
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">Online Payments</CardTitle>
              <Calendar className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-lg font-bold">
                {payments.filter(p => getPaymentMode(p) === 'online').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {payments.filter(p => getPaymentMode(p) === 'online' && p.paymentStatus === 'payment_done').length} completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">Cash Payments</CardTitle>
              <User className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-lg font-bold">
                {payments.filter(p => getPaymentMode(p) === 'cash').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {payments.filter(p => getPaymentMode(p) === 'cash' && p.paymentStatus === 'collected').length} collected
              </p>
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
                    placeholder="Search by booking ID, customer name, email, or payment ID..."
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
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting_for_engineer">Waiting for Engineer</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Status</SelectItem>
                  <SelectItem value="payment_done">Payment Done</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="collected">Collected</SelectItem>
                  <SelectItem value="not_collected">Not Collected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={paymentModeFilter} onValueChange={setPaymentModeFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Payment Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Modes</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportToCSV} variant="outline" size="sm" className="flex items-center gap-2 text-xs">
                <Download className="w-3 h-3" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Payment Records</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading payments...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-6">
                <CreditCard className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">No payment records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Service Charges Payment</TableHead>
                      <TableHead>Spare Parts Payment</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell className="text-sm font-medium">
                          {payment.bookingReference || `FIX${payment.bookingId.substring(payment.bookingId.length - 8).toUpperCase()}`}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{payment.customer?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-600">{payment.customer?.email || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {payment.services?.map(s => s.serviceName).join(', ') || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-green-600">
                          <div>
                            {(() => {
                              const serviceCharges = parseFloat(payment.completionData?.billingAmount || payment.billingAmount || '0') || 0;
                              return serviceCharges > 0 ? (
                              <>
                                <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mb-1 inline-block">
                                  {(payment.paymentStatus === 'payment_done' || payment.paymentStatus === 'collected') ? 'Paid' : 'Pending'}
                                  </div>
                                  <div>₹{serviceCharges}</div>
                                </>
                              ) : (
                                <span className="text-gray-400">-</span>
                              );
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-orange-600">
                          <div>
                            {payment.completionData?.spareParts && payment.completionData.spareParts.length > 0 ? (
                              <>
                                <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded mb-1 inline-block">
                                  Spare Parts Amount
                                </div>
                                <div>₹{payment.completionData.spareParts.reduce((sum: number, part: any) => 
                                  sum + parseInt(part.amount.replace(/[₹,]/g, '')), 0
                                )}</div>
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPaymentModeBadge(getPaymentMode(payment))}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(
                            payment.paymentStatus || '', 
                            getPaymentMode(payment),
                            payment.status,
                            payment.payment?.status
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {payment.payment?.razorpayPaymentId || payment.payment?.transactionId || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(payment.payment?.paidAt || payment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(payment)}
                            className="text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Details Modal */}
        <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-base">Payment Details</DialogTitle>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-2">
                {/* Booking & Payment Info */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <Label className="text-xs text-gray-500">Booking ID</Label>
                    <p className="font-medium">{selectedPayment.bookingReference || `FIX${selectedPayment.bookingId.substring(selectedPayment.bookingId.length - 8).toUpperCase()}`}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Payment ID</Label>
                    <p className="font-mono text-xs">{selectedPayment.payment?.razorpayPaymentId || selectedPayment.payment?.transactionId || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <div className="mt-0.5">{getStatusBadge(selectedPayment.status)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Payment Mode</Label>
                    <div className="mt-0.5">{getPaymentModeBadge(getPaymentMode(selectedPayment))}</div>
                  </div>
                </div>

                {/* Amount Summary */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <Label className="text-xs text-gray-500">Service Charges</Label>
                    <p className="font-medium text-green-600">₹{parseFloat(selectedPayment.completionData?.billingAmount || selectedPayment.billingAmount || '0') || 0}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Spare Parts</Label>
                    <p className="font-medium text-orange-600">
                      ₹{selectedPayment.completionData?.spareParts ? 
                        selectedPayment.completionData.spareParts.reduce((sum: number, part: any) => 
                          sum + parseInt(part.amount.replace(/[₹,]/g, '')), 0
                        ) : 0}
                    </p>
                  </div>
                </div>

                {/* Customer & Service Info */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <Label className="text-xs text-gray-500">Customer</Label>
                    <div className="mt-0.5 p-1.5 bg-gray-50 rounded text-xs">
                      <p><strong>{selectedPayment.customer?.name || 'N/A'}</strong></p>
                      <p className="text-gray-600">{selectedPayment.customer?.email || 'N/A'}</p>
                      <p className="text-gray-600">{selectedPayment.customer?.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Services</Label>
                    <div className="mt-0.5 p-1.5 bg-gray-50 rounded text-xs">
                      <p>{selectedPayment.services?.map(s => s.serviceName).join(', ') || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Spare Parts */}
                {selectedPayment.completionData?.spareParts && selectedPayment.completionData.spareParts.length > 0 && (
                  <div>
                    <Label className="text-xs text-gray-500">Spare Parts Used</Label>
                    <div className="mt-0.5 space-y-1">
                      {selectedPayment.completionData.spareParts.map((part, index) => (
                        <div key={index} className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded text-xs">
                          <div className="w-8 h-5 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                            {part.photo ? (
                              <img 
                                src={part.photo} 
                                alt={part.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-2 h-2 bg-gray-400 rounded"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{part.name}</p>
                            <p className="text-gray-600">₹{part.amount}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution Note */}
                {selectedPayment.completionData?.resolutionNote && (
                  <div>
                    <Label className="text-xs text-gray-500">Resolution Note</Label>
                    <div className="mt-0.5 p-1.5 bg-gray-50 rounded text-xs">
                      <p>{selectedPayment.completionData.resolutionNote}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminPaymentManagement;