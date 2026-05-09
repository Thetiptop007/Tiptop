
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  
  if (!event.data) {
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
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
