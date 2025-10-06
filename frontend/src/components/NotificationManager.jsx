import React, { useEffect } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Button } from './ui/button';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';

const NotificationManager = ({ vendorId }) => {
  const {
    token,
    permission,
    isSupported,
    requestNotificationPermission,
    saveTokenToBackend
  } = usePushNotifications();

  // Initialize notifications when component mounts
  useEffect(() => {
    const initializeNotifications = async () => {
      if (isSupported && permission === 'default') {
        // Request permission automatically
        const fcmToken = await requestNotificationPermission();
        if (fcmToken && vendorId) {
          await saveTokenToBackend(vendorId, fcmToken);
        }
      } else if (permission === 'granted' && !token) {
        // Permission already granted but no token, request token
        const fcmToken = await requestNotificationPermission();
        if (fcmToken && vendorId) {
          await saveTokenToBackend(vendorId, fcmToken);
        }
      }
    };

    initializeNotifications();
  }, [isSupported, permission, vendorId, requestNotificationPermission, saveTokenToBackend, token]);

  const handleEnableNotifications = async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return;
    }

    const fcmToken = await requestNotificationPermission();
    if (fcmToken && vendorId) {
      const saved = await saveTokenToBackend(vendorId, fcmToken);
      if (saved) {
        toast.success('Notifications enabled successfully!');
      } else {
        toast.error('Failed to enable notifications');
      }
    } else {
      toast.error('Failed to get notification permission');
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="h-4 w-4" />
        <span>Push notifications not supported</span>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500">
        <BellOff className="h-4 w-4" />
        <span>Notifications blocked. Please enable in browser settings.</span>
      </div>
    );
  }

  if (permission === 'granted' && token) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-500">
        <Bell className="h-4 w-4" />
        <span>Notifications enabled</span>
      </div>
    );
  }

  return (
    <Button
      onClick={handleEnableNotifications}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Bell className="h-4 w-4" />
      Enable Notifications
    </Button>
  );
};

export default NotificationManager;
