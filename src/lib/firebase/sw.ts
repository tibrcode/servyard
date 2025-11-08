// Helper to register the Firebase Messaging service worker
// Ensures the file at /firebase-messaging-sw.js is registered to receive background messages

export async function registerFirebaseMessagingSW(): Promise<ServiceWorkerRegistration | null> {
  const maxAttempts = 3;
  const baseDelay = 800; // ms
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      if (!('serviceWorker' in navigator)) {
        console.warn('[SW] Service workers not supported in this browser');
        return null;
      }

      // If we already have a registration controlling page, reuse
      const existing = await navigator.serviceWorker.getRegistration('/');
      if (existing) {
        return existing;
      }

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      // Wait until it's active to reduce race conditions
      if (registration.installing) {
        await new Promise<void>((resolve, reject) => {
          const sw = registration.installing!;
          const timeout = setTimeout(() => reject(new Error('SW install timeout')), 10000);
          sw.addEventListener('statechange', () => {
            if (sw.state === 'activated' || sw.state === 'installed') {
              clearTimeout(timeout);
              resolve();
            }
          });
        });
      }
      return registration;
    } catch (err) {
      attempt++;
      const isLast = attempt >= maxAttempts;
      console.warn(`[SW] Registration attempt ${attempt} failed`, err);
      if (isLast) {
        console.error('[SW] Giving up on service worker registration');
        return null;
      }
      // Exponential backoff with jitter
      const jitter = Math.random() * 0.4 + 0.8; // 0.8 - 1.2
      const delay = Math.round(baseDelay * Math.pow(2, attempt - 1) * jitter);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return null;
}

// Network-resilient message fetch wrapper (can be used by foreground messaging init)
export async function resilientFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response | null> {
  const maxAttempts = 4;
  const baseDelay = 500;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(input, init);
      if (!res.ok && res.status >= 500) throw new Error(`Server error ${res.status}`);
      return res;
    } catch (e) {
      const isLast = i === maxAttempts - 1;
      console.warn('[SW] resilientFetch error attempt', i + 1, e);
      if (isLast) return null;
      const jitter = Math.random() * 0.5 + 0.75; // 0.75 - 1.25
      const delay = Math.round(baseDelay * Math.pow(2, i) * jitter);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return null;
}
