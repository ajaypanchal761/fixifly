import React, { useState, useEffect } from 'react';
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
    method: 'card' | 'upi' | 'netbanking' | 'wallet';
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

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.bookingReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payment?.razorpayPaymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payment?.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesPaymentStatus = paymentStatusFilter === 'all' || payment.paymentStatus === paymentStatusFilter;
    const matchesPaymentMode = paymentModeFilter === 'all' || payment.paymentMode === paymentModeFilter;
    
    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesPaymentMode;
  });

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
  const getPaymentStatusBadge = (status: string, mode: string) => {
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
      switch (status) {
        case 'collected':
          return <Badge className="bg-green-100 text-green-800">Collected</Badge>;
        case 'not_collected':
          return <Badge className="bg-red-100 text-red-800">Not Collected</Badge>;
        default:
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
        payment.payment?.amount || 0,
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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
          </div>
          <p className="text-gray-600">Manage and track all Razorpay payments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payments.length}</div>
              <p className="text-xs text-muted-foreground">
                {payments.filter(p => p.payment?.status === 'completed').length} completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{payments.reduce((sum, payment) => {
                  const initialAmount = payment.pricing?.totalAmount || 0;
                  const sparePartsAmount = payment.completionData?.totalAmount || 0;
                  return sum + initialAmount + sparePartsAmount;
                }, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Completed + Spare Parts (Pay Now)
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Payments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payments.filter(p => p.paymentMode === 'online').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {payments.filter(p => p.paymentMode === 'online' && p.paymentStatus === 'payment_done').length} completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Payments</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payments.filter(p => p.paymentMode === 'cash').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {payments.filter(p => p.paymentMode === 'cash' && p.paymentStatus === 'collected').length} collected
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by booking ID, customer name, email, or payment ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
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
                <SelectTrigger className="w-full md:w-48">
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
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Payment Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Modes</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading payments...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No payment records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Initial Payment</TableHead>
                      <TableHead>Spare Parts Payment</TableHead>
                      <TableHead>Total Amount</TableHead>
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
                        <TableCell className="font-medium">
                          {payment.bookingReference || `FIX${payment.bookingId.substring(payment.bookingId.length - 8).toUpperCase()}`}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.customer?.name || 'N/A'}</p>
                            <p className="text-sm text-gray-600">{payment.customer?.email || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {payment.services?.map(s => s.serviceName).join(', ') || 'N/A'}
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">
                          <div>
                            <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mb-1 inline-block">Completed</div>
                            <div>₹{payment.pricing?.totalAmount || 0}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          <div>
                            {payment.completionData?.totalAmount > 0 ? (
                              <>
                                <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mb-1 inline-block">
                                  {(payment.paymentStatus === 'payment_done' || payment.paymentStatus === 'collected') ? 'Paid' : 'Pending'}
                                </div>
                                <div>₹{payment.completionData.totalAmount}</div>
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-purple-600">
                          ₹{(payment.pricing?.totalAmount || 0) + (payment.completionData?.totalAmount || 0)}
                        </TableCell>
                        <TableCell>
                          {getPaymentModeBadge(payment.paymentMode || '')}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(payment.paymentStatus || '', payment.paymentMode || '')}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.payment?.razorpayPaymentId || payment.payment?.transactionId || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {new Date(payment.payment?.paidAt || payment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(payment)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
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
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Complete Payment Details</DialogTitle>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-6">
                {/* Booking Information */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Booking ID</Label>
                    <p className="text-sm font-medium">
                      {selectedPayment.bookingReference || `FIX${selectedPayment.bookingId.substring(selectedPayment.bookingId.length - 8).toUpperCase()}`}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                    <div className="mt-1">
                      <Badge className="bg-orange-100 text-orange-800">{selectedPayment.priority || 'medium'}</Badge>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Payment ID</Label>
                    <p className="text-sm font-mono">{selectedPayment.payment?.razorpayPaymentId || selectedPayment.payment?.transactionId || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Order ID</Label>
                    <p className="text-sm font-mono">{selectedPayment.payment?.razorpayOrderId || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Payment Date</Label>
                    <p className="text-sm">
                      {new Date(selectedPayment.payment?.paidAt || selectedPayment.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Amount Breakdown */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Initial Payment 
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completed</span>
                    </Label>
                    <p className="text-sm font-medium text-blue-600">
                      ₹{selectedPayment.pricing?.totalAmount || 0}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Spare Parts Amount
                      {selectedPayment.completionData?.totalAmount > 0 && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          {(selectedPayment.paymentStatus === 'payment_done' || selectedPayment.paymentStatus === 'collected') ? 'Paid' : 'Pending'}
                        </span>
                      )}
                    </Label>
                    <p className="text-sm font-medium text-green-600">
                      ₹{selectedPayment.completionData?.totalAmount || 0}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
                    <p className="text-sm font-medium text-purple-600">
                      ₹{(selectedPayment.pricing?.totalAmount || 0) + (selectedPayment.completionData?.totalAmount || 0)}
                    </p>
                  </div>
                </div>

                {/* Payment Mode & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Payment Mode</Label>
                    <div className="mt-1">{getPaymentModeBadge(selectedPayment.paymentMode || '')}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Payment Status</Label>
                    <div className="mt-1">{getPaymentStatusBadge(selectedPayment.paymentStatus || '', selectedPayment.paymentMode || '')}</div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Customer Information</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm"><strong>Name:</strong> {selectedPayment.customer?.name || 'N/A'}</p>
                    <p className="text-sm"><strong>Email:</strong> {selectedPayment.customer?.email || 'N/A'}</p>
                    <p className="text-sm"><strong>Phone:</strong> {selectedPayment.customer?.phone || 'N/A'}</p>
                  </div>
                </div>

                {/* Service Information */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Service Information</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm"><strong>Services:</strong> {selectedPayment.services?.map(s => s.serviceName).join(', ') || 'N/A'}</p>
                  </div>
                </div>

                {/* Spare Parts Information */}
                {selectedPayment.completionData?.spareParts && selectedPayment.completionData.spareParts.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Spare Parts Used</Label>
                    <div className="mt-2 space-y-2">
                      {selectedPayment.completionData.spareParts.map((part, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                            {part.photo ? (
                              <img 
                                src={part.photo} 
                                alt={part.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-4 h-4 bg-gray-400 rounded"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{part.name}</p>
                            <p className="text-xs text-gray-600">₹{part.amount}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution Note */}
                {selectedPayment.completionData?.resolutionNote && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Resolution Note</Label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">{selectedPayment.completionData.resolutionNote}</p>
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