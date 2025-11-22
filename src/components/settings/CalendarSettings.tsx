import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Calendar, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n';

interface CalendarSettingsProps {
  language?: 'ar' | 'en';
}

export const CALENDAR_PREFS_KEY = 'serv_yard_calendar_prefs';

export interface CalendarPreferences {
  autoAdd: boolean;
  provider: 'google' | 'apple' | 'outlook' | 'ics';
}

const DEFAULT_PREFS: CalendarPreferences = {
  autoAdd: false,
  provider: 'google'
};

export function CalendarSettings({ language = 'ar' }: CalendarSettingsProps) {
  const { t, isRTL } = useTranslation(language);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<CalendarPreferences>(DEFAULT_PREFS);

  useEffect(() => {
    const saved = localStorage.getItem(CALENDAR_PREFS_KEY);
    if (saved) {
      try {
        setPrefs(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse calendar prefs', e);
      }
    }
  }, []);

  const handleSave = () => {
    setLoading(true);
    try {
      localStorage.setItem(CALENDAR_PREFS_KEY, JSON.stringify(prefs));
      toast({
        title: isRTL ? 'تم حفظ الإعدادات' : 'Settings saved',
        description: isRTL ? 'تم تحديث تفضيلات التقويم بنجاح' : 'Calendar preferences updated successfully',
      });
    } catch (error) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل حفظ الإعدادات' : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <CardTitle>{isRTL ? 'إعدادات التقويم' : 'Calendar Settings'}</CardTitle>
        </div>
        <CardDescription>
          {isRTL 
            ? 'تحكم في كيفية إضافة الحجوزات إلى تقويمك' 
            : 'Manage how bookings are added to your calendar'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label className="text-base">
              {isRTL ? 'إضافة تلقائية' : 'Automatic Addition'}
            </Label>
            <p className="text-sm text-muted-foreground">
              {isRTL 
                ? 'إضافة الحجوزات المؤكدة تلقائياً إلى التقويم' 
                : 'Automatically add confirmed bookings to calendar'}
            </p>
          </div>
          <Switch
            checked={prefs.autoAdd}
            onCheckedChange={(checked) => setPrefs(prev => ({ ...prev, autoAdd: checked }))}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            <Save className="w-4 h-4" />
            {isRTL ? 'حفظ التغييرات' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
