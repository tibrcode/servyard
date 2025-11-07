// Helper to register the Firebase Messaging service worker
// Ensures the file at /firebase-messaging-sw.js is registered to receive background messages

export async function registerFirebaseMessagingSW(): Promise<ServiceWorkerRegistration | null> {
  try {
    if (!('serviceWorker' in navigator)) {
      console.warn('[SW] Service workers not supported in this browser');
      return null;
    }

    // Avoid duplicate registrations
    const existing = await navigator.serviceWorker.getRegistration('/');
    if (existing) {
      // If the existing registration already controls our scope, reuse it
      return existing;
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    // Wait until it's active to reduce race conditions
    if (registration.installing) {
      await new Promise<void>((resolve) => {
        const sw = registration.installing!;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'activated' || sw.state === 'installed') resolve();
        });
      });
    }
    return registration;
  } catch (err) {
    console.error('[SW] Failed to register firebase-messaging-sw.js', err);
    return null;
  }
}
