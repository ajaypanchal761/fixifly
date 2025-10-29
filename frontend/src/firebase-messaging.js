// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGs7tH_e5UjO5-jciWDN6-DbocZU37XLc",
  authDomain: "fixfly-d8e35.firebaseapp.com",
  projectId: "fixfly-d8e35",
  storageBucket: "fixfly-d8e35.firebasestorage.app",
  messagingSenderId: "784235928201",
  appId: "1:784235928201:web:9b5cd211064837a17d0458",
  measurementId: "G-CRR1JHT0BZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics = null;
let messaging = null;

console.log('🔥 Firebase initialized successfully');

// Initialize analytics safely
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.log('Analytics not available:', error.message);
}

// Initialize Firebase Cloud Messaging safely
try {
  // Check if service worker is supported
  if ('serviceWorker' in navigator) {
    messaging = getMessaging(app);
    console.log('✅ Firebase messaging initialized');
  } else {
    console.log('⚠️ Service worker not supported, Firebase messaging disabled');
  }
} catch (error) {
  console.log('⚠️ Firebase messaging not available:', error.message);
  messaging = null; // Ensure messaging is null on error
}

// VAPID key for push notifications
const VAPID_KEY = "BJEae_aP7PqzRFAAgS8BybRJ1qgxWkN6Qej5ivrcyYEUruPnxXPqiUDeu0s6i8ARBzgExXqukeKk0UEGi6m-3QU";

// Request permission and get FCM token
export const requestPermission = async () => {
  try {
    if (!messaging) {
      console.log('⚠️ Firebase messaging not available');
      return null;
    }

    console.log('🔔 Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('📱 Permission result:', permission);
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted.');
      
      // Get FCM token
      console.log('🔑 Getting FCM token...');
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });
      
      if (token) {
        console.log('✅ FCM Token generated:', token.substring(0, 20) + '...');
        return token;
      } else {
        console.log('❌ No registration token available.');
        return null;
      }
    } else {
      console.log('❌ Notification permission denied.');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting permission or token:', error);
    return null;
  }
};

// Listen for foreground messages
export const onMessageListener = () => {
  return new Promise((resolve) => {
    if (!messaging) {
      console.log('⚠️ Firebase messaging not available');
      resolve(null);
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      resolve(payload);
    });
  });
};

// Export messaging instance for other uses (null if not available)
export { messaging };

export default app;
