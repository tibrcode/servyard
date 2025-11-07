// Service Worker لمعالجة الإشعارات في الخلفية
// يجب أن يكون في المجلد public/

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

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

const messaging = firebase.messaging();

// معالجة الإشعارات في الخلفية
messaging.onBackgroundMessage((payload) => {
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

// معالجة النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click:', event);
  event.notification.close();

  // فتح التطبيق أو الانتقال للصفحة المناسبة
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // إذا كان التطبيق مفتوح، انتقل للصفحة
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // وإلا افتح نافذة جديدة
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
