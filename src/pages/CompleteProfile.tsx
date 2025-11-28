import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ClipboardCheck } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { commonTimezones, getBrowserTimezone } from "@/lib/timezones";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { db } from "@/integrations/firebase/client";
import { doc, setDoc } from "firebase/firestore";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

interface CompleteProfileProps {
  currentLanguage: string;
}

export default function CompleteProfile({ currentLanguage }: CompleteProfileProps) {
  const { t, isRTL } = useTranslation(currentLanguage);
  const { user, profile, loading } = useAuth();
  const query = useQuery();
  const navigate = useNavigate();

  const queryRole = (query.get('role') as 'provider' | 'customer' | null) || (profile?.user_type as any) || null;
  const [selectedRole, setSelectedRole] = useState<'provider' | 'customer' | null>(queryRole);

  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState(getBrowserTimezone());
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (queryRole) setSelectedRole(queryRole);
  }, [queryRole]);

  useEffect(() => {
    if (!loading) {
      if (!user) return;
      setFullName(profile?.full_name || user.displayName || '');
      setCity(profile?.city || '');
      setCountry(profile?.country || '');
      setTimezone(profile?.timezone || getBrowserTimezone());
    }
  }, [loading, user, profile]);

  useEffect(() => {
    // If user already has role and basic info, send to dashboard
    if (!loading && user && profile?.user_type && profile.user_type !== 'unknown' && profile.full_name && profile.city && profile.country) {
      if (profile.user_type === 'provider') navigate('/provider-dashboard', { replace: true });
      if (profile.user_type === 'customer') navigate('/customer-dashboard', { replace: true });
    }
  }, [loading, user, profile, navigate]);

  // If no role selected, redirect to role selection page
  useEffect(() => {
    if (!loading && user && !selectedRole && !queryRole) {
      navigate('/select-role', { replace: true });
    }
  }, [loading, user, selectedRole, queryRole, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-center">{t.ui.accessDenied}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">{t.ui.loginRequired}</p>
            <Button onClick={() => navigate('/auth')}>{t.actions.login}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no role is selected, the useEffect above will redirect to /select-role
  // Show loading while redirecting
  if (!selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!accepted) {
      setError(t.auth.termsRequired);
      return;
    }
    if (!fullName || !city || !country) {
      setError(t.ui.errorLoadingData || 'Please fill required fields');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        user_id: user.uid,
        full_name: fullName,
        city,
        country,
        timezone: timezone || getBrowserTimezone(),
        terms_accepted_at: new Date(),
        updated_at: new Date(),
      };
      // Only set created_at when creating for the first time; never send undefined to Firestore
      if (!profile?.id) payload.created_at = new Date();
      if (phone) payload.phone_numbers = [phone];
      if (selectedRole) payload.user_type = selectedRole;

      await setDoc(doc(db, 'profiles', user.uid), payload, { merge: true });

      if (payload.user_type === 'provider' || profile?.user_type === 'provider') {
        navigate('/provider-dashboard', { replace: true });
      } else if (payload.user_type === 'customer' || profile?.user_type === 'customer') {
        navigate('/customer-dashboard', { replace: true });
      } else {
        navigate('/auth');
      }
    } catch (err: any) {
      console.error('CompleteProfile save error:', err);
      setError(t.ui.errorLoadingData || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="max-w-lg w-full mx-4">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            {selectedRole === 'provider' ? t.provider?.profile || 'Complete Provider Profile' : t.customer?.profile || 'Complete Profile'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSave}>
            {error ? (
              <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t.auth.fullName} *</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={saving} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t.auth.phoneNumber}</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={saving} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t.auth.city} *</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required disabled={saving} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">{t.auth.country} *</Label>
                <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} required disabled={saving} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.timezone?.label || 'Timezone'} *</Label>
              <Select value={timezone} onValueChange={setTimezone} disabled={saving}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.timezone?.placeholder || 'Select timezone'} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {commonTimezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label} ({tz.offset})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t.timezone?.hint || 'Used to calculate times accurately'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Switch 
                id="termsAccepted" 
                checked={accepted} 
                onCheckedChange={(v) => setAccepted(!!v)} 
                disabled={saving}
              />
              <Label htmlFor="termsAccepted" className="text-sm leading-relaxed cursor-pointer">{t.auth.termsAgreement}</Label>
            </div>

            <Button type="submit" className="w-full luxury-button" disabled={saving || !accepted}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t.actions.save}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
