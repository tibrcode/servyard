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
import { Bell, BellOff, Clock, CheckCircle2, XCircle, Moon, Save, BellRing, Info } from 'lucide-react';
import { db } from '@/integrations/firebase/client';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { withTrace } from '@/lib/trace';
import { requestNotificationPermission } from '@/lib/firebase/notifications';
import { useTranslation } from '@/lib/i18n';

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
  const { t, isRTL } = useTranslation(language);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const reminderOptions = [
    { value: 15, label: t.notificationSettings.min15 },
    { value: 30, label: t.notificationSettings.min30 },
    { value: 60, label: t.notificationSettings.hour1 },
    { value: 120, label: t.notificationSettings.hour2 },
    { value: 180, label: t.notificationSettings.hour3 },
    { value: 1440, label: t.notificationSettings.day1 },
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
      // Validate preferences before saving
      const validatedPreferences = {
        ...preferences,
        quiet_hours: {
          enabled: preferences.quiet_hours?.enabled || false,
          start: preferences.quiet_hours?.start || '22:00',
          end: preferences.quiet_hours?.end || '08:00',
        },
        booking_reminders: {
          enabled: preferences.booking_reminders?.enabled || false,
          reminder_times: Array.isArray(preferences.booking_reminders?.reminder_times) 
            ? preferences.booking_reminders.reminder_times 
            : [],
        },
        booking_updates: {
          confirmations: preferences.booking_updates?.confirmations !== false,
          cancellations: preferences.booking_updates?.cancellations !== false,
          completions: preferences.booking_updates?.completions !== false,
        },
      };

      await updateDoc(doc(db, 'profiles', userId), {
        notification_settings: validatedPreferences,
        updated_at: new Date(),
      });

      toast({
        title: t.notificationSettings.saved,
        description: t.notificationSettings.savedDesc,
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: t.notificationSettings.saveFailed,
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
          title: t.notificationSettings.notificationsEnabled,
          description: t.notificationSettings.notificationsEnabledDesc,
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
      if (!userId) {
        toast({
          title: isRTL ? 'خطأ' : 'Error',
          description: isRTL ? 'المستخدم غير معرف' : 'User ID not found',
          variant: 'destructive',
        });
        return;
      }
      
      // Check if notification permission is granted first
      if (notificationPermission !== 'granted') {
        toast({
          title: isRTL ? 'تفعيل الإشعارات مطلوب' : 'Notifications Required',
          description: isRTL 
            ? 'يرجى تفعيل الإشعارات أولاً عن طريق زر "طلب الصلاحية" في الأعلى'
            : 'Please enable notifications first by clicking "Request Permission" button above',
          variant: 'destructive',
        });
        return;
      }

      // Check if user has FCM token saved
      console.log('[handleSendTest] Checking FCM token for userId:', userId);
      const profileDoc = await getDoc(doc(db, 'profiles', userId));
      console.log('[handleSendTest] Profile exists:', profileDoc.exists());
      const profileData = profileDoc.data();
      console.log('[handleSendTest] Profile data keys:', profileData ? Object.keys(profileData) : 'no data');
      const fcmToken = profileData?.fcm_token;
      console.log('[handleSendTest] FCM token present:', !!fcmToken);
      
      if (!fcmToken) {
        console.error('[handleSendTest] No FCM token found in profile');
        toast({
          title: isRTL ? 'لم يتم حفظ رمز الإشعارات' : 'No FCM Token Saved',
          description: isRTL 
            ? 'يرجى الضغط على "طلب الصلاحية" أولاً لحفظ رمز الإشعارات'
            : 'Please click "Request Permission" first to save your FCM token',
          variant: 'destructive',
        });
        return;
      }
      
      // Use the new Cloud Run URL from Gen 2 deployment
      const functionUrls = {
        sendTestNotification: 'https://sendtestnotification-btfczcxdyq-uc.a.run.app',
        fallback: 'https://us-central1-servyard-de527.cloudfunctions.net/sendTestNotification',
        custom: import.meta.env.VITE_FIREBASE_FUNCTIONS_URL 
          ? `${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/sendTestNotification`
          : null
      };
      
      const url = functionUrls.custom || functionUrls.sendTestNotification;
      
      console.log('[Test Notification] Sending to:', url);
      console.log('[Test Notification] userId:', userId);
      console.log('[Test Notification] fcmToken:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'none');
      
      // Send the FCM token directly instead of userId to avoid any ID mismatch issues
      const payload = { token: fcmToken, userId };
      console.log('[Test Notification] Payload with token:', JSON.stringify({ ...payload, token: payload.token?.substring(0, 20) + '...' }));
      
      const resp = await fetch(url, withTrace({
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }));
      
      if (resp.ok) {
        const data = await resp.json().catch(() => null);
        console.log('[Test Notification] Success:', data);
        toast({
          title: isRTL ? '✅ تم إرسال إشعار تجريبي' : '✅ Test notification sent',
          description: isRTL ? 'تحقق من مركز الإشعارات في الأعلى' : 'Check your notification center at the top',
        });
      } else {
        const text = await resp.text();
        console.error('[Test Notification] Failed:', resp.status, text);
        
        // Parse error response
        let errorData: any = {};
        try {
          errorData = JSON.parse(text);
        } catch {}
        
        // Better error messages based on error code
        if (errorData?.error?.code === 'missing_token') {
          toast({
            title: isRTL ? 'رمز الإشعارات مفقود' : 'FCM Token Missing',
            description: isRTL 
              ? 'يرجى إعادة طلب صلاحية الإشعارات عن طريق زر "طلب الصلاحية"'
              : 'Please re-request notification permission using "Request Permission" button',
            variant: 'destructive',
          });
        } else if (resp.status === 403) {
          toast({
            title: isRTL ? 'خطأ في الصلاحيات' : 'Permission Error',
            description: isRTL 
              ? 'الوظيفة محمية. تم حل المشكلة، حاول مرة أخرى.' 
              : 'Function permissions issue. Try again in a moment.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: isRTL ? 'فشل الإرسال' : 'Failed to send',
            description: `Status: ${resp.status}${errorData?.error?.message ? ` - ${errorData.error.message}` : ''}`,
            variant: 'destructive',
          });
        }
      }
    } catch (e: any) {
      console.error('[Test Notification] Request error:', e);
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
      <CardContent className="space-y-6 pt-6">
        {/* Permission Status Banner */}
        {notificationPermission === 'denied' && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
            <div className="flex items-start gap-2">
              <BellOff className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-destructive">{t.notificationSettings.permissionDenied}</h4>
                <p className="text-sm text-muted-foreground mt-1">{t.notificationSettings.permissionDeniedDesc}</p>
              </div>
            </div>
          </div>
        )}

        {notificationPermission === 'default' && (
          <div className="bg-primary/10 border border-primary rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-2">
                <Bell className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold">{t.notificationSettings.enableNotifications}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{t.notificationSettings.enableDesc}</p>
                </div>
              </div>
              <Button onClick={handleRequestPermission} className="shrink-0 w-full sm:w-auto">
                {t.notificationSettings.requestPermission}
              </Button>
            </div>
          </div>
        )}

        {notificationPermission === 'granted' && (
          <div className="bg-green-500/10 border border-green-500 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-700 dark:text-green-400">
                  {t.notificationSettings.notificationsEnabled}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {t.notificationSettings.notificationsEnabledDesc}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enable All Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable-all">{t.notificationSettings.enableNotifications}</Label>
            <p className="text-sm text-muted-foreground">{t.notificationSettings.enableDesc}</p>
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
                {t.notificationSettings.bookingReminders}
              </Label>
              <p className="text-sm text-muted-foreground">{t.notificationSettings.bookingRemindersDesc}</p>
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
              <Label className="text-sm">{t.notificationSettings.reminderTimes}</Label>
              <p className="text-xs text-muted-foreground">{t.notificationSettings.reminderTimesDesc}</p>
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
              {/* Reminder summary */}
              <div className="mt-3 text-xs text-muted-foreground">
                <span className="font-medium">{t.notificationSettings.reminderSummaryLabel}: </span>
                {preferences.booking_reminders.reminder_times.length === 0
                  ? t.notificationSettings.noneSelected
                  : preferences.booking_reminders.reminder_times.map(m => {
                      if (m < 60) return (isRTL ? `${m} دقيقة` : `${m} min`);
                      if (m === 60) return isRTL ? 'ساعة واحدة' : '1h';
                      if (m < 180) return isRTL ? `${Math.round(m/60)} ساعات` : `${Math.round(m/60)}h`;
                      if (m < 1440) return isRTL ? `${Math.round(m/60)} ساعة` : `${Math.round(m/60)}h`;
                      if (m === 1440) return isRTL ? 'يوم واحد' : '1d';
                      return `${m}m`;
                    }).join(isRTL ? '، ' : ', ')
                }
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
              {t.notificationSettings.bookingUpdates}
            </Label>
            <p className="text-sm text-muted-foreground mt-1">{t.notificationSettings.bookingUpdatesDesc}</p>
          </div>

          <div className="space-y-3 pl-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="confirmations" className="text-sm">
                {t.notificationSettings.confirmations}
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
                {t.notificationSettings.cancellations}
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
                {t.notificationSettings.completions}
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
                {t.notificationSettings.quietHours}
              </Label>
              <p className="text-sm text-muted-foreground">{t.notificationSettings.quietHoursDesc}</p>
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
                  {t.notificationSettings.startTime}
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
                  {t.notificationSettings.endTime}
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
              <div className="col-span-2 flex items-start gap-2 text-xs text-muted-foreground mt-1">
                <Info className="h-3 w-3 mt-0.5" />
                <span>{t.notificationSettings.quietHoursTooltip}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Request Permission Button - Always visible if not granted */}
          {notificationPermission !== 'granted' && (
            <Button
              onClick={handleRequestPermission}
              variant="default"
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              {t.notificationSettings.requestPermission}
            </Button>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving || !preferences.enabled}
            variant={notificationPermission === 'granted' ? 'default' : 'outline'}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t.notificationSettings.saving : t.notificationSettings.save}
          </Button>

          {/* Test Push Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleSendTest}
            disabled={!preferences.enabled || notificationPermission !== 'granted'}
            className="w-full"
          >
            <BellRing className="h-4 w-4 mr-2" />
            {isRTL ? 'إرسال إشعار تجريبي' : 'Send Test Notification'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
