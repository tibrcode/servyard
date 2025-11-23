import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ClipboardCheck, User, UserPlus } from "lucide-react";
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
    if (!loading && user && profile?.user_type && profile.full_name && profile.city && profile.country) {
      if (profile.user_type === 'provider') navigate('/provider-dashboard', { replace: true });
      if (profile.user_type === 'customer') navigate('/customer-dashboard', { replace: true });
    }
  }, [loading, user, profile, navigate]);

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

  // If no role is selected yet, show the selection screen
  if (!selectedRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary mb-2">{t.auth.welcome}</h1>
            <p className="text-muted-foreground text-lg">{t.auth.subtitle}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all hover:border-primary group"
              onClick={() => setSelectedRole('customer')}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-xl mb-2">{t.auth.joinAsCustomer}</CardTitle>
                <CardDescription>{t.auth.customerDescription}</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-all hover:border-primary group"
              onClick={() => setSelectedRole('provider')}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <UserPlus className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-xl mb-2">{t.auth.joinAsProvider}</CardTitle>
                <CardDescription>{t.auth.providerDescription}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
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
              <Label>{isRTL ? 'المنطقة الزمنية *' : 'Timezone *'}</Label>
              <Select value={timezone} onValueChange={setTimezone} disabled={saving}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isRTL ? 'اختر المنطقة الزمنية' : 'Select timezone'} />
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
                {isRTL 
                  ? 'يستخدم لحساب الأوقات بدقة'
                  : 'Used to calculate times accurately'}
              </p>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox id="termsAccepted" checked={accepted} onCheckedChange={(v) => setAccepted(!!v)} disabled={saving} />
              <Label htmlFor="termsAccepted" className="text-sm leading-tight">{t.auth.termsAgreement}</Label>
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
