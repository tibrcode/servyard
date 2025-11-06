// Service Booking Settings Component
// مكون إعدادات الحجز للخدمة

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { BookingSettings } from '@/types/booking';
import { Clock, Users, Calendar, AlertCircle, Save } from 'lucide-react';

interface ServiceBookingSettingsProps {
  serviceId: string;
  currentSettings?: Partial<BookingSettings>;
  onSettingsChange?: (settings: BookingSettings) => void;
  language?: 'ar' | 'en';
}

const DEFAULT_SETTINGS: BookingSettings = {
  booking_enabled: false,
  duration_minutes: 30,
  max_concurrent_bookings: 1,
  advance_booking_days: 30,
  cancellation_policy_hours: 24,
  require_confirmation: true,
  allow_customer_cancellation: true,
  buffer_time_minutes: 0,
};

export function ServiceBookingSettings({
  serviceId,
  currentSettings,
  onSettingsChange,
  language = 'ar',
}: ServiceBookingSettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BookingSettings>({
    ...DEFAULT_SETTINGS,
    ...currentSettings,
  });
  const [isSaving, setIsSaving] = useState(false);

  const isRTL = language === 'ar';

  // Translation object (simplified - will use full i18n later)
  const t = {
    title: isRTL ? 'إعدادات الحجز' : 'Booking Settings',
    subtitle: isRTL ? 'تخصيص كيفية عمل نظام الحجز لهذه الخدمة' : 'Customize how booking works for this service',
    enableBooking: isRTL ? 'تفعيل نظام الحجز' : 'Enable Booking System',
    enableDesc: isRTL ? 'السماح للعملاء بحجز هذه الخدمة عبر الإنترنت' : 'Allow customers to book this service online',
    serviceDuration: isRTL ? 'مدة الخدمة' : 'Service Duration',
    durationDesc: isRTL ? 'كم من الوقت تستغرق هذه الخدمة' : 'How long this service takes',
    concurrentBookings: isRTL ? 'الحجوزات المتزامنة' : 'Concurrent Bookings',
    concurrentDesc: isRTL ? 'عدد العملاء الذين يمكن خدمتهم في نفس الوقت' : 'Number of clients you can serve at the same time',
    advanceBooking: isRTL ? 'الحجز المسبق' : 'Advance Booking',
    advanceDesc: isRTL ? 'كم يوم مقدماً يمكن للعملاء الحجز' : 'How many days ahead customers can book',
    bufferTime: isRTL ? 'وقت فاصل' : 'Buffer Time',
    bufferDesc: isRTL ? 'وقت راحة بين المواعيد' : 'Rest time between appointments',
    cancellationPolicy: isRTL ? 'سياسة الإلغاء' : 'Cancellation Policy',
    cancellationDesc: isRTL ? 'الحد الأدنى من الساعات قبل الموعد للإلغاء' : 'Minimum hours before appointment to cancel',
    requireConfirmation: isRTL ? 'يتطلب تأكيد' : 'Require Confirmation',
    requireConfirmDesc: isRTL ? 'يجب تأكيد الحجوزات يدوياً' : 'Bookings must be manually confirmed',
    allowCancellation: isRTL ? 'السماح بإلغاء العملاء' : 'Allow Customer Cancellation',
    allowCancelDesc: isRTL ? 'يمكن للعملاء إلغاء حجوزاتهم' : 'Customers can cancel their bookings',
    save: isRTL ? 'حفظ الإعدادات' : 'Save Settings',
    minutes: isRTL ? 'دقيقة' : 'minutes',
    days: isRTL ? 'يوم' : 'days',
    hours: isRTL ? 'ساعة' : 'hours',
    clients: isRTL ? 'عملاء' : 'clients',
    saved: isRTL ? 'تم حفظ الإعدادات' : 'Settings saved',
    saveFailed: isRTL ? 'فشل حفظ الإعدادات' : 'Failed to save settings',
  };

  const durationOptions = [
    { value: '15', label: `15 ${t.minutes}` },
    { value: '30', label: `30 ${t.minutes}` },
    { value: '45', label: `45 ${t.minutes}` },
    { value: '60', label: `1 ${t.hours}` },
    { value: '90', label: `1.5 ${t.hours}` },
    { value: '120', label: `2 ${t.hours}` },
    { value: '180', label: `3 ${t.hours}` },
    { value: '240', label: `4 ${t.hours}` },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Validation
      if (settings.duration_minutes < 15) {
        toast({
          title: isRTL ? 'خطأ' : 'Error',
          description: isRTL ? 'المدة يجب أن تكون 15 دقيقة على الأقل' : 'Duration must be at least 15 minutes',
          variant: 'destructive',
        });
        return;
      }

      if (settings.max_concurrent_bookings < 1) {
        toast({
          title: isRTL ? 'خطأ' : 'Error',
          description: isRTL ? 'يجب أن يكون هناك موظف واحد على الأقل' : 'At least 1 staff member required',
          variant: 'destructive',
        });
        return;
      }

      // Call parent callback
      if (onSettingsChange) {
        onSettingsChange(settings);
      }

      toast({
        title: t.saved,
        description: isRTL ? 'تم تحديث إعدادات الحجز بنجاح' : 'Booking settings updated successfully',
      });
    } catch (error) {
      console.error('Error saving booking settings:', error);
      toast({
        title: t.saveFailed,
        description: isRTL ? 'حدث خطأ أثناء حفظ الإعدادات' : 'An error occurred while saving settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Booking Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable-booking">{t.enableBooking}</Label>
            <p className="text-sm text-muted-foreground">{t.enableDesc}</p>
          </div>
          <Switch
            id="enable-booking"
            checked={settings.booking_enabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, booking_enabled: checked })
            }
          />
        </div>

        {settings.booking_enabled && (
          <>
            <Separator />

            {/* Service Duration */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label>{t.serviceDuration}</Label>
              </div>
              <p className="text-sm text-muted-foreground">{t.durationDesc}</p>
              <Select
                value={settings.duration_minutes.toString()}
                onValueChange={(value) =>
                  setSettings({ ...settings, duration_minutes: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Concurrent Bookings */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label>{t.concurrentBookings}</Label>
              </div>
              <p className="text-sm text-muted-foreground">{t.concurrentDesc}</p>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={settings.max_concurrent_bookings?.toString() || ''}
                  onChange={(e) => {
                    const input = e.target.value.replace(/\D/g, '');
                    const value = parseInt(input) || 1;
                    if (value >= 1 && value <= 10) {
                      setSettings({
                        ...settings,
                        max_concurrent_bookings: value,
                      });
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) {
                      setSettings({
                        ...settings,
                        max_concurrent_bookings: 1,
                      });
                    }
                  }}
                  className="max-w-[100px]"
                />
                <span className="text-sm text-muted-foreground">{t.clients}</span>
              </div>
            </div>

            {/* Advance Booking Days */}
            <div className="space-y-2">
              <Label>{t.advanceBooking}</Label>
              <p className="text-sm text-muted-foreground">{t.advanceDesc}</p>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={settings.advance_booking_days?.toString() || ''}
                  onChange={(e) => {
                    const input = e.target.value.replace(/\D/g, '');
                    const value = parseInt(input) || 1;
                    if (value >= 1 && value <= 365) {
                      setSettings({
                        ...settings,
                        advance_booking_days: value,
                      });
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) {
                      setSettings({
                        ...settings,
                        advance_booking_days: 30,
                      });
                    }
                  }}
                  className="max-w-[100px]"
                />
                <span className="text-sm text-muted-foreground">{t.days}</span>
              </div>
            </div>

            {/* Buffer Time */}
            <div className="space-y-2">
              <Label>{t.bufferTime}</Label>
              <p className="text-sm text-muted-foreground">{t.bufferDesc}</p>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={settings.buffer_time_minutes?.toString() || ''}
                  onChange={(e) => {
                    const input = e.target.value.replace(/\D/g, '');
                    const value = parseInt(input) || 0;
                    if (value >= 0 && value <= 60) {
                      setSettings({
                        ...settings,
                        buffer_time_minutes: value,
                      });
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) {
                      setSettings({
                        ...settings,
                        buffer_time_minutes: 0,
                      });
                    }
                  }}
                  className="max-w-[100px]"
                />
                <span className="text-sm text-muted-foreground">{t.minutes}</span>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <Label>{t.cancellationPolicy}</Label>
              </div>
              <p className="text-sm text-muted-foreground">{t.cancellationDesc}</p>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={settings.cancellation_policy_hours?.toString() || ''}
                  onChange={(e) => {
                    const input = e.target.value.replace(/\D/g, '');
                    const value = parseInt(input) || 0;
                    if (value >= 0 && value <= 168) {
                      setSettings({
                        ...settings,
                        cancellation_policy_hours: value,
                      });
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) {
                      setSettings({
                        ...settings,
                        cancellation_policy_hours: 24,
                      });
                    }
                  }}
                  className="max-w-[100px]"
                />
                <span className="text-sm text-muted-foreground">{t.hours}</span>
              </div>
            </div>

            <Separator />

            {/* Require Confirmation */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require-confirm">{t.requireConfirmation}</Label>
                <p className="text-sm text-muted-foreground">{t.requireConfirmDesc}</p>
              </div>
              <Switch
                id="require-confirm"
                checked={settings.require_confirmation}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, require_confirmation: checked })
                }
              />
            </div>

            {/* Allow Customer Cancellation */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow-cancel">{t.allowCancellation}</Label>
                <p className="text-sm text-muted-foreground">{t.allowCancelDesc}</p>
              </div>
              <Switch
                id="allow-cancel"
                checked={settings.allow_customer_cancellation}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allow_customer_cancellation: checked })
                }
              />
            </div>

            <Separator />

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full"
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : t.save}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
