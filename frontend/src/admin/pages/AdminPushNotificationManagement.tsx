import React, { useState, useEffect } from 'react';
import AdminHeader from '../components/AdminHeader';
import { useToast } from '@/hooks/use-toast';
import adminNotificationApi, { AdminNotification, SendNotificationRequest } from '@/services/adminNotificationApi';
import { 
  Bell, 
  Send, 
  Users, 
  UserCheck, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Plus,
  Edit,
  Eye,
  Filter,
  Search,
  Calendar,
  Target,
  MessageSquare,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface NotificationStats {
  totalNotifications: number;
  sentNotifications: number;
  scheduledNotifications: number;
  draftNotifications: number;
  totalRecipients: number;
  averageDeliveryRate: number;
}

const AdminPushNotificationManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetAudience: 'all' as 'all' | 'users' | 'vendors' | 'specific',
    targetUsers: [] as string[],
    targetVendors: [] as string[],
    scheduledAt: '',
    isScheduled: false
  });

  // Data states
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);


  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      
      const response = await adminNotificationApi.getNotifications({
        page: currentPage,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter,
        targetAudience: audienceFilter === 'all' ? undefined : audienceFilter
      });
      
      if (response.success) {
        setNotifications(response.data.notifications);
        setTotalPages(response.data.pagination.totalPages);
        setTotalNotifications(response.data.pagination.totalNotifications);
      }
      
      // Fetch stats
      const statsResponse = await adminNotificationApi.getNotificationStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send notification
  const handleSendNotification = async () => {
    try {
      setIsLoading(true);
      
      if (!formData.title || !formData.message) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      const notificationData: SendNotificationRequest = {
        title: formData.title,
        message: formData.message,
        targetAudience: formData.targetAudience,
        targetUsers: formData.targetUsers.length > 0 ? formData.targetUsers : undefined,
        targetVendors: formData.targetVendors.length > 0 ? formData.targetVendors : undefined,
        scheduledAt: formData.isScheduled ? formData.scheduledAt : undefined,
        isScheduled: formData.isScheduled
      };

      const response = await adminNotificationApi.sendNotification(notificationData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Notification sent successfully to ${response.data.sentCount} recipients`,
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to send notification",
          variant: "destructive"
        });
        return;
      }
      
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        message: '',
        targetAudience: 'all',
        targetUsers: [],
        targetVendors: [],
        scheduledAt: '',
        isScheduled: false
      });
      
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };


  // View notification details
  const handleViewNotification = (notification: AdminNotification) => {
    setSelectedNotification(notification);
    setIsViewModalOpen(true);
  };

  // Load data on component mount
  useEffect(() => {
    fetchNotifications();
  }, [statusFilter, audienceFilter, searchTerm, currentPage]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getAudienceBadge = (audience: string) => {
    switch (audience) {
      case 'all':
        return <Badge className="bg-purple-100 text-purple-800">All Users</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{audience}</Badge>;
    }
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
                Push <span className="text-gradient">Notification</span>
              </h1>
              <p className="text-sm text-gray-600">Manage and send push notifications to users and vendors</p>
            </div>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Notification
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Notifications</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stats?.totalNotifications || 0}
                  </p>
                </div>
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Sent Notifications</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stats?.sentNotifications || 0}
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
                  <p className="text-xs font-medium text-gray-600">Scheduled</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stats?.scheduledNotifications || 0}
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
                  <p className="text-xs font-medium text-gray-600">Total Recipients</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stats?.totalRecipients || 0}
                  </p>
                </div>
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search notifications by title or message..."
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
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audience</SelectItem>
                 
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={fetchNotifications}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Notifications ({totalNotifications})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Target Audience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent Date</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Delivery Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">Loading notifications...</p>
                    </TableCell>
                  </TableRow>
                ) : notifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No notifications found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.map((notification) => (
                    <TableRow key={notification._id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-900 max-w-xs truncate">
                          {notification.message}
                        </p>
                      </TableCell>
                      <TableCell>{getAudienceBadge(notification.targetAudience)}</TableCell>
                      <TableCell>{getStatusBadge(notification.status)}</TableCell>
                      <TableCell>
                        {notification.sentAt 
                          ? new Date(notification.sentAt).toLocaleDateString()
                          : notification.scheduledAt
                          ? new Date(notification.scheduledAt).toLocaleDateString()
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{notification.sentCount}</p>
                          <p className="text-xs text-gray-500">sent</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">
                            {notification.sentCount > 0 
                              ? `${Math.round((notification.deliveredCount / notification.sentCount) * 100)}%`
                              : '-'
                            }
                          </p>
                          <p className="text-xs text-gray-500">
                            {notification.deliveredCount} delivered
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewNotification(notification)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {notification.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Handle edit
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Notification Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Push Notification</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter notification title"
                />
              </div>
              
              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Enter notification message"
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="targetAudience">Target Audience *</Label>
                <Select 
                  value={formData.targetAudience} 
                  onValueChange={(value: 'all' | 'users' | 'vendors' | 'specific') => 
                    setFormData({...formData, targetAudience: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.isScheduled && (
                <div>
                  <Label htmlFor="scheduledAt">Scheduled Date & Time</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSendNotification}
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {formData.isScheduled ? 'Scheduling...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {formData.isScheduled ? 'Schedule Notification' : 'Send Now'}
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Notification Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Notification Details</DialogTitle>
            </DialogHeader>
            {selectedNotification && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Title</Label>
                  <p className="text-sm font-medium text-gray-900">{selectedNotification.title}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Message</Label>
                  <p className="text-sm text-gray-900">{selectedNotification.message}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Target Audience</Label>
                    <div className="mt-1">{getAudienceBadge(selectedNotification.targetAudience)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedNotification.status)}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Sent Count</Label>
                    <p className="text-sm text-gray-900">{selectedNotification.sentCount}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Delivered Count</Label>
                    <p className="text-sm text-gray-900">{selectedNotification.deliveredCount}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Read Count</Label>
                    <p className="text-sm text-gray-900">{selectedNotification.readCount}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Delivery Rate</Label>
                    <p className="text-sm text-gray-900">
                      {selectedNotification.sentCount > 0 
                        ? `${Math.round((selectedNotification.deliveredCount / selectedNotification.sentCount) * 100)}%`
                        : '-'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Created At</Label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedNotification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedNotification.sentAt && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Sent At</Label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedNotification.sentAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsViewModalOpen(false)}
                    className="flex-1"
                  >
                    Close
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

export default AdminPushNotificationManagement;
