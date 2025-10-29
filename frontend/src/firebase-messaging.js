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

// Initialize Firebase Cloud Messaging safely - PUSH NOTIFICATIONS DISABLED
try {
  // Push notifications disabled - messaging remains null
  messaging = null;
  console.log('⚠️ Push notifications are disabled');
} catch (error) {
  console.log('⚠️ Firebase messaging not available:', error.message);
  messaging = null; // Ensure messaging is null on error
}

// VAPID key for push notifications
const VAPID_KEY = "BJEae_aP7PqzRFAAgS8BybRJ1qgxWkN6Qej5ivrcyYEUruPnxXPqiUDeu0s6i8ARBzgExXqukeKk0UEGi6m-3QU";

// Request permission and get FCM token - PUSH NOTIFICATIONS DISABLED
export const requestPermission = async () => {
  // PUSH NOTIFICATIONS DISABLED
  console.log('⚠️ Push notifications are disabled');
  return null;
};

// Listen for foreground messages - PUSH NOTIFICATIONS DISABLED
export const onMessageListener = () => {
  return new Promise((resolve) => {
    console.log('⚠️ Push notifications are disabled');
    resolve(null);
  });
};

// Export messaging instance for other uses (null if not available)
export { messaging };

export default app;
