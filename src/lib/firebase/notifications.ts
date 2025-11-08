import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { registerFirebaseMessagingSW } from '@/lib/firebase/sw';
import { useNotificationLog } from '@/contexts/NotificationLogContext';

// استخدم VAPID key من Firebase Console
// Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

let messaging: Messaging | null = null;

// تهيئة Firebase Cloud Messaging مع إعادة محاولة خفيفة
export const initializeMessaging = async () => {
  const maxAttempts = 2;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        messaging = getMessaging();
        return messaging;
      }
      console.warn('Push notifications not supported');
      return null;
    } catch (error) {
      console.error('Error initializing messaging attempt', i + 1, error);
      if (i === maxAttempts - 1) return null;
      const backoff = 400 * Math.pow(2, i) * (0.8 + Math.random() * 0.4);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  return null;
};

// طلب إذن الإشعارات وحفظ التوكن
export const requestNotificationPermission = async (userId: string, skipPrompt = false): Promise<string | null> => {
  try {
    // تحقق من دعم Notification API
    if (!('Notification' in window)) {
      console.warn('[FCM] Notifications not supported in this browser');
      return null;
    }

    if (!messaging) {
      messaging = await initializeMessaging();
    }

    if (!messaging) {
      console.warn('[FCM] Messaging initialization failed');
      return null;
    }

    let permission = Notification.permission;

    // إذا كان الإذن مرفوضاً، أخبر المستخدم
    if (permission === 'denied') {
      console.warn('[FCM] Notification permission denied by user. Must enable in browser settings.');
      return null;
    }

    // طلب الإذن فقط إذا لم يتم منحه مسبقاً ولم يُطلب تخطيه
    if (permission === 'default' && !skipPrompt) {
      try {
        permission = await Notification.requestPermission();
      } catch (err: any) {
        // Safari and some browsers throw if called without user gesture
        console.error('[FCM] Permission request failed (may need user gesture):', err);
        return null;
      }
    }
    
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission not granted:', permission);
      return null;
    }

    // Ensure the messaging service worker is registered before requesting a token
    const swReg = await registerFirebaseMessagingSW();
    if (!swReg) {
      console.warn('[FCM] Service worker registration unavailable. Foreground messages only.');
    }

    // Check if VAPID key is configured
    if (!VAPID_KEY) {
      console.error('[FCM] VAPID key not configured. Set VITE_FIREBASE_VAPID_KEY in environment variables.');
      return null;
    }

    // الحصول على التوكن
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg ?? undefined,
    });

    if (token) {
      // Check existing profile for prior verification timestamp
      let verifiedAt: Date | null = null;
      try {
        const snap = await getDoc(doc(db, 'profiles', userId));
        const d = snap.data();
        if (d?.fcm_verified_at) {
          // Handle Firestore Timestamp object
          const timestamp = d.fcm_verified_at;
          if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
            verifiedAt = timestamp.toDate();
          } else if (timestamp) {
            // Try parsing as string/number
            const parsed = new Date(timestamp);
            if (!isNaN(parsed.getTime())) {
              verifiedAt = parsed;
            }
          }
        }
      } catch (err) {
        console.warn('[FCM] Could not read existing fcm_verified_at:', err);
      }
      
      await updateDoc(doc(db, 'profiles', userId), {
        fcm_token: token,
        notifications_enabled: true,
        fcm_verified_at: verifiedAt || new Date(), // set once on first successful token
        updated_at: new Date(),
      });
      console.log('FCM Token saved:', token);
      return token;
    }

    return null;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// الاستماع للإشعارات عندما يكون التطبيق مفتوحاً
export const onMessageListener = (callback: (payload: any) => void, options?: { userId?: string }) => {
  if (!messaging) {
    // allow async init but we don't await inside listener registration context
    initializeMessaging().then((m) => { messaging = m; });
  }

  if (!messaging) {
    return () => {};
  }

  return onMessage(messaging, async (payload) => {
    console.log('Message received:', payload);
    callback(payload);
    try {
      // Optional dynamic import to avoid circular dependency at module init
      // We no-op if context is unavailable (called outside React tree)
      // Foreground messages logged by consumer instead normally.
    } catch {}
    
    // عرض إشعار محلي
    try {
      if (payload.notification && Notification.permission === 'granted') {
        new Notification(payload.notification.title || 'إشعار جديد', {
          body: payload.notification.body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png'
        });
      }
    } catch {}

    // Mark verification if we have userId and not yet verified
    try {
      if (options?.userId) {
        const ref = doc(db, 'profiles', options.userId);
        const snap = await getDoc(ref);
        const data = snap.data();
        if (!data?.fcm_verified_at) {
          await updateDoc(ref, { fcm_verified_at: new Date(), updated_at: new Date() });
        }
      }
    } catch {}
  });
};

// تعطيل الإشعارات
export const disableNotifications = async (userId: string) => {
  try {
    await updateDoc(doc(db, 'profiles', userId), {
      fcm_token: null,
      notifications_enabled: false,
      updated_at: new Date()
    });
    console.log('Notifications disabled');
  } catch (error) {
    console.error('Error disabling notifications:', error);
  }
};
