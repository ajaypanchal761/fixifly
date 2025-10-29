import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// Firebase removed - stub functions
const requestPermission = async () => {
  console.log('⚠️ Firebase removed - notifications disabled');
  return null;
};
const onMessageListener = () => {
  return Promise.resolve(null);
};

export const usePushNotifications = () => {
  const [token, setToken] = useState(null);
  const [permission, setPermission] = useState(Notification.permission);
  const [isSupported, setIsSupported] = useState(false);

  // Check if notifications are supported
  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
    }
  }, []);

  // Automatically request permission and get token when component mounts
  useEffect(() => {
    const autoRequestPermission = async () => {
      if (isSupported && permission === 'default' && !token) {
        console.log('🔔 Auto-requesting notification permission...');
        try {
          const fcmToken = await requestPermission();
          if (fcmToken) {
            setToken(fcmToken);
            setPermission(Notification.permission);
            console.log('✅ FCM token generated automatically:', fcmToken.substring(0, 20) + '...');
          }
        } catch (error) {
          console.error('Error auto-requesting permission:', error);
        }
      }
    };

    autoRequestPermission();
  }, [isSupported, permission, token, requestPermission]);

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
                // Handle notification click
                if (payload.data?.type === 'support_ticket_assignment') {
                  window.location.href = '/vendor/support-tickets';
                } else if (payload.data?.type === 'booking_assignment') {
                  window.location.href = '/vendor/bookings';
                } else {
                  window.location.href = '/vendor/dashboard';
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

  // Save FCM token to backend - DISABLED
  const saveTokenToBackend = useCallback(async (vendorId, fcmToken) => {
    // PUSH NOTIFICATIONS DISABLED
    console.log('⚠️ Push notifications are disabled - FCM token save disabled');
    return false;
    // try {
    //   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    //   const response = await fetch(`${API_BASE_URL}/vendors/update-fcm-token`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${localStorage.getItem('vendorToken')}`
    //     },
    //     body: JSON.stringify({
    //       fcmToken,
    //       vendorId
    //     })
    //   });

    //   if (response.ok) {
    //     console.log('✅ FCM token saved to backend successfully');
    //     return true;
    //   } else {
    //     const errorData = await response.json().catch(() => ({}));
    //     console.error('❌ Failed to save FCM token to backend:', {
    //       status: response.status,
    //       statusText: response.statusText,
    //       error: errorData
    //     });
    //     return false;
    //   }
    // } catch (error) {
    //   console.error('❌ Error saving FCM token to backend:', error);
    //   return false;
    // }
  }, []);

  // Automatically save token to backend when token is generated - DISABLED
  useEffect(() => {
    // PUSH NOTIFICATIONS DISABLED
    // const autoSaveToken = async () => {
    //   if (token && window.location.pathname.includes('/vendor')) {
    //     // Try to get vendor ID from various sources
    //     let vendorId = null;
    //     
    //     // Try to get from localStorage or sessionStorage
    //     vendorId = localStorage.getItem('vendorId') || sessionStorage.getItem('vendorId');
    //     
    //     // If not found, try to get from current user context
    //     if (!vendorId) {
    //       try {
    //         const response = await fetch('/api/vendor/profile', {
    //           headers: {
    //             'Authorization': `Bearer ${localStorage.getItem('vendorToken')}`
    //           }
    //         });
    //         if (response.ok) {
    //           const data = await response.json();
    //           vendorId = data.vendor?._id || data._id;
    //         }
    //       } catch (error) {
    //         console.log('Could not fetch vendor profile for token saving');
    //       }
    //     }
    //     
    //     if (vendorId) {
    //       console.log('🔄 Auto-saving FCM token to backend...');
    //       const saved = await saveTokenToBackend(vendorId, token);
    //       if (saved) {
    //         console.log('✅ FCM token auto-saved to backend');
    //       }
    //     } else {
    //       console.log('⚠️ Could not find vendor ID for auto-saving FCM token');
    //     }
    //   }
    // };

    // autoSaveToken();
  }, [token, saveTokenToBackend]);

  return {
    token,
    permission,
    isSupported,
    requestNotificationPermission,
    saveTokenToBackend
  };
};
