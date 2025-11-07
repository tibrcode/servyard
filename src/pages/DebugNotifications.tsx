import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { registerFirebaseMessagingSW } from '@/lib/firebase/sw';
import { requestNotificationPermission } from '@/lib/firebase/notifications';
import { Link } from 'react-router-dom';

export default function DebugNotifications() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [permission, setPermission] = React.useState<NotificationPermission>(
    (typeof Notification !== 'undefined' ? Notification.permission : 'default') as NotificationPermission
  );
  const [swInfo, setSwInfo] = React.useState<{ registered: boolean; scope?: string; controlled: boolean }>({
    registered: false,
    controlled: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
  });
  const [token, setToken] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const refreshSW = async () => {
    if (!('serviceWorker' in navigator)) {
      setSwInfo({ registered: false, controlled: false });
      return;
    }
    const reg = await navigator.serviceWorker.getRegistration('/');
    setSwInfo({ registered: !!reg, scope: reg?.scope, controlled: !!navigator.serviceWorker.controller });
  };

  React.useEffect(() => {
    refreshSW();
  }, []);

  const obfuscate = (t: string | null) => (t ? `${t.slice(0, 8)}…${t.slice(-6)}` : '—');

  const doRequestPermission = async () => {
    if (!user?.uid) {
      toast({ title: 'Login required', description: 'Please sign in to bind token to your profile', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const res = await requestNotificationPermission(user.uid);
      setPermission(Notification.permission);
      setToken(res);
      await refreshSW();
      toast({ title: res ? 'Token acquired' : 'Permission flow finished', description: res ? obfuscate(res) : Notification.permission });
    } finally {
      setBusy(false);
    }
  };

  const doRegisterSW = async () => {
    setBusy(true);
    try {
      await registerFirebaseMessagingSW();
      await refreshSW();
      toast({ title: 'Service Worker registered', description: swInfo.scope || '/' });
    } finally {
      setBusy(false);
    }
  };

  const testToast = () => {
    toast({ title: 'Test toast', description: 'This is a UI toast (foreground only)' });
  };

  const testNotificationAPI = () => {
    try {
      if (Notification.permission !== 'granted') {
        toast({ title: 'Notification permission not granted', description: 'Allow notifications first', variant: 'destructive' });
        return;
      }
      new Notification('Local Notification', { body: 'This is Notification API from page context' });
    } catch (e: any) {
      toast({ title: 'Notification error', description: e?.message || String(e), variant: 'destructive' });
    }
  };

  const testBackendPush = async () => {
    if (!user?.uid) {
      toast({ title: 'Login required', description: 'Sign in to send a test push to your profile', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      // Prefer env-configured URL (production)
      const url = import.meta.env.VITE_TEST_NOTIFICATION_URL || '/sendTestNotification';
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const json = await resp.json().catch(() => ({}));
      toast({ title: resp.ok ? 'Test push requested' : 'Test push failed', description: JSON.stringify(json).slice(0, 200) });
    } catch (e: any) {
      toast({ title: 'Request error', description: e?.message || String(e), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Notifications Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 border rounded-md">
              <div className="text-sm text-muted-foreground">Permission</div>
              <div className="font-mono">{permission}</div>
            </div>
            <div className="p-3 border rounded-md">
              <div className="text-sm text-muted-foreground">Service Worker</div>
              <div className="font-mono">{swInfo.registered ? `registered (${swInfo.scope})` : 'not registered'}</div>
              <div className="font-mono">controlled: {String(swInfo.controlled)}</div>
            </div>
            <div className="p-3 border rounded-md sm:col-span-2">
              <div className="text-sm text-muted-foreground">FCM Token</div>
              <div className="font-mono break-all">{obfuscate(token)}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={doRequestPermission} disabled={busy}>Request Permission & Token</Button>
            <Button variant="outline" onClick={doRegisterSW} disabled={busy}>Register SW</Button>
            <Button variant="secondary" onClick={testToast}>Test Toast</Button>
            <Button variant="secondary" onClick={testNotificationAPI}>Test Notification API</Button>
            <Button variant="default" onClick={testBackendPush} disabled={busy}>Send Test Push (Backend)</Button>
            <Link to="/notifications" className="inline-flex">
              <Button variant="ghost">Open History</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
