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
import { Search, Filter, MapPin, Star, Clock, ExternalLink, Calendar, Map as MapIcon, List, ChevronDown, Sparkles, Wrench, Heart, Dumbbell, Scissors, GraduationCap, Stethoscope, Home, Car, Laptop, Scale, DollarSign, Users, Cog, Palette, Shirt, Code, Building, Megaphone, Camera, Languages, Briefcase, Sofa, PenTool, Music, Plane, Trash2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from "@/hooks/use-toast";
import { getCategoryIcon, getCategoryColor } from "@/lib/categoryIcons";
// Currency display uses Latin currency code (e.g., AED) instead of symbol
import { db } from "@/integrations/firebase/client";
import InteractiveMap from "@/components/map/InteractiveMap";
import { ServiceCategory, initializeServiceCategories } from "@/lib/firebase/collections";

import { getServicesCached, invalidateServicesCache } from "@/lib/servicesCache";
import { upsertDefaultServiceCategories } from "@/lib/firebase/defaultCategories";
import { getCategoryLabel } from "@/lib/categoriesLocale";
import { filterByRadius, formatDistance, calculateDistance, RADIUS_OPTIONS, DEFAULT_RADIUS_KM, Coordinates } from "@/lib/geolocation";
import { Slider } from "@/components/ui/slider";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { Service, Offer, ProviderProfile } from "@/types/service";
import { useServicesData } from "@/hooks/useServicesData";

interface ServicesProps {
  currentLanguage: string;
}

const Services = ({ currentLanguage = 'en' }: ServicesProps) => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const qParam = searchParams.get('q');
  const viewParam = searchParams.get('view'); // Get view parameter

  const [searchQuery, setSearchQuery] = useState(qParam || '');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');
  const [sortBy, setSortBy] = useState('relevance');

  const { 
    services, 
    categories, 
    providers, 
    offers: offersByProvider, 
    providerRatings, 
    serviceRatings, 
    isLoading: loading 
  } = useServicesData();

  const offersList = useMemo(() => {
    return Object.values(offersByProvider).flat();
  }, [offersByProvider]);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // Location-based filtering states
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // View toggle: 'services', 'map', 'offers', or 'appointments'
  const [activeView, setActiveView] = useState<'services' | 'map' | 'offers' | 'appointments'>(
    viewParam === 'map' ? 'map' : 'services'
  );
  
  // Selected service from map
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const selectedServiceRef = useRef<HTMLDivElement>(null);
  
  // Expanded service card state (for accordion)
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  
  // Booking modal state
  const [bookingService, setBookingService] = useState<Service | null>(null);

  const { t, isRTL } = useTranslation(currentLanguage);
  const { toast } = useToast();

  // محاولة استرجاع الموقع المحفوظ عند بداية الصفحة + الاستماع للتحديثات
  useEffect(() => {
    const loadSavedLocation = () => {
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
    };

    loadSavedLocation();

    // الاستماع لتحديثات الموقع من الهيدر
    const handleLocationUpdate = (event: CustomEvent) => {
      if (event.detail) {
        setUserLocation(event.detail);
      }
    };

    window.addEventListener('location-updated', handleLocationUpdate as EventListener);
    return () => {
      window.removeEventListener('location-updated', handleLocationUpdate as EventListener);
    };
  }, []);

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
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service => {
        const provider = providers[service.provider_id];
        const providerName = provider?.full_name || '';
        
        return (
          service.name.toLowerCase().includes(query) ||
          service.description?.toLowerCase().includes(query) ||
          providerName.toLowerCase().includes(query)
        );
      });
      console.log('  After search filter:', filtered.length);
    }

    console.log('  Final baseFilteredServices:', filtered.length);
    return filtered;
  }, [services, selectedCategory, searchQuery, providers]);

  // فلترة للقائمة (تشمل فلترة الموقع + الترتيب)
  const filteredServices = useMemo(() => {
    let filtered = [...baseFilteredServices];

    // إضافة معلومات المسافة لكل خدمة (إذا كان موقع المستخدم متوفر)
    if (userLocation) {
      filtered = filtered.map(service => {
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

      // فلترة حسب النطاق الجغرافي (فقط في وضع القائمة أو العروض)
      if (radiusKm > 0 && (activeView === 'services' || activeView === 'offers' || activeView === 'appointments')) {
        filtered = filtered.filter(s => (s as any).distance !== undefined && (s as any).distance <= radiusKm);
      }
    }

    // Filter by type based on activeView
    if (activeView === 'services') {
      filtered = filtered.filter(s => s.type !== 'booking');
    } else if (activeView === 'appointments') {
      filtered = filtered.filter(s => s.type === 'booking');
    }

    // تطبيق الترتيب
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'nearest':
          const distA = (a as any).distance;
          const distB = (b as any).distance;
          // If distance is undefined (no location), put at the end
          if (distA === undefined && distB === undefined) return 0;
          if (distA === undefined) return 1;
          if (distB === undefined) return -1;
          return distA - distB;

        case 'rating':
          const ratingA = serviceRatings[a.id]?.avg || 0;
          const ratingB = serviceRatings[b.id]?.avg || 0;
          return ratingB - ratingA; // Highest rated first
          
        case 'price-low':
          const priceA_low = a.has_discount && a.discount_price 
            ? parseFloat(a.discount_price.toString().replace(/[^0-9.]/g, '')) || 0
            : parseFloat((a.approximate_price || '0').toString().replace(/[^0-9.]/g, '')) || 0;
          const priceB_low = b.has_discount && b.discount_price 
            ? parseFloat(b.discount_price.toString().replace(/[^0-9.]/g, '')) || 0
            : parseFloat((b.approximate_price || '0').toString().replace(/[^0-9.]/g, '')) || 0;
          return priceA_low - priceB_low;
          
        case 'price-high':
          const priceA_high = a.has_discount && a.discount_price 
            ? parseFloat(a.discount_price.toString().replace(/[^0-9.]/g, '')) || 0
            : parseFloat((a.approximate_price || '0').toString().replace(/[^0-9.]/g, '')) || 0;
          const priceB_high = b.has_discount && b.discount_price 
            ? parseFloat(b.discount_price.toString().replace(/[^0-9.]/g, '')) || 0
            : parseFloat((b.approximate_price || '0').toString().replace(/[^0-9.]/g, '')) || 0;
          return priceB_high - priceA_high;
          
        case 'relevance':
        default:
          // If user location is available, sort by distance
          if (userLocation) {
            const distA = (a as any).distance;
            const distB = (b as any).distance;
            if (distA === undefined && distB === undefined) return 0;
            if (distA === undefined) return 1;
            if (distB === undefined) return -1;
            return distA - distB;
          }
          return 0;
      }
    });

    return filtered;
  }, [baseFilteredServices, userLocation, radiusKm, providers, activeView, sortBy, serviceRatings]);

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
      
      // حساب تقييم المزود من تقييمات خدماته
      const providerServiceRatings = services
        .map(s => serviceRatings[s.id])
        .filter(r => r && r.avg > 0);
      const providerAvgRating = providerServiceRatings.length > 0
        ? providerServiceRatings.reduce((sum, r) => sum + r.avg, 0) / providerServiceRatings.length
        : 0;
      const providerTotalReviews = providerServiceRatings.reduce((sum, r) => sum + r.count, 0);
      
      console.log(`  Provider "${provider.full_name}" ratings:`, {
        providerAvgRating,
        providerTotalReviews,
        servicesCount: services.length,
        ratingsFound: providerServiceRatings.length
      });
      
      return {
        latitude: provider.latitude!,
        longitude: provider.longitude!,
        label: `${provider.full_name} - ${services.length} ${isRTL ? 'خدمة' : 'services'}`,
        provider_rating: providerAvgRating,
        provider_reviews_count: providerTotalReviews,
        services: services.map(service => {
          const rating = serviceRatings[service.id];
          const category = categories.find(c => c.id === service.category_id);
          console.log(`    Service "${service.name}" - category:`, { category_id: service.category_id, icon_name: category?.icon_name, color_scheme: category?.color_scheme });
          return {
            id: service.id,
            name: service.name,
            price: service.approximate_price || service.price_range || (isRTL ? 'السعر عند الطلب' : 'Price on request'),
            provider_name: provider.full_name,
            average_rating: rating?.avg || 0,
            reviews_count: rating?.count || 0,
            currency: provider.currency_code || 'AED',
            category_id: service.category_id,
            icon_name: category?.icon_name,
            color_scheme: category?.color_scheme,
            has_discount: service.has_discount,
            discount_price: service.discount_price,
            discount_percentage: service.discount_percentage,
            type: service.type
          };
        })
      };
    }).filter((marker): marker is NonNullable<typeof marker> => marker !== null);
    
    console.log('🗺️ useMemo: Calculated mapMarkers:', markers.length);
    markers.forEach((m, i) => console.log(`  Marker ${i + 1}:`, m.label, `(${m.latitude}, ${m.longitude})`, 
      `Provider Rating: ${m.provider_rating?.toFixed(1)}, Services with ratings:`, 
      m.services.filter(s => s.average_rating > 0).length));
    
    return markers;
  }, [baseFilteredServices, providers, isRTL, serviceRatings, categories]);

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
        {/* 1. Location-based Filter (Top) */}
        <div className="mb-4">
          {userLocation ? (
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
              <div className="flex justify-between items-center mb-3">
                <Label className="text-muted-foreground font-normal">
                  {isRTL ? "نطاق البحث:" : "Search Radius:"}
                </Label>
                <span className="text-sm font-semibold">
                  {radiusKm} {isRTL ? "كم" : "km"}
                </span>
              </div>
              <Slider
                value={[radiusKm]}
                onValueChange={(values) => setRadiusKm(values[0])}
                min={5}
                max={500}
                step={5}
                className="w-full"
              />
            </div>
          ) : (
            <div className="text-center py-2 bg-muted/30 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground">
                {isRTL 
                  ? "يرجى تحديد موقعك من الشريط العلوي لعرض الخدمات القريبة" 
                  : "Please set your location from the header to see nearby services"
                }
              </p>
            </div>
          )}
        </div>

        {/* 2. Main Navigation Buttons (Services, Map, Offers, Appointments) */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Button
            variant={activeView === 'services' ? 'default' : 'outline'}
            className={`h-16 flex flex-col items-center justify-center gap-1 rounded-xl border-2 ${
              activeView === 'services' 
                ? 'border-primary bg-primary text-primary-foreground shadow-md' 
                : 'border-muted bg-card hover:bg-muted/50 hover:border-primary/50'
            }`}
            onClick={() => setActiveView('services')}
          >
            <List className="w-5 h-5" />
            <span className="text-xs font-bold">{isRTL ? 'الخدمات' : 'Services'}</span>
          </Button>

          <Button
            variant={activeView === 'map' ? 'default' : 'outline'}
            className={`h-16 flex flex-col items-center justify-center gap-1 rounded-xl border-2 ${
              activeView === 'map' 
                ? 'border-primary bg-primary text-primary-foreground shadow-md' 
                : 'border-muted bg-card hover:bg-muted/50 hover:border-primary/50'
            }`}
            onClick={() => setActiveView('map')}
          >
            <MapIcon className="w-5 h-5" />
            <span className="text-xs font-bold">{isRTL ? 'الخريطة' : 'Map'}</span>
          </Button>

          <Button
            variant={activeView === 'offers' ? 'default' : 'outline'}
            className={`h-16 flex flex-col items-center justify-center gap-1 rounded-xl border-2 ${
              activeView === 'offers' 
                ? 'border-primary bg-primary text-primary-foreground shadow-md' 
                : 'border-muted bg-card hover:bg-muted/50 hover:border-primary/50'
            }`}
            onClick={() => setActiveView('offers')}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold">{isRTL ? 'العروض' : 'Offers'}</span>
          </Button>

          <Button
            variant={activeView === 'appointments' ? 'default' : 'outline'}
            className={`h-16 flex flex-col items-center justify-center gap-1 rounded-xl border-2 ${
              activeView === 'appointments' 
                ? 'border-primary bg-primary text-primary-foreground shadow-md' 
                : 'border-muted bg-card hover:bg-muted/50 hover:border-primary/50'
            }`}
            onClick={() => setActiveView('appointments')}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-bold">{isRTL ? 'مواعيد' : 'Bookings'}</span>
          </Button>
        </div>

        {/* 3. Filters & Sort (Below Buttons) */}
        <div className="flex flex-col sm:flex-row gap-2 min-w-0 mb-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 h-10">
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
            <SelectTrigger className="w-full sm:w-48 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">{t.ui.relevance}</SelectItem>
              <SelectItem value="nearest">{isRTL ? 'الأقرب مسافة' : 'Nearest'}</SelectItem>
              <SelectItem value="rating">{t.ui.highestRated}</SelectItem>
              <SelectItem value="price-low">{t.ui.priceLowHigh}</SelectItem>
              <SelectItem value="price-high">{t.ui.priceHighLow}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 4. Search Bar */}
        <div className="flex gap-2 min-w-0 mb-6">
          <Input
            placeholder={t.home.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-10"
          />
          <Button onClick={handleSearch} className="px-6 h-10">
            <Search className="h-4 w-4" />
          </Button>
        </div>

            {/* 6. Results (Grid or Map) */}
            {activeView !== 'offers' && (
              filteredServices.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t.ui.noData}</h3>
                  <p className="text-muted-foreground">{t.home.searchPlaceholder}</p>
                </CardContent>
              </Card>
            ) : activeView === 'map' ? (
              /* Map View */
              <div className="space-y-3">
                {/* Map */}
                <div className="w-full h-[800px] sm:h-[1120px] rounded-lg overflow-hidden border">
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
                
                {/* Map Statistics */}
                <div className="flex flex-wrap gap-2 items-center justify-between p-4 card-nested rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="font-semibold">
                      {isRTL ? 'المزودين في المنطقة:' : 'Providers in area:'} {mapMarkers.length}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isRTL ? 'يتم عرض جميع المزودين بغض النظر عن نطاق البحث' : 'Showing all providers regardless of search radius'}
                  </div>
                </div>

                {/* Selected Service Details (Below Map) */}
                {selectedServiceId && (
                  <div ref={selectedServiceRef} className="mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    {filteredServices.filter(s => s.id === selectedServiceId).map((service) => {
                      const provider = providers[service.provider_id];
                      const category = categories.find(c => c.id === service.category_id);
                      const isExpanded = true; // Always expanded when selected from map
                      
                      return (
                        <div
                          key={service.id}
                          className="relative transition-all duration-300 bg-card border-2 border-primary shadow-lg"
                          style={{
                            borderRadius: '16px',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Compact Header */}
                          <div
                            className="flex flex-col p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setSelectedServiceId(null)}
                          >
                            {/* Service Name with Category Icon */}
                            <div 
                              className="text-foreground flex items-center gap-2"
                              style={{
                                fontSize: '13px',
                                fontWeight: '700',
                                marginBottom: '10px',
                                lineHeight: '1.4'
                              }}
                            >
                              {(() => {
                                const category = categories.find(c => c.id === service.category_id);
                                if (category?.icon_name && category?.color_scheme) {
                                  const IconComponent = getCategoryIcon(category.icon_name);
                                  const colors = getCategoryColor(category.color_scheme);
                                  return (
                                    <div className={`${colors.bg} p-2 rounded-md flex-shrink-0`}>
                                      <IconComponent className={`w-5 h-5 ${colors.text}`} />
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              <span
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  flex: 1
                                }}
                              >
                                {service.name}
                              </span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto" onClick={(e) => {
                                e.stopPropagation();
                                setSelectedServiceId(null);
                              }}>
                                <span className="sr-only">Close</span>
                                ×
                              </Button>
                            </div>
                            
                            {/* Rating & Reviews */}
                            {serviceRatings[service.id]?.avg > 0 ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <div style={{
                                    color: '#fbbf24',
                                    fontSize: '12px',
                                    letterSpacing: '0.5px',
                                    lineHeight: 1
                                  }}>
                                    {[1, 2, 3, 4, 5].map((star) => {
                                      const rating = serviceRatings[service.id]?.avg || 0;
                                      const fullStars = Math.floor(rating);
                                      const hasHalfStar = rating % 1 >= 0.5;
                                      if (star <= fullStars) return '★';
                                      if (star === fullStars + 1 && hasHalfStar) return '⯨';
                                      return '☆';
                                    }).join('')}
                                  </div>
                                  <span className="text-foreground" style={{ fontSize: '12px', fontWeight: '600' }}>
                                    {serviceRatings[service.id].avg.toFixed(1)}
                                  </span>
                                  <span className="text-muted-foreground" style={{ fontSize: '10px' }}>
                                    ({serviceRatings[service.id].count})
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', height: '16px' }}>
                                <div className="text-muted-foreground" style={{ fontSize: '10px' }}>
                                  ⭐ {isRTL ? 'لا توجد تقييمات' : 'No reviews'}
                                </div>
                              </div>
                            )}
                            
                            {/* Price */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {service.type === 'booking' ? (
                                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'hsl(var(--primary))' }}>
                                    {isRTL ? 'حجز موعد' : 'Appointment'}
                                  </div>
                                ) : service.has_discount && service.discount_price ? (
                                  <>
                                    {/* Discounted Price */}
                                    <div style={{ 
                                      fontSize: '18px', 
                                      color: '#dc2626', 
                                      fontWeight: '700',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}>
                                      {service.discount_price} {provider?.currency_code || 'AED'}
                                      {service.discount_percentage && (
                                        <Badge 
                                          variant="destructive" 
                                          className="bg-red-500 text-white text-[10px] px-1.5 py-0.5"
                                        >
                                          -{service.discount_percentage}%
                                        </Badge>
                                      )}
                                    </div>
                                    {/* Original Price - Strikethrough */}
                                    <div style={{ 
                                      fontSize: '14px', 
                                      color: '#6b7280', 
                                      fontWeight: '500',
                                      textDecoration: 'line-through',
                                      textDecorationColor: '#dc2626',
                                      textDecorationThickness: '2px'
                                    }}>
                                      {service.approximate_price} {provider?.currency_code || 'AED'}
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                                    {service.approximate_price} {provider?.currency_code || 'AED'}
                                  </div>
                                )}
                              </div>
                              <ChevronDown
                                className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </div>

                          {/* Expanded Content */}
                          <div className="border-t px-3 pb-3 pt-2 bg-muted/10">
                            <div className="space-y-2">
                              {service.description && (
                                <p className="text-foreground" style={{ fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                                  {service.description}
                                </p>
                              )}

                              <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                                <span className="text-primary" style={{ fontWeight: '600' }}>
                                  {isRTL ? 'المزود:' : 'Provider:'}
                                </span> {provider?.full_name || t.ui.noData}
                              </p>

                              {service.duration_minutes && (
                                <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                                  <span className="text-primary" style={{ fontWeight: '600' }}>
                                    {isRTL ? 'المدة:' : 'Duration:'}
                                  </span> {service.duration_minutes} {isRTL ? 'دقيقة' : 'minutes'}
                                </p>
                              )}

                              {provider?.city && (
                                <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                                  <span className="text-primary" style={{ fontWeight: '600' }}>
                                    {isRTL ? 'المدينة:' : 'City:'}
                                  </span> {provider.city}
                                </p>
                              )}

                              <div className="space-y-2 pt-2">
                                {service.booking_enabled && (
                                  <Button
                                    className="w-full"
                                    style={{
                                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                      border: 'none'
                                    }}
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
                                  className="w-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/provider/${service.provider_id}`;
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  {isRTL ? 'عرض كل الخدمات' : 'View All Services'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* List View */
              <div className="w-full max-w-full overflow-x-clip">
                <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {filteredServices.map((service) => {
                    const provider = providers[service.provider_id];
                    const category = categories.find(c => c.id === service.category_id);
                    const isExpanded = expandedServiceId === service.id;
                    const iconMap: { [key: string]: any } = {
                      'Sparkles': Sparkles, 'Wrench': Wrench, 'Heart': Heart, 'Dumbbell': Dumbbell,
                      'Scissors': Scissors, 'GraduationCap': GraduationCap, 'Stethoscope': Stethoscope,
                      'Home': Home, 'Car': Car, 'Laptop': Laptop, 'Scale': Scale, 'DollarSign': DollarSign,
                      'Users': Users, 'Cog': Cog, 'Palette': Palette, 'Shirt': Shirt, 'Code': Code,
                      'Building': Building, 'Megaphone': Megaphone, 'Camera': Camera, 'Languages': Languages,
                      'Briefcase': Briefcase, 'Calendar': Calendar, 'Sofa': Sofa, 'PenTool': PenTool,
                      'Music': Music, 'Plane': Plane
                    };
                    const CategoryIcon = category?.icon_name ? iconMap[category.icon_name] || Users : Users;

                    return (
                      <div
                        key={service.id}
                        className="relative transition-all duration-300 bg-card border hover:border-primary/40"
                        style={{
                          borderRadius: '16px',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                        }}
                      >
                        {/* Compact Header - Always Visible */}
                        <div
                          className="flex flex-col p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setExpandedServiceId(isExpanded ? null : service.id)}
                        >
                          {/* Service Name with Category Icon */}
                          <div 
                            className="text-foreground flex items-center gap-2"
                            style={{
                              fontSize: '13px',
                              fontWeight: '700',
                              marginBottom: '10px',
                              lineHeight: '1.4'
                            }}
                          >
                            {(() => {
                              const category = categories.find(c => c.id === service.category_id);
                              if (category?.icon_name && category?.color_scheme) {
                                const IconComponent = getCategoryIcon(category.icon_name);
                                const colors = getCategoryColor(category.color_scheme);
                                return (
                                  <div className={`${colors.bg} p-2 rounded-md flex-shrink-0`}>
                                    <IconComponent className={`w-5 h-5 ${colors.text}`} />
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                flex: 1
                              }}
                            >
                              {service.name}
                            </span>
                          </div>
                          
                          {/* Rating & Reviews with Favorite Button */}
                          {serviceRatings[service.id]?.avg > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <div style={{
                                  color: '#fbbf24',
                                  fontSize: '12px',
                                  letterSpacing: '0.5px',
                                  lineHeight: 1
                                }}>
                                  {[1, 2, 3, 4, 5].map((star) => {
                                    const rating = serviceRatings[service.id]?.avg || 0;
                                    const fullStars = Math.floor(rating);
                                    const hasHalfStar = rating % 1 >= 0.5;
                                    if (star <= fullStars) return '★';
                                    if (star === fullStars + 1 && hasHalfStar) return '⯨';
                                    return '☆';
                                  }).join('')}
                                </div>
                                <span className="text-foreground" style={{ fontSize: '12px', fontWeight: '600' }}>
                                  {serviceRatings[service.id].avg.toFixed(1)}
                                </span>
                                <span className="text-muted-foreground" style={{ fontSize: '10px' }}>
                                  ({serviceRatings[service.id].count})
                                </span>
                              </div>
                              
                              {/* Favorite Button */}
                              <div onClick={(e) => e.stopPropagation()}>
                                <FavoriteButton
                                  type="service"
                                  itemId={service.id}
                                  itemData={{
                                    title: service.name,
                                    category: category?.[isRTL ? 'name_ar' : 'name_en'],
                                    rating: serviceRatings[service.id]?.avg
                                  }}
                                  variant="ghost"
                                  size="sm"
                                />
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', height: '16px' }}>
                              <div className="text-muted-foreground" style={{ fontSize: '10px' }}>
                                ⭐ {isRTL ? 'لا توجد تقييمات' : 'No reviews'}
                              </div>
                              
                              {/* Favorite Button */}
                              <div onClick={(e) => e.stopPropagation()}>
                                <FavoriteButton
                                  type="service"
                                  itemId={service.id}
                                  itemData={{
                                    title: service.name,
                                    category: category?.[isRTL ? 'name_ar' : 'name_en'],
                                    rating: serviceRatings[service.id]?.avg
                                  }}
                                  variant="ghost"
                                  size="sm"
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Price + Expand Arrow */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {service.type === 'booking' ? (
                                <div style={{ fontSize: '14px', fontWeight: '600', color: 'hsl(var(--primary))' }}>
                                  {isRTL ? 'حجز موعد' : 'Appointment'}
                                </div>
                              ) : service.has_discount && service.discount_price ? (
                                <>
                                  {/* Discounted Price */}
                                  <div style={{ 
                                    fontSize: '18px', 
                                    color: '#dc2626', 
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}>
                                    {service.discount_price} {provider?.currency_code || 'AED'}
                                    {service.discount_percentage && (
                                      <Badge 
                                        variant="destructive" 
                                        className="bg-red-500 text-white text-[10px] px-1.5 py-0.5"
                                      >
                                        -{service.discount_percentage}%
                                      </Badge>
                                    )}
                                  </div>
                                  {/* Original Price - Strikethrough */}
                                  <div style={{ 
                                    fontSize: '14px', 
                                    color: '#6b7280', 
                                    fontWeight: '500',
                                    textDecoration: 'line-through',
                                    textDecorationColor: '#dc2626',
                                    textDecorationThickness: '2px'
                                  }}>
                                    {service.approximate_price} {provider?.currency_code || 'AED'}
                                  </div>
                                </>
                              ) : (
                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                                  {service.approximate_price} {provider?.currency_code || 'AED'}
                                </div>
                              )}
                            </div>
                            <ChevronDown
                              className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div 
                            className="border-t px-3 pb-3 pt-2 animate-in slide-in-from-top-2 duration-200"
                          >
                            <div className="space-y-2">
                              {/* Description */}
                              {service.description && (
                                <p className="text-foreground" style={{ fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                                  {service.description}
                                </p>
                              )}

                              {/* Provider */}
                              <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                                <span className="text-primary" style={{ fontWeight: '600' }}>
                                  {isRTL ? 'المزود:' : 'Provider:'}
                                </span> {provider?.full_name || t.ui.noData}
                              </p>

                              {/* Duration */}
                              {service.duration_minutes && (
                                <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                                  <span className="text-primary" style={{ fontWeight: '600' }}>
                                    {isRTL ? 'المدة:' : 'Duration:'}
                                  </span> {service.duration_minutes} {isRTL ? 'دقيقة' : 'minutes'}
                                </p>
                              )}

                              {/* City */}
                              {provider?.city && (
                                <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                                  <span className="text-primary" style={{ fontWeight: '600' }}>
                                    {isRTL ? 'المدينة:' : 'City:'}
                                  </span> {provider.city}
                                </p>
                              )}

                              {/* Buttons */}
                              <div className="space-y-2 pt-2">
                                {service.booking_enabled && (
                                  <Button
                                    className="w-full"
                                    style={{
                                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                      border: 'none'
                                    }}
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
                                  className="w-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/provider/${service.provider_id}`;
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  {isRTL ? 'عرض كل الخدمات' : 'View All Services'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}


        {/* Offers List View */}
        {activeView === 'offers' && (
          <div>
            {/* Services with Discounts Only */}
            {filteredServices.filter(s => 
              s.has_discount === true && 
              s.discount_price && 
              s.discount_price.toString().trim() !== '' &&
              s.discount_percentage && 
              s.discount_percentage > 0
            ).length > 0 ? (
              <div>
                <div className="w-full max-w-full overflow-x-clip">
                  <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {filteredServices.filter(s => 
                      s.has_discount === true && 
                      s.discount_price && 
                      s.discount_price.toString().trim() !== '' &&
                      s.discount_percentage && 
                      s.discount_percentage > 0
                    ).map((service) => {
                      const provider = providers[service.provider_id];
                      const category = categories.find(c => c.id === service.category_id);
                      const isExpanded = expandedServiceId === service.id;
                      const iconMap: { [key: string]: any } = {
                        'Sparkles': Sparkles, 'Wrench': Wrench, 'Heart': Heart, 'Dumbbell': Dumbbell,
                        'Scissors': Scissors, 'GraduationCap': GraduationCap, 'Stethoscope': Stethoscope,
                        'Home': Home, 'Car': Car, 'Laptop': Laptop, 'Scale': Scale, 'DollarSign': DollarSign,
                        'Users': Users, 'Cog': Cog, 'Palette': Palette, 'Shirt': Shirt, 'Code': Code,
                        'Building': Building, 'Megaphone': Megaphone, 'Camera': Camera, 'Languages': Languages,
                        'Briefcase': Briefcase, 'Calendar': Calendar, 'Sofa': Sofa, 'PenTool': PenTool,
                        'Music': Music, 'Plane': Plane
                      };
                      const CategoryIcon = category?.icon_name ? iconMap[category.icon_name] || Users : Users;

                      return (
                        <div
                          key={service.id}
                          className="relative transition-all duration-300 bg-card border hover:border-primary/40"
                          style={{
                            borderRadius: '16px',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                          }}
                        >
                          {/* Compact Header - Always Visible */}
                          <div
                            className="flex flex-col p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setExpandedServiceId(isExpanded ? null : service.id)}
                          >
                            {/* Service Name with Category Icon */}
                            <div 
                              className="text-foreground flex items-center gap-2"
                              style={{
                                fontSize: '13px',
                                fontWeight: '700',
                                marginBottom: '10px',
                                lineHeight: '1.4'
                              }}
                            >
                              {(() => {
                                const category = categories.find(c => c.id === service.category_id);
                                if (category?.icon_name && category?.color_scheme) {
                                  const IconComponent = getCategoryIcon(category.icon_name);
                                  const colors = getCategoryColor(category.color_scheme);
                                  return (
                                    <div className={`${colors.bg} p-2 rounded-md flex-shrink-0`}>
                                      <IconComponent className={`w-5 h-5 ${colors.text}`} />
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              <span
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  flex: 1
                                }}
                              >
                                {service.name}
                              </span>
                            </div>
                            
                            {/* Rating & Reviews with Favorite Button */}
                            {serviceRatings[service.id]?.avg > 0 ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <div style={{
                                    color: '#fbbf24',
                                    fontSize: '12px',
                                    letterSpacing: '0.5px',
                                    lineHeight: 1
                                  }}>
                                    {[1, 2, 3, 4, 5].map((star) => {
                                      const rating = serviceRatings[service.id]?.avg || 0;
                                      const fullStars = Math.floor(rating);
                                      const hasHalfStar = rating % 1 >= 0.5;
                                      if (star <= fullStars) return '★';
                                      if (star === fullStars + 1 && hasHalfStar) return '⯨';
                                      return '☆';
                                    }).join('')}
                                  </div>
                                  <span className="text-foreground" style={{ fontSize: '12px', fontWeight: '600' }}>
                                    {serviceRatings[service.id].avg.toFixed(1)}
                                  </span>
                                  <span className="text-muted-foreground" style={{ fontSize: '10px' }}>
                                    ({serviceRatings[service.id].count})
                                  </span>
                                </div>
                                
                                {/* Favorite Button */}
                                <div onClick={(e) => e.stopPropagation()}>
                                  <FavoriteButton
                                    type="service"
                                    itemId={service.id}
                                    itemData={{
                                      title: service.name,
                                      category: category?.[isRTL ? 'name_ar' : 'name_en'],
                                      rating: serviceRatings[service.id]?.avg
                                    }}
                                    variant="ghost"
                                    size="sm"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', height: '16px' }}>
                                <div className="text-muted-foreground" style={{ fontSize: '10px' }}>
                                  ⭐ {isRTL ? 'لا توجد تقييمات' : 'No reviews'}
                                </div>
                                
                                {/* Favorite Button */}
                                <div onClick={(e) => e.stopPropagation()}>
                                  <FavoriteButton
                                    type="service"
                                    itemId={service.id}
                                    itemData={{
                                      title: service.name,
                                      category: category?.[isRTL ? 'name_ar' : 'name_en'],
                                      rating: serviceRatings[service.id]?.avg
                                    }}
                                    variant="ghost"
                                    size="sm"
                                  />
                                </div>
                              </div>
                            )}
                            
                            {/* Price + Expand Arrow */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {service.type === 'booking' ? (
                                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'hsl(var(--primary))' }}>
                                    {isRTL ? 'حجز موعد' : 'Appointment'}
                                  </div>
                                ) : service.has_discount && service.discount_price ? (
                                  <>
                                    {/* Discounted Price */}
                                    <div style={{ 
                                      fontSize: '18px', 
                                      color: '#dc2626', 
                                      fontWeight: '700',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}>
                                      {service.discount_price} {provider?.currency_code || 'AED'}
                                      {service.discount_percentage && (
                                        <Badge 
                                          variant="destructive" 
                                          className="bg-red-500 text-white text-[10px] px-1.5 py-0.5"
                                        >
                                          -{service.discount_percentage}%
                                        </Badge>
                                      )}
                                    </div>
                                    {/* Original Price - Strikethrough */}
                                    <div style={{ 
                                      fontSize: '14px', 
                                      color: '#6b7280', 
                                      fontWeight: '500',
                                      textDecoration: 'line-through',
                                      textDecorationColor: '#dc2626',
                                      textDecorationThickness: '2px'
                                    }}>
                                      {service.approximate_price} {provider?.currency_code || 'AED'}
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                                    {service.approximate_price} {provider?.currency_code || 'AED'}
                                  </div>
                                )}
                              </div>
                              <ChevronDown
                                className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div 
                              className="border-t px-3 pb-3 pt-2 animate-in slide-in-from-top-2 duration-200"
                            >
                              <div className="space-y-2">
                                {/* Description */}
                                {service.description && (
                                  <p className="text-foreground" style={{ fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                                    {service.description}
                                  </p>
                                )}

                                {/* Provider */}
                                <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                                  <span className="text-primary" style={{ fontWeight: '600' }}>
                                    {isRTL ? 'المزود:' : 'Provider:'}
                                  </span> {provider?.full_name || t.ui.noData}
                                </p>

                                {/* Duration */}
                                {service.duration_minutes && (
                                  <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                                    <span className="text-primary" style={{ fontWeight: '600' }}>
                                      {isRTL ? 'المدة:' : 'Duration:'}
                                    </span> {service.duration_minutes} {isRTL ? 'دقيقة' : 'minutes'}
                                  </p>
                                )}

                                {/* City */}
                                {provider?.city && (
                                  <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                                    <span className="text-primary" style={{ fontWeight: '600' }}>
                                      {isRTL ? 'المدينة:' : 'City:'}
                                    </span> {provider.city}
                                  </p>
                                )}

                                {/* Buttons */}
                                <div className="space-y-2 pt-2">
                                  {service.booking_enabled && (
                                    <Button
                                      className="w-full"
                                      style={{
                                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                        border: 'none'
                                      }}
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
                                    className="w-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.location.href = `/provider/${service.provider_id}`;
                                    }}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    {isRTL ? 'عرض كل الخدمات' : 'View All Services'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State */
              <Card>
                <CardContent className="p-12 text-center">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{isRTL ? 'لا توجد عروض' : 'No Offers Available'}</h3>
                  <p className="text-muted-foreground">{isRTL ? 'لا توجد خدمات بتخفيضات حالياً' : 'No services with discounts available right now.'}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Load More */}
        {(activeView === 'services' || activeView === 'offers') && filteredServices.length > 0 && (
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