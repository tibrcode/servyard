// Native (Capacitor) push notifications skeleton
// This file provides optional integration points for Android/iOS builds.
// It gracefully no-ops on web so you can import it unconditionally.

import type { PushNotificationSchema, Token, ActionPerformed } from '@capacitor/push-notifications';

interface InitResult {
  platform: 'web' | 'android' | 'ios';
  supported: boolean;
}

export async function initNativePush(onToken?: (t: string) => void): Promise<InitResult> {
  // Detect Capacitor environment
  const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
  if (!isCapacitor) {
    return { platform: 'web', supported: false };
  }
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    await PushNotifications.requestPermissions();
    await PushNotifications.register();

    PushNotifications.addListener('registration', (token: Token) => {
      onToken?.(token.value);
      // You can send this token to backend to map native APNs/FCM tokens separately if desired
      console.log('[NativePush] registration token', token.value);
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.warn('[NativePush] registration error', err);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('[NativePush] foreground notification', notification);
      // Optionally: surface in-app toast
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('[NativePush] action performed', action);
      const link = (action.notification?.data as any)?.link;
      if (link) {
        try { window.location.href = link; } catch { /* noop */ }
      }
    });

    const platform: 'android' | 'ios' = (window as any).Capacitor.getPlatform?.() === 'ios' ? 'ios' : 'android';
    return { platform, supported: true };
  } catch (e) {
    console.warn('[NativePush] init failed', e);
    return { platform: 'web', supported: false };
  }
}

export function isNativePlatform(): boolean {
  return !!(window as any).Capacitor?.isNativePlatform?.();
}
