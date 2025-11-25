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
        title: t.calendarSettings?.saved || 'Settings saved',
        description: t.calendarSettings?.savedDesc || 'Calendar preferences updated successfully',
      });
    } catch (error) {
      toast({
        title: t.calendarSettings?.error || 'Error',
        description: t.calendarSettings?.errorDesc || 'Failed to save settings',
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
          <CardTitle>{t.calendarSettings?.title || 'Calendar Settings'}</CardTitle>
        </div>
        <CardDescription>
          {t.calendarSettings?.description || 'Manage how bookings are added to your calendar'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label className="text-base">
              {t.calendarSettings?.autoAdd || 'Automatic Addition'}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t.calendarSettings?.autoAddDesc || 'Automatically add confirmed bookings to calendar'}
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
            {t.calendarSettings?.saveChanges || 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
