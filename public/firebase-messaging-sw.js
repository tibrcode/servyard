// Service Worker لمعالجة الإشعارات في الخلفية
// يجب أن يكون في المجلد public/

// Lightweight guarded import (retry once if CDN hiccups) + version pin
const firebaseVersion = '10.7.1';
try {
  importScripts(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app-compat.js`);
  importScripts(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-messaging-compat.js`);
} catch (e) {
  // Retry with exponential backoff (single retry)
  console.warn('[SW] Initial importScripts failed, retrying...', e);
  try {
    const delay = 600 + Math.random() * 400; // jitter
    const start = Date.now();
    // Busy wait is not ideal; use setTimeout via Promise (Service Worker env supports it)
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    wait(delay).then(() => {
      importScripts(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app-compat.js`);
      importScripts(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-messaging-compat.js`);
      console.log('[SW] importScripts retry succeeded after', Date.now() - start, 'ms');
    });
  } catch (e2) {
    console.error('[SW] importScripts retry failed; FCM background messages may not work', e2);
  }
}

// Firebase Configuration
firebase.initializeApp({
  apiKey: "AIzaSyAKG7vAEa2xrON6YqyysgdaEKQXQu1cX4g",
  authDomain: "servyard-de527.firebaseapp.com",
  projectId: "servyard-de527",
  storageBucket: "servyard-de527.firebasestorage.app",
  messagingSenderId: "866507388194",
  appId: "1:866507388194:web:3e3d6ea94ce274781fe17b",
  measurementId: "G-GDCET0K1NN"
});

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (e) {
  console.error('[SW] Failed to init messaging()', e);
}

// معالجة الإشعارات في الخلفية
if (messaging) messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background Message:', payload);
  const normalized = {
    notification: {
      title: payload.notification?.title || 'إشعار جديد',
      body: payload.notification?.body || ''
    },
    data: payload.data || {},
    receivedAt: new Date().toISOString(),
    via: 'background'
  };

  // بث إلى كل العملاء المفتوحين لتسجيله في سجل الإشعارات بصيغة موحدة
  try {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({ __SERVYARD_PUSH: true, source: 'sw-background', payload: normalized });
      });
    });
  } catch (e) { /* noop */ }

  // Support silent sync notifications: skip showing system notification if type === 'silent_sync'
  if (normalized.data?.type === 'silent_sync') {
    console.log('[SW] Silent sync payload received; skipping system notification display');
    return; // still broadcast via postMessage above
  }

  const notificationTitle = normalized.notification.title;
  const notificationOptions = {
    body: normalized.notification.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: normalized.data?.type || 'default',
    data: normalized.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Simple ping handler for health checks
self.addEventListener('message', (event) => {
  try {
    const data = event.data;
    if (data && data.__SERVYARD_PING) {
      event.source?.postMessage({ __SERVYARD_PONG: true, id: data.id, ts: Date.now() });
    }
  } catch (e) {
    // silent
  }
});
// معالجة النقر على الإشعار
// Robust notification click handling with retry for clients list race
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click:', event);
  event.notification.close();

  // فتح التطبيق أو الانتقال للصفحة المناسبة
  const urlToOpen = event.notification.data?.url || '/';
  
  const openOrFocus = async () => {
    const maxTries = 2;
    for (let i = 0; i < maxTries; i++) {
      const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          await client.focus();
          return;
        }
      }
      if (clients.openWindow) {
        await clients.openWindow(urlToOpen);
        return;
      }
      // small backoff before retrying clients.matchAll
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  };
  event.waitUntil(openOrFocus());
});
