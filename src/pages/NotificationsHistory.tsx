import React from 'react';
import { useNotificationLog } from '@/contexts/NotificationLogContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function NotificationsHistory() {
  // Detect language from document or fallback
  const lang = typeof document !== 'undefined' ? document.documentElement.lang || 'en' : 'en';
  const { t } = useTranslation(lang);
  const { notifications, clear, markAllRead } = useNotificationLog();
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState<'all' | 'foreground' | 'background'>('all');
  const [cat, setCat] = React.useState<'all' | 'booking' | 'reminder' | 'system' | 'other'>('all');
  const [search, setSearch] = React.useState('');
  const [bookingStatus, setBookingStatus] = React.useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show'>('all');

  const filtered = notifications.filter(n => {
    if (filter !== 'all' && n.via !== filter) return false;
    if (cat !== 'all' && (n.category || 'other') !== cat) return false;
    if (cat === 'booking' && bookingStatus !== 'all') {
      if ((n as any).bookingStatus !== bookingStatus) return false;
    }
    if (search) {
      const t = (n.title + ' ' + (n.body || '')).toLowerCase();
      if (!t.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  React.useEffect(() => {
    // Mark all as read on first view
    markAllRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg">{t.notificationsUI?.historyTitle || 'Notification History'}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>{t.notificationsUI?.all || 'All'}</Button>
            <Button variant={filter === 'foreground' ? 'default' : 'outline'} onClick={() => setFilter('foreground')}>{t.notificationsUI?.foreground || 'Foreground'}</Button>
            <Button variant={filter === 'background' ? 'default' : 'outline'} onClick={() => setFilter('background')}>{t.notificationsUI?.background || 'Background'}</Button>
            <Button variant="secondary" onClick={markAllRead}>{t.notificationsUI?.markAllRead || 'Mark all as read'}</Button>
            <Button variant="destructive" onClick={clear}>{t.notificationsUI?.clear || 'Clear'}</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="text"
            placeholder={t.notificationsUI?.searchPlaceholder || "Search..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
          />
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button variant={cat === 'all' ? 'default' : 'outline'} onClick={() => setCat('all')}>{t.notificationsUI?.categoryAll || 'All types'}</Button>
            <Button variant={cat === 'booking' ? 'default' : 'outline'} onClick={() => setCat('booking')}>{t.notificationsUI?.categoryBooking || 'Bookings'}</Button>
            <Button variant={cat === 'reminder' ? 'default' : 'outline'} onClick={() => setCat('reminder')}>{t.notificationsUI?.categoryReminder || 'Reminders'}</Button>
            <Button variant={cat === 'system' ? 'default' : 'outline'} onClick={() => setCat('system')}>{t.notificationsUI?.categorySystem || 'System'}</Button>
            <Button variant={cat === 'other' ? 'default' : 'outline'} onClick={() => setCat('other')}>{t.notificationsUI?.categoryOther || 'Other'}</Button>
          </div>
          {cat === 'booking' && (
            <div className="flex flex-wrap gap-2">
              <Button variant={bookingStatus === 'all' ? 'default' : 'outline'} onClick={() => setBookingStatus('all')}>{t.notificationsUI?.bookingStatusAll || 'All statuses'}</Button>
              <Button variant={bookingStatus === 'pending' ? 'default' : 'outline'} onClick={() => setBookingStatus('pending')}>{t.notificationsUI?.bookingStatusPending || 'Pending'}</Button>
              <Button variant={bookingStatus === 'confirmed' ? 'default' : 'outline'} onClick={() => setBookingStatus('confirmed')}>{t.notificationsUI?.bookingStatusConfirmed || 'Confirmed'}</Button>
              <Button variant={bookingStatus === 'cancelled' ? 'default' : 'outline'} onClick={() => setBookingStatus('cancelled')}>{t.notificationsUI?.bookingStatusCancelled || 'Cancelled'}</Button>
              <Button variant={bookingStatus === 'completed' ? 'default' : 'outline'} onClick={() => setBookingStatus('completed')}>{t.notificationsUI?.bookingStatusCompleted || 'Completed'}</Button>
              <Button variant={bookingStatus === 'no-show' ? 'default' : 'outline'} onClick={() => setBookingStatus('no-show')}>{t.notificationsUI?.bookingStatusNoShow || 'No Show'}</Button>
            </div>
          )}
          <Separator />
          <div className="space-y-3 max-h-[600px] overflow-auto pr-1">
            {filtered.length === 0 && (
              <div className="text-sm text-muted-foreground">{t.notificationsUI?.noNotifications || "No notifications"}</div>
            )}
            {filtered.map(n => (
              <div key={n.id} className="border rounded-md p-3 text-sm space-y-1 bg-card">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{n.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.receivedAt).toLocaleString()} • {n.via}
                  </span>
                </div>
                {n.body && <div className="text-muted-foreground whitespace-pre-wrap">{n.body}</div>}
                <div className="flex flex-wrap gap-2 text-xs mt-1">
                  {n.type && (
                    <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 font-mono">
                      {n.type}
                    </span>
                  )}
                  {n.category && n.category !== 'other' && (
                    <span className="inline-flex items-center rounded bg-blue-600/10 text-blue-700 dark:text-blue-300 px-1.5 py-0.5">
                      {n.category}
                    </span>
                  )}
                  {n.category === 'booking' && (n as any).raw?.data?.bookingId && (
                    <button
                      type="button"
                      onClick={() => {
                        const bookingId = (n as any).raw.data.bookingId;
                        // Decide which dashboard to route to based on presence of customer/provider hints.
                        // Default to customer dashboard; provider notifications may carry provider flag.
                        const isProvider = (n as any).raw?.data?.provider === 'true';
                        navigate(isProvider ? `/provider-dashboard?bookingId=${bookingId}` : `/customer-dashboard?bookingId=${bookingId}`);
                      }}
                      className="inline-flex items-center rounded bg-green-600/10 text-green-700 dark:text-green-300 px-1.5 py-0.5 hover:bg-green-600/20 transition-colors"
                    >
                      {t.notificationsUI?.openBooking || "Open Booking"}
                    </button>
                  )}
                  {n.category === 'booking' && (n as any).bookingStatus && (
                    <span className="inline-flex items-center rounded bg-amber-600/10 text-amber-700 dark:text-amber-300 px-1.5 py-0.5">
                      {(n as any).bookingStatus}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
