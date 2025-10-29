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
  return false;
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
  console.log('⚠️ Push notifications are disabled');
  return { success: false, error: 'Push notifications are disabled' };
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
