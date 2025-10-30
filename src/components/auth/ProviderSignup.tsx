import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currencyList, getCurrencyLabel } from "@/lib/currencies";
import { Loader2, Building2, FileText } from "lucide-react";
import { auth, db } from "@/integrations/firebase/client";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ProviderSignupProps {
  currentLanguage: string;
}

export const ProviderSignup = ({ currentLanguage }: ProviderSignupProps) => {
  const { t } = useTranslation(currentLanguage);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumbers: [''],
    websiteUrl: '',
    googleBusinessUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    tiktokUrl: '',
    currencyCode: '',
    licenseNumber: '',
    licenseVerificationUrl: '',
    city: '',
    country: '',
    profileDescription: '',
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

      // Create user account with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, { displayName: formData.fullName });

      // Create provider profile in Firestore (don't block navigation if slow)
      setDoc(doc(db, 'profiles', user.uid), {
        user_id: user.uid,
        user_type: 'provider',
        full_name: formData.fullName,
        email: formData.email,
        phone_numbers: formData.phoneNumbers.filter(phone => phone.trim() !== ''),
        website_url: formData.websiteUrl,
        google_business_url: formData.googleBusinessUrl,
        instagram_url: formData.instagramUrl,
        facebook_url: formData.facebookUrl,
        tiktok_url: formData.tiktokUrl,
        currency_code: formData.currencyCode || null,
        license_number: formData.licenseNumber,
        license_verification_url: formData.licenseVerificationUrl,
        city: formData.city,
        country: formData.country,
        profile_description: formData.profileDescription,
        terms_accepted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }).catch((err) => {
        console.warn('Failed to create provider profile', err);
      });

      toast({
        title: t.auth.signupSuccess,
        description: t.auth.checkEmailVerification
      });

      // Stop loading and navigate immediately
      setIsLoading(false);
      navigate('/provider-dashboard', { replace: true });
    } catch (error: any) {
      console.error("Provider signup error:", error);

      // Show localized generic error without leaking raw English error text
      setError(t.auth.signupError);
      toast({
        variant: "destructive",
        title: t.auth.signupError,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...formData.phoneNumbers];
    newPhones[index] = value;
    setFormData(prev => ({ ...prev, phoneNumbers: newPhones }));
  };

  const addPhoneNumber = () => {
    if (formData.phoneNumbers.length < 3) {
      setFormData(prev => ({
        ...prev,
        phoneNumbers: [...prev.phoneNumbers, '']
      }));
    }
  };

  const removePhoneNumber = (index: number) => {
    const newPhones = formData.phoneNumbers.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, phoneNumbers: newPhones }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <Building2 className="w-5 h-5" />
          {t.auth.providerSignup}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {t.auth.basicInfo}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t.auth.fullName} *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange('fullName')}
                  placeholder={t.auth.fullNamePlaceholder}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t.auth.email} *</Label>
                <Input
                  id="email"
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
              <Label htmlFor="password">{t.auth.password} *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                placeholder={t.auth.passwordPlaceholder}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {t.auth.contactInfo}
            </h3>

            <div className="space-y-2">
              <Label>{t.auth.phoneNumbers}</Label>
              {formData.phoneNumbers.map((phone, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(index, e.target.value)}
                    placeholder={`${t.auth.phoneNumber} ${index + 1}`}
                    disabled={isLoading}
                  />
                  {formData.phoneNumbers.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removePhoneNumber(index)}
                      disabled={isLoading}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              {formData.phoneNumbers.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPhoneNumber}
                  disabled={isLoading}
                >
                  {t.auth.addPhone}
                </Button>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {t.auth.location}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t.auth.city} *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={handleInputChange('city')}
                  placeholder={t.auth.cityPlaceholder}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">{t.auth.country} *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={handleInputChange('country')}
                  placeholder={t.auth.countryPlaceholder}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {t.auth.businessInfo}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="profileDescription">{t.auth.providerDescription}</Label>
              <Textarea
                id="profileDescription"
                value={formData.profileDescription}
                onChange={handleInputChange('profileDescription')}
                placeholder={t.auth.descriptionPlaceholder}
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">{t.auth.website}</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={formData.websiteUrl}
                  onChange={handleInputChange('websiteUrl')}
                  placeholder={t.auth.websitePlaceholder}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleBusinessUrl">{t.auth.googleBusiness}</Label>
                <Input
                  id="googleBusinessUrl"
                  type="url"
                  value={formData.googleBusinessUrl}
                  onChange={handleInputChange('googleBusinessUrl')}
                  placeholder={t.auth.googleBusinessPlaceholder}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Currency Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.auth.currency || t.forms?.price}</Label>
                <Select
                  value={formData.currencyCode}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, currencyCode: val }))}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.auth.currency || t.forms?.price} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {currencyList.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Social Media */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagramUrl">{t.actions?.instagram || 'Instagram'}</Label>
                <Input
                  id="instagramUrl"
                  type="url"
                  value={formData.instagramUrl}
                  onChange={handleInputChange('instagramUrl')}
                  placeholder={t.auth.websitePlaceholder}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebookUrl">{t.actions?.facebook || 'Facebook'}</Label>
                <Input
                  id="facebookUrl"
                  type="url"
                  value={formData.facebookUrl}
                  onChange={handleInputChange('facebookUrl')}
                  placeholder={t.auth.websitePlaceholder}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiktokUrl">{t.actions?.tiktok || 'TikTok'}</Label>
                <Input
                  id="tiktokUrl"
                  type="url"
                  value={formData.tiktokUrl}
                  onChange={handleInputChange('tiktokUrl')}
                  placeholder={t.auth.websitePlaceholder}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">{t.auth.licenseNumber}</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange('licenseNumber')}
                  placeholder={t.auth.licenseNumberPlaceholder}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseVerificationUrl">{t.auth.licenseVerification}</Label>
                <Input
                  id="licenseVerificationUrl"
                  type="url"
                  value={formData.licenseVerificationUrl}
                  onChange={handleInputChange('licenseVerificationUrl')}
                  placeholder={t.auth.licenseVerificationPlaceholder}
                  disabled={isLoading}
                />
              </div>
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
                    <DialogTitle>{t.legal?.providerTerms?.title}</DialogTitle>
                    <DialogDescription>{t.legal?.providerTerms?.intro}</DialogDescription>
                  </DialogHeader>
                  <div className="prose prose-sm dark:prose-invert max-w-none overflow-y-auto">
                    {t.legal?.providerTerms ? (
                      <>
                        <p className="mb-4">{t.legal.providerTerms.intro}</p>
                        <ol className="list-decimal list-inside space-y-2">
                          {t.legal.providerTerms.points.map((p: string, idx: number) => (
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
                  id="termsAccepted"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, termsAccepted: !!checked }))
                  }
                  disabled={isLoading}
                />
                <Label htmlFor="termsAccepted" className="text-sm leading-tight">
                  {t.auth.termsAgreement}
                </Label>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full luxury-button" disabled={isLoading || !formData.termsAccepted}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {t.auth.createProviderAccount}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};