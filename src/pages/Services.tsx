import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { ProviderLogo } from "@/components/provider/ProviderLogo";
import { BookingModal } from "@/components/booking/BookingModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, MapPin, Star, Clock, ExternalLink, Calendar, Map as MapIcon, List } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
// Currency display uses Latin currency code (e.g., AED) instead of symbol
import { db } from "@/integrations/firebase/client";
import InteractiveMap from "@/components/map/InteractiveMap";
import { collection, getDocs, doc, getDoc, query as fsQuery, where } from "firebase/firestore";
import { ServiceCategory, initializeServiceCategories } from "@/lib/firebase/collections";
import { upsertDefaultServiceCategories } from "@/lib/firebase/defaultCategories";
import { getCategoryLabel } from "@/lib/categoriesLocale";
import { filterByRadius, formatDistance, RADIUS_OPTIONS, DEFAULT_RADIUS_KM, Coordinates } from "@/lib/geolocation";
import { Slider } from "@/components/ui/slider";

interface ServicesProps {
  currentLanguage: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  provider_id: string;
  category_id: string;
  approximate_price?: string;
  duration_minutes?: number;
  price_range?: string;
  is_active: boolean;
  // Booking settings
  booking_enabled?: boolean;
  max_concurrent_bookings?: number;
  advance_booking_days?: number;
  buffer_time_minutes?: number;
  cancellation_policy_hours?: number;
  require_confirmation?: boolean;
  allow_customer_cancellation?: boolean;
}

interface Provider {
  id: string;
  full_name: string;
  city?: string;
  country?: string;
  profile_description?: string;
  currency_code?: string;
  latitude?: number;
  longitude?: number;
  location_address?: string;
}

const Services = ({ currentLanguage = 'en' }: ServicesProps) => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const qParam = searchParams.get('q');

  const [searchQuery, setSearchQuery] = useState(qParam || '');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');
  const [sortBy, setSortBy] = useState('relevance');
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [providers, setProviders] = useState<{ [key: string]: Provider }>({});
  const [providerRatings, setProviderRatings] = useState<{ [key: string]: { avg: number; count: number } }>({});
  const [serviceRatings, setServiceRatings] = useState<{ [key: string]: { avg: number; count: number } }>({});
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // Location-based filtering states
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // View toggle: 'list' or 'map'
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const { t, isRTL } = useTranslation(currentLanguage);
  const { toast } = useToast();

  // محاولة استرجاع الموقع المحفوظ عند بداية الصفحة
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const { latitude, longitude, timestamp } = JSON.parse(savedLocation);
        // استخدام الموقع إذا كان أقل من ساعة
        if (Date.now() - timestamp < 3600000) {
          setUserLocation({ latitude, longitude });
        }
      } catch (e) {
        console.error('Error parsing saved location:', e);
      }
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Upsert default categories to ensure all 24 are present
        console.log('Upserting default service categories for Services page...');
        const inserted = await upsertDefaultServiceCategories();
        console.log(`Inserted ${inserted} new categories for Services page`);

        // Load categories
        const categoriesRef = collection(db, 'service_categories');
        const categoriesSnapshot = await getDocs(categoriesRef);
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ServiceCategory[];
        setCategories(categoriesData);

        // Load services  
        const servicesRef = collection(db, 'services');
        const servicesSnapshot = await getDocs(servicesRef);
        const servicesData = servicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Service[];

        setServices(servicesData);

        // Load providers for services
        const providerIds = [...new Set(servicesData.map(s => s.provider_id))];
        const providersData: { [key: string]: Provider } = {};

        for (const providerId of providerIds) {
          const providerDoc = await getDoc(doc(db, 'profiles', providerId));
          if (providerDoc.exists()) {
            providersData[providerId] = {
              id: providerDoc.id,
              ...providerDoc.data()
            } as Provider;
          }
        }
        setProviders(providersData);

        // Load reviews for these providers in chunks (Firestore 'in' supports up to 10 values)
        if (providerIds.length > 0) {
          const chunks: string[][] = [];
          for (let i = 0; i < providerIds.length; i += 10) {
            chunks.push(providerIds.slice(i, i + 10));
          }

          const ratingsMap: { [key: string]: { sum: number; count: number } } = {};
          for (const chunk of chunks) {
            const reviewsRef = collection(db, 'reviews');
            const q = fsQuery(reviewsRef, where('provider_id', 'in', chunk));
            const snap = await getDocs(q);
            snap.forEach(d => {
              const data: any = d.data();
              const pid = data.provider_id as string | undefined;
              const approved = (data.is_approved === undefined) ? true : !!data.is_approved;
              if (!pid || typeof data.rating !== 'number' || !approved) return;
              if (!ratingsMap[pid]) ratingsMap[pid] = { sum: 0, count: 0 };
              ratingsMap[pid].sum += data.rating;
              ratingsMap[pid].count += 1;
            });
          }

          const finalRatings: { [key: string]: { avg: number; count: number } } = {};
          Object.entries(ratingsMap).forEach(([pid, { sum, count }]) => {
            if (count > 0) finalRatings[pid] = { avg: sum / count, count };
          });
          setProviderRatings(finalRatings);
        }

        // Load per-service ratings in chunks as well
        const serviceIds = servicesData.map(s => s.id);
        if (serviceIds.length > 0) {
          const chunksS: string[][] = [];
          for (let i = 0; i < serviceIds.length; i += 10) {
            chunksS.push(serviceIds.slice(i, i + 10));
          }

          const srMap: { [key: string]: { sum: number; count: number } } = {};
          for (const chunk of chunksS) {
            const reviewsRef = collection(db, 'reviews');
            const q = fsQuery(reviewsRef, where('service_id', 'in', chunk));
            const snap = await getDocs(q);
            snap.forEach(d => {
              const data: any = d.data();
              const sid = data.service_id as string | undefined;
              const approved = (data.is_approved === undefined) ? true : !!data.is_approved;
              if (!sid || typeof data.rating !== 'number' || !approved) return;
              if (!srMap[sid]) srMap[sid] = { sum: 0, count: 0 };
              srMap[sid].sum += data.rating;
              srMap[sid].count += 1;
            });
          }

          const finalServiceRatings: { [key: string]: { avg: number; count: number } } = {};
          Object.entries(srMap).forEach(([sid, { sum, count }]) => {
            if (count > 0) finalServiceRatings[sid] = { avg: sum / count, count };
          });
          setServiceRatings(finalServiceRatings);
        }

      } catch (error) {
        console.error('Error loading services:', error);
        toast({
          variant: "destructive",
          title: t.toast.error,
          description: t.ui.errorLoadingServices
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedCategory, toast]);

  const handleSearch = () => {
    toast({
      title: t.actions.search,
      description: `"${searchQuery}" • ${selectedCategory}`,
    });
  };

  const handleServiceClick = (service: Service) => {
    const provider = providers[service.provider_id];
    if (provider) {
      setSelectedService(service);
      setSelectedProvider(provider);
      setShowBookingModal(true);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: isRTL ? "الموقع غير مدعوم" : "Location Not Supported",
        description: isRTL 
          ? "المتصفح لا يدعم تحديد الموقع"
          : "Your browser doesn't support geolocation"
      });
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        
        // حفظ في localStorage
        localStorage.setItem('userLocation', JSON.stringify({ 
          latitude, 
          longitude,
          timestamp: Date.now()
        }));

        toast({
          title: isRTL ? "تم تحديد موقعك" : "Location Set",
          description: isRTL 
            ? `سيتم عرض الخدمات القريبة منك ضمن ${radiusKm} كم`
            : `Showing services within ${radiusKm} km`
        });
        
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        let errorMessage = isRTL ? "فشل تحديد الموقع" : "Failed to get location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = isRTL 
              ? "تم رفض إذن الموقع. يرجى السماح بالوصول إلى الموقع من إعدادات المتصفح"
              : "Permission denied. Please allow location access";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = isRTL 
              ? "معلومات الموقع غير متاحة"
              : "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = isRTL 
              ? "انتهت مهلة طلب الموقع"
              : "Location request timeout";
            break;
        }
        
        toast({
          variant: "destructive",
          title: isRTL ? "خطأ" : "Error",
          description: errorMessage
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // فلترة الخدمات حسب البحث والفئة والموقع
  const filteredServices = (() => {
    let filtered = services;

    // فلترة حسب الفئة
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category_id === selectedCategory);
    }

    // فلترة حسب البحث
    if (searchQuery) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // فلترة حسب الموقع الجغرافي
    if (userLocation && radiusKm > 0) {
      const servicesWithLocation = filtered
        .map(service => {
          const provider = providers[service.provider_id];
          return {
            ...service,
            provider,
            latitude: provider?.latitude,
            longitude: provider?.longitude
          };
        })
        .filter(s => s.latitude && s.longitude) as (Service & Coordinates & { provider: Provider })[];

      const nearby = filterByRadius(userLocation, servicesWithLocation, radiusKm);
      
      // إرجاع الخدمات مع معلومات المسافة
      return nearby.map(({ distance, provider, latitude, longitude, ...service }) => ({
        ...service,
        distance
      }));
    }

    return filtered;
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" aria-label={t.ui.loading}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden max-w-[100vw]" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-6 sm:py-8 overflow-x-hidden touch-pan-y max-w-[100vw]">
        {/* Search & Filters */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2 min-w-0">
              <Input
                placeholder={t.home.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} className="px-6">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 min-w-0">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t.ui.allCategories} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.ui.allCategories}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {getCategoryLabel(category as any, currentLanguage)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">{t.ui.relevance}</SelectItem>
                  <SelectItem value="rating">{t.ui.highestRated}</SelectItem>
                  <SelectItem value="price-low">{t.ui.priceLowHigh}</SelectItem>
                  <SelectItem value="price-high">{t.ui.priceHighLow}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location-based Filter */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {isRTL ? "البحث حسب الموقع" : "Search by Location"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleGetLocation}
                  disabled={locationLoading}
                  variant={userLocation ? "secondary" : "default"}
                  className="flex-1"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {locationLoading 
                    ? (isRTL ? "جاري تحديد الموقع..." : "Getting location...")
                    : userLocation
                      ? (isRTL ? "تم تحديد الموقع" : "Location Set")
                      : (isRTL ? "استخدم موقعي" : "Use My Location")
                  }
                </Button>
                {userLocation && (
                  <Button
                    onClick={() => {
                      setUserLocation(null);
                      localStorage.removeItem('userLocation');
                      toast({
                        title: isRTL ? "تم إلغاء الفلتر" : "Filter Cleared",
                        description: isRTL ? "سيتم عرض جميع الخدمات" : "Showing all services"
                      });
                    }}
                    variant="outline"
                  >
                    {isRTL ? "إلغاء" : "Clear"}
                  </Button>
                )}
              </div>

              {userLocation && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>
                      {isRTL ? "نطاق البحث:" : "Search Radius:"}
                    </Label>
                    <Badge variant="secondary">
                      {radiusKm === 0 
                        ? (isRTL ? "أي مسافة" : "Any distance")
                        : `${radiusKm} ${isRTL ? "كم" : "km"}`
                      }
                    </Badge>
                  </div>
                  <Slider
                    value={[radiusKm]}
                    onValueChange={(values) => setRadiusKm(values[0])}
                    min={0}
                    max={500}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{isRTL ? "قريب جداً" : "Very Close"}</span>
                    <span>{isRTL ? "بعيد" : "Far"}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {qParam && (
            <p className="text-muted-foreground mt-4">
              {t.actions.search}: "{qParam}" • {filteredServices.length}
            </p>
          )}
          
          {/* View Toggle */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="flex-1"
            >
              <List className="w-4 h-4 mr-2" />
              {isRTL ? 'عرض القائمة' : 'List View'}
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              onClick={() => setViewMode('map')}
              className="flex-1"
            >
              <MapIcon className="w-4 h-4 mr-2" />
              {isRTL ? 'عرض الخريطة' : 'Map View'}
            </Button>
          </div>
        </div>

        {/* Services Grid or Map */}
        {filteredServices.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t.ui.noData}</h3>
              <p className="text-muted-foreground">{t.home.searchPlaceholder}</p>
            </CardContent>
          </Card>
        ) : viewMode === 'map' ? (
          /* Map View */
          <div className="w-full h-[600px]">
            <InteractiveMap
              markers={filteredServices
                .map(service => {
                  const provider = providers[service.provider_id];
                  if (!provider?.latitude || !provider?.longitude) return null;
                  
                  return {
                    latitude: provider.latitude,
                    longitude: provider.longitude,
                    label: `${service.name} - ${provider.full_name}`
                  };
                })
                .filter((marker): marker is NonNullable<typeof marker> => marker !== null)
              }
              center={userLocation 
                ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
                : { latitude: 25.276987, longitude: 55.296249 } // Dubai default
              }
              zoom={userLocation ? 12 : 11}
              currentLanguage={currentLanguage}
              showCurrentLocation={true}
            />
          </div>
        ) : (
          /* List View */
          <div className="w-full max-w-full overflow-x-clip">
            <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredServices.map((service) => {
                const provider = providers[service.provider_id];

                return (
                  <Card
                    key={service.id}
                    className="w-full cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleServiceClick(service)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ProviderLogo
                            providerName={provider?.full_name || t.ui.noData}
                            verified={true}
                            size="md"
                            showName={false}
                          />
                          <div>
                            <CardTitle className="text-lg">{service.name}</CardTitle>
                            <p className="text-muted-foreground text-sm">
                              {provider?.full_name || t.ui.noData}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 px-4 sm:px-6 pb-6">
                      {service.description && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {service.description}
                        </p>
                      )}

                      <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-3">
                        {/* Service rating */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {serviceRatings[service.id] ? (
                              <span className="whitespace-nowrap">
                                {serviceRatings[service.id].avg.toFixed(1)} {t.customer.outOf5 || '/5'} ({serviceRatings[service.id].count})
                              </span>
                            ) : (
                              <span>{t.booking.noRatingYet}</span>
                            )}
                          </div>
                          <span className="opacity-70">• {t.provider.rating}</span>
                        </div>

                        {/* Provider (customer) rating */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {provider && providerRatings[provider.id] ? (
                              <span className="whitespace-nowrap">
                                {providerRatings[provider.id].avg.toFixed(1)} {t.customer.outOf5 || '/5'} ({providerRatings[provider.id].count})
                              </span>
                            ) : (
                              <span>{t.booking.noRatingYet}</span>
                            )}
                          </div>
                          <span className="opacity-70">• {t.booking.clientRating}</span>
                        </div>

                        {provider?.city && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{provider.city}</span>
                          </div>
                        )}

                        {/* Display distance if available */}
                        {(service as any).distance !== undefined && (
                          <div className="flex items-center gap-1 text-primary font-medium">
                            <MapPin className="h-4 w-4" />
                            <span>{formatDistance((service as any).distance, currentLanguage === 'ar' ? 'ar' : 'en')}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        {service.duration_minutes && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{service.duration_minutes} {t.ui.minutes}</span>
                          </div>
                        )}

                        {service.approximate_price && (
                          <div className="text-lg font-semibold text-primary">
                            {provider?.currency_code ? (
                              <span>{provider.currency_code} {service.approximate_price}</span>
                            ) : (
                              <span>{service.approximate_price}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4">
                        {service.booking_enabled && (
                          <Button
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleServiceClick(service);
                            }}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            {isRTL ? 'حجز موعد' : 'Book Appointment'}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className={service.booking_enabled ? 'flex-1' : 'w-full'}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (provider?.id) {
                              window.location.href = `/provider/${provider.id}`;
                            }
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {t.actions.viewProvider}
                        </Button>
                      </div>

                      <Button className="w-full mt-2" onClick={(e) => {
                        e.stopPropagation();
                        handleServiceClick(service);
                      }}>
                        {t.actions.book}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Load More */}
        {filteredServices.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" onClick={() => toast({ title: t.ui.loading, description: t.ui.loadingMoreServices })}>
              {t.ui.loadMore}
            </Button>
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {selectedService && selectedProvider && (
        <BookingModal
          service={selectedService}
          provider={selectedProvider}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedService(null);
            setSelectedProvider(null);
          }}
          currentLanguage={currentLanguage}
        />
      )}

      <Footer currentLanguage={currentLanguage} />
    </div>
  );
};

export default Services;