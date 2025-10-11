import React, { useState, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { ArrowLeft, Bell, CheckCircle, AlertTriangle, Info, Clock, User, MapPin, Loader2, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VendorBottomNav from '../components/VendorBottomNav';
import Footer from '../../components/Footer';
import NotFound from '../../pages/NotFound';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import vendorNotificationApi, { VendorNotification } from '@/services/vendorNotificationApi';

// Desktop Vendor Notifications Component
const DesktopVendorNotifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<VendorNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <User className="w-5 h-5 text-blue-600" />;
      case 'payment_received':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'task_reminder':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'system_update':
        return <Info className="w-5 h-5 text-purple-600" />;
      case 'task_cancelled':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await vendorNotificationApi.getNotifications({
        page: 1,
        limit: 50
      });
      
      if (response.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.pagination.unreadCount);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch notifications",
          variant: "destructive"
        });
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

  const markAsRead = async (id: string) => {
    try {
      const response = await vendorNotificationApi.markAsRead(id);
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === id 
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to mark notification as read",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await vendorNotificationApi.markAllAsRead();
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast({
          title: "Success",
          description: "All notifications marked as read",
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to mark all notifications as read",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      });
    }
  };

  // Load notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/vendor")}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Vendor Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-500">{unreadCount} unread</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-sm"
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Notifications List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">You're all caught up! We'll notify you when something new happens.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Loading notifications...</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification._id} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white'
                  }`}
                  onClick={() => markAsRead(notification._id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h3 className={`text-base font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h3>
                            {notification.image && (
                              <div className="flex items-center space-x-1">
                                <ImageIcon className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-blue-600">Image</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {!notification.isRead && (
                              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{notification.message}</p>
                        
                        {/* Display notification image if available */}
                        {notification.image && (
                          <div className="mb-3">
                            <img
                              src={notification.image.secure_url}
                              alt="Notification"
                              className="w-full max-w-md h-48 object-cover rounded-lg border"
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const VendorNotifications = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Show desktop version - must be before any other hooks
  if (!isMobile) {
    return <DesktopVendorNotifications />;
  }

  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<VendorNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'payment_received':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'task_reminder':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'system_update':
        return <Info className="w-4 h-4 text-purple-600" />;
      case 'task_cancelled':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return 'bg-blue-50 border-blue-200';
      case 'payment_received':
        return 'bg-green-50 border-green-200';
      case 'task_reminder':
        return 'bg-orange-50 border-orange-200';
      case 'system_update':
        return 'bg-purple-50 border-purple-200';
      case 'task_cancelled':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await vendorNotificationApi.getNotifications({
        page: 1,
        limit: 50
      });
      
      if (response.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.pagination.unreadCount);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch notifications",
          variant: "destructive"
        });
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

  const markAsRead = async (id: string) => {
    try {
      const response = await vendorNotificationApi.markAsRead(id);
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === id 
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to mark notification as read",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await vendorNotificationApi.markAllAsRead();
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast({
          title: "Success",
          description: "All notifications marked as read",
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to mark all notifications as read",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      });
    }
  };

  // Load notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Custom Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-800 border-red-200">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 font-medium hover:text-blue-700"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <main className="flex-1 pb-24 overflow-y-auto">
        <div className="container mx-auto px-4 py-4">
          {/* Notifications List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Loading notifications...</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification._id} 
                  className={`shadow-sm border-0 cursor-pointer transition-all ${
                    notification.isRead 
                      ? 'bg-white' 
                      : 'bg-blue-50 border-l-4 border-l-blue-500'
                  }`}
                  onClick={() => markAsRead(notification._id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <h3 className={`font-semibold text-sm ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                              {notification.title}
                            </h3>
                            {notification.image && (
                              <div className="flex items-center space-x-1">
                                <ImageIcon className="w-3 h-3 text-blue-600" />
                                <span className="text-xs text-blue-600">Image</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm mb-2 ${notification.isRead ? 'text-gray-600' : 'text-gray-700'}`}>
                          {notification.message}
                        </p>
                        
                        {/* Display notification image if available */}
                        {notification.image && (
                          <div className="mb-2">
                            <img
                              src={notification.image.secure_url}
                              alt="Notification"
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                          </div>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Empty State */}
          {notifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">No notifications</h3>
              <p className="text-sm text-gray-400">
                You're all caught up! New notifications will appear here.
              </p>
            </div>
          )}
        </div>
      </main>
      <div className="md:hidden">
        <Footer />
        <VendorBottomNav />
      </div>
    </div>
  );
};

export default VendorNotifications;
