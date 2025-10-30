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

      navigate('/customer-dashboard');
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

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="customerTermsAccepted"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, termsAccepted: !!checked }))
                  }
                  disabled={isLoading}
                />
                <Label htmlFor="customerTermsAccepted" className="text-sm leading-tight">
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
        </form>
      </CardContent>
    </Card>
  );
};