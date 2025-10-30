import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/integrations/firebase/client";
import { collection, getDocs, query, where, addDoc, getDoc, doc, orderBy } from "firebase/firestore";
import { upsertDefaultServiceCategories } from "@/lib/firebase/defaultCategories";
import { getCategoryLabel } from "@/lib/categoriesLocale";

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
    specialtyDescription: ''
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Upsert default categories to ensure all 24 are present
        console.log('Upserting default service categories for AddService...');
        const inserted = await upsertDefaultServiceCategories();
        console.log(`Inserted ${inserted} new categories for AddService`);

        // Fetch categories from Firestore
        console.log('Fetching categories for AddService...');
        const categoriesQuery = query(
          collection(db, 'service_categories'),
          where('is_active', '==', true),
          orderBy('display_order')
        );
        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log(`Fetched ${categoriesData.length} categories for AddService`);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback: try without orderBy
        try {
          console.log('Trying fallback fetch for AddService...');
          const categoriesSnapshot = await getDocs(collection(db, 'service_categories'));
          const categoriesData = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log(`Fallback fetch got ${categoriesData.length} categories`);
          setCategories(categoriesData.filter((cat: any) => cat.is_active));
        } catch (fallbackError) {
          console.error('Fallback fetch also failed:', fallbackError);
        }
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
        updated_at: new Date()
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
        specialtyDescription: ''
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
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
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

                  <div className="space-y-2">
                    <Label htmlFor="durationMinutes">{t.addService.durationMinutes}</Label>
                    <Input
                      id="durationMinutes"
                      type="number"
                      value={formData.durationMinutes}
                      onChange={handleInputChange('durationMinutes')}
                      placeholder={t.addService.durationMinutes}
                      min="15"
                      max="480"
                      disabled={loading}
                    />
                  </div>
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