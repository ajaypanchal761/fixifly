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
  
  // If the payload already has a notification property, the FCM SDK will show it automatically 
  // on most platforms (especially with the webpush/android notification blocks we have).
  // Manually showing it here causes a second (duplicate) notification.
  if (payload.notification) {
    console.log('[firebase-messaging-sw.js] Payload has notification block, skipping manual showNotification to prevent duplicates');
    return;
  }

  const notificationTitle = payload.data?.title || payload.data?.heading || 'Fixfly Notification';
  const notificationOptions = {
    body: payload.data?.body || payload.data?.message || 'You have a new notification',
    icon: payload.data?.icon || '/favicon.png',
    badge: '/favicon.png',
    tag: payload.data?.tag || 'fixfly-notification',
    data: payload.data || {},
    requireInteraction: payload.data?.priority === 'high' || false,
    silent: false,
  };

  // Show notification only for data-only messages
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.', event);
  console.log('[firebase-messaging-sw.js] Notification data:', event.notification.data);
  
  event.notification.close();

  // Get the link from notification data
  // Check multiple possible locations for the link
  const notificationData = event.notification.data || {};
  let link = notificationData.link || 
             notificationData.data?.link || 
             (notificationData.type === 'booking_assignment' && notificationData.bookingId 
               ? `/vendor/task/${notificationData.bookingId}` 
               : null) ||
             (notificationData.type === 'booking_assignment' && notificationData.taskId 
               ? `/vendor/task/${notificationData.taskId}` 
               : null) ||
             '/';
  
  console.log('[firebase-messaging-sw.js] Navigating to:', link);
  
  // Get the origin URL
  const origin = self.location.origin;
  const fullUrl = link.startsWith('http') ? link : `${origin}${link}`;
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if there's already a window/tab open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // Focus any existing window
        if ('focus' in client) {
          // Send message to navigate to the task
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            link: link,
            data: notificationData
          });
          return client.focus();
        }
      }
      // If no existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});

