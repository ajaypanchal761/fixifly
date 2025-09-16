import React, { useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import { 
  DollarSign, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  CreditCard,
  Banknote,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Receipt
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const AdminPaymentManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Sample payment data - in real app this would come from API
  const payments = [
    {
      id: 'PAY001',
      transactionId: 'TXN_2024_001',
      customerName: 'John Doe',
      customerEmail: 'john.doe@email.com',
      amount: 1200,
      currency: 'INR',
      paymentMethod: 'Credit Card',
      status: 'completed',
      bookingId: 'B001',
      serviceName: 'AC Repair & Maintenance',
      vendorName: 'ABC Electronics',
      paymentDate: '2024-02-15',
      processedDate: '2024-02-15',
      gateway: 'Razorpay',
      fees: 36,
      netAmount: 1164,
      refundAmount: 0,
      notes: 'Payment processed successfully'
    },
    {
      id: 'PAY002',
      transactionId: 'TXN_2024_002',
      customerName: 'Sarah Wilson',
      customerEmail: 'sarah.wilson@email.com',
      amount: 2500,
      currency: 'INR',
      paymentMethod: 'UPI',
      status: 'pending',
      bookingId: 'B002',
      serviceName: 'Laptop Repair',
      vendorName: 'TechFix Solutions',
      paymentDate: '2024-02-14',
      processedDate: null,
      gateway: 'Razorpay',
      fees: 75,
      netAmount: 2425,
      refundAmount: 0,
      notes: 'Payment verification pending'
    },
    {
      id: 'PAY003',
      transactionId: 'TXN_2024_003',
      customerName: 'Mike Johnson',
      customerEmail: 'mike.johnson@email.com',
      amount: 800,
      currency: 'INR',
      paymentMethod: 'Net Banking',
      status: 'completed',
      bookingId: 'B003',
      serviceName: 'Mobile Phone Repair',
      vendorName: 'Quick Fix Hub',
      paymentDate: '2024-02-13',
      processedDate: '2024-02-13',
      gateway: 'Razorpay',
      fees: 24,
      netAmount: 776,
      refundAmount: 0,
      notes: 'Payment completed'
    },
    {
      id: 'PAY004',
      transactionId: 'TXN_2024_004',
      customerName: 'Emily Davis',
      customerEmail: 'emily.davis@email.com',
      amount: 600,
      currency: 'INR',
      paymentMethod: 'Wallet',
      status: 'refunded',
      bookingId: 'B004',
      serviceName: 'Washing Machine Repair',
      vendorName: 'Home Services Pro',
      paymentDate: '2024-02-12',
      processedDate: '2024-02-12',
      gateway: 'Razorpay',
      fees: 18,
      netAmount: 582,
      refundAmount: 600,
      notes: 'Full refund processed due to cancellation'
    },
    {
      id: 'PAY005',
      transactionId: 'TXN_2024_005',
      customerName: 'David Brown',
      customerEmail: 'david.brown@email.com',
      amount: 900,
      currency: 'INR',
      paymentMethod: 'Debit Card',
      status: 'failed',
      bookingId: 'B005',
      serviceName: 'Plumbing Services',
      vendorName: 'Appliance Masters',
      paymentDate: '2024-02-11',
      processedDate: null,
      gateway: 'Razorpay',
      fees: 0,
      netAmount: 0,
      refundAmount: 0,
      notes: 'Payment failed - insufficient funds'
    }
  ];

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.paymentMethod === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Completed
        </Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Failed
        </Badge>;
      case 'refunded':
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
          <Receipt className="w-3 h-3" />
          Refunded
        </Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Credit Card':
      case 'Debit Card':
        return <CreditCard className="w-4 h-4" />;
      case 'UPI':
      case 'Net Banking':
      case 'Wallet':
        return <Banknote className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.netAmount, 0);

  const totalFees = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.fees, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const refundedAmount = payments
    .filter(p => p.status === 'refunded')
    .reduce((sum, p) => sum + p.refundAmount, 0);

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="ml-72 pt-32 p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Payment <span className="text-gradient">Management</span>
              </h1>
              <p className="text-muted-foreground">Manage and monitor all payment transactions</p>
            </div>
            <div className="flex items-center gap-4">
              <Button className="bg-primary hover:bg-primary/90">
                <DollarSign className="w-4 h-4 mr-2" />
                Process Refund
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">₹{totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Net amount received</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gateway Fees</p>
                  <p className="text-2xl font-bold text-foreground">₹{totalFees.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Processing charges</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Amount</p>
                  <p className="text-2xl font-bold text-foreground">₹{pendingAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Refunded Amount</p>
                  <p className="text-2xl font-bold text-foreground">₹{refundedAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total refunds processed</p>
                </div>
                <Receipt className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search payments by customer, transaction ID, or booking ID..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Debit Card">Debit Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Net Banking">Net Banking</SelectItem>
                  <SelectItem value="Wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Transactions ({filteredPayments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Fees</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{payment.transactionId}</p>
                        <p className="text-sm text-muted-foreground">ID: {payment.id}</p>
                        <p className="text-xs text-muted-foreground">Booking: {payment.bookingId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{payment.customerName}</p>
                        <p className="text-sm text-muted-foreground">{payment.customerEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{payment.serviceName}</p>
                        <p className="text-sm text-muted-foreground">{payment.vendorName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-right">
                        <p className="font-medium text-foreground">₹{payment.amount.toLocaleString()}</p>
                        {payment.refundAmount > 0 && (
                          <p className="text-sm text-red-600">-₹{payment.refundAmount.toLocaleString()}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Net: ₹{payment.netAmount.toLocaleString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(payment.paymentMethod)}
                        <span className="text-sm">{payment.paymentMethod}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span>{new Date(payment.paymentDate).toLocaleDateString()}</span>
                        </div>
                        {payment.processedDate && (
                          <div className="text-xs text-muted-foreground">
                            Processed: {new Date(payment.processedDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-right">
                        <p className="text-sm font-medium">₹{payment.fees}</p>
                        <p className="text-xs text-muted-foreground">{payment.gateway}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Receipt className="w-4 h-4 mr-2" />
                            Download Receipt
                          </DropdownMenuItem>
                          {payment.status === 'completed' && (
                            <DropdownMenuItem>
                              <Receipt className="w-4 h-4 mr-2" />
                              Process Refund
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <User className="w-4 h-4 mr-2" />
                            Contact Customer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminPaymentManagement;
