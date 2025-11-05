import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';

// استخدم VAPID key من Firebase Console
// Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

let messaging: Messaging | null = null;

// تهيئة Firebase Cloud Messaging
export const initializeMessaging = () => {
  try {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      messaging = getMessaging();
      return messaging;
    }
    console.warn('Push notifications not supported');
    return null;
  } catch (error) {
    console.error('Error initializing messaging:', error);
    return null;
  }
};

// طلب إذن الإشعارات وحفظ التوكن
export const requestNotificationPermission = async (userId: string, skipPrompt = false): Promise<string | null> => {
  try {
    // تحقق من دعم Notification API
    if (!('Notification' in window)) {
      return null;
    }

    if (!messaging) {
      messaging = initializeMessaging();
    }

    if (!messaging) {
      return null;
    }

    let permission = Notification.permission;

    // طلب الإذن فقط إذا لم يتم منحه مسبقاً ولم يُطلب تخطيه
    if (permission === 'default' && !skipPrompt) {
      permission = await Notification.requestPermission();
    }
    
    if (permission !== 'granted') {
      return null;
    }

    // الحصول على التوكن
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY
    });

    if (token) {
      // حفظ التوكن في profile المستخدم
      await updateDoc(doc(db, 'profiles', userId), {
        fcm_token: token,
        notifications_enabled: true,
        updated_at: new Date()
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
export const onMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) {
    messaging = initializeMessaging();
  }

  if (!messaging) {
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log('Message received:', payload);
    callback(payload);
    
    // عرض إشعار محلي
    if (payload.notification) {
      new Notification(payload.notification.title || 'إشعار جديد', {
        body: payload.notification.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png'
      });
    }
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
