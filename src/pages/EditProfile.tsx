import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, X, Trash2 } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { currencyList, getCurrencyLabel } from "@/lib/currencies";
import { commonTimezones, getBrowserTimezone } from "@/lib/timezones";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";
import { getCategoryLabel } from "@/lib/categoriesLocale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import LocationPicker from "@/components/provider/LocationPicker";
import { useProfileData, ProfileData } from "@/hooks/useProfileData";
import { useServiceCategories } from "@/hooks/useServiceCategories";

interface EditProfileProps {
  currentLanguage: string;
}

const EditProfile: React.FC<EditProfileProps> = ({ currentLanguage }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, loading: authLoading } = useAuth();
  const { t, isRTL } = useTranslation(currentLanguage);

  const { profile, isLoading: profileLoading, updateProfile, isUpdating, deleteAccount, isDeleting } = useProfileData();
  const { data: categories = [] } = useServiceCategories();

  const [newPhoneNumber, setNewPhoneNumber] = useState("");

  const [formData, setFormData] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone_numbers: [],
    whatsapp_number: '',
    city: '',
    country: '',
    profile_description: '',
    website_url: '',
    google_business_url: '',
    license_number: '',
    instagram_url: '',
    facebook_url: '',
    tiktok_url: '',
    currency_code: '',
    timezone: getBrowserTimezone(),
    main_category_id: '',
    latitude: undefined,
    longitude: undefined,
    location_address: ''
  });

  const isInitialized = useRef(false);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile && !isInitialized.current) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone_numbers: profile.phone_numbers || [],
        whatsapp_number: profile.whatsapp_number || '',
        city: profile.city || '',
        country: profile.country || '',
        profile_description: profile.profile_description || '',
        website_url: profile.website_url || '',
        google_business_url: profile.google_business_url || '',
        license_number: profile.license_number || '',
        instagram_url: profile.instagram_url || '',
        facebook_url: profile.facebook_url || '',
        tiktok_url: profile.tiktok_url || '',
        currency_code: profile.currency_code || '',
        timezone: profile.timezone || 'Asia/Dubai',
        main_category_id: profile.main_category_id || '',
        latitude: profile.latitude,
        longitude: profile.longitude,
        location_address: profile.location_address || ''
      });
      isInitialized.current = true;
    }
  }, [profile]);

  const handleInputChange = (field: keyof ProfileData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPhoneNumber = () => {
    if (newPhoneNumber.trim() && !formData.phone_numbers.includes(newPhoneNumber.trim())) {
      setFormData(prev => ({
        ...prev,
        phone_numbers: [...prev.phone_numbers, newPhoneNumber.trim()]
      }));
      setNewPhoneNumber("");
    }
  };

  const removePhoneNumber = (index: number) => {
    setFormData(prev => ({
      ...prev,
      phone_numbers: prev.phone_numbers.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      return;
    }

    if (!formData.full_name.trim() || !formData.email.trim()) {
      toast({
        title: t.editProfile.validationError,
        description: t.editProfile.validationMessage,
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProfile({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone_numbers: formData.phone_numbers,
        whatsapp_number: formData.whatsapp_number.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        profile_description: formData.profile_description.trim(),
        website_url: formData.website_url.trim(),
        google_business_url: formData.google_business_url.trim(),
        license_number: formData.license_number.trim(),
        instagram_url: formData.instagram_url.trim(),
        facebook_url: formData.facebook_url.trim(),
        tiktok_url: formData.tiktok_url.trim(),
        currency_code: (formData.currency_code || '').trim() || undefined,
        timezone: formData.timezone || 'Asia/Dubai',
        main_category_id: formData.main_category_id || undefined,
        latitude: formData.latitude,
        longitude: formData.longitude,
        location_address: formData.location_address?.trim() || undefined,
      });

      toast({
        title: t.editProfile.successTitle,
        description: t.editProfile.successMessage,
      });

      // Navigate back based on user role
      if (role === 'provider') {
        navigate('/provider-dashboard');
      } else {
        navigate('/customer-dashboard');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t.editProfile.errorTitle,
        description: t.editProfile.errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    if (role === 'provider') {
      navigate('/provider-dashboard');
    } else {
      navigate('/customer-dashboard');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await deleteAccount();
      toast({ title: 'Account deleted', description: t.ui.interfaceUpdated });
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({ variant: 'destructive', title: t.toast.error, description: error?.message || 'Failed to delete account' });
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="container mx-auto p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">{t.editProfile.loading}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t.editProfile.backToDashboard}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.editProfile.title}</CardTitle>
          <CardDescription>
            {t.editProfile.subtitle}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t.editProfile.basicInfo}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">{t.editProfile.fullName} *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder={t.editProfile.fullNamePlaceholder}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t.editProfile.email} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={t.editProfile.emailPlaceholder}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">{t.editProfile.city}</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder={t.editProfile.cityPlaceholder}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">{t.editProfile.country}</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder={t.editProfile.countryPlaceholder}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="main_category">{isRTL ? "المجال الرئيسي" : "Main Category"}</Label>
                  <Select
                    value={formData.main_category_id || ""}
                    onValueChange={(value) => handleInputChange('main_category_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isRTL ? "اختر المجال الرئيسي" : "Select Main Category"} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {getCategoryLabel(category, currentLanguage)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Numbers */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t.editProfile.contactNumbers}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number">{t.editProfile.whatsappNumber}</Label>
                  <Input
                    id="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                    placeholder={t.editProfile.whatsappPlaceholder}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.editProfile.additionalPhones}</Label>
                <div className="flex gap-2">
                  <Input
                    value={newPhoneNumber}
                    onChange={(e) => setNewPhoneNumber(e.target.value)}
                    placeholder={t.editProfile.additionalPhonePlaceholder}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPhoneNumber();
                      }
                    }}
                  />
                  <Button type="button" onClick={addPhoneNumber} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.phone_numbers.length > 0 && (
                  <div className="space-y-2">
                    {formData.phone_numbers.map((phone, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="flex-1">{phone}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePhoneNumber(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Description */}
            <div className="space-y-2">
              <Label htmlFor="profile_description">{t.editProfile.profileDescription}</Label>
              <Textarea
                id="profile_description"
                value={formData.profile_description}
                onChange={(e) => handleInputChange('profile_description', e.target.value)}
                placeholder={t.editProfile.descriptionPlaceholder}
                rows={4}
              />
            </div>

            {/* Timezone - For all users */}
            <div className="space-y-2">
              <Label>{t.timezone?.label || 'Timezone'}</Label>
              <Select
                value={formData.timezone || getBrowserTimezone()}
                onValueChange={(val) => handleInputChange('timezone', val)}
              >
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
                {t.timezone?.hint || 'Used to accurately calculate times and notifications'}
              </p>
            </div>

            {/* Provider-specific fields */}
            {role === 'provider' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t.editProfile.providerInfo}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website_url">{t.editProfile.website}</Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={formData.website_url}
                      onChange={(e) => handleInputChange('website_url', e.target.value)}
                      placeholder={t.editProfile.websitePlaceholder}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google_business_url">{t.editProfile.googleBusiness}</Label>
                    <Input
                      id="google_business_url"
                      type="url"
                      value={formData.google_business_url}
                      onChange={(e) => handleInputChange('google_business_url', e.target.value)}
                      placeholder={t.editProfile.googleBusinessPlaceholder}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t.editProfile.currency}</Label>
                    <Select
                      value={formData.currency_code || ''}
                      onValueChange={(val) => handleInputChange('currency_code', val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t.editProfile.currency} />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {currencyList.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {getCurrencyLabel(c.code, 'en')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram_url">{t.actions.instagram || 'Instagram'}</Label>
                    <Input
                      id="instagram_url"
                      type="url"
                      value={formData.instagram_url}
                      onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                      placeholder={t.editProfile.websitePlaceholder}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook_url">{t.actions.facebook || 'Facebook'}</Label>
                    <Input
                      id="facebook_url"
                      type="url"
                      value={formData.facebook_url}
                      onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                      placeholder={t.editProfile.websitePlaceholder}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiktok_url">{t.actions.tiktok || 'TikTok'}</Label>
                    <Input
                      id="tiktok_url"
                      type="url"
                      value={formData.tiktok_url}
                      onChange={(e) => handleInputChange('tiktok_url', e.target.value)}
                      placeholder={t.editProfile.websitePlaceholder}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="license_number">{t.editProfile.licenseNumber}</Label>
                    <Input
                      id="license_number"
                      value={formData.license_number}
                      onChange={(e) => handleInputChange('license_number', e.target.value)}
                      placeholder={t.editProfile.licensePlaceholder}
                    />
                  </div>
                </div>

                {/* مكون تحديد الموقع الجغرافي للمزود */}
                <LocationPicker
                  currentLanguage={currentLanguage}
                  value={
                    formData.latitude && formData.longitude
                      ? {
                          latitude: formData.latitude,
                          longitude: formData.longitude,
                          address: formData.location_address
                        }
                      : undefined
                  }
                  onChange={(location) => {
                    setFormData(prev => ({
                      ...prev,
                      latitude: location.latitude,
                      longitude: location.longitude,
                      location_address: location.address
                    }));
                  }}
                  isRTL={isRTL}
                />
              </div>
            )}

            <div className={`flex justify-end space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
              >
                {t.editProfile.cancel}
              </Button>
              <Button type="submit" disabled={isUpdating}>
                <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {isUpdating ? t.editProfile.saving : t.editProfile.saveChanges}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="mt-8 border-red-300">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            {'Danger Zone'}
          </CardTitle>
          <CardDescription className="text-red-500">
            {'Deleting your account will remove your profile, services, bookings, reviews and offers. This action is irreversible.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? (t.ui.loading || 'Deleting...') : ('Delete my account')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{'Delete my account'}</AlertDialogTitle>
                <AlertDialogDescription>
                  {'Are you sure? This will permanently delete your account and all related data.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.actions.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                  {t.actions.delete || 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProfile;