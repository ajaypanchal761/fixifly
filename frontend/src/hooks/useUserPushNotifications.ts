import { useState, useEffect, useCallback } from 'react';
import { requestPermission, onMessageListener } from '../firebase-messaging';
import { setupUserNotifications } from '../utils/notificationSetup';
import { toast } from 'sonner';
import userNotificationApi from '../services/userNotificationApi';
import { useAuth } from '../contexts/AuthContext';

export const useUserPushNotifications = () => {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);
  const [isSupported, setIsSupported] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Check if notifications are supported
  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
    }
  }, []);

  // Request permission and get token
  const requestNotificationPermission = useCallback(async () => {
    if (!isSupported) {
      console.log('Push notifications are not supported in this browser');
      return null;
    }

    try {
      const fcmToken = await requestPermission();
      if (fcmToken) {
        setToken(fcmToken);
        setPermission(Notification.permission);
        return fcmToken;
      }
      return null;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return null;
    }
  }, [isSupported]);

  // Save FCM token to backend - DISABLED
  const saveTokenToBackend = useCallback(async (fcmToken: string) => {
    // PUSH NOTIFICATIONS DISABLED
    console.log('⚠️ Push notifications are disabled - FCM token save disabled');
    return false;
    // if (!isAuthenticated) {
    //   console.log('User not authenticated, cannot save FCM token');
    //   return false;
    // }

    // try {
    //   const response = await userNotificationApi.updateFcmToken(fcmToken);
    //   if (response.success) {
    //     console.log('✅ FCM token saved to backend successfully');
    //     return true;
    //   } else {
    //     console.error('❌ Failed to save FCM token to backend:', response);
    //     return false;
    //   }
    // } catch (error) {
    //   console.error('❌ Error saving FCM token to backend:', error);
    //   return false;
    // }
  }, [isAuthenticated]);

  // Automatically request permission and get token when user is authenticated - DISABLED
  useEffect(() => {
    // PUSH NOTIFICATIONS DISABLED
    console.log('⚠️ Push notifications are disabled');
    // const autoRequestPermission = async () => {
    //   if (isSupported && isAuthenticated && !token) {
    //     console.log('🔔 Auto-requesting notification permission for user...');
    //     console.log('Current permission status:', permission);
    //     console.log('User authenticated:', isAuthenticated);
    //     console.log('User data:', user);
    //     
    //     try {
    //       // Use comprehensive setup for automatic token generation
    //       const result = await setupUserNotifications();
    //       if (result.success) {
    //         setToken(result.fcmToken);
    //         setPermission(Notification.permission);
    //         console.log('✅ FCM token generated automatically for user:', result.fcmToken.substring(0, 20) + '...');
    //       } else {
    //         console.log('❌ FCM token generation failed:', result.error);
    //       }
    //     } catch (error) {
    //       console.error('Error auto-requesting permission:', error);
    //     }
    //   }
    // };

    // autoRequestPermission();
  }, [isSupported, isAuthenticated, user, token]);

  // Automatically save token to backend when token is generated and user is authenticated - DISABLED
  useEffect(() => {
    // PUSH NOTIFICATIONS DISABLED
    // const autoSaveToken = async () => {
    //   if (token && isAuthenticated && user) {
    //     console.log('🔄 Auto-saving FCM token to backend for user...');
    //     const saved = await saveTokenToBackend(token);
    //     if (saved) {
    //       console.log('✅ FCM token auto-saved to backend for user');
    //     } else {
    //       console.log('⚠️ Failed to save FCM token to backend for user');
    //     }
    //   }
    // };

    // autoSaveToken();
  }, [token, isAuthenticated, user, saveTokenToBackend]);

  // Listen for foreground messages
  useEffect(() => {
    if (isSupported && permission === 'granted') {
      const unsubscribe = onMessageListener().then((payload) => {
        if (payload) {
          // Show toast notification for foreground messages
          toast.success(payload.notification?.title || 'New Notification', {
            description: payload.notification?.body || 'You have a new notification',
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => {
                // Handle notification click - navigate to notifications page
                if (payload.data?.type === 'admin_notification') {
                  window.location.href = '/notifications';
                } else if (payload.data?.type === 'booking') {
                  window.location.href = '/booking';
                } else if (payload.data?.type === 'payment') {
                  window.location.href = '/profile';
                } else {
                  window.location.href = '/notifications';
                }
              }
            }
          });
        }
      });

      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [isSupported, permission]);

  return {
    token,
    permission,
    isSupported,
    requestNotificationPermission,
    saveTokenToBackend
  };
};
