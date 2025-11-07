import React from 'react';
import { useNotificationLog } from '@/contexts/NotificationLogContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function NotificationsHistory() {
  const { notifications, clear } = useNotificationLog();
  const [filter, setFilter] = React.useState<'all' | 'foreground' | 'background'>('all');
  const [search, setSearch] = React.useState('');

  const filtered = notifications.filter(n => {
    if (filter !== 'all' && n.via !== filter) return false;
    if (search) {
      const t = (n.title + ' ' + (n.body || '')).toLowerCase();
      if (!t.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg">سجل الإشعارات / Notification History</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>الكل</Button>
            <Button variant={filter === 'foreground' ? 'default' : 'outline'} onClick={() => setFilter('foreground')}>أمام</Button>
            <Button variant={filter === 'background' ? 'default' : 'outline'} onClick={() => setFilter('background')}>خلفية</Button>
            <Button variant="destructive" onClick={clear}>مسح</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="text"
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
          />
          <Separator />
          <div className="space-y-3 max-h-[600px] overflow-auto pr-1">
            {filtered.length === 0 && (
              <div className="text-sm text-muted-foreground">لا يوجد إشعارات مطابقة / No notifications</div>
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
                {n.type && <div className="text-xs">نوع / type: <span className="font-mono">{n.type}</span></div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
