// Comprehensive notification setup utility
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getApp } from 'firebase/app';

const VAPID_KEY = "BJEae_aP7PqzRFAAgS8BybRJ1qgxWkN6Qej5ivrcyYEUruPnxXPqiUDeu0s6i8ARBzgExXqukeKk0UEGi6m-3QU";

// Register service worker
export const registerServiceWorker = async () => {
  try {
    console.log('🔧 Registering service worker...');
    
    if ('serviceWorker' in navigator) {
      // Check if service worker is already registered
      const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (existingRegistration) {
        console.log('✅ Service worker already registered:', existingRegistration);
        return existingRegistration;
      }
      
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log('✅ Service worker registered successfully:', registration);
      return registration;
    } else {
      console.log('❌ Service worker not supported');
      return null;
    }
  } catch (error) {
    console.error('❌ Service worker registration failed:', error);
    // Return null instead of throwing to prevent app crashes
    return null;
  }
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async (messaging) => {
  try {
    console.log('🔔 Requesting notification permission...');
    
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('❌ Notifications not supported');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    console.log('📱 Permission result:', permission);
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      
      // Get FCM token
      console.log('🔑 Getting FCM token...');
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });
      
      if (token) {
        console.log('✅ FCM Token generated:', token.substring(0, 20) + '...');
        return token;
      } else {
        console.log('❌ No FCM token available');
        return null;
      }
    } else {
      console.log('❌ Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting notification permission:', error);
    return null;
  }
};

// Save FCM token to backend for vendors
export const saveTokenToBackend = async (fcmToken, vendorId) => {
  try {
    console.log('💾 Saving FCM token to backend...');
    
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${API_BASE_URL}/vendors/update-fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('vendorToken')}`
      },
      body: JSON.stringify({
        fcmToken,
        vendorId
      })
    });

    if (response.ok) {
      console.log('✅ FCM token saved to backend successfully');
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Failed to save FCM token:', errorData);
      return false;
    }
  } catch (error) {
    console.error('❌ Error saving FCM token:', error);
    return false;
  }
};

// Save FCM token to backend for users
export const saveUserTokenToBackend = async (fcmToken) => {
  try {
    console.log('💾 Saving user FCM token to backend...');
    console.log('FCM Token:', fcmToken.substring(0, 20) + '...');
    
    const token = localStorage.getItem('accessToken');
    console.log('Access token found:', token ? 'Yes' : 'No');
    console.log('Token length:', token ? token.length : 0);
    
    // Normalize API URL to ensure it ends with /api exactly once
    let apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    apiBaseUrl = apiBaseUrl.trim().replace(/\/+$/, ''); // Remove trailing slashes
    // Remove duplicate /api/api if present
    apiBaseUrl = apiBaseUrl.replace(/\/api\/api$/, '/api');
    // Ensure it ends with /api exactly once
    if (!apiBaseUrl.endsWith('/api')) {
      apiBaseUrl = apiBaseUrl.endsWith('/') ? `${apiBaseUrl}api` : `${apiBaseUrl}/api`;
    }
    const API_BASE_URL = apiBaseUrl;
    console.log('API URL:', `${API_BASE_URL}/user/notifications/fcm-token`);
    
    const response = await fetch(`${API_BASE_URL}/user/notifications/fcm-token`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fcmToken
      })
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ User FCM token saved to backend successfully:', result);
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Failed to save user FCM token:', errorData);
      return false;
    }
  } catch (error) {
    console.error('❌ Error saving user FCM token:', error);
    return false;
  }
};

// Save FCM token to backend for admins
export const saveAdminTokenToBackend = async (fcmToken) => {
  try {
    console.log('💾 Saving admin FCM token to backend...');
    
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${API_BASE_URL}/admin/update-fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({
        fcmToken
      })
    });

    if (response.ok) {
      console.log('✅ Admin FCM token saved to backend successfully');
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Failed to save admin FCM token:', errorData);
      return false;
    }
  } catch (error) {
    console.error('❌ Error saving admin FCM token:', error);
    return false;
  }
};

// Setup complete notification system for vendors
export const setupNotifications = async (vendorId) => {
  try {
    console.log('🚀 Setting up complete notification system...');
    
    // Step 1: Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      console.log('⚠️ Service worker registration failed, continuing without notifications');
      return { success: false, error: 'Service worker registration failed' };
    }
    
    // Step 2: Get messaging instance
    const app = getApp();
    const messaging = getMessaging(app);
    
    // Step 3: Request permission and get token
    const fcmToken = await requestNotificationPermission(messaging);
    if (!fcmToken) {
      throw new Error('Failed to get FCM token');
    }
    
    // Step 4: Save token to backend
    const saved = await saveTokenToBackend(fcmToken, vendorId);
    if (!saved) {
      throw new Error('Failed to save FCM token to backend');
    }
    
    // Step 5: Setup foreground message listener
    onMessage(messaging, (payload) => {
      console.log('📱 Foreground message received:', payload);
      console.log('🖼️ Image in payload:', payload.notification?.image);
      
      // Show notification in foreground
      if (payload.notification) {
        const notificationOptions = {
          body: payload.notification.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: payload.data
        };
        
        // Add image if available
        if (payload.notification.image) {
          notificationOptions.image = payload.notification.image;
        }
        
        const notification = new Notification(payload.notification.title, notificationOptions);
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    });
    
    console.log('✅ Complete notification system setup successful!');
    return { success: true, fcmToken };
    
  } catch (error) {
    console.error('❌ Notification setup failed:', error);
    return { success: false, error: error.message };
  }
};

// Setup complete notification system for users
export const setupUserNotifications = async () => {
  try {
    console.log('🚀 Setting up user notification system...');
    
    // Step 1: Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      console.log('⚠️ Service worker registration failed, continuing without notifications');
      return { success: false, error: 'Service worker registration failed' };
    }
    
    // Step 2: Get messaging instance
    const app = getApp();
    const messaging = getMessaging(app);
    
    // Step 3: Request permission and get token
    const fcmToken = await requestNotificationPermission(messaging);
    if (!fcmToken) {
      throw new Error('Failed to get FCM token');
    }
    
    // Step 4: Save token to backend
    const saved = await saveUserTokenToBackend(fcmToken);
    if (!saved) {
      throw new Error('Failed to save FCM token to backend');
    }
    
    // Step 5: Setup foreground message listener
    onMessage(messaging, (payload) => {
      console.log('📱 User foreground message received:', payload);
      console.log('🖼️ Image in payload:', payload.notification?.image);
      
      // Show notification in foreground
      if (payload.notification) {
        const notificationOptions = {
          body: payload.notification.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: payload.data
        };
        
        // Add image if available
        if (payload.notification.image) {
          notificationOptions.image = payload.notification.image;
        }
        
        const notification = new Notification(payload.notification.title, notificationOptions);
        
        notification.onclick = () => {
          window.focus();
          notification.close();
          
          // Navigate to appropriate page based on notification type
          if (payload.data?.type === 'admin_notification') {
            window.location.href = '/notifications';
          } else if (payload.data?.type === 'booking') {
            window.location.href = '/booking';
          } else if (payload.data?.type === 'payment') {
            window.location.href = '/profile';
          } else {
            window.location.href = '/notifications';
          }
        };
      }
    });
    
    console.log('✅ User notification system setup successful!');
    return { success: true, fcmToken };
    
  } catch (error) {
    console.error('❌ User notification setup failed:', error);
    return { success: false, error: error.message };
  }
};

// Setup complete notification system for admins
export const setupAdminNotifications = async () => {
  try {
    console.log('🚀 Setting up admin notification system...');
    
    // Step 1: Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      console.log('⚠️ Service worker registration failed, continuing without notifications');
      return { success: false, error: 'Service worker registration failed' };
    }
    
    // Step 2: Get messaging instance
    const app = getApp();
    const messaging = getMessaging(app);
    
    // Step 3: Request permission and get token
    const fcmToken = await requestNotificationPermission(messaging);
    if (!fcmToken) {
      throw new Error('Failed to get FCM token');
    }
    
    // Step 4: Save token to backend
    const saved = await saveAdminTokenToBackend(fcmToken);
    if (!saved) {
      throw new Error('Failed to save admin FCM token to backend');
    }
    
    // Step 5: Setup foreground message listener
    onMessage(messaging, (payload) => {
      console.log('📱 Admin foreground message received:', payload);
      console.log('🖼️ Image in payload:', payload.notification?.image);
      
      // Show notification in foreground
      if (payload.notification) {
        const notificationOptions = {
          body: payload.notification.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: payload.data
        };
        
        // Add image if available
        if (payload.notification.image) {
          notificationOptions.image = payload.notification.image;
        }
        
        const notification = new Notification(payload.notification.title, notificationOptions);
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    });
    
    console.log('✅ Admin notification system setup successful!');
    return { success: true, fcmToken };
    
  } catch (error) {
    console.error('❌ Admin notification setup failed:', error);
    return { success: false, error: error.message };
  }
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
