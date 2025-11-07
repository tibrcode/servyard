// Notification Settings Component
// مكون إعدادات التنبيهات

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Clock, CheckCircle2, XCircle, Moon, Save, BellRing } from 'lucide-react';
import { db } from '@/integrations/firebase/client';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { requestNotificationPermission } from '@/lib/firebase/notifications';

interface NotificationSettingsProps {
  userId: string;
  language?: 'ar' | 'en';
}

interface NotificationPreferences {
  enabled: boolean;
  booking_reminders: {
    enabled: boolean;
    reminder_times: number[]; // minutes before booking
  };
  booking_updates: {
    confirmations: boolean;
    cancellations: boolean;
    completions: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  booking_reminders: {
    enabled: true,
    reminder_times: [60], // 1 hour before
  },
  booking_updates: {
    confirmations: true,
    cancellations: true,
    completions: true,
  },
  quiet_hours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

export function NotificationSettings({ userId, language = 'ar' }: NotificationSettingsProps) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const isRTL = language === 'ar';

  // Translation
  const t = {
    title: isRTL ? 'إعدادات التنبيهات' : 'Notification Settings',
    subtitle: isRTL ? 'إدارة كيفية تلقيك للتنبيهات' : 'Manage how you receive notifications',
    enableNotifications: isRTL ? 'تفعيل التنبيهات' : 'Enable Notifications',
    enableDesc: isRTL ? 'تلقي جميع التنبيهات من التطبيق' : 'Receive all notifications from the app',
    bookingReminders: isRTL ? 'تذكيرات الحجز' : 'Booking Reminders',
    bookingRemindersDesc: isRTL ? 'تذكيرك بمواعيدك القادمة' : 'Remind you of upcoming appointments',
    reminderTimes: isRTL ? 'أوقات التذكير' : 'Reminder Times',
    reminderTimesDesc: isRTL ? 'اختر متى تريد أن تتلقى التذكيرات قبل موعدك' : 'Choose when to receive reminders before your appointment',
    min15: isRTL ? '15 دقيقة قبل' : '15 minutes before',
    min30: isRTL ? '30 دقيقة قبل' : '30 minutes before',
    hour1: isRTL ? 'ساعة قبل' : '1 hour before',
    hour2: isRTL ? 'ساعتين قبل' : '2 hours before',
    hour3: isRTL ? '3 ساعات قبل' : '3 hours before',
    day1: isRTL ? 'يوم قبل' : '1 day before',
    bookingUpdates: isRTL ? 'تحديثات الحجز' : 'Booking Updates',
    bookingUpdatesDesc: isRTL ? 'تنبيهات حول تغييرات حالة حجزك' : 'Notifications about booking status changes',
    confirmations: isRTL ? 'تأكيدات الحجز' : 'Booking Confirmations',
    cancellations: isRTL ? 'إلغاء الحجوزات' : 'Booking Cancellations',
    completions: isRTL ? 'إكمال الخدمات' : 'Service Completions',
    quietHours: isRTL ? 'ساعات الهدوء' : 'Quiet Hours',
    quietHoursDesc: isRTL ? 'لن تتلقى تنبيهات خلال هذه الأوقات' : 'You won\'t receive notifications during these hours',
    startTime: isRTL ? 'من' : 'From',
    endTime: isRTL ? 'إلى' : 'To',
    save: isRTL ? 'حفظ الإعدادات' : 'Save Settings',
    saving: isRTL ? 'جاري الحفظ...' : 'Saving...',
    saved: isRTL ? 'تم حفظ الإعدادات' : 'Settings saved',
    saveFailed: isRTL ? 'فشل حفظ الإعدادات' : 'Failed to save settings',
    permissionDenied: isRTL ? 'صلاحية التنبيهات محظورة' : 'Notification Permission Denied',
    permissionDeniedDesc: isRTL ? 'يرجى تفعيل التنبيهات في إعدادات المتصفح' : 'Please enable notifications in browser settings',
    requestPermission: isRTL ? 'طلب الصلاحية' : 'Request Permission',
  };

  const reminderOptions = [
    { value: 15, label: t.min15 },
    { value: 30, label: t.min30 },
    { value: 60, label: t.hour1 },
    { value: 120, label: t.hour2 },
    { value: 180, label: t.hour3 },
    { value: 1440, label: t.day1 },
  ];

  const checkNotificationPermission = useCallback(() => {
    if (typeof Notification !== 'undefined') {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const profileDoc = await getDoc(doc(db, 'profiles', userId));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        if (data.notification_settings) {
          setPreferences({
            ...DEFAULT_PREFERENCES,
            ...data.notification_settings,
          });
        }
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPreferences();
    checkNotificationPermission();
  }, [loadPreferences, checkNotificationPermission]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'profiles', userId), {
        notification_settings: preferences,
      });

      toast({
        title: t.saved,
        description: isRTL ? 'تم تحديث إعدادات التنبيهات بنجاح' : 'Notification settings updated successfully',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: t.saveFailed,
        description: isRTL ? 'حدث خطأ أثناء حفظ الإعدادات' : 'An error occurred while saving settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestPermission = async () => {
    try {
      const granted = await requestNotificationPermission(userId);
      if (granted) {
        setNotificationPermission('granted');
        setPreferences({ ...preferences, enabled: true });
        toast({
          title: isRTL ? 'تم تفعيل التنبيهات' : 'Notifications Enabled',
          description: isRTL ? 'يمكنك الآن تلقي التنبيهات' : 'You can now receive notifications',
        });
      } else {
        setNotificationPermission('denied');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const handleSendTest = async () => {
    try {
      if (!userId) return;
      const url = import.meta.env.VITE_TEST_NOTIFICATION_URL || '/sendTestNotification';
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (resp.ok) {
        toast({
          title: isRTL ? 'تم إرسال إشعار تجريبي' : 'Test notification sent',
          description: isRTL ? 'تحقق من مركز الإشعارات' : 'Check your notification center',
        });
      } else {
        const text = await resp.text();
        toast({
          title: isRTL ? 'فشل الإرسال' : 'Failed to send',
          description: text.slice(0, 160),
          variant: 'destructive',
        });
      }
    } catch (e: any) {
      toast({
        title: isRTL ? 'خطأ في الطلب' : 'Request error',
        description: e?.message || String(e),
        variant: 'destructive',
      });
    }
  };

  const toggleReminderTime = (minutes: number) => {
    const current = preferences.booking_reminders.reminder_times;
    const updated = current.includes(minutes)
      ? current.filter(m => m !== minutes)
      : [...current, minutes].sort((a, b) => a - b);

    setPreferences({
      ...preferences,
      booking_reminders: {
        ...preferences.booking_reminders,
        reminder_times: updated,
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            {isRTL ? 'جاري التحميل...' : 'Loading...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Warning */}
        {notificationPermission === 'denied' && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
            <div className="flex items-start gap-2">
              <BellOff className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-destructive">{t.permissionDenied}</h4>
                <p className="text-sm text-muted-foreground mt-1">{t.permissionDeniedDesc}</p>
              </div>
            </div>
          </div>
        )}

        {notificationPermission === 'default' && (
          <div className="bg-primary/10 border border-primary rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <Bell className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold">{t.enableNotifications}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{t.enableDesc}</p>
                </div>
              </div>
              <Button onClick={handleRequestPermission} className="shrink-0">
                {t.requestPermission}
              </Button>
            </div>
          </div>
        )}

        {/* Enable All Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable-all">{t.enableNotifications}</Label>
            <p className="text-sm text-muted-foreground">{t.enableDesc}</p>
          </div>
          <Switch
            id="enable-all"
            checked={preferences.enabled && notificationPermission === 'granted'}
            onCheckedChange={(checked) => setPreferences({ ...preferences, enabled: checked })}
            disabled={notificationPermission !== 'granted'}
          />
        </div>

        <Separator />

        {/* Booking Reminders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="booking-reminders" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t.bookingReminders}
              </Label>
              <p className="text-sm text-muted-foreground">{t.bookingRemindersDesc}</p>
            </div>
            <Switch
              id="booking-reminders"
              checked={preferences.booking_reminders.enabled}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  booking_reminders: { ...preferences.booking_reminders, enabled: checked },
                })
              }
              disabled={!preferences.enabled}
            />
          </div>

          {preferences.booking_reminders.enabled && (
            <div className="space-y-2 pl-6">
              <Label className="text-sm">{t.reminderTimes}</Label>
              <p className="text-xs text-muted-foreground">{t.reminderTimesDesc}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                {reminderOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant={
                      preferences.booking_reminders.reminder_times.includes(option.value)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => toggleReminderTime(option.value)}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Booking Updates */}
        <div className="space-y-4">
          <div>
            <Label className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {t.bookingUpdates}
            </Label>
            <p className="text-sm text-muted-foreground mt-1">{t.bookingUpdatesDesc}</p>
          </div>

          <div className="space-y-3 pl-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="confirmations" className="text-sm">
                {t.confirmations}
              </Label>
              <Switch
                id="confirmations"
                checked={preferences.booking_updates.confirmations}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    booking_updates: { ...preferences.booking_updates, confirmations: checked },
                  })
                }
                disabled={!preferences.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="cancellations" className="text-sm">
                {t.cancellations}
              </Label>
              <Switch
                id="cancellations"
                checked={preferences.booking_updates.cancellations}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    booking_updates: { ...preferences.booking_updates, cancellations: checked },
                  })
                }
                disabled={!preferences.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="completions" className="text-sm">
                {t.completions}
              </Label>
              <Switch
                id="completions"
                checked={preferences.booking_updates.completions}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    booking_updates: { ...preferences.booking_updates, completions: checked },
                  })
                }
                disabled={!preferences.enabled}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Quiet Hours */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quiet-hours" className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                {t.quietHours}
              </Label>
              <p className="text-sm text-muted-foreground">{t.quietHoursDesc}</p>
            </div>
            <Switch
              id="quiet-hours"
              checked={preferences.quiet_hours.enabled}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  quiet_hours: { ...preferences.quiet_hours, enabled: checked },
                })
              }
              disabled={!preferences.enabled}
            />
          </div>

          {preferences.quiet_hours.enabled && (
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="start-time" className="text-sm">
                  {t.startTime}
                </Label>
                <input
                  id="start-time"
                  type="time"
                  value={preferences.quiet_hours.start}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      quiet_hours: { ...preferences.quiet_hours, start: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-time" className="text-sm">
                  {t.endTime}
                </Label>
                <input
                  id="end-time"
                  type="time"
                  value={preferences.quiet_hours.end}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      quiet_hours: { ...preferences.quiet_hours, end: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving || !preferences.enabled}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? t.saving : t.save}
        </Button>

        {/* Test Push Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleSendTest}
          disabled={!preferences.enabled}
          className="w-full mt-2"
        >
          <BellRing className="h-4 w-4 mr-2" />
          {isRTL ? 'إرسال إشعار تجريبي' : 'Send Test Notification'}
        </Button>
      </CardContent>
    </Card>
  );
}
