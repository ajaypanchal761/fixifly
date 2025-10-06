import React, { useState } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { ArrowLeft, Bell, CheckCircle, AlertTriangle, Info, Clock, User, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VendorBottomNav from '../components/VendorBottomNav';
import Footer from '../../components/Footer';
import NotFound from '../../pages/NotFound';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const VendorNotifications = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: 'AC Repair task assigned in Sector 15, Gurgaon',
      time: '2 minutes ago',
      isRead: false,
      priority: 'high'
    },
    {
      id: 2,
      type: 'payment_received',
      title: 'Payment Received',
      message: 'Payment of ₹2,500 received for Case ID: CASE-2024-001',
      time: '1 hour ago',
      isRead: false,
      priority: 'medium'
    },
    {
      id: 3,
      type: 'task_reminder',
      title: 'Task Reminder',
      message: 'Washing Machine service scheduled for 2:00 PM today',
      time: '3 hours ago',
      isRead: true,
      priority: 'medium'
    },
    {
      id: 4,
      type: 'system_update',
      title: 'System Update',
      message: 'New features added to vendor dashboard. Check it out!',
      time: '1 day ago',
      isRead: true,
      priority: 'low'
    },
    {
      id: 5,
      type: 'task_cancelled',
      title: 'Task Cancelled',
      message: 'Refrigerator repair task cancelled by customer',
      time: '2 days ago',
      isRead: true,
      priority: 'low'
    }
  ]);

  // Show 404 error on desktop
  if (!isMobile) {
    return <NotFound />;
  }

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

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`shadow-sm border-0 cursor-pointer transition-all ${
                  notification.isRead 
                    ? 'bg-white' 
                    : 'bg-blue-50 border-l-4 border-l-blue-500'
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className={`font-semibold text-sm ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className={`text-sm mb-2 ${notification.isRead ? 'text-gray-600' : 'text-gray-700'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">{notification.time}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
