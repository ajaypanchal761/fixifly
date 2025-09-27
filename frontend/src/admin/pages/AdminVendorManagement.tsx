import React, { useState, useEffect } from 'react';
import AdminHeader from '../components/AdminHeader';
import adminApiService from '@/services/adminApi';
import { useToast } from '@/hooks/use-toast';
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
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Vendor {
  id: string;
  vendorId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  address?: any;
  joinDate: string;
  status: 'active' | 'inactive' | 'blocked' | 'suspended';
  verificationStatus: 'verified' | 'pending' | 'rejected';
  rating: number;
  totalReviews: number;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  services: string[];
  customServiceCategory?: string;
  lastActive: string;
  profileImage?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isProfileComplete: boolean;
  experience: string;
  specialty?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

interface VendorStats {
  totalVendors: number;
  activeVendors: number;
  verifiedVendors: number;
  pendingVendors: number;
  blockedVendors: number;
  inactiveVendors: number;
  recentVendors: number;
  averageRating: number;
  serviceCategoryStats: any[];
  locationStats: any[];
}

const AdminVendorManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorStats, setVendorStats] = useState<VendorStats | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalVendors: 0,
    hasNext: false,
    hasPrev: false,
    limit: 20
  });
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isVendorDetailsOpen, setIsVendorDetailsOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: '',
    message: ''
  });
  const [sendingEmail, setSendingEmail] = useState(false);

  // Fetch vendors data
  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        verificationStatus: verificationFilter !== 'all' ? verificationFilter : undefined,
        sortBy: sortBy,
        sortOrder: sortOrder
      };

      const response = await adminApiService.getVendors(params);
      
      if (response.success && response.data) {
        setVendors(response.data.vendors);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      console.error('Error fetching vendors:', err);
      setError(err.message || 'Failed to fetch vendors');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch vendors',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch vendor statistics
  const fetchVendorStats = async () => {
    try {
      const response = await adminApiService.getVendorStats();
      if (response.success && response.data) {
        setVendorStats(response.data.stats);
      }
    } catch (err: any) {
      console.error('Error fetching vendor stats:', err);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchVendors();
  }, [currentPage, searchTerm, statusFilter, verificationFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchVendorStats();
  }, []);

  // Handle vendor status update
  const handleVendorStatusUpdate = async (vendorId: string, action: string) => {
    try {
      await adminApiService.updateVendorStatus(vendorId, action as any);
      toast({
        title: "Success",
        description: `Vendor ${action}d successfully`,
      });
      fetchVendors(); // Refresh the list
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to update vendor status',
        variant: "destructive",
      });
    }
  };

  // Handle vendor deletion
  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      return;
    }

    try {
      await adminApiService.deleteVendor(vendorId);
      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });
      fetchVendors(); // Refresh the list
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to delete vendor',
        variant: "destructive",
      });
    }
  };

  // Handle send email
  const handleSendEmail = async () => {
    if (!selectedVendor || !emailData.subject || !emailData.message) {
      toast({
        title: "Error",
        description: "Please fill in all email fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSendingEmail(true);
      await adminApiService.sendEmailToVendor(selectedVendor.id, emailData);
      toast({
        title: "Success",
        description: "Email sent successfully",
      });
      setIsEmailModalOpen(false);
      setEmailData({ subject: '', message: '' });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to send email',
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800">Blocked</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-100 text-orange-800">Suspended</Badge>;
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
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">
                Vendor <span className="text-gradient">Management</span>
              </h1>
              <p className="text-sm text-gray-600">Manage and monitor all registered vendors</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Vendors</p>
                  <p className="text-lg font-bold text-gray-900">
                    {vendorStats?.totalVendors || 0}
                  </p>
                </div>
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Verified Vendors</p>
                  <p className="text-lg font-bold text-gray-900">
                    {vendorStats?.verifiedVendors || 0}
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
                  <p className="text-xs font-medium text-gray-600">Pending Verification</p>
                  <p className="text-lg font-bold text-gray-900">
                    {vendorStats?.pendingVendors || 0}
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
                  <p className="text-xs font-medium text-gray-600">Active Vendors</p>
                  <p className="text-lg font-bold text-gray-900">
                    {vendorStats?.activeVendors || 0}
                  </p>
                </div>
                <Award className="w-6 h-6 text-purple-600" />
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
                    placeholder="Search vendors by name, owner, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger className="w-full md:w-40">
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
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Newest First</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="rating.average">Highest Rating</SelectItem>
                  <SelectItem value="stats.totalTasks">Most Bookings</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setVerificationFilter('all');
                  setSortBy('createdAt');
                  setSortOrder('desc');
                  setCurrentPage(1);
                }}
                className="w-full md:w-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Vendors Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Vendors ({pagination.totalVendors})</CardTitle>
              <div className="text-xs text-muted-foreground">
                Showing {((pagination.currentPage - 1) * 20) + 1} to {Math.min(pagination.currentPage * 20, pagination.totalVendors)} of {pagination.totalVendors} vendors
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-sm">Loading vendors...</span>
              </div>
            ) : vendors.length === 0 ? (
              <div className="text-center py-6">
                <UserCheck className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-medium text-gray-900 mb-1">No vendors found</h3>
                <p className="text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              <>
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
                    {vendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={vendor.profileImage || undefined} />
                              <AvatarFallback>{getInitials(vendor.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{vendor.name}</p>
                              <p className="text-xs text-gray-500">ID: {vendor.vendorId}</p>
                              <p className="text-xs text-gray-400">Joined: {new Date(vendor.joinDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span>{vendor.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{vendor.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span>{vendor.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{vendor.rating.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({vendor.totalReviews})</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                        <TableCell>{getVerificationBadge(vendor.verificationStatus)}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div>Total: <span className="font-medium">{vendor.totalBookings}</span></div>
                            <div>Completed: <span className="font-medium text-green-600">{vendor.completedBookings}</span></div>
                            <div>Pending: <span className="font-medium text-yellow-600">{vendor.pendingBookings}</span></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500">
                            {vendor.lastActive ? new Date(vendor.lastActive).toLocaleDateString() : 'Never'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedVendor(vendor);
                                setIsVendorDetailsOpen(true);
                              }}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {vendor.verificationStatus === 'pending' && (
                                <DropdownMenuItem onClick={() => handleVendorStatusUpdate(vendor.id, 'approve')}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve Vendor
                                </DropdownMenuItem>
                              )}
                              {vendor.verificationStatus === 'verified' && (
                                <DropdownMenuItem onClick={() => handleVendorStatusUpdate(vendor.id, 'reject')}>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject Vendor
                                </DropdownMenuItem>
                              )}
                              {vendor.status !== 'blocked' && (
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleVendorStatusUpdate(vendor.id, 'block')}
                                >
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  Block Vendor
                                </DropdownMenuItem>
                              )}
                              {vendor.status === 'blocked' && (
                                <DropdownMenuItem 
                                  className="text-green-600"
                                  onClick={() => handleVendorStatusUpdate(vendor.id, 'unblock')}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Unblock Vendor
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => {
                                setSelectedVendor(vendor);
                                setIsEmailModalOpen(true);
                              }}>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteVendor(vendor.id)}
                              >
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
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-xs text-muted-foreground">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={!pagination.hasPrev}
                        className="text-xs"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                        disabled={!pagination.hasNext}
                        className="text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Vendor Details Modal */}
        <Dialog open={isVendorDetailsOpen} onOpenChange={setIsVendorDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Vendor Details</DialogTitle>
            </DialogHeader>
            {selectedVendor && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-sm">{selectedVendor.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vendor ID</label>
                    <p className="text-sm">{selectedVendor.vendorId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm">{selectedVendor.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm">{selectedVendor.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-sm">{selectedVendor.location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Experience</label>
                    <p className="text-sm">{selectedVendor.experience}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Services</label>
                    <p className="text-sm">
                      {selectedVendor.services.map(service => 
                        service === 'Other' && selectedVendor.customServiceCategory 
                          ? selectedVendor.customServiceCategory 
                          : service
                      ).join(', ')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Rating</label>
                    <p className="text-sm">{selectedVendor.rating.toFixed(1)} ({selectedVendor.totalReviews} reviews)</p>
                  </div>
                </div>
                {selectedVendor.specialty && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Specialty</label>
                    <p className="text-sm">{selectedVendor.specialty}</p>
                  </div>
                )}
                {selectedVendor.bio && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Bio</label>
                    <p className="text-sm">{selectedVendor.bio}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Email Modal */}
        <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Email to {selectedVendor?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows={4}
                  value={emailData.message}
                  onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Email message"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEmailModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendEmail} disabled={sendingEmail}>
                  {sendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Email'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add New Vendor Modal */}
        <Dialog open={isAddVendorModalOpen} onOpenChange={setIsAddVendorModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center py-8">
                <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Add New Vendor</h3>
                <p className="text-gray-600 mb-6">
                  To add a new vendor, please direct them to the vendor registration page where they can create their own account.
                </p>
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      // Open vendor registration page in new tab
                      window.open('/vendor/signup', '_blank');
                    }}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Open Vendor Registration Page
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsAddVendorModalOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminVendorManagement;
