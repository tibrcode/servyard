import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, ShoppingBag, Mail, Lock, Phone, MapPin, FileText } from "lucide-react";
import { auth, db } from "@/integrations/firebase/client";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { signInWithGoogle } from "@/lib/firebase/googleAuth";
import { doc, setDoc } from "firebase/firestore";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CustomerSignupProps {
  currentLanguage: string;
}

export const CustomerSignup = ({ currentLanguage }: CustomerSignupProps) => {
  const { t } = useTranslation(currentLanguage);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    whatsappNumber: '',
    city: '',
    country: '',
    termsAccepted: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTermsDialogOpen, setIsTermsDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.termsAccepted) {
      setError(t.auth.termsRequired);
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, {
        displayName: formData.fullName,
      });

      // Create user profile in Firestore
      const phoneNumbers = formData.phoneNumber ? [formData.phoneNumber] : [];

      await setDoc(doc(db, 'profiles', user.uid), {
        user_id: user.uid,
        user_type: 'customer',
        full_name: formData.fullName,
        email: formData.email,
        phone_numbers: phoneNumbers,
        whatsapp_number: formData.whatsappNumber,
        city: formData.city,
        country: formData.country,
        terms_accepted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });

      toast({
        title: t.auth.signupSuccess,
        description: t.auth.checkEmailVerification
      });

      // After signup, complete missing profile details first
      navigate('/complete-profile?role=customer');
    } catch (err: any) {
      console.error('Customer signup error:', err);
      setError(t.auth.signupError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          {t.auth.customerSignup}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerFullName">{t.auth.fullName} *</Label>
              <Input
                id="customerFullName"
                value={formData.fullName}
                onChange={handleInputChange('fullName')}
                placeholder={t.auth.fullNamePlaceholder}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">{t.auth.email} *</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                placeholder={t.auth.emailPlaceholder}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPassword">{t.auth.password} *</Label>
            <Input
              id="customerPassword"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              placeholder={t.auth.passwordPlaceholder}
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerPhone">{t.auth.phoneNumber}</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange('phoneNumber')}
                placeholder={t.auth.phoneNumberPlaceholder}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerWhatsapp">{t.auth.whatsappNumber}</Label>
              <Input
                id="customerWhatsapp"
                type="tel"
                value={formData.whatsappNumber}
                onChange={handleInputChange('whatsappNumber')}
                placeholder={t.auth.whatsappNumberPlaceholder}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerCity">{t.auth.city} *</Label>
              <Input
                id="customerCity"
                value={formData.city}
                onChange={handleInputChange('city')}
                placeholder={t.auth.cityPlaceholder}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerCountry">{t.auth.country} *</Label>
              <Input
                id="customerCountry"
                value={formData.country}
                onChange={handleInputChange('country')}
                placeholder={t.auth.countryPlaceholder}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Terms */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {t.legal?.terms?.title}
            </h3>

            <div className="flex flex-col space-y-3">
              <Dialog open={isTermsDialogOpen} onOpenChange={setIsTermsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" type="button" className="self-start">
                    <FileText className="w-4 h-4 mr-2" />
                    {t.actions?.viewTerms}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>{t.legal?.customerTerms?.title}</DialogTitle>
                    <DialogDescription>{t.legal?.customerTerms?.intro}</DialogDescription>
                  </DialogHeader>
                  <div className="prose prose-sm dark:prose-invert max-w-none overflow-y-auto">
                    {t.legal?.customerTerms ? (
                      <>
                        <p className="mb-4">{t.legal.customerTerms.intro}</p>
                        <ol className="list-decimal list-inside space-y-2">
                          {t.legal.customerTerms.points.map((p: string, idx: number) => (
                            <li key={idx}>{p}</li>
                          ))}
                        </ol>
                      </>
                    ) : null}
                  </div>
                </DialogContent>
              </Dialog>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="customerTermsAccepted"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, termsAccepted: !!checked }))
                  }
                  disabled={isLoading}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <Label htmlFor="customerTermsAccepted" className="text-sm leading-relaxed cursor-pointer">
                  {t.auth.termsAgreement}
                </Label>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full luxury-button" disabled={isLoading || !formData.termsAccepted}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {t.auth.createCustomerAccount}
          </Button>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">أو</span>
            </div>
          </div>

          {/* Google Sign-Up */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isGoogleLoading || !formData.termsAccepted}
            onClick={async () => {
              setError('');
              if (!formData.termsAccepted) return;
              setIsGoogleLoading(true);
              try {
                const { user } = await signInWithGoogle();

                if (!user.displayName && formData.fullName) {
                  await updateProfile(user, { displayName: formData.fullName });
                }

                await setDoc(doc(db, 'profiles', user.uid), {
                  user_id: user.uid,
                  user_type: 'customer',
                  full_name: user.displayName || formData.fullName || '',
                  email: user.email,
                  phone_numbers: formData.phoneNumber ? [formData.phoneNumber] : [],
                  whatsapp_number: formData.whatsappNumber || '',
                  city: formData.city || '',
                  country: formData.country || '',
                  terms_accepted_at: new Date(),
                  updated_at: new Date(),
                  created_at: new Date(),
                }, { merge: true });

                toast({ title: t.auth.signupSuccess });
                navigate('/complete-profile?role=customer');
              } catch (err: any) {
                console.error('Google customer signup error:', err);
                if (String(err?.message || '').includes('popup-closed-by-user')) {
                  // silent
                } else {
                  setError(t.auth.signupError);
                }
              } finally {
                setIsGoogleLoading(false);
              }
            }}
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 mr-2">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.201,6.053,28.791,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.817C14.655,16.108,18.961,13,24,13c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C33.201,6.053,28.791,4,24,4C16.318,4,9.656,8.336,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c4.721,0,9.039-1.807,12.304-4.757l-5.682-4.733C28.562,36.976,26.396,38,24,38 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.081,5.51 c0.001-0.001,0.002-0.001,0.003-0.002l5.682,4.733C35.56,39.205,40,35.333,42.443,30.59c0.643-1.498,1.043-3.122,1.168-4.807 C43.862,21.35,44,22.659,43.611,20.083z"/>
              </svg>
            )}
            {t.auth.continueWithGoogle || 'Continue with Google'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};