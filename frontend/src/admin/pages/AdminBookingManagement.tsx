import React, { useState } from 'react';
import AdminHeader from '../components/AdminHeader';
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
  Users
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [isAssignEngineerOpen, setIsAssignEngineerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [assignedEngineer, setAssignedEngineer] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isEditBookingOpen, setIsEditBookingOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  
  // Sample booking data - in real app this would come from API
  const [bookings, setBookings] = useState([
    {
      id: 'B001',
      customerName: 'John Doe',
      customerPhone: '+91 98765 43210',
      customerEmail: 'john.doe@email.com',
      serviceName: 'AC Repair & Maintenance',
      vendorName: 'ABC Electronics',
      vendorPhone: '+91 98765 43211',
      bookingDate: '2024-02-15',
      scheduledDate: '2024-02-16',
      scheduledTime: '10:00 AM',
      status: 'confirmed',
      priority: 'normal',
      address: '123 Main Street, Mumbai, Maharashtra',
      totalAmount: 1200,
      paymentStatus: 'paid',
      rating: 4.8,
      notes: 'AC not cooling properly, needs urgent repair',
      assignedEngineer: 'E001',
      assignmentStatus: 'assigned'
    },
    {
      id: 'B002',
      customerName: 'Sarah Wilson',
      customerPhone: '+91 98765 43212',
      customerEmail: 'sarah.wilson@email.com',
      serviceName: 'Laptop Repair',
      vendorName: 'TechFix Solutions',
      vendorPhone: '+91 98765 43213',
      bookingDate: '2024-02-14',
      scheduledDate: '2024-02-17',
      scheduledTime: '2:00 PM',
      status: 'pending',
      priority: 'high',
      address: '456 Park Avenue, Delhi, NCR',
      totalAmount: 2500,
      paymentStatus: 'pending',
      rating: null,
      notes: 'Laptop screen cracked, needs replacement',
      assignedEngineer: null,
      assignmentStatus: 'pending'
    },
    {
      id: 'B003',
      customerName: 'Mike Johnson',
      customerPhone: '+91 98765 43214',
      customerEmail: 'mike.johnson@email.com',
      serviceName: 'Mobile Phone Repair',
      vendorName: 'Quick Fix Hub',
      vendorPhone: '+91 98765 43215',
      bookingDate: '2024-02-13',
      scheduledDate: '2024-02-15',
      scheduledTime: '11:00 AM',
      status: 'completed',
      priority: 'normal',
      address: '789 Tech Park, Bangalore, Karnataka',
      totalAmount: 800,
      paymentStatus: 'paid',
      rating: 4.5,
      notes: 'Battery replacement and screen repair',
      assignedEngineer: 'E002',
      assignmentStatus: 'in_progress'
    },
    {
      id: 'B004',
      customerName: 'Emily Davis',
      customerPhone: '+91 98765 43216',
      customerEmail: 'emily.davis@email.com',
      serviceName: 'Washing Machine Repair',
      vendorName: 'Home Services Pro',
      vendorPhone: '+91 98765 43217',
      bookingDate: '2024-02-12',
      scheduledDate: '2024-02-14',
      scheduledTime: '3:00 PM',
      status: 'cancelled',
      priority: 'low',
      address: '321 Garden Street, Chennai, Tamil Nadu',
      totalAmount: 600,
      paymentStatus: 'refunded',
      rating: null,
      notes: 'Customer cancelled due to schedule conflict',
      assignedEngineer: null,
      assignmentStatus: 'cancelled'
    },
    {
      id: 'B005',
      customerName: 'David Brown',
      customerPhone: '+91 98765 43218',
      customerEmail: 'david.brown@email.com',
      serviceName: 'Plumbing Services',
      vendorName: 'Appliance Masters',
      vendorPhone: '+91 98765 43219',
      bookingDate: '2024-02-11',
      scheduledDate: '2024-02-13',
      scheduledTime: '9:00 AM',
      status: 'in_progress',
      priority: 'urgent',
      address: '654 Water Lane, Pune, Maharashtra',
      totalAmount: 900,
      paymentStatus: 'paid',
      rating: null,
      notes: 'Pipe leakage, needs immediate attention',
      assignedEngineer: null,
      assignmentStatus: 'pending'
    }
  ]);

  const services = ['AC Repair & Maintenance', 'Laptop Repair', 'Mobile Phone Repair', 'Washing Machine Repair', 'Plumbing Services'];

  // Sample engineers data
  const engineers = [
    { id: 'E001', name: 'Rajesh Kumar', phone: '+91 98765 43220', specialization: 'AC Repair & Maintenance', status: 'available', rating: 4.8 },
    { id: 'E002', name: 'Priya Sharma', phone: '+91 98765 43221', specialization: 'Laptop Repair', status: 'available', rating: 4.9 },
    { id: 'E003', name: 'Amit Singh', phone: '+91 98765 43222', specialization: 'Mobile Phone Repair', status: 'busy', rating: 4.7 },
    { id: 'E004', name: 'Sneha Patel', phone: '+91 98765 43223', specialization: 'Washing Machine Repair', status: 'available', rating: 4.6 },
    { id: 'E005', name: 'Vikram Joshi', phone: '+91 98765 43224', specialization: 'Plumbing Services', status: 'available', rating: 4.5 },
    { id: 'E006', name: 'Anita Gupta', phone: '+91 98765 43225', specialization: 'General Electronics', status: 'available', rating: 4.8 }
  ];

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesService = serviceFilter === 'all' || booking.serviceName === serviceFilter;
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

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'refunded':
        return <Badge className="bg-blue-100 text-blue-800">Refunded</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const handleAssignEngineer = (booking: any) => {
    setSelectedBooking(booking);
    setAssignedEngineer(booking.assignedEngineer || '');
    setAssignmentNotes('');
    setIsAssignEngineerOpen(true);
  };

  const handleSubmitAssignment = () => {
    if (!assignedEngineer) return;

    // Get the selected engineer details
    const engineer = engineers.find(e => e.id === assignedEngineer);
    
    // Update the booking with assigned engineer and make them the vendor
    setBookings(prev => prev.map(booking => 
      booking.id === selectedBooking.id 
        ? { 
            ...booking, 
            assignedEngineer: assignedEngineer,
            assignmentStatus: 'assigned',
            vendorName: engineer?.name || 'Unknown Engineer',
            vendorPhone: engineer?.phone || 'N/A'
          }
        : booking
    ));

    console.log('Engineer assigned successfully:', {
      bookingId: selectedBooking.id,
      engineerId: assignedEngineer,
      engineerName: engineer?.name,
      notes: assignmentNotes
    });

    // Close modal and reset form
    setIsAssignEngineerOpen(false);
    setSelectedBooking(null);
    setAssignedEngineer('');
    setAssignmentNotes('');
  };

  const handleUpdateAssignmentStatus = (bookingId: string, newStatus: string) => {
    setBookings(prev => prev.map(booking => 
      booking.id === bookingId 
        ? { ...booking, assignmentStatus: newStatus }
        : booking
    ));
  };

  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
    setIsViewDetailsOpen(true);
  };

  const handleEditBooking = (booking: any) => {
    setEditingBooking(booking);
    setIsEditBookingOpen(true);
  };

  const handleReschedule = (booking: any) => {
    setSelectedBooking(booking);
    setIsRescheduleOpen(true);
  };

  const handleConfirmBooking = (bookingId: string) => {
    setBookings(prev => prev.map(booking => 
      booking.id === bookingId 
        ? { ...booking, status: 'confirmed' }
        : booking
    ));
  };

  const handleCancelBooking = (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled', assignmentStatus: 'cancelled' }
          : booking
      ));
    }
  };

  const handleCreateBooking = () => {
    // In a real app, this would open a create booking modal
    console.log('Creating new booking');
  };

  const getEngineerName = (engineerId: string | null) => {
    if (!engineerId) return 'Not Assigned';
    const engineer = engineers.find(e => e.id === engineerId);
    return engineer ? engineer.name : 'Unknown Engineer';
  };

  const getAvailableEngineers = (serviceName: string) => {
    return engineers.filter(engineer => 
      engineer.status === 'available' && 
      (engineer.specialization === serviceName || engineer.specialization === 'General Electronics')
    );
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <main className="ml-72 pt-32 p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Booking <span className="text-gradient">Management</span>
              </h1>
              <p className="text-gray-600">Manage and monitor all service bookings</p>
            </div>
            <div className="flex items-center gap-4">
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateBooking}>
                <Calendar className="w-4 h-4 mr-2" />
                Create Booking
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
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookings.filter(b => b.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookings.filter(b => b.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search bookings by customer, service, vendor, or booking ID..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {services.map(service => (
                    <SelectItem key={service} value={service}>{service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="scheduled">Scheduled Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Scheduled</TableHead>
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
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{booking.id}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.bookingDate).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{booking.customerName}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="w-3 h-3" />
                          <span>{booking.customerPhone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{booking.serviceName}</p>
                        <p className="text-sm text-gray-500 max-w-xs truncate">{booking.notes}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{booking.vendorName}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="w-3 h-3" />
                          <span>{booking.vendorPhone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(booking.scheduledDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">{booking.scheduledTime}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">₹{booking.totalAmount}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>{getPriorityBadge(booking.priority)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{getEngineerName(booking.assignedEngineer)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getAssignmentStatusBadge(booking.assignmentStatus)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(booking.paymentStatus)}</TableCell>
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
                            {booking.assignedEngineer ? 'Reassign Engineer & Vendor' : 'Assign Engineer as Vendor'}
                          </DropdownMenuItem>
                          {booking.assignedEngineer && (
                            <>
                              <DropdownMenuItem onClick={() => handleUpdateAssignmentStatus(booking.id, 'in_progress')}>
                                <Clock className="w-4 h-4 mr-2" />
                                Mark In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateAssignmentStatus(booking.id, 'completed')}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Completed
                              </DropdownMenuItem>
                            </>
                          )}
                          {booking.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleConfirmBooking(booking.id)}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Confirm Booking
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleReschedule(booking)}>
                            <Clock className="w-4 h-4 mr-2" />
                            Reschedule
                          </DropdownMenuItem>
                          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleCancelBooking(booking.id)}
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
        <Dialog open={isAssignEngineerOpen} onOpenChange={setIsAssignEngineerOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Engineer to Booking</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-6">
                {/* Booking Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Booking Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Booking ID:</span>
                      <span className="ml-2 font-medium">{selectedBooking.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Customer:</span>
                      <span className="ml-2 font-medium">{selectedBooking.customerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Service:</span>
                      <span className="ml-2 font-medium">{selectedBooking.serviceName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Scheduled:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedBooking.scheduledDate).toLocaleDateString()} at {selectedBooking.scheduledTime}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Address:</span>
                      <span className="ml-2 font-medium">{selectedBooking.address}</span>
                    </div>
                  </div>
                </div>

                {/* Current Assignment Status */}
                {selectedBooking.assignedEngineer && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Current Assignment</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">Engineer:</span> {getEngineerName(selectedBooking.assignedEngineer)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Status:</span> {getAssignmentStatusBadge(selectedBooking.assignmentStatus)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Engineer Selection */}
                <div>
                  <Label htmlFor="engineer">
                    {selectedBooking.assignedEngineer ? 'Reassign Engineer' : 'Select Engineer'} *
                  </Label>
                  <p className="text-sm text-gray-600 mb-2">
                    The selected engineer will become the vendor for this booking
                  </p>
                  <Select value={assignedEngineer} onValueChange={setAssignedEngineer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an engineer" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableEngineers(selectedBooking.serviceName).map((engineer) => (
                        <SelectItem key={engineer.id} value={engineer.id}>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <span className="font-medium">{engineer.name}</span>
                              <span className="text-sm text-gray-500 ml-2">({engineer.specialization})</span>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span className="text-sm">{engineer.rating}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {getAvailableEngineers(selectedBooking.serviceName).length === 0 && (
                    <p className="text-sm text-red-600 mt-1">No available engineers for this service type</p>
                  )}
                </div>

                {/* Assignment Notes */}
                <div>
                  <Label htmlFor="notes">Assignment Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    placeholder="Add any special instructions or notes for the engineer..."
                    rows={3}
                  />
                </div>

                {/* Available Engineers Info */}
                {getAvailableEngineers(selectedBooking.serviceName).length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Available Engineers</h4>
                    <div className="space-y-2">
                      {getAvailableEngineers(selectedBooking.serviceName).map((engineer) => (
                        <div key={engineer.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">{engineer.name}</span>
                            <span className="text-gray-600">({engineer.specialization})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span>{engineer.rating}</span>
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Available
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleSubmitAssignment} className="flex-1" disabled={!assignedEngineer}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {selectedBooking.assignedEngineer ? 'Reassign Engineer & Vendor' : 'Assign Engineer as Vendor'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsAssignEngineerOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Details Modal */}
        <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Booking Details - {selectedBooking?.id}</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <p className="text-sm">{selectedBooking.customerName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-sm">{selectedBooking.customerEmail}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="text-sm">{selectedBooking.customerPhone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                      <p className="text-sm">{selectedBooking.address}</p>
                    </div>
                  </div>
                </div>

                {/* Service Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Service Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Service</Label>
                      <p className="text-sm font-medium">{selectedBooking.serviceName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Vendor</Label>
                      <p className="text-sm">{selectedBooking.vendorName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Vendor Phone</Label>
                      <p className="text-sm">{selectedBooking.vendorPhone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                      <p className="text-sm font-medium">₹{selectedBooking.totalAmount}</p>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Booking Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Booking Date</Label>
                      <p className="text-sm">{new Date(selectedBooking.bookingDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Scheduled Date</Label>
                      <p className="text-sm">{new Date(selectedBooking.scheduledDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Scheduled Time</Label>
                      <p className="text-sm">{selectedBooking.scheduledTime}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                      <div className="mt-1">{getPriorityBadge(selectedBooking.priority)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Payment Status</Label>
                      <div className="mt-1">{getPaymentStatusBadge(selectedBooking.paymentStatus)}</div>
                    </div>
                  </div>
                </div>

                {/* Engineer Assignment */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Engineer Assignment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Assigned Engineer</Label>
                      <p className="text-sm">{getEngineerName(selectedBooking.assignedEngineer)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Assignment Status</Label>
                      <div className="mt-1">{getAssignmentStatusBadge(selectedBooking.assignmentStatus)}</div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">{selectedBooking.notes}</p>
                </div>

                {/* Rating */}
                {selectedBooking.rating && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Customer Rating</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{selectedBooking.rating}/5</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleEditBooking(selectedBooking)} 
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Booking
                  </Button>
                  <Button variant="outline" onClick={() => setIsViewDetailsOpen(false)}>
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
              <DialogTitle>Edit Booking - {editingBooking?.id}</DialogTitle>
            </DialogHeader>
            {editingBooking && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      value={editingBooking.customerName}
                      onChange={(e) => setEditingBooking({...editingBooking, customerName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone</Label>
                    <Input
                      id="customerPhone"
                      value={editingBooking.customerPhone}
                      onChange={(e) => setEditingBooking({...editingBooking, customerPhone: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    value={editingBooking.customerEmail}
                    onChange={(e) => setEditingBooking({...editingBooking, customerEmail: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={editingBooking.address}
                    onChange={(e) => setEditingBooking({...editingBooking, address: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduledDate">Scheduled Date</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={editingBooking.scheduledDate}
                      onChange={(e) => setEditingBooking({...editingBooking, scheduledDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="scheduledTime">Scheduled Time</Label>
                    <Input
                      id="scheduledTime"
                      value={editingBooking.scheduledTime}
                      onChange={(e) => setEditingBooking({...editingBooking, scheduledTime: e.target.value})}
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
                        booking.id === editingBooking.id ? editingBooking : booking
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

        {/* Reschedule Modal */}
        <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reschedule Booking - {selectedBooking?.id}</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newDate">New Scheduled Date</Label>
                  <Input
                    id="newDate"
                    type="date"
                    defaultValue={selectedBooking.scheduledDate}
                  />
                </div>
                <div>
                  <Label htmlFor="newTime">New Scheduled Time</Label>
                  <Input
                    id="newTime"
                    defaultValue={selectedBooking.scheduledTime}
                  />
                </div>
                <div>
                  <Label htmlFor="rescheduleReason">Reason for Reschedule</Label>
                  <Textarea
                    id="rescheduleReason"
                    placeholder="Enter reason for rescheduling..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      // Update booking with new schedule
                      setIsRescheduleOpen(false);
                    }} 
                    className="flex-1"
                  >
                    Reschedule
                  </Button>
                  <Button variant="outline" onClick={() => setIsRescheduleOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminBookingManagement;
