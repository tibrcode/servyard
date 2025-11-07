import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface LoggedNotification {
  id: string;
  title: string;
  body?: string;
  receivedAt: string; // ISO
  via: 'foreground' | 'background';
  raw?: any;
  type?: string;
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
          receivedAt: p.receivedAt,
        });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [addNotification]);

  return (
    <NotificationLogContext.Provider value={{ notifications, addNotification, clear, unreadCount, markAllRead, lastViewedAt }}>
      {children}
    </NotificationLogContext.Provider>
  );
};

export function useNotificationLog() {
  const ctx = useContext(NotificationLogContext);
  if (!ctx) throw new Error('useNotificationLog must be used within NotificationLogProvider');
  return ctx;
}
