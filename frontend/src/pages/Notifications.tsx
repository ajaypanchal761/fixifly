import React, { useState, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { ArrowLeft, Bell, CheckCircle, AlertTriangle, Info, Clock, User, MapPin, Calendar, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MobileBottomNav from '@/components/MobileBottomNav';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import NotFound from './NotFound';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import userNotificationApi, { UserNotification } from '@/services/userNotificationApi';
import { toast } from 'sonner';

// Remove the old interface since we're using the one from the API service


const Notifications = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'payment':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'system':
        return <Info className="w-5 h-5 text-purple-600" />;
      case 'service':
        return <Wrench className="w-5 h-5 text-orange-600" />;
      case 'promotion':
        return <Bell className="w-5 h-5 text-pink-600" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };


  const markAsRead = async (notificationId: string) => {
    try {
      await userNotificationApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await userNotificationApi.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleNotificationClick = (notification: UserNotification) => {
    markAsRead(notification._id);
    
    // Navigate based on notification type and data
    if (notification.data?.type === 'admin_notification') {
      // Admin notifications - stay on notifications page or navigate to specific page
      if (notification.data?.action === 'booking') {
        navigate('/booking');
      } else if (notification.data?.action === 'profile') {
        navigate('/profile');
      } else {
        // Stay on notifications page for general admin notifications
        return;
      }
    } else if (notification.type === 'booking' && notification.bookingId) {
      navigate('/booking');
    } else if (notification.type === 'payment') {
      navigate('/profile');
    } else if (notification.type === 'service') {
      navigate('/booking');
    } else {
      // Default navigation
      navigate('/booking');
    }
  };

  // Load notifications function
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await userNotificationApi.getNotifications();
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Load notifications on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated]);

  // Refresh notifications when page becomes visible (for new notifications)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        loadNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  // Remove this line since we're now using the unreadCount state from API

  return (
    <div className="min-h-screen bg-gray-50">
      {isMobile ? (
        // Mobile Layout
        <>
          {/* Mobile Header */}
          <div className="bg-white shadow-sm border-b">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToHome}
                    className="p-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
                    {unreadCount > 0 && (
                      <p className="text-sm text-gray-500">{unreadCount} unread</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadNotifications}
                    className="text-sm"
                    disabled={loading}
                  >
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </Button>
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

          {/* Mobile Notifications List */}
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                  <p className="text-gray-500">You're all caught up! We'll notify you when something new happens.</p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification._id} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{notification.timeAgo}</span>
                          {notification.serviceType && (
                            <Badge variant="outline" className="text-xs">
                              {notification.serviceType}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />
          
          {/* Footer */}
          <Footer />
        </>
      ) : (
        // Desktop Layout
        <>
          <Header />
          
          {/* Desktop Notifications Header */}
          <div className="bg-white shadow-sm border-b pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/")}
                    className="p-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
                    {unreadCount > 0 && (
                      <p className="text-sm text-gray-500">{unreadCount} unread</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadNotifications}
                    className="text-sm"
                    disabled={loading}
                  >
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </Button>
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
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No notifications</h3>
                  <p className="text-gray-500">You're all caught up! We'll notify you when something new happens.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <Card 
                    key={notification._id} 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`text-base font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{notification.timeAgo}</span>
                            {notification.serviceType && (
                              <Badge variant="outline" className="text-sm">
                                {notification.serviceType}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Notifications;
