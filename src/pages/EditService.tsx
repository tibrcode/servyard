import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/integrations/firebase/client";
import { collection, getDocs, query, where, doc, getDoc, updateDoc, orderBy } from "firebase/firestore";
import { ServiceCategory } from "@/lib/firebase/collections";
import { getCategoryLabel } from "@/lib/categoriesLocale";
import { useTranslation } from "@/lib/i18n";
import { upsertDefaultServiceCategories } from "@/lib/firebase/defaultCategories";
import { ServiceBookingSettings } from "@/components/booking/ServiceBookingSettings";
import { ServiceScheduleSetup } from "@/components/booking/ServiceScheduleSetup";
import { BookingSettings } from "@/types/booking";
import { invalidateServicesCache } from "@/lib/servicesCache";
import { Service } from "@/types/service";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { useServiceDetails } from "@/hooks/useServiceDetails";

interface EditServiceProps {
  currentLanguage: string;
}



const EditService: React.FC<EditServiceProps> = ({ currentLanguage }) => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, isRTL } = useTranslation(currentLanguage);

  const { data: categories = [] } = useServiceCategories();
  const { data: serviceData, isLoading: serviceLoading } = useServiceDetails(serviceId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [service, setService] = useState<Service | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    approximate_price: '',
    duration_minutes: 60,
    specialty_description: '',
    price_range: 'budget',
    has_discount: false,
    discount_price: '',
    discount_percentage: 0,
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

  // Initialize form data when service loads
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      if (!auth.currentUser || !serviceId) {
        navigate('/provider-dashboard');
        return;
      }

      if (serviceData) {
        // Check ownership
        try {
          const userProfileQuery = query(
            collection(db, 'profiles'),
            where('user_id', '==', auth.currentUser.uid),
            where('user_type', '==', 'provider')
          );
          const userProfileSnapshot = await getDocs(userProfileQuery);

          if (userProfileSnapshot.empty) {
            navigate('/provider-dashboard');
            return;
          }

          const userProfile = userProfileSnapshot.docs[0];
          if (serviceData.provider_id !== userProfile.id) {
             console.error('Unauthorized access to service');
             toast({
               title: t.toast.error,
               description: t.ui.accessDenied,
               variant: "destructive",
             });
             navigate('/provider-dashboard');
             return;
          }

          setService(serviceData);
          setFormData({
            name: serviceData.name || '',
            description: serviceData.description || '',
            category_id: serviceData.category_id || '',
            approximate_price: serviceData.approximate_price || '',
            duration_minutes: serviceData.duration_minutes || 60,
            specialty_description: serviceData.specialty_description || '',
            price_range: serviceData.price_range || 'budget',
            has_discount: serviceData.has_discount || false,
            discount_price: serviceData.discount_price || '',
            discount_percentage: serviceData.discount_percentage || 0,
            type: serviceData.type || 'service'
          });

          setBookingSettings({
            booking_enabled: serviceData.booking_enabled || false,
            duration_minutes: serviceData.duration_minutes || 30,
            max_concurrent_bookings: serviceData.max_concurrent_bookings || 1,
            advance_booking_days: serviceData.advance_booking_days || 30,
            buffer_time_minutes: serviceData.buffer_time_minutes || 0,
            cancellation_policy_hours: serviceData.cancellation_policy_hours || 24,
            require_confirmation: serviceData.require_confirmation !== false,
            allow_customer_cancellation: serviceData.allow_customer_cancellation !== false,
          });
          
          setLoading(false);
        } catch (error) {
          console.error('Error checking auth:', error);
          navigate('/provider-dashboard');
        }
      } else if (!serviceLoading && serviceId) {
         if (serviceData === null) {
            toast({
              title: t.toast.error,
              description: t.ui.serviceNotFound || 'Service not found',
              variant: "destructive",
            });
            navigate('/provider-dashboard');
         }
      }
    };

    checkAuthAndLoad();
  }, [serviceData, serviceLoading, serviceId, navigate, t, toast]);



  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!service) {
      console.error('No service data');
      return;
    }

    if (!formData.name || !formData.category_id) {
      toast({
        title: t.toast.error,
        description: t.availability?.messages?.requiredFields || 'Please fill in all required fields',
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      await updateDoc(doc(db, 'services', service.id), {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        approximate_price: formData.approximate_price,
        duration_minutes: formData.duration_minutes,
        specialty_description: formData.specialty_description,
        price_range: formData.price_range,
        updated_at: new Date(),
        // Discount fields
        has_discount: formData.has_discount,
        discount_price: formData.has_discount ? formData.discount_price : null,
        discount_percentage: formData.has_discount ? formData.discount_percentage : null,
        // Booking settings
        ...bookingSettings,
        type: formData.type
      });

      // Invalidate cached client service lists so updates appear immediately
      invalidateServicesCache();

      toast({
        title: t.editProfile.successTitle,
        description: t.ui.serviceUpdated || 'Service updated successfully',
      });

      navigate('/provider-dashboard');
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: t.toast.error,
        description: t.ui.serviceUpdateFailed || 'Failed to update service',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">{t.editProfile.loading}</div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">{t.ui.serviceNotFound || 'Service not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/provider-dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.editProfile.backToDashboard}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.provider.editService}</CardTitle>
          <CardDescription>
            {t.addService.serviceDetails}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="basic">
                {isRTL ? 'معلومات الخدمة' : 'Service Info'}
              </TabsTrigger>
              <TabsTrigger value="booking">
                {isRTL ? 'إعدادات الحجز' : 'Booking Settings'}
              </TabsTrigger>
              <TabsTrigger value="schedule">
                {isRTL ? 'الجدول الأسبوعي' : 'Weekly Schedule'}
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Service Type Selection */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <h3 className="text-lg font-semibold">{isRTL ? 'نوع الخدمة' : 'Service Type'}</h3>
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
                        {isRTL ? 'خدمة عامة' : 'General Service'}
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
                        {isRTL ? 'موعد / حجز' : 'Appointment / Booking'}
                      </Label>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formData.type === 'service' 
                      ? (isRTL ? 'خدمة عادية مع عرض السعر والتفاصيل' : 'Standard service with price display and details')
                      : (isRTL ? 'حجز موعد فقط بدون عرض سعر (مثل: استشارة طبية)' : 'Appointment booking only without price display (e.g., Medical Consultation)')}
                  </p>
                </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t.addService.serviceName} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t.addService.enterServiceName}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t.addService.category} *</Label>
                <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
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

              {formData.type === 'service' && (
                <div className="space-y-2">
                  <Label htmlFor="price">{t.addService.approximatePrice}</Label>
                  <Input
                    id="price"
                    value={formData.approximate_price}
                    onChange={(e) => handleInputChange('approximate_price', e.target.value)}
                    placeholder="100"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="duration">{t.addService.durationMinutes}</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 60)}
                  placeholder="60"
                  min="15"
                  max="480"
                />
              </div>

              {formData.type === 'service' && (
                <div className="space-y-2">
                  <Label htmlFor="price_range">{t.addService.priceRange}</Label>
                  <Select value={formData.price_range} onValueChange={(value) => handleInputChange('price_range', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">{t.addService.priceRangeBudget || 'Budget'}</SelectItem>
                      <SelectItem value="standard">{t.addService.priceRangeStandard || 'Standard'}</SelectItem>
                      <SelectItem value="premium">{t.addService.priceRangePremium || 'Premium'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Discount Section */}
            <div className="mt-6 p-4 border rounded-lg bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-base">{isRTL ? '🎉 عرض تخفيض' : '🎉 Discount Offer'}</h4>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'أضف عرض تخفيض لجذب المزيد من العملاء' : 'Add a discount to attract more customers'}
                  </p>
                </div>
                <Switch
                  checked={formData.has_discount}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    has_discount: checked,
                    discount_price: checked ? prev.discount_price : '',
                    discount_percentage: checked ? prev.discount_percentage : 0
                  }))}
                />
              </div>

              {formData.has_discount && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountPrice">
                      {isRTL ? 'السعر بعد التخفيض' : 'Discounted Price'}
                    </Label>
                    <Input
                      id="discountPrice"
                      value={formData.discount_price}
                      onChange={(e) => handleInputChange('discount_price', e.target.value)}
                      placeholder={isRTL ? 'مثال: 80' : 'e.g., 80'}
                    />
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? 'السعر الأصلي: ' : 'Original price: '}{formData.approximate_price || '---'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discountPercentage">
                      {isRTL ? 'نسبة التخفيض (%)' : 'Discount Percentage (%)'}
                    </Label>
                    <Input
                      id="discountPercentage"
                      type="number"
                      value={formData.discount_percentage}
                      onChange={(e) => handleInputChange('discount_percentage', parseInt(e.target.value) || 0)}
                      placeholder={isRTL ? 'مثال: 20' : 'e.g., 20'}
                      min="1"
                      max="99"
                    />
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? 'سيظهر badge التخفيض على بطاقة الخدمة' : 'Discount badge will appear on service card'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t.addService.description}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t.addService.describeService}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">{t.addService.specialtyDescription}</Label>
              <Textarea
                id="specialty"
                value={formData.specialty_description}
                onChange={(e) => handleInputChange('specialty_description', e.target.value)}
                placeholder={t.addService.specialtyInfo}
                rows={3}
              />
            </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/provider-dashboard')}
                  >
                    {t.forms.cancel}
                  </Button>
                  <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? t.editProfile.saving : t.editProfile.saveChanges}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Booking Settings Tab */}
            <TabsContent value="booking">
              <ServiceBookingSettings
                serviceId={service.id}
                currentSettings={bookingSettings}
                onSettingsChange={(newSettings) => {
                  setBookingSettings(newSettings);
                  // Auto-save when settings change
                  updateDoc(doc(db, 'services', service.id), {
                    ...newSettings,
                    updated_at: new Date()
                  });
                }}
                language={currentLanguage as 'en' | 'ar'}
              />
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule">
              <ServiceScheduleSetup
                serviceId={service.id}
                providerId={service.provider_id}
                language={currentLanguage as 'en' | 'ar'}
                onScheduleChange={() => {
                  toast({
                    title: t.editProfile.successTitle,
                    description: isRTL ? 'تم تحديث الجدول بنجاح' : 'Schedule updated successfully',
                  });
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditService;