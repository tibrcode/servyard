import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/firebase/client';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export interface LoggedNotification {
  id: string;
  title: string;
  body?: string;
  receivedAt: string; // ISO
  via: 'foreground' | 'background';
  raw?: any;
  type?: string;
  category?: 'booking' | 'reminder' | 'system' | 'other';
}

interface NotificationLogContextValue {
  notifications: LoggedNotification[];
  addNotification: (n: Omit<LoggedNotification, 'id' | 'receivedAt'> & { receivedAt?: string }) => void;
  clear: () => void;
  unreadCount: number;
  markAllRead: () => void;
  lastViewedAt: string | null;
}

const NotificationLogContext = createContext<NotificationLogContextValue | undefined>(undefined);

const STORAGE_KEY = 'servyard_notification_log_v1';
const LAST_VIEWED_KEY = 'servyard_notification_last_viewed_at';
const MAX_ENTRIES = 200;

export const NotificationLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<LoggedNotification[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, MAX_ENTRIES);
    } catch {}
    return [];
  });
  const [lastViewedAt, setLastViewedAt] = useState<string | null>(() => {
    try { return localStorage.getItem(LAST_VIEWED_KEY); } catch { return null; }
  });

  const persist = useCallback((list: LoggedNotification[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES))); } catch {}
  }, []);

  const addNotification = useCallback((n: Omit<LoggedNotification, 'id' | 'receivedAt'> & { receivedAt?: string }) => {
    const entry: LoggedNotification = {
      id: crypto.randomUUID(),
      title: n.title,
      body: n.body,
      via: n.via,
      raw: n.raw,
      type: n.type,
      receivedAt: n.receivedAt || new Date().toISOString(),
    };
    setNotifications((prev) => {
      const updated = [entry, ...prev].slice(0, MAX_ENTRIES);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const clear = useCallback(() => {
    setNotifications([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    setLastViewedAt(now);
    try { localStorage.setItem(LAST_VIEWED_KEY, now); } catch {}
    // Sync to Firestore if signed in
    try {
      if (user?.uid) {
        updateDoc(doc(db, 'profiles', user.uid), { notifications_last_viewed_at: now }).catch(() => {});
      }
    } catch {}
  }, []);

  const unreadCount = React.useMemo(() => {
    if (!lastViewedAt) return notifications.length;
    const last = new Date(lastViewedAt).getTime();
    return notifications.filter(n => new Date(n.receivedAt).getTime() > last).length;
  }, [notifications, lastViewedAt]);

  // Listen to service worker postMessage for background notifications
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (data && data.__SERVYARD_PUSH && data.payload) {
        const p = data.payload;
        addNotification({
          title: p.notification?.title || 'Notification',
          body: p.notification?.body,
          via: p.via === 'background' ? 'background' : 'background',
          raw: p,
          type: p.data?.type,
          category: deriveCategory(p.data?.type),
          receivedAt: p.receivedAt,
        });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [addNotification]);

  // On login, merge remote last viewed timestamp
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.uid) return;
      try {
        const snap = await getDoc(doc(db, 'profiles', user.uid));
        const remote = snap.get('notifications_last_viewed_at') as string | undefined;
        if (!cancelled && remote) {
          // Use the most recent of local vs remote
          const local = lastViewedAt ? new Date(lastViewedAt).getTime() : 0;
          const remoteTs = new Date(remote).getTime();
          if (remoteTs > local) {
            setLastViewedAt(remote);
            try { localStorage.setItem(LAST_VIEWED_KEY, remote); } catch {}
          }
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [user?.uid]);

  return (
    <NotificationLogContext.Provider value={{ notifications, addNotification, clear, unreadCount, markAllRead, lastViewedAt }}>
      {children}
    </NotificationLogContext.Provider>
  );
};

function deriveCategory(type?: string): LoggedNotification['category'] {
  if (!type) return 'other';
  if (type.includes('booking')) return 'booking';
  if (type.includes('reminder')) return 'reminder';
  if (type.includes('system')) return 'system';
  return 'other';
}

export function useNotificationLog() {
  const ctx = useContext(NotificationLogContext);
  if (!ctx) throw new Error('useNotificationLog must be used within NotificationLogProvider');
  return ctx;
}
