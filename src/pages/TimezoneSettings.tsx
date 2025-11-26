import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Globe, Clock, MapPin, CheckCircle, ArrowLeft } from "lucide-react";
import { commonTimezones, getBrowserTimezone, getTimezoneLabel } from "@/lib/timezones";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/integrations/firebase/client";
import { doc, updateDoc } from "firebase/firestore";
import { useTranslation } from "@/lib/i18n";

interface TimezoneSettingsProps {
  currentLanguage: string;
}

export default function TimezoneSettings({ currentLanguage }: TimezoneSettingsProps) {
  const { t, isRTL } = useTranslation(currentLanguage);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedTimezone, setSelectedTimezone] = useState<string>(getBrowserTimezone());
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load user's timezone if logged in
  useEffect(() => {
    if (profile?.timezone) {
      setSelectedTimezone(profile.timezone);
    } else {
      setSelectedTimezone(getBrowserTimezone());
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) {
      toast({
        title: t.timezone?.notice || 'Notice',
        description: isRTL 
          ? 'يجب تسجيل الدخول لحفظ المنطقة الزمنية' 
          : 'Please log in to save your timezone',
        variant: 'default',
      });
      navigate('/auth');
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        timezone: selectedTimezone,
        updated_at: new Date()
      });

      toast({
        title: t.timezone?.savedSuccessfully || 'Saved Successfully',
        description: isRTL 
          ? 'تم تحديث المنطقة الزمنية بنجاح' 
          : 'Timezone has been updated successfully',
      });
    } catch (error) {
      console.error('Error saving timezone:', error);
      toast({
        title: t.calendarSettings?.error || 'Error',
        description: t.timezone?.saveFailed || 'Failed to save timezone',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getTimeInTimezone = (timezone: string): string => {
    try {
      return currentTime.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return '--:--:--';
    }
  };

  const getDateInTimezone = (timezone: string): string => {
    try {
      return currentTime.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        timeZone: timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '---';
    }
  };

  return (
    <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.timezone?.back || 'Back'}
        </Button>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Globe className="h-6 w-6" />
              {t.timezone?.title || 'Timezone Settings'}
            </CardTitle>
            <CardDescription>
              {t.timezone?.description || (isRTL 
                ? 'اختر المنطقة الزمنية الخاصة بك لحساب الأوقات والإشعارات بدقة' 
                : 'Select your timezone for accurate time calculations and notifications')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Current Time Display */}
            <Card className="card-nested">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      {t.timezone?.currentTime || 'Current time in your timezone'}
                    </span>
                  </div>
                  <div className="text-4xl font-bold">
                    {getTimeInTimezone(selectedTimezone)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getDateInTimezone(selectedTimezone)}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
                    <MapPin className="h-3 w-3" />
                    <span>{getTimezoneLabel(selectedTimezone)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timezone Selector */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                {t.timezone?.selectTimezone || 'Select Timezone'}
              </Label>
              <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder={t.timezone?.selectTimezone || 'Select timezone'} />
                </SelectTrigger>
                <SelectContent className="max-h-96">
                  {/* Group timezones by region */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {t.timezone?.middleEast || 'Middle East & North Africa'}
                  </div>
                  {commonTimezones.filter(tz => 
                    tz.value.includes('Dubai') || tz.value.includes('Riyadh') || 
                    tz.value.includes('Kuwait') || tz.value.includes('Qatar') ||
                    tz.value.includes('Bahrain') || tz.value.includes('Muscat') ||
                    tz.value.includes('Cairo') || tz.value.includes('Amman') ||
                    tz.value.includes('Beirut') || tz.value.includes('Damascus') ||
                    tz.value.includes('Baghdad')
                  ).map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label} ({tz.offset})
                    </SelectItem>
                  ))}

                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2">
                    {t.timezone?.europe || 'Europe'}
                  </div>
                  {commonTimezones.filter(tz => tz.value.includes('Europe')).map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label} ({tz.offset})
                    </SelectItem>
                  ))}

                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2">
                    {t.timezone?.asia || 'Asia'}
                  </div>
                  {commonTimezones.filter(tz => 
                    tz.value.includes('Asia') && 
                    !['Dubai', 'Riyadh', 'Kuwait', 'Qatar', 'Bahrain', 'Muscat', 'Amman', 'Beirut', 'Damascus', 'Baghdad'].some(city => tz.value.includes(city))
                  ).map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label} ({tz.offset})
                    </SelectItem>
                  ))}

                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2">
                    {t.timezone?.americas || 'Americas'}
                  </div>
                  {commonTimezones.filter(tz => tz.value.includes('America')).map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label} ({tz.offset})
                    </SelectItem>
                  ))}

                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2">
                    {t.timezone?.africa || 'Africa'}
                  </div>
                  {commonTimezones.filter(tz => tz.value.includes('Africa')).map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label} ({tz.offset})
                    </SelectItem>
                  ))}

                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2">
                    {t.timezone?.pacific || 'Australia & Pacific'}
                  </div>
                  {commonTimezones.filter(tz => 
                    tz.value.includes('Australia') || tz.value.includes('Pacific')
                  ).map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label} ({tz.offset})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    {t.timezone?.whyImportant || 'Why is timezone important?'}
                  </p>
                  <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400">•</span>
                      <span>{t.timezone?.accurateBooking || 'Accurate booking time calculations'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400">•</span>
                      <span>{t.timezone?.timelyNotifications || 'Timely notification delivery'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400">•</span>
                      <span>{t.timezone?.respectQuietHours || 'Respect local quiet hours'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400">•</span>
                      <span>{t.timezone?.seamlessExperience || 'Seamless experience worldwide'}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
                size="lg"
              >
                {saving ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    {t.timezone?.saving || 'Saving...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {user 
                      ? (t.timezone?.saveTimezone || 'Save Timezone')
                      : (t.timezone?.loginToSave || 'Login to Save')
                    }
                  </>
                )}
              </Button>
            </div>

            {!user && (
              <p className="text-sm text-center text-muted-foreground">
                {t.timezone?.browseWithoutLogin || 'You can browse without logging in, but login is required to save'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
