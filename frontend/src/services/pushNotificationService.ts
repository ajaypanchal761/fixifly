// Push Notification Service for Fixfly
import { messaging, getToken, onMessage, VAPID_KEY, isValidVAPIDKey } from '../firebase';
import { normalizeApiUrl } from '../utils/apiUrl';

const API_BASE_URL = normalizeApiUrl(import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

// Service worker registration
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register service worker for push notifications
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Workers are not supported in this browser');
    return null;
  }

  try {
    // Check if service worker is already registered
    const existingRegistration = await navigator.serviceWorker.getRegistration('/');
    if (existingRegistration) {
      console.log('✅ Service Worker already registered');
      serviceWorkerRegistration = existingRegistration;
      
      // Wait for it to be active
      if (existingRegistration.active) {
        console.log('✅ Service Worker is already active');
        return existingRegistration;
      } else if (existingRegistration.installing) {
        console.log('⏳ Service Worker is installing, waiting...');
        await new Promise<void>((resolve) => {
          const worker = existingRegistration.installing;
          if (worker) {
            worker.addEventListener('statechange', () => {
              if (worker.state === 'activated') {
                console.log('✅ Service Worker activated');
                resolve();
              }
            });
          } else {
            resolve();
          }
        });
        return existingRegistration;
      } else if (existingRegistration.waiting) {
        console.log('⏳ Service Worker is waiting, activating...');
        existingRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Reload to activate waiting service worker
        window.location.reload();
        return existingRegistration;
      }
    }

    // Register new service worker
    console.log('📝 Registering new Service Worker...');
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    
    console.log('✅ Service Worker registered successfully');
    serviceWorkerRegistration = registration;

    // Wait for service worker to be ready
    if (registration.installing) {
      console.log('⏳ Service Worker is installing, waiting for activation...');
      await new Promise<void>((resolve) => {
        const worker = registration.installing;
        if (worker) {
          worker.addEventListener('statechange', () => {
            console.log(`📊 Service Worker state: ${worker.state}`);
            if (worker.state === 'activated') {
              console.log('✅ Service Worker activated');
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    } else if (registration.waiting) {
      console.log('⏳ Service Worker is waiting, activating...');
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else if (registration.active) {
      console.log('✅ Service Worker is already active');
    }

    // Double check it's active
    if (!registration.active) {
      console.warn('⚠️ Service Worker registered but not active yet, waiting...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('⚠️ This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    console.log('✅ Notification permission already granted');
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    console.warn('⚠️ Notification permission was denied');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('📱 Notification permission:', permission);
    return permission;
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Get FCM token and register it with backend
 */
export const registerFCMToken = async (forceUpdate: boolean = false): Promise<string | null> => {
  if (!messaging) {
    console.error('❌ Firebase messaging not initialized');
    return null;
  }

  // Check if we're in a secure context (HTTPS or localhost)
  const isSecureContext = window.isSecureContext || 
    location.protocol === 'https:' || 
    location.hostname === 'localhost' || 
    location.hostname === '127.0.0.1';
  
  if (!isSecureContext) {
    console.error('❌ Push notifications require HTTPS (or localhost). Current protocol:', location.protocol);
    return null;
  }

  try {
    // Check if service worker is registered and active
    if (!serviceWorkerRegistration) {
      console.log('📝 Registering service worker...');
      const registration = await registerServiceWorker();
      if (!registration) {
        console.error('❌ Failed to register service worker');
        return null;
      }
      serviceWorkerRegistration = registration;
    }

    // Ensure service worker is active before proceeding
    let attempts = 0;
    const maxAttempts = 10;
    while (serviceWorkerRegistration && !serviceWorkerRegistration.active && attempts < maxAttempts) {
      console.log(`⏳ Waiting for service worker to be active... (attempt ${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
      // Re-check registration
      const currentRegistration = await navigator.serviceWorker.getRegistration('/');
      if (currentRegistration && currentRegistration.active) {
        serviceWorkerRegistration = currentRegistration;
        break;
      }
    }

    if (!serviceWorkerRegistration || !serviceWorkerRegistration.active) {
      console.error('❌ Service worker is not active after waiting. Please refresh the page.');
      return null;
    }

    console.log('✅ Service worker is active and ready');

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('⚠️ Notification permission not granted');
      return null;
    }

    // Get FCM token
    let currentToken: string | null = null;
    try {
      // Verify service worker is still active
      if (!serviceWorkerRegistration.active) {
        throw new Error('Service worker is not active');
      }
      
      console.log('🔑 Getting FCM token with active service worker...');

      // Always use VAPID key if provided
      if (isValidVAPIDKey && VAPID_KEY) {
        console.log('🔑 Using VAPID key:', VAPID_KEY.substring(0, 20) + '...');
        console.log('🔑 Full VAPID key length:', VAPID_KEY.length);
        
        // Try to get token with VAPID key
        currentToken = await getToken(messaging, { 
          vapidKey: VAPID_KEY.trim(),
          serviceWorkerRegistration: serviceWorkerRegistration || undefined
        });
      } else {
        console.warn('⚠️ VAPID key not provided. Trying without VAPID key...');
        // Try without VAPID key - Firebase may use the default key from project settings
        currentToken = await getToken(messaging, {
          serviceWorkerRegistration: serviceWorkerRegistration || undefined
        });
      }
    } catch (error: any) {
      console.error('❌ Error getting FCM token:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Provide helpful error messages
      if (error.code === 'messaging/invalid-vapid-key' || 
          error.message?.includes('applicationServerKey') ||
          error.message?.includes('not valid')) {
        console.error('❌ VAPID key validation failed. This might be due to:');
        console.error('   1. Key format issue - ensure it\'s copied correctly from Firebase Console');
        console.error('   2. Service worker not ready - try refreshing the page');
        console.error('   3. Browser compatibility - ensure you\'re using a supported browser');
        console.error('   4. HTTPS required - push notifications only work on HTTPS (or localhost)');
        console.error('');
        console.error('💡 Current VAPID key:', VAPID_KEY);
        console.error('💡 Key length:', VAPID_KEY?.length || 0);
      } else if (error.code === 'messaging/permission-blocked') {
        console.warn('⚠️ Notification permission is blocked. Please enable it in browser settings.');
      } else if (error.code === 'messaging/unsupported-browser') {
        console.warn('⚠️ This browser does not support Firebase Cloud Messaging.');
      } else if (error.code === 'messaging/failed-service-worker-registration') {
        console.error('❌ Service worker registration failed. Check if firebase-messaging-sw.js is accessible.');
      } else if (error.message?.includes('no active Service Worker') || error.message?.includes('Subscription failed')) {
        console.error('❌ Service worker is not active. This usually means:');
        console.error('   1. Service worker file is not accessible at /firebase-messaging-sw.js');
        console.error('   2. Service worker failed to install/activate');
        console.error('   3. Browser blocked service worker registration');
        console.error('');
        console.error('💡 Solutions:');
        console.error('   1. Check if firebase-messaging-sw.js exists in public/ folder');
        console.error('   2. Clear browser cache and reload');
        console.error('   3. Check browser console for service worker errors');
        console.error('   4. Try in incognito mode to rule out extension conflicts');
        console.error('   5. Ensure you\'re on HTTPS or localhost');
      } else if (error.code === 'messaging/token-subscribe-failed') {
        console.error('❌ FCM token subscription failed. This usually means:');
        console.error('   1. Firebase Cloud Messaging API is not enabled in Google Cloud Console');
        console.error('   2. API key restrictions are blocking FCM API access');
        console.error('   3. Service account lacks proper permissions');
        console.error('');
        console.error('💡 Solution:');
        console.error('   1. Go to: https://console.cloud.google.com/apis/library/fcm.googleapis.com');
        console.error('   2. Select project: fixfly-fb12b');
        console.error('   3. Click "Enable" button');
        console.error('   4. Wait 2-3 minutes and try again');
        console.error('');
        console.error('📖 See FIREBASE_API_SETUP.md for detailed instructions');
      }
      return null;
    }

    if (!currentToken) {
      console.warn('⚠️ No FCM token available');
      return null;
    }

    console.log('✅ FCM Token generated:', currentToken.substring(0, 20) + '...');

    // Check if user is a vendor or regular user
    const vendorToken = localStorage.getItem('vendorToken');
    const userToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const authToken = vendorToken || userToken;
    const isVendor = !!vendorToken;
    
    if (!authToken) {
      console.warn('⚠️ User not logged in, skipping token registration');
      return currentToken;
    }

    // Save token to backend - use vendor endpoint if vendor, user endpoint otherwise
    try {
      const endpoint = isVendor 
        ? `${API_BASE_URL}/vendors/save-fcm-token`
        : `${API_BASE_URL}/users/save-fcm-token`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          token: currentToken,
          platform: 'web',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`✅ FCM token saved to backend successfully (${isVendor ? 'vendor' : 'user'})`);
      } else {
        console.warn(`⚠️ Failed to save FCM token to backend (${isVendor ? 'vendor' : 'user'}):`, data.message);
      }
    } catch (error) {
      console.error(`❌ Error saving FCM token to backend (${isVendor ? 'vendor' : 'user'}):`, error);
    }

    return currentToken;
  } catch (error) {
    console.error('❌ Error in registerFCMToken:', error);
    return null;
  }
};

/**
 * Initialize push notifications
 * Call this when app loads
 */
export const initializePushNotifications = async (): Promise<void> => {
  console.log('🚀 Initializing push notifications...');

  // Register service worker
  await registerServiceWorker();

  // Wait a bit for service worker to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Register FCM token
  await registerFCMToken();
};

/**
 * Setup foreground notification handler
 * This handles notifications when app is in foreground
 */
export const setupForegroundNotificationHandler = (
  onNotificationReceived?: (payload: any) => void
): (() => void) => {
  if (!messaging) {
    console.warn('⚠️ Firebase messaging not initialized');
    return () => {};
  }

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📬 Message received in foreground:', payload);

      // Show browser notification
      if (payload.notification) {
        const { title, body, icon } = payload.notification;
        
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification(title || 'Fixfly Notification', {
            body: body || 'You have a new notification',
            icon: icon || '/favicon.png',
            badge: '/favicon.png',
            tag: payload.data?.tag || 'fixfly-notification',
            data: payload.data || {},
          });

          // Handle notification click
          notification.onclick = (event) => {
            event.preventDefault();
            // Get link from multiple possible locations
            const notificationData = payload.data || {};
            let link = notificationData.link || 
                       payload.fcmOptions?.link || 
                       (notificationData.type === 'booking_assignment' && notificationData.bookingId 
                         ? `/vendor/task/${notificationData.bookingId}` 
                         : null) ||
                       (notificationData.type === 'booking_assignment' && notificationData.taskId 
                         ? `/vendor/task/${notificationData.taskId}` 
                         : null) ||
                       '/';
            
            console.log('📬 Notification clicked, navigating to:', link);
            window.focus();
            
            // Use React Router navigation if available, otherwise use window.location
            if (window.location.pathname.startsWith('/vendor')) {
              window.location.href = link;
            } else {
              window.location.href = link;
            }
            notification.close();
          };
        }
      }

      // Call custom handler if provided
      if (onNotificationReceived) {
        onNotificationReceived(payload);
      }
    });

    console.log('✅ Foreground notification handler setup complete');
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up foreground notification handler:', error);
    return () => {};
  }
};

/**
 * Remove FCM token from backend
 * Supports both users and vendors
 */
export const removeFCMToken = async (token: string): Promise<boolean> => {
  try {
    // Check if user is a vendor or regular user
    const vendorToken = localStorage.getItem('vendorToken');
    const userToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const authToken = vendorToken || userToken;
    const isVendor = !!vendorToken;
    
    if (!authToken) {
      console.warn('⚠️ User not logged in');
      return false;
    }

    // Use vendor endpoint if vendor, user endpoint otherwise
    const endpoint = isVendor 
      ? `${API_BASE_URL}/vendors/remove-fcm-token`
      : `${API_BASE_URL}/users/remove-fcm-token`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token: token,
        platform: 'web',
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log(`✅ FCM token removed from backend (${isVendor ? 'vendor' : 'user'})`);
      return true;
    } else {
      console.warn(`⚠️ Failed to remove FCM token (${isVendor ? 'vendor' : 'user'}):`, data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error removing FCM token:', error);
    return false;
  }
};

/**
 * Save mobile FCM token (for mobile apps/APK)
 * Supports both users and vendors
 */
export const saveMobileFCMToken = async (token: string, phone: string, email?: string): Promise<boolean> => {
  try {
    // Check if user is a vendor or regular user
    const vendorToken = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('vendorData');
    const isVendor = !!vendorToken;
    
    // For vendors, use email instead of phone
    let requestBody: any;
    let endpoint: string;
    
    if (isVendor) {
      // Vendor endpoint uses email
      let vendorEmail = email;
      if (!vendorEmail && vendorData) {
        try {
          const parsed = JSON.parse(vendorData);
          vendorEmail = parsed.email;
        } catch (e) {
          console.error('Error parsing vendor data:', e);
        }
      }
      
      if (!vendorEmail) {
        console.error('❌ Vendor email is required for saving mobile FCM token');
        return false;
      }
      
      endpoint = `${API_BASE_URL}/vendors/save-fcm-token-mobile`;
      requestBody = {
        token: token,
        email: vendorEmail,
        platform: 'mobile',
      };
    } else {
      // User endpoint uses phone
      endpoint = `${API_BASE_URL}/users/save-fcm-token-mobile`;
      requestBody = {
        token: token,
        phone: phone,
        platform: 'mobile',
      };
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log(`✅ Mobile FCM token saved to backend (${isVendor ? 'vendor' : 'user'})`);
      return true;
    } else {
      console.warn(`⚠️ Failed to save mobile FCM token (${isVendor ? 'vendor' : 'user'}):`, data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error saving mobile FCM token:', error);
    return false;
  }
};

// Export default functions
export default {
  registerServiceWorker,
  requestNotificationPermission,
  registerFCMToken,
  initializePushNotifications,
  setupForegroundNotificationHandler,
  removeFCMToken,
  saveMobileFCMToken,
};

