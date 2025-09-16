import React, { useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import { 
  UserCheck, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Award,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AdminVendorManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Sample vendor data - in real app this would come from API
  const vendors = [
    {
      id: 'V001',
      name: 'ABC Electronics',
      ownerName: 'Rajesh Kumar',
      email: 'rajesh@abcelectronics.com',
      phone: '+91 98765 43210',
      location: 'Mumbai, Maharashtra',
      joinDate: '2024-01-15',
      status: 'active',
      verificationStatus: 'verified',
      rating: 4.8,
      totalReviews: 156,
      totalBookings: 89,
      completedBookings: 85,
      pendingBookings: 4,
      services: ['AC Repair', 'Washing Machine', 'Refrigerator'],
      lastActive: '2 hours ago',
      avatar: null
    },
    {
      id: 'V002',
      name: 'TechFix Solutions',
      ownerName: 'Priya Sharma',
      email: 'priya@techfix.com',
      phone: '+91 98765 43211',
      location: 'Delhi, NCR',
      joinDate: '2024-01-20',
      status: 'active',
      verificationStatus: 'pending',
      rating: 4.6,
      totalReviews: 89,
      totalBookings: 67,
      completedBookings: 62,
      pendingBookings: 5,
      services: ['Mobile Repair', 'Laptop Repair', 'Desktop Repair'],
      lastActive: '1 day ago',
      avatar: null
    },
    {
      id: 'V003',
      name: 'Home Services Pro',
      ownerName: 'Amit Singh',
      email: 'amit@homeservices.com',
      phone: '+91 98765 43212',
      location: 'Bangalore, Karnataka',
      joinDate: '2024-01-25',
      status: 'inactive',
      verificationStatus: 'verified',
      rating: 4.2,
      totalReviews: 45,
      totalBookings: 34,
      completedBookings: 30,
      pendingBookings: 4,
      services: ['Plumbing', 'Electrical', 'Carpentry'],
      lastActive: '1 week ago',
      avatar: null
    },
    {
      id: 'V004',
      name: 'Quick Fix Hub',
      ownerName: 'Sneha Patel',
      email: 'sneha@quickfix.com',
      phone: '+91 98765 43213',
      location: 'Chennai, Tamil Nadu',
      joinDate: '2024-02-01',
      status: 'active',
      verificationStatus: 'rejected',
      rating: 3.9,
      totalReviews: 23,
      totalBookings: 18,
      completedBookings: 15,
      pendingBookings: 3,
      services: ['TV Repair', 'Audio Systems', 'Gaming Consoles'],
      lastActive: '30 minutes ago',
      avatar: null
    },
    {
      id: 'V005',
      name: 'Appliance Masters',
      ownerName: 'Vikram Reddy',
      email: 'vikram@appliancemasters.com',
      phone: '+91 98765 43214',
      location: 'Pune, Maharashtra',
      joinDate: '2024-02-05',
      status: 'suspended',
      verificationStatus: 'verified',
      rating: 4.1,
      totalReviews: 67,
      totalBookings: 45,
      completedBookings: 40,
      pendingBookings: 5,
      services: ['Microwave', 'Oven', 'Dishwasher'],
      lastActive: '2 weeks ago',
      avatar: null
    }
  ];

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    const matchesVerification = verificationFilter === 'all' || vendor.verificationStatus === verificationFilter;
    return matchesSearch && matchesStatus && matchesVerification;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Verified
        </Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Rejected
        </Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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
                Vendor <span className="text-gradient">Management</span>
              </h1>
              <p className="text-gray-600">Manage and monitor all registered vendors</p>
            </div>
            <div className="flex items-center gap-4">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserCheck className="w-4 h-4 mr-2" />
                Add New Vendor
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
                  <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">{vendors.length}</p>
                </div>
                <UserCheck className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Verified Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vendors.filter(v => v.verificationStatus === 'verified').length}
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
                  <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vendors.filter(v => v.verificationStatus === 'pending').length}
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
                  <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vendors.filter(v => v.status === 'active').length}
                  </p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
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
                    placeholder="Search vendors by name, owner, email, or phone..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Verification status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verification</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="rating">Highest Rating</SelectItem>
                  <SelectItem value="bookings">Most Bookings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Vendors Table */}
        <Card>
          <CardHeader>
            <CardTitle>Vendors ({filteredVendors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={vendor.avatar || undefined} />
                          <AvatarFallback>{getInitials(vendor.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{vendor.name}</p>
                          <p className="text-sm text-gray-500">Owner: {vendor.ownerName}</p>
                          <p className="text-xs text-gray-400">ID: {vendor.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{vendor.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{vendor.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{vendor.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-medium">{vendor.rating}</span>
                        <span className="text-sm text-gray-500">({vendor.totalReviews})</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                    <TableCell>{getVerificationBadge(vendor.verificationStatus)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Total: <span className="font-medium">{vendor.totalBookings}</span></div>
                        <div>Completed: <span className="font-medium text-green-600">{vendor.completedBookings}</span></div>
                        <div>Pending: <span className="font-medium text-yellow-600">{vendor.pendingBookings}</span></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">{vendor.lastActive}</span>
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
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Vendor
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Verify Vendor
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Suspend Vendor
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Vendor
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

export default AdminVendorManagement;
