// Notification setup utility - Firebase removed
// All functions return early without performing any actions
import { normalizeApiUrl } from './apiUrl';

// Register service worker - DISABLED
export const registerServiceWorker = async () => {
  console.log('⚠️ Push notifications are disabled');
  return null;
};

// Request notification permission - DISABLED
export const requestNotificationPermission = async (messaging) => {
  console.log('⚠️ Push notifications are disabled');
  return null;
};

// Save FCM token to backend for vendors - DISABLED
export const saveTokenToBackend = async (fcmToken, vendorId) => {
  console.log('⚠️ Push notifications are disabled - FCM token save disabled');
  return false;
};

// Save FCM token to backend for users - DISABLED
export const saveUserTokenToBackend = async (fcmToken) => {
  console.log('⚠️ Push notifications are disabled - FCM token save disabled');
  // DO NOT CALL API - RETURN IMMEDIATELY
  return false;
  // const API_BASE_URL = normalizeApiUrl(import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
  // try {
  //   const response = await fetch(`${API_BASE_URL}/user/notifications/fcm-token`, {
  //     method: 'PUT',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': `Bearer ${localStorage.getItem('token')}`
  //     },
  //     body: JSON.stringify({ fcmToken })
  //   });

  //   if (response.ok) {
  //     console.log('✅ FCM token saved to backend successfully');
  //     return true;
  //   } else {
  //     const errorData = await response.json().catch(() => ({}));
  //     console.error('❌ Failed to save FCM token to backend:', errorData);
  //     return false;
  //   }
  // } catch (error) {
  //   console.error('❌ Error saving FCM token to backend:', error);
  //   return false;
  // }
};

// Save FCM token to backend for admins - DISABLED
export const saveAdminTokenToBackend = async (fcmToken) => {
  console.log('⚠️ Push notifications are disabled - FCM token save disabled');
  return false;
};

// Setup complete notification system for vendors - DISABLED
export const setupNotifications = async (vendorId) => {
  console.log('⚠️ Push notifications are disabled');
  return { success: false, error: 'Push notifications are disabled' };
};

// Setup complete notification system for users - DISABLED
export const setupUserNotifications = async () => {
  // PUSH NOTIFICATIONS COMPLETELY DISABLED - NO API CALLS
  console.log('⚠️ Push notifications are disabled - setupUserNotifications');
  // Return immediately without any operations
  return Promise.resolve({ success: false, error: 'Push notifications are disabled', fcmToken: null });
  // try {
  //   console.log('🚀 Setting up user notification system...');
  //   
  //   // Step 1: Register service worker
  //   const registration = await registerServiceWorker();
  //   if (!registration) {
  //     console.log('⚠️ Service worker registration failed, continuing without notifications');
  //     return { success: false, error: 'Service worker registration failed' };
  //   }
  //   
  //   // Step 2: Get messaging instance
  //   const app = getApp();
  //   const messaging = getMessaging(app);
  //   
  //   // Step 3: Request permission and get token
  //   const fcmToken = await requestNotificationPermission(messaging);
  //   if (!fcmToken) {
  //     throw new Error('Failed to get FCM token');
  //   }
  //   
  //   // Step 4: Save token to backend
  //   const saved = await saveUserTokenToBackend(fcmToken);
  //   if (!saved) {
  //     throw new Error('Failed to save FCM token to backend');
  //   }
  //   
  //   // Step 5: Setup foreground message listener
  //   onMessage(messaging, (payload) => {
  //     console.log('📱 User foreground message received:', payload);
  //     console.log('🖼️ Image in payload:', payload.notification?.image);
  //     
  //     // Show notification in foreground
  //     if (payload.notification) {
  //       const notificationOptions = {
  //         body: payload.notification.body,
  //         icon: '/favicon.ico',
  //         badge: '/favicon.ico',
  //         data: payload.data
  //       };
  //       
  //       // Add image if available
  //       if (payload.notification.image) {
  //         notificationOptions.image = payload.notification.image;
  //       }
  //       
  //       const notification = new Notification(payload.notification.title, notificationOptions);
  //       
  //       notification.onclick = () => {
  //         window.focus();
  //         notification.close();
  //         
  //         // Navigate to appropriate page based on notification type
  //         if (payload.data?.type === 'admin_notification') {
  //           window.location.href = '/notifications';
  //         } else if (payload.data?.type === 'booking') {
  //           window.location.href = '/booking';
  //         } else if (payload.data?.type === 'payment') {
  //           window.location.href = '/profile';
  //         } else {
  //           window.location.href = '/notifications';
  //         }
  //       };
  //     }
  //   });
  //   
  //   console.log('✅ User notification system setup successful!');
  //   return { success: true, fcmToken };
  //   
  // } catch (error) {
  //   console.error('❌ User notification setup failed:', error);
  //   return { success: false, error: error.message };
  // }
};

// Setup complete notification system for admins - DISABLED
export const setupAdminNotifications = async () => {
  console.log('⚠️ Push notifications are disabled');
  return { success: false, error: 'Push notifications are disabled' };
};

// Test notification
export const testNotification = () => {
  try {
    console.log('🧪 Testing notification...');
    
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Fixfly Test Notification', {
        body: 'This is a test notification to verify the system is working.',
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      console.log('✅ Test notification sent');
      return true;
    } else {
      console.log('❌ Notifications not available or permission not granted');
      return false;
    }
  } catch (error) {
    console.error('❌ Test notification failed:', error);
    return false;
  }
};
