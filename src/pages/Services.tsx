import { useState, useEffect, useRef, useMemo } from "react";
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
import { getServiceCategoriesCached } from "@/lib/categoriesCache";
import { getServicesCached, invalidateServicesCache } from "@/lib/servicesCache";
import { upsertDefaultServiceCategories } from "@/lib/firebase/defaultCategories";
import { getCategoryLabel } from "@/lib/categoriesLocale";
import { filterByRadius, formatDistance, calculateDistance, RADIUS_OPTIONS, DEFAULT_RADIUS_KM, Coordinates } from "@/lib/geolocation";
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
  
  // Selected service from map
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const selectedServiceRef = useRef<HTMLDivElement>(null);
  
  // Booking modal state
  const [bookingService, setBookingService] = useState<Service | null>(null);

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const loadData = async () => {
      try {
        // Upsert default categories to ensure all 24 are present
        console.log('Upserting default service categories for Services page...');
        const inserted = await upsertDefaultServiceCategories();
        console.log(`Inserted ${inserted} new categories for Services page`);

        // Load categories (cached)
        const cats = await getServiceCategoriesCached();
        setCategories(cats);

        // Load services (cached)
        const servicesData = await getServicesCached();
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
        const errorTitle = isRTL ? 'خطأ' : 'Error';
        const errorDesc = isRTL ? 'فشل تحميل الخدمات' : 'Failed to load services';
        toast({
          variant: "destructive",
          title: errorTitle,
          description: errorDesc
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedCategory, toast, isRTL]);

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

  // فلترة أساسية (فئة + بحث فقط)
  const baseFilteredServices = useMemo(() => {
    console.log('🔍 baseFilteredServices calculation:');
    console.log('  Total services:', services.length);
    console.log('  Selected category:', selectedCategory);
    console.log('  Search query:', searchQuery);
    
    let filtered = services;

    // فلترة حسب الفئة
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category_id === selectedCategory);
      console.log('  After category filter:', filtered.length);
    }

    // فلترة حسب البحث
    if (searchQuery) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('  After search filter:', filtered.length);
    }

    console.log('  Final baseFilteredServices:', filtered.length);
    return filtered;
  }, [services, selectedCategory, searchQuery]);

  // فلترة للقائمة (تشمل فلترة الموقع + إضافة المسافة)
  const filteredServices = useMemo(() => {
    let filtered = baseFilteredServices;

    // إضافة معلومات المسافة لكل خدمة (إذا كان موقع المستخدم متوفر)
    if (userLocation) {
      const servicesWithLocation = filtered
        .map(service => {
          const provider = providers[service.provider_id];
          if (!provider?.latitude || !provider?.longitude) {
            return { ...service, distance: undefined };
          }
          
          const distance = calculateDistance(
            userLocation,
            { latitude: provider.latitude, longitude: provider.longitude }
          );
          
          return { ...service, distance };
        });

      // فلترة حسب النطاق الجغرافي (فقط في وضع القائمة)
      if (radiusKm > 0 && viewMode === 'list') {
        filtered = servicesWithLocation
          .filter(s => s.distance !== undefined && s.distance <= radiusKm)
          .sort((a, b) => (a.distance || 0) - (b.distance || 0));
      } else {
        // ترتيب حسب المسافة بدون فلترة
        filtered = servicesWithLocation.sort((a, b) => {
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        });
      }
      
      return filtered;
    }

    return filtered;
  }, [baseFilteredServices, userLocation, radiusKm, providers, viewMode]);

  // حساب mapMarkers من الفلترة الأساسية (بدون فلترة الموقع)
  const mapMarkers = useMemo(() => {
    console.log('🗺️ mapMarkers calculation:');
    console.log('  baseFilteredServices:', baseFilteredServices.length);
    console.log('  Total providers:', Object.keys(providers).length);
    console.log('  Providers with GPS:', Object.values(providers).filter(p => p?.latitude && p?.longitude).length);
    
    // استخدام baseFilteredServices بدلاً من filteredServices
    // لتجنب تأثير فلترة الموقع على الخريطة
    const servicesByLocation = new Map<string, Service[]>();
    
    baseFilteredServices.forEach((service, index) => {
      const provider = providers[service.provider_id];
      console.log(`  Service ${index + 1} (${service.name}):`, {
        provider_id: service.provider_id,
        provider_exists: !!provider,
        has_gps: !!(provider?.latitude && provider?.longitude),
        lat: provider?.latitude,
        lng: provider?.longitude
      });
      
      if (!provider?.latitude || !provider?.longitude) return;
      
      const locationKey = `${provider.latitude},${provider.longitude}`;
      if (!servicesByLocation.has(locationKey)) {
        servicesByLocation.set(locationKey, []);
      }
      servicesByLocation.get(locationKey)!.push(service);
    });
    
    // إنشاء markers مع معلومات كل الخدمات
    const markers = Array.from(servicesByLocation.entries()).map(([locationKey, services]) => {
      const provider = providers[services[0].provider_id];
      if (!provider) return null;
      
      return {
        latitude: provider.latitude!,
        longitude: provider.longitude!,
        label: `${provider.full_name} - ${services.length} ${isRTL ? 'خدمة' : 'services'}`,
        services: services.map(service => ({
          id: service.id,
          name: service.name,
          price: service.approximate_price || service.price_range || (isRTL ? 'السعر عند الطلب' : 'Price on request'),
          provider_name: provider.full_name
        }))
      };
    }).filter((marker): marker is NonNullable<typeof marker> => marker !== null);
    
    console.log('🗺️ useMemo: Calculated mapMarkers:', markers.length);
    markers.forEach((m, i) => console.log(`  Marker ${i + 1}:`, m.label, `(${m.latitude}, ${m.longitude})`));
    
    return markers;
  }, [baseFilteredServices, providers, isRTL]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" aria-label={t.ui.loading}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden max-w-[100vw]" dir={isRTL ? 'rtl' : 'ltr'}>
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
          <div className="space-y-4">
            {/* Map Statistics */}
            <div className="flex flex-wrap gap-2 items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-semibold">
                  {isRTL 
                    ? `${mapMarkers.length} من ${filteredServices.length} خدمة على الخريطة`
                    : `${mapMarkers.length} of ${filteredServices.length} services on map`
                  }
                </span>
              </div>
              {(filteredServices.length - mapMarkers.length) > 0 && (
                <Badge variant="secondary">
                  {isRTL 
                    ? `${filteredServices.length - mapMarkers.length} بدون موقع`
                    : `${filteredServices.length - mapMarkers.length} without location`
                  }
                </Badge>
              )}
            </div>
            
            {/* Map */}
            <div className="w-full h-[600px] rounded-lg overflow-hidden border">
              <InteractiveMap
                markers={mapMarkers}
                center={
                  userLocation 
                    ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
                    : mapMarkers.length > 0
                      ? { 
                          latitude: mapMarkers[0].latitude, 
                          longitude: mapMarkers[0].longitude 
                        }
                      : { latitude: 25.276987, longitude: 55.296249 } // Dubai default fallback
                }
                zoom={userLocation ? 12 : mapMarkers.length > 0 ? 12 : 11}
                currentLanguage={currentLanguage}
                showCurrentLocation={true}
                onServiceClick={(serviceId) => {
                  // عرض الخدمة تحت الخريطة
                  setSelectedServiceId(serviceId);
                  // Smooth scroll للخدمة المختارة
                  setTimeout(() => {
                    selectedServiceRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'nearest'
                    });
                  }, 100);
                }}
              />
            </div>
            
            {/* Selected Service Display */}
            {selectedServiceId && (() => {
                    const service = filteredServices.find(s => s.id === selectedServiceId);
                    const provider = service ? providers[service.provider_id] : null;
                    
                    if (!service || !provider) return null;
                    
                    return (
                      <div 
                        ref={selectedServiceRef}
                        className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
                      >
                        <Card className="border-2 border-primary/50 shadow-lg">
                          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {isRTL ? '✨ مختار من الخريطة' : '✨ Selected from map'}
                                  </Badge>
                                </div>
                                <CardTitle className="text-2xl">
                                  {service.name}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-2">
                                  {service.description || (isRTL ? 'لا يوجد وصف' : 'No description')}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedServiceId(null)}
                                className="shrink-0"
                              >
                                ✕
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4 sm:pt-6">
                            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                              {/* معلومات الخدمة */}
                              <div className="space-y-2 sm:space-y-4">
                                <h3 className="font-semibold text-lg border-b pb-2">
                                  {isRTL ? '📋 تفاصيل الخدمة' : '📋 Service Details'}
                                </h3>
                                
                                {/* السعر */}
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">{isRTL ? 'السعر:' : 'Price:'}</span>
                                  <span className="text-xl font-bold text-primary">
                                    {service.approximate_price || service.price_range || (isRTL ? 'السعر عند الطلب' : 'Price on request')}
                                  </span>
                                </div>
                                
                                {/* المدة */}
                                {service.duration_minutes && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <span>{service.duration_minutes} {isRTL ? 'دقيقة' : 'minutes'}</span>
                                  </div>
                                )}
                                
                                {/* الفئة */}
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {categories.find(c => c.id === service.category_id)?.[isRTL ? 'name_ar' : 'name_en']}
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* معلومات المزود */}
                              <div className="space-y-2 sm:space-y-4">
                                <h3 className="font-semibold text-lg border-b pb-2">
                                  {isRTL ? '👤 معلومات المزود' : '👤 Provider Info'}
                                </h3>
                                
                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                    {provider.full_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-semibold">{provider.full_name}</div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <MapPin className="w-3 h-3" />
                                      <span>{provider.city || (isRTL ? 'مزود خدمة' : 'Service Provider')}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* المسافة */}
                                {userLocation && provider.latitude && provider.longitude && (
                                  <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                                    <MapPin className="w-5 h-5 text-primary" />
                                    <div>
                                      <div className="text-sm text-muted-foreground">
                                        {isRTL ? 'المسافة التقديرية' : 'Estimated Distance'}
                                      </div>
                                      <div className="text-lg font-semibold text-primary">
                                        {formatDistance(
                                          calculateDistance(
                                            userLocation,
                                            { latitude: provider.latitude, longitude: provider.longitude }
                                          ),
                                          currentLanguage === 'ar' ? 'ar' : 'en'
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* الموقع */}
                                {provider.location_address && (
                                  <div className="flex items-start gap-2 text-sm">
                                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <span className="text-muted-foreground">{provider.location_address}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* الأزرار */}
                            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t">
                              {service.booking_enabled && (
                                <Button
                                  size="lg"
                                  onClick={() => {
                                    setBookingService(service);
                                    setSelectedServiceId(null);
                                  }}
                                  className="flex-1 min-w-[200px]"
                                >
                                  <Calendar className="w-4 h-4 mr-2" />
                                  {isRTL ? 'حجز موعد' : 'Book Appointment'}
                                </Button>
                              )}
                              
                              <Button
                                variant="outline"
                                size="lg"
                                onClick={() => {
                                  window.location.href = `/provider/${service.provider_id}`;
                                }}
                                className="flex-1 min-w-[200px]"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                {isRTL ? 'عرض كل خدمات المزود' : 'View All Provider Services'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })()}
            
            {/* Help Message */}
            {(filteredServices.length - mapMarkers.length) > 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {isRTL 
                    ? '💡 بعض مقدمي الخدمات لم يضيفوا موقعهم بعد. يمكنهم إضافة الموقع من صفحة تحرير الملف الشخصي.'
                    : '💡 Some service providers have not added their location yet. They can add it from their Edit Profile page.'
                  }
                </p>
              </div>
            )}
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

                    <CardContent className="pt-0 px-3 sm:px-6 pb-4 sm:pb-6">
                      {service.description && (
                        <p className="text-muted-foreground text-sm mb-1.5 sm:mb-3 line-clamp-2">
                          {service.description}
                        </p>
                      )}

                      <div className="flex flex-col gap-0 sm:gap-1 text-sm text-muted-foreground mb-1.5 sm:mb-3">
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

                      <div className="flex items-center justify-between mb-2 sm:mb-0">
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

                      <div className="flex gap-2 mt-2 sm:mt-4">
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

                      <Button className="w-full mt-1.5 sm:mt-2" onClick={(e) => {
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

      {/* Booking Modal */}
      {bookingService && (
        <BookingModal
          isOpen={!!bookingService}
          onClose={() => setBookingService(null)}
          service={bookingService}
          provider={providers[bookingService.provider_id]}
          currentLanguage={currentLanguage}
        />
      )}

      <Footer currentLanguage={currentLanguage} />
    </div>
  );
};

export default Services;