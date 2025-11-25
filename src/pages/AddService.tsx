import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/integrations/firebase/client";
import { collection, getDocs, query, where, addDoc, getDoc, doc, orderBy } from "firebase/firestore";
import { upsertDefaultServiceCategories } from "@/lib/firebase/defaultCategories";
import { getCategoryLabel } from "@/lib/categoriesLocale";
import { ServiceBookingSettings } from "@/components/booking/ServiceBookingSettings";
import { BookingSettings } from "@/types/booking";
import { invalidateServicesCache } from "@/lib/servicesCache";
import { useServiceCategories } from "@/hooks/useServiceCategories";

interface AddServiceProps {
  currentLanguage: string;
}

const AddService = ({ currentLanguage }: AddServiceProps) => {
  const { t, isRTL } = useTranslation(currentLanguage);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    approximatePrice: '',
    durationMinutes: '',
    priceRange: '',
    specialtyDescription: '',
    hasDiscount: false,
    discountPrice: '',
    discountPercentage: '',
    type: 'service' as 'service' | 'booking'
  });

  const [bookingSettings, setBookingSettings] = useState<BookingSettings>({
    booking_enabled: false,
    duration_minutes: 30,
    max_concurrent_bookings: 1,
    advance_booking_days: 30,
    buffer_time_minutes: 0,
    cancellation_policy_hours: 24,
    require_confirmation: true,
    allow_customer_cancellation: true,
  });

  const { data: categories = [] } = useServiceCategories();
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

              invalidateServicesCache();
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get provider profile
      const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
      if (!profileDoc.exists() || profileDoc.data()?.user_type !== 'provider') {
        throw new Error('Provider profile not found');
      }

      const serviceData = {
        name: formData.name,
        description: formData.description,
        category_id: formData.categoryId,
        provider_id: user.uid,
        approximate_price: formData.approximatePrice,
        duration_minutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
        price_range: formData.priceRange,
        specialty_description: formData.specialtyDescription,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        // Discount fields
        has_discount: formData.hasDiscount,
        discount_price: formData.hasDiscount ? formData.discountPrice : null,
        discount_percentage: formData.hasDiscount && formData.discountPercentage ? parseInt(formData.discountPercentage) : null,
        // Booking settings
        ...bookingSettings,
        type: formData.type
      };

      await addDoc(collection(db, 'services'), serviceData);

      toast({
        title: t.editProfile.successTitle,
        description: t.ui.serviceCreated,
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        approximatePrice: '',
        durationMinutes: '',
        priceRange: '',
        specialtyDescription: '',
        hasDiscount: false,
        discountPrice: '',
        discountPercentage: '',
        type: 'service'
      });

      // Navigate back to dashboard
      navigate('/provider-dashboard');

    } catch (error: any) {
      console.error('Error creating service:', error);
      toast({
        variant: "destructive",
        title: t.toast.error,
        description: error.message || t.ui.serviceCreateFailed,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/provider-dashboard')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">
              {t.addService.title}
            </h1>
            <p className="text-muted-foreground">
              {t.addService.subtitle}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t.addService.serviceDetails}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Type Selection */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                <h3 className="text-lg font-semibold">{t.serviceTypes?.title || 'Service Type'}</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <input
                      type="radio"
                      id="type-service"
                      name="serviceType"
                      value="service"
                      checked={formData.type === 'service'}
                      onChange={() => setFormData(prev => ({ ...prev, type: 'service' }))}
                      className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="type-service" className="cursor-pointer font-medium">
                      {t.serviceTypes?.generalService || 'General Service'}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <input
                      type="radio"
                      id="type-booking"
                      name="serviceType"
                      value="booking"
                      checked={formData.type === 'booking'}
                      onChange={() => setFormData(prev => ({ ...prev, type: 'booking' }))}
                      className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="type-booking" className="cursor-pointer font-medium">
                      {t.serviceTypes?.appointmentBooking || 'Appointment / Booking'}
                    </Label>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formData.type === 'service' 
                    ? (t.serviceTypes?.generalServiceDesc || 'Standard service with price display and details')
                    : (t.serviceTypes?.appointmentDesc || 'Appointment booking only without price display (e.g., Medical Consultation)')}
                </p>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t.addService.basicInfo}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.addService.serviceName} *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      placeholder={t.addService.enterServiceName}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">{t.addService.category} *</Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.addService.selectCategory} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {getCategoryLabel(category as any, currentLanguage)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t.addService.description}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={handleInputChange('description')}
                    placeholder={t.addService.describeService}
                    rows={4}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Pricing and Duration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t.addService.pricingDuration}</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {formData.type === 'service' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="approximatePrice">{t.addService.approximatePrice}</Label>
                        <Input
                          id="approximatePrice"
                          value={formData.approximatePrice}
                          onChange={handleInputChange('approximatePrice')}
                          placeholder={t.addService.approximatePrice}
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priceRange">{t.addService.priceRange}</Label>
                        <Select
                          value={formData.priceRange}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, priceRange: value }))}
                          disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t.addService.selectRange} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="budget">{t.addService.priceRangeBudget || 'Budget'}</SelectItem>
                            <SelectItem value="moderate">{t.addService.priceRangeStandard || 'Standard'}</SelectItem>
                            <SelectItem value="premium">{t.addService.priceRangePremium || 'Premium'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="durationMinutes">{t.addService.durationMinutes}</Label>
                    <Input
                      id="durationMinutes"
                      type="number"
                      value={formData.durationMinutes}
                      onChange={handleInputChange('durationMinutes')}
                      placeholder={t.addService.durationMinutes}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Discount Section */}
                <div className="mt-6 p-4 border rounded-lg bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-base">{t.discount?.title || '🎉 Discount Offer'}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t.discount?.description || 'Add a discount to attract more customers'}
                      </p>
                    </div>
                    <Switch
                      checked={formData.hasDiscount}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        hasDiscount: checked,
                        discountPrice: checked ? prev.discountPrice : '',
                        discountPercentage: checked ? prev.discountPercentage : ''
                      }))}
                      disabled={loading}
                    />
                  </div>

                  {formData.hasDiscount && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="discountPrice">
                          {t.discount?.discountedPrice || 'Discounted Price'}
                        </Label>
                        <Input
                          id="discountPrice"
                          value={formData.discountPrice}
                          onChange={handleInputChange('discountPrice')}
                          placeholder={t.discount?.discountPricePlaceholder || 'e.g., 80'}
                          disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t.discount?.originalPrice || 'Original price: '}{formData.approximatePrice || '---'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="discountPercentage">
                          {t.discount?.percentage || 'Discount Percentage (%)'}
                        </Label>
                        <Input
                          id="discountPercentage"
                          type="number"
                          value={formData.discountPercentage}
                          onChange={handleInputChange('discountPercentage')}
                          placeholder={t.discount?.discountPercentagePlaceholder || 'e.g., 20'}
                          min="1"
                          max="99"
                          disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t.discount?.badgeNote || 'Discount badge will appear on service card'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Specialty Description */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t.addService.specialtyInfo}</h3>

                <div className="space-y-2">
                  <Label htmlFor="specialtyDescription">{t.addService.specialtyDescription}</Label>
                  <Textarea
                    id="specialtyDescription"
                    value={formData.specialtyDescription}
                    onChange={handleInputChange('specialtyDescription')}
                    placeholder={t.addService.whatMakesUnique}
                    rows={3}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Booking Settings */}
              <div className="space-y-4">
                <ServiceBookingSettings
                  serviceId=""
                  currentSettings={bookingSettings}
                  onSettingsChange={setBookingSettings}
                  language={currentLanguage as 'en' | 'ar'}
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/provider-dashboard')}
                  disabled={loading}
                  className="flex-1"
                >
                  {t.forms.cancel}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.name || !formData.categoryId}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t.addService.creating}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {t.addService.createService}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddService;