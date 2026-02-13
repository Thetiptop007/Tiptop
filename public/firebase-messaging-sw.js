// Simple service worker for FCM
console.log('[SW] Service worker loading...');

self.addEventListener('install', (event) => {
  console.log('[SW] Service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event);
  
  if (!event.data) {
    console.log('[SW] No data in push event');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
    console.log('[SW] Push payload:', payload);
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
    payload = { notification: { title: 'Order Update', body: event.data.text() } };
  }

  const notificationTitle = payload?.notification?.title || 'TheTipTop Restaurant';
  const notificationOptions = {
    body: payload?.notification?.body || 'Your order has been updated.',
    icon: payload?.data?.icon || payload?.notification?.icon || 'https://thetiptop.ca/favicon.ico',
    badge: payload?.data?.badge || payload?.notification?.badge || 'https://thetiptop.ca/favicon.ico',
    data: payload?.data || {},
    tag: payload?.data?.orderId || 'order-notification',
    requireInteraction: true, // Keep notification visible until user interacts
    vibrate: [200, 100, 200], // Vibration pattern
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log('[SW] Service worker ready');
