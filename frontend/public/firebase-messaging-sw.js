// Service Worker for Firebase Cloud Messaging background notifications
// This file must be in the public folder to be accessible at the root

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Use same config as client
const firebaseConfig = {
  apiKey: "AIzaSyCwf8OGEhQJUDi2Iqtvo0GdWNrjQ_3wBNI",
  authDomain: "fixfly-fb12b.firebaseapp.com",
  projectId: "fixfly-fb12b",
  storageBucket: "fixfly-fb12b.firebasestorage.app",
  messagingSenderId: "628159919352",
  appId: "1:628159919352:web:f18f3c99471c5feb89370d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages
const messaging = firebase.messaging();

// Service worker activation
self.addEventListener('activate', function(event) {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  // Take control of all pages immediately
  event.waitUntil(self.clients.claim());
});

// Handle skip waiting message (for updating service worker)
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[firebase-messaging-sw.js] Skipping waiting, activating immediately');
    self.skipWaiting();
  }
});

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Fixfly Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new notification',
    icon: payload.notification?.icon || payload.data?.icon || '/favicon.png',
    badge: '/favicon.png',
    tag: payload.data?.tag || 'fixfly-notification',
    data: payload.data || {},
    requireInteraction: false,
    silent: false,
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.', event);
  
  event.notification.close();

  // Get the link from notification data
  const link = event.notification.data?.link || event.notification.data?.data?.link || '/';
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // If we can find an existing window, focus it
        if (client.url === link && 'focus' in client) {
          return client.focus();
        }
      }
      // If no existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});

