// Firebase configuration for Fixfly project
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwf8OGEhQJUDi2Iqtvo0GdWNrjQ_3wBNI",
  authDomain: "fixfly-fb12b.firebaseapp.com",
  projectId: "fixfly-fb12b",
  storageBucket: "fixfly-fb12b.firebasestorage.app",
  messagingSenderId: "628159919352",
  appId: "1:628159919352:web:f18f3c99471c5feb89370d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging: Messaging | null = null;

// Only initialize messaging in browser environment
if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Firebase messaging initialization error:', error);
  }
}

// VAPID key for web push notifications
// This is the PUBLIC VAPID key from Firebase Console: Project Settings > Cloud Messaging > Web Push certificates
// Public key (use this in frontend): BNSelRg1_hiuruJZ2RJ6Q5QetysJmhVT5p6s2GnFVxrI2D4KWJn5FSeshDZX0KzW6KQ_uTUwTP9fvBKxmCz1yW0
// Private key (keep secret, used in backend if needed): sOnf2UrmqAP_tgkHnVG3Gxs-Rfb4-fG-NNfkazaM2RA
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BNSelRg1_hiuruJZ2RJ6Q5QetysJmhVT5p6s2GnFVxrI2D4KWJn5FSeshDZX0KzW6KQ_uTUwTP9fvBKxmCz1yW0";

// VAPID keys can vary in length, so we'll validate it's not empty
const isValidVAPIDKey = VAPID_KEY && VAPID_KEY.trim().length > 0;

export { messaging, getToken, onMessage, VAPID_KEY, app, isValidVAPIDKey };

