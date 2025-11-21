import React, { useState, useEffect } from 'react';
import AdminHeader from '../components/AdminHeader';
import adminApiService from '@/services/adminApi';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Loader2,
  AlertCircle,
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

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'blocked';
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  totalBookings: number;
  completedBookings: number;
  totalSpent: number;
  lastActive: string;
  profileImage?: string;
  address?: any;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  verifiedUsers: number;
  recentUsers: number;
  totalBookings: number;
  totalSpent: number;
  avgBookingsPerUser: number;
}

const AdminUserManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false,
    limit: 20
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: '',
    message: ''
  });
  const [sendingEmail, setSendingEmail] = useState(false);

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sortBy: sortBy,
        sortOrder: sortOrder
      };

      const response = await adminApiService.getUsers(params);
      
      if (response.success && response.data) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch users',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      const response = await adminApiService.getUserStats();
      
      if (response.success && response.data) {
        setUserStats(response.data.stats);
      }
    } catch (err: any) {
      console.error('Error fetching user stats:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchUsers();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchUsers();
    }
  }, [statusFilter, sortBy, sortOrder]);

  // User action handlers
  const handleBlockUser = async (userId: string, userName: string) => {
    try {
      await adminApiService.updateUserStatus(userId, 'block');
      toast({
        title: "Success",
        description: `User ${userName} has been blocked`,
      });
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to block user',
        variant: "destructive",
      });
    }
  };

  const handleUnblockUser = async (userId: string, userName: string) => {
    try {
      await adminApiService.updateUserStatus(userId, 'unblock');
      toast({
        title: "Success",
        description: `User ${userName} has been unblocked`,
      });
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to unblock user',
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete user ${userName}? This action cannot be undone.`)) {
      try {
        await adminApiService.deleteUser(userId);
        toast({
          title: "Success",
          description: `User ${userName} has been deleted`,
        });
        fetchUsers();
        fetchUserStats();
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || 'Failed to delete user',
          variant: "destructive",
        });
      }
    }
  };

  const handleRefresh = () => {
    fetchUsers();
    fetchUserStats();
  };

  const handleViewUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsUserDetailsOpen(true);
  };

  const handleSendEmail = (user: User) => {
    setSelectedUser(user);
    setEmailData({ subject: '', message: '' });
    setIsEmailModalOpen(true);
  };

  const handleEmailSubmit = async () => {
    if (!selectedUser || !emailData.subject.trim() || !emailData.message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both subject and message",
        variant: "destructive",
      });
      return;
    }

    try {
      setSendingEmail(true);
      await adminApiService.sendEmailToUser(selectedUser.id, emailData);
      
      toast({
        title: "Success",
        description: `Email sent successfully to ${selectedUser.name}`,
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
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    if (!name || name === 'N/A') return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return formatDate(dateString);
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
                User <span className="text-gradient">Management</span>
              </h1>
              <p className="text-sm text-gray-600">Manage and monitor all registered users</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={loading}
                size="sm"
              >
                <RefreshCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-xs">Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Users</p>
                  <p className="text-lg font-bold text-gray-900">
                    {userStats?.totalUsers || 0}
                  </p>
                </div>
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Active Users</p>
                  <p className="text-lg font-bold text-gray-900">
                    {userStats?.activeUsers || 0}
                  </p>
                </div>
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Blocked Users</p>
                  <p className="text-lg font-bold text-gray-900">
                    {userStats?.blockedUsers || 0}
                  </p>
                </div>
                <UserX className="w-6 h-6 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Verified Users</p>
                  <p className="text-lg font-bold text-gray-900">
                    {userStats?.verifiedUsers || 0}
                  </p>
                </div>
                <UserCheck className="w-6 h-6 text-blue-600" />
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
                    placeholder="Search users by name, email, or phone..."
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
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Newest First</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="email">Email A-Z</SelectItem>
                  <SelectItem value="stats.totalBookings">Most Bookings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Users ({pagination.totalUsers})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-sm">Loading users...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No users found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.profileImage || undefined} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">ID: {user.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span>{user.email}</span>
                            {user.isEmailVerified && (
                              <Badge variant="outline" className="text-xs">Verified</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{user.phone}</span>
                            {user.isPhoneVerified && (
                              <Badge variant="outline" className="text-xs">Verified</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{user.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>{formatDate(user.joinDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <span className="font-medium">{user.totalBookings}</span>
                          <span className="text-gray-500"> total</span>
                        </div>
                        {user.completedBookings > 0 && (
                          <div className="text-xs text-gray-500">
                            {user.completedBookings} completed
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">
                          {formatLastActive(user.lastActive)}
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
                            <DropdownMenuItem onClick={() => handleViewUserDetails(user)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendEmail(user)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            {user.status === 'blocked' ? (
                              <DropdownMenuItem 
                                onClick={() => handleUnblockUser(user.id, user.name)}
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Unblock User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleBlockUser(user.id, user.name)}
                                className="text-orange-600"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Block User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* User Details Modal */}
        <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto mt-16">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={selectedUser?.profileImage || undefined} />
                  <AvatarFallback>{selectedUser ? getInitials(selectedUser.name) : 'U'}</AvatarFallback>
                </Avatar>
                User Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Name:</span>
                    <span className="text-gray-900 font-medium">{selectedUser.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Email:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-900 text-sm">{selectedUser.email}</span>
                      {selectedUser.isEmailVerified && (
                        <Badge variant="outline" className="text-xs px-1 py-0">✓</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Phone:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-900 text-sm">{selectedUser.phone}</span>
                      {selectedUser.isPhoneVerified && (
                        <Badge variant="outline" className="text-xs px-1 py-0">✓</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    {getStatusBadge(selectedUser.status)}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Join Date:</span>
                    <span className="text-gray-900 text-sm">{formatDate(selectedUser.joinDate)}</span>
                  </div>
                </div>

                {/* Address Information */}
                {selectedUser.address && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Address</h4>
                    <div className="space-y-2 text-sm">
                      {selectedUser.address.street && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Street:</span>
                          <span className="text-gray-900">{selectedUser.address.street}</span>
                        </div>
                      )}
                      
                      {selectedUser.address.city && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">City:</span>
                          <span className="text-gray-900">{selectedUser.address.city}</span>
                        </div>
                      )}
                      
                      {selectedUser.address.state && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">State:</span>
                          <span className="text-gray-900">{selectedUser.address.state}</span>
                        </div>
                      )}
                      
                      {selectedUser.address.pincode && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pincode:</span>
                          <span className="text-gray-900">{selectedUser.address.pincode}</span>
                        </div>
                      )}
                      
                      {selectedUser.address.landmark && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Landmark:</span>
                          <span className="text-gray-900">{selectedUser.address.landmark}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Activity Information */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Activity</h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold text-blue-600">{selectedUser.totalBookings}</p>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">{selectedUser.completedBookings}</p>
                      <p className="text-xs text-gray-600">Completed</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-purple-600">₹{selectedUser.totalSpent}</p>
                      <p className="text-xs text-gray-600">Spent</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-600">Last Active: {formatLastActive(selectedUser.lastActive)}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Send Email Modal */}
        <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Send Email to {selectedUser?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">To:</label>
                <p className="text-gray-900">{selectedUser?.email}</p>
              </div>
              
              <div>
                <label htmlFor="email-subject" className="text-sm font-medium text-gray-600">
                  Subject *
                </label>
                <Input
                  id="email-subject"
                  placeholder="Enter email subject"
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="email-message" className="text-sm font-medium text-gray-600">
                  Message *
                </label>
                <textarea
                  id="email-message"
                  placeholder="Enter your message"
                  value={emailData.message}
                  onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                  rows={6}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEmailModalOpen(false)}
                  disabled={sendingEmail}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEmailSubmit}
                  disabled={sendingEmail || !emailData.subject.trim() || !emailData.message.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminUserManagement;
