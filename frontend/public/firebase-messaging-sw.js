// Import the functions you need from the SDKs you need
importScripts('https://www.gstatic.com/firebasejs/12.3.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging-compat.js');

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
firebase.initializeApp(firebaseConfig);

// PUSH NOTIFICATIONS DISABLED - Service worker disabled
console.log('⚠️ Push notifications are disabled - service worker inactive');

// Initialize Firebase Cloud Messaging and get a reference to the service
// const messaging = firebase.messaging();

// Handle background messages - DISABLED
// messaging.onBackgroundMessage(function(payload) {
//   console.log('Received background message ', payload);
//   console.log('🖼️ Image in background payload:', payload.notification?.image);
//   
//   const notificationTitle = payload.notification?.title || 'Fixifly Notification';
//   const notificationOptions = {
//     body: payload.notification?.body || 'You have a new notification',
//     icon: '/favicon.ico',
//     badge: '/favicon.ico',
//     data: payload.data || {},
//     actions: [
//       {
//         action: 'view',
//         title: 'View Details'
//       },
//       {
//         action: 'dismiss',
//         title: 'Dismiss'
//       }
//     ]
//   };

//   // Add image if available
//   if (payload.notification?.image) {
//     notificationOptions.image = payload.notification.image;
//   }

//   self.registration.showNotification(notificationTitle, notificationOptions);
// });

// Handle notification clicks - DISABLED
// self.addEventListener('notificationclick', function(event) {
//   console.log('Notification click received.');
//   
//   event.notification.close();
//   
//   if (event.action === 'view') {
//     // Open the app or navigate to specific page
//     event.waitUntil(
//       clients.openWindow('/vendor/dashboard')
//     );
//   } else if (event.action === 'dismiss') {
//     // Just close the notification
//     return;
//   } else {
//     // Default action - open the app
//     event.waitUntil(
//       clients.openWindow('/vendor/dashboard')
//     );
//   }
// });
