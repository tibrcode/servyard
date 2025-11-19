// Favorites Page - Customer's favorite services and providers
// صفحة المفضلة - الخدمات ومزودي الخدمة المفضلين للعميل

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MapPin, Star, Trash2, ArrowRight, Package, Users, Clock, AlertCircle, ExternalLink, ChevronDown, Calendar } from 'lucide-react';
import { getUserFavoritesByType, removeFavorite } from '@/lib/firebase/favoriteFunctions';
import { Favorite } from '@/types/favorites';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { BookingModal } from '@/components/booking/BookingModal';
import { useTranslation } from '@/lib/i18n';
import { getCategoryIcon, getCategoryColor } from '@/lib/categoryIcons';

interface ServiceData {
  id: string;
  name: string;
  description?: string;
  approximate_price?: string;
  duration_minutes?: number;
  price_range?: string;
  is_active: boolean;
  provider_id: string;
  category_id?: string;
  booking_enabled?: boolean;
}

interface ProviderData {
  id: string;
  full_name: string;
  city?: string;
  country?: string;
  profile_description?: string;
  avatar_url?: string;
  rating?: number;
  total_reviews?: number;
  currency_code?: string;
}

interface ServiceRating {
  avg: number;
  count: number;
}

export default function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, isRTL } = useTranslation();
  
  const [activeTab, setActiveTab] = useState<'services' | 'providers'>('services');
  const [serviceFavorites, setServiceFavorites] = useState<Favorite[]>([]);
  const [providerFavorites, setProviderFavorites] = useState<Favorite[]>([]);
  const [serviceDetails, setServiceDetails] = useState<{ [key: string]: ServiceData | null }>({});
  const [providerDetails, setProviderDetails] = useState<{ [key: string]: ProviderData | null }>({});
  const [serviceRatings, setServiceRatings] = useState<{ [key: string]: ServiceRating }>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<(ServiceData & { provider_id: string }) | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderData | null>(null);

  useEffect(() => {
    if (user?.uid) {
      loadFavorites();
    }
  }, [user?.uid]);

  const loadFavorites = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      // Load categories first
      const categoriesQuery = query(
        collection(db, 'service_categories'),
        where('is_active', '==', true)
      );
      const categoriesSnapshot = await getDocs(categoriesQuery);
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);

      const [services, providers] = await Promise.all([
        getUserFavoritesByType(user.uid, 'service'),
        getUserFavoritesByType(user.uid, 'provider'),
      ]);

      setServiceFavorites(services);
      setProviderFavorites(providers);

      // Load service details
      const serviceDetailsMap: { [key: string]: ServiceData | null } = {};
      const serviceRatingsMap: { [key: string]: ServiceRating } = {};
      
      for (const fav of services) {
        try {
          const serviceDoc = await getDoc(doc(db, 'services', fav.item_id));
          if (serviceDoc.exists()) {
            serviceDetailsMap[fav.item_id] = { id: serviceDoc.id, ...serviceDoc.data() } as ServiceData;
            
            // Load ratings
            const reviewsQuery = query(
              collection(db, 'reviews'),
              where('service_id', '==', fav.item_id)
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);
            const reviews = reviewsSnapshot.docs.map(d => d.data());
            const avgRating = reviews.length > 0
              ? reviews.reduce((sum, r: any) => sum + (r.rating || 0), 0) / reviews.length
              : 0;
            serviceRatingsMap[fav.item_id] = {
              avg: avgRating,
              count: reviews.length
            };
          } else {
            serviceDetailsMap[fav.item_id] = null;
          }
        } catch (error) {
          console.error(`Error loading service ${fav.item_id}:`, error);
          serviceDetailsMap[fav.item_id] = null;
        }
      }
      setServiceDetails(serviceDetailsMap);
      setServiceRatings(serviceRatingsMap);

      // Load provider details
      const providerDetailsMap: { [key: string]: ProviderData | null } = {};
      for (const fav of providers) {
        try {
          const providerDoc = await getDoc(doc(db, 'profiles', fav.item_id));
          providerDetailsMap[fav.item_id] = providerDoc.exists() 
            ? { id: providerDoc.id, ...providerDoc.data() } as ProviderData
            : null;
        } catch (error) {
          console.error(`Error loading provider ${fav.item_id}:`, error);
          providerDetailsMap[fav.item_id] = null;
        }
      }
      setProviderDetails(providerDetailsMap);
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast({
        variant: 'destructive',
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حدث خطأ أثناء تحميل المفضلة' : 'Error loading favorites',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!user?.uid) return;

    setRemovingId(itemId);
    try {
      await removeFavorite(user.uid, itemId);

      toast({
        title: isRTL ? 'تمت الإزالة' : 'Removed',
        description: isRTL ? 'تم إزالة العنصر من المفضلة' : 'Item removed from favorites',
      });

      await loadFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        variant: 'destructive',
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حدث خطأ أثناء الإزالة' : 'Error removing favorite',
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handleBookingClick = (service: ServiceData) => {
    setSelectedService({ ...service, provider_id: service.provider_id });
    const provider = providerDetails[service.provider_id];
    if (provider) {
      setSelectedProvider(provider);
      setBookingModalOpen(true);
    } else {
      toast({
        variant: 'destructive',
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'لم يتم العثور على المزود' : 'Provider not found',
      });
    }
  };

  const handleViewProvider = (providerId: string) => {
    navigate(`/provider/${providerId}`);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">
          {isRTL ? 'يرجى تسجيل الدخول لعرض المفضلة' : 'Please log in to view favorites'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 fill-red-500" />
            {isRTL ? 'المفضلة' : 'Favorites'}
          </h1>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {isRTL ? 'الخدمات' : 'Services'} ({serviceFavorites.length})
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {isRTL ? 'مزودو الخدمة' : 'Providers'} ({providerFavorites.length})
            </TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-40 bg-muted rounded-md mb-3"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : serviceFavorites.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {isRTL ? 'لا توجد خدمات مفضلة' : 'No favorite services'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {isRTL ? 'ابدأ بإضافة خدماتك المفضلة' : 'Start adding your favorite services'}
                </p>
                <Button onClick={() => navigate('/services')}>
                  {isRTL ? 'تصفح الخدمات' : 'Browse Services'}
                  <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceFavorites.map((favorite) => {
                const service = serviceDetails[favorite.item_id];
                const isDeleted = service === null;
                const isExpanded = expandedServiceId === favorite.item_id;
                const categoryIcon = getCategoryIcon(favorite.item_category);
                const categoryColor = getCategoryColor(favorite.item_category);
                const rating = serviceRatings[favorite.item_id] || { avg: 0, count: 0 };
                const isTopService = rating.avg >= 4.5;

                if (isDeleted) {
                  return (
                    <Card key={favorite.favorite_id} className="border-dashed border-red-300 bg-red-50 dark:bg-red-950/20">
                      <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
                        <h3 className="font-semibold mb-2 text-red-700 dark:text-red-300">
                          {isRTL ? 'الخدمة غير متوفرة' : 'Service Unavailable'}
                        </h3>
                        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                          {isRTL ? 'تم حذف هذه الخدمة من قبل المزود' : 'This service was deleted by the provider'}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemove(favorite.item_id)}
                          disabled={removingId === favorite.item_id}
                          className="text-red-600"
                        >
                          {removingId === favorite.item_id ? (
                            <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          {isRTL ? 'إزالة من المفضلة' : 'Remove from Favorites'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                }

                if (!service) return null;

                return (
                  <Card 
                    key={favorite.favorite_id} 
                    className="overflow-hidden border hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                  >
                    <CardContent className="p-0 flex flex-col h-full">
                      {/* Card Header */}
                      <div 
                        className="p-4 flex items-start justify-between gap-3"
                        onClick={() => setExpandedServiceId(isExpanded ? null : favorite.item_id)}
                      >
                        <div className="flex-1 min-w-0">
                          {/* Service Name */}
                          <h3 className="font-semibold text-base line-clamp-2 mb-2">
                            {service.name}
                          </h3>

                          {/* Compact Info Row */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            {/* Category Icon */}
                            <div className={`p-1 rounded-md ${categoryColor} flex-shrink-0`}>
                              {categoryIcon}
                            </div>

                            {/* Rating */}
                            {rating.count > 0 && (
                              <>
                                <span className="text-yellow-500">★</span>
                                <span className="font-medium">{rating.avg.toFixed(1)}</span>
                                <span className="text-xs">({rating.count})</span>
                              </>
                            )}

                            {/* TOP Badge */}
                            {isTopService && (
                              <Badge className="ml-auto bg-amber-500 text-white text-xs">
                                {isRTL ? 'الأفضل' : 'TOP'}
                              </Badge>
                            )}
                          </div>

                          {/* Price */}
                          {(service.approximate_price || service.price_range) && (
                            <div className="text-base font-bold text-primary">
                              {service.approximate_price || service.price_range}
                            </div>
                          )}
                        </div>

                        {/* Right Side: Favorite Button + Expand Arrow */}
                        <div className="flex items-start gap-2 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(favorite.item_id);
                            }}
                            disabled={removingId === favorite.item_id}
                          >
                            {removingId === favorite.item_id ? (
                              <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                            )}
                          </Button>

                          <ChevronDown 
                            className={`h-5 w-5 text-muted-foreground transition-transform duration-300 mt-0.5 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t pt-4 pb-4 px-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          {/* Description */}
                          {service.description && (
                            <p className="text-sm text-muted-foreground">
                              {service.description}
                            </p>
                          )}

                          {/* Metadata Row */}
                          <div className="space-y-2">
                            {/* Provider */}
                            {service.provider_id && providerDetails[service.provider_id] && (
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span>{providerDetails[service.provider_id]?.full_name}</span>
                              </div>
                            )}

                            {/* Duration */}
                            {service.duration_minutes && (
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span>{service.duration_minutes} {isRTL ? 'دقيقة' : 'min'}</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2 pt-2">
                            <Button
                              className="w-full"
                              onClick={() => handleBookingClick(service)}
                              disabled={!service.is_active}
                            >
                              {isRTL ? 'احجز الآن' : 'Book Now'}
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => handleViewProvider(service.provider_id)}
                            >
                              {isRTL ? 'عرض المزود' : 'View Provider'}
                              <ExternalLink className={`h-4 w-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 text-center">
                    <div className="h-20 w-20 bg-muted rounded-full mx-auto mb-3"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mx-auto"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : providerFavorites.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {isRTL ? 'لا يوجد مزودو خدمة مفضلين' : 'No favorite providers'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {isRTL ? 'ابدأ بإضافة مزودي خدمة مفضلين' : 'Start adding your favorite providers'}
                </p>
                <Button onClick={() => navigate('/services')}>
                  {isRTL ? 'تصفح الخدمات' : 'Browse Services'}
                  <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providerFavorites.map((favorite) => {
                const provider = providerDetails[favorite.item_id];
                const isDeleted = provider === null;

                if (isDeleted) {
                  return (
                    <Card key={favorite.favorite_id} className="border-dashed border-red-300 bg-red-50 dark:bg-red-950/20">
                      <CardContent className="p-6 flex flex-col items-center justify-center min-h-[250px] text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
                        <h3 className="font-semibold mb-2 text-red-700 dark:text-red-300">
                          {isRTL ? 'المزود غير متاح' : 'Provider Unavailable'}
                        </h3>
                        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                          {isRTL ? 'تم حذف حساب هذا المزود' : 'This provider account was deleted'}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemove(favorite.item_id)}
                          disabled={removingId === favorite.item_id}
                          className="text-red-600"
                        >
                          {removingId === favorite.item_id ? (
                            <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          {isRTL ? 'إزالة من المفضلة' : 'Remove from Favorites'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                }

                if (!provider) return null;

                return (
                  <Card key={favorite.favorite_id} className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      {/* Remove Button */}
                      <div className="flex justify-end mb-4">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleRemove(favorite.item_id)}
                          disabled={removingId === favorite.item_id}
                        >
                          {removingId === favorite.item_id ? (
                            <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                          )}
                        </Button>
                      </div>

                      {/* Avatar */}
                      <div className="text-center mb-4">
                        {favorite.item_image ? (
                          <img
                            src={favorite.item_image}
                            alt={favorite.item_title}
                            className="h-24 w-24 rounded-full object-cover mx-auto"
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-muted mx-auto flex items-center justify-center">
                            <Users className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <h3 className="font-semibold text-center mb-2 line-clamp-2">
                        {favorite.item_title || provider.full_name}
                      </h3>

                      {/* Location */}
                      {favorite.item_location && (
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-3">
                          <MapPin className="h-4 w-4" />
                          <span>{favorite.item_location}</span>
                        </div>
                      )}

                      {/* Rating */}
                      {favorite.item_rating && (
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{favorite.item_rating.toFixed(1)}</span>
                        </div>
                      )}

                      {/* View Button */}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleViewProvider(favorite.item_id)}
                      >
                        {isRTL ? 'عرض الملف الشخصي' : 'View Profile'}
                        <ExternalLink className={`h-4 w-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Modal */}
      {selectedService && selectedProvider && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => {
            setBookingModalOpen(false);
            setSelectedService(null);
            setSelectedProvider(null);
          }}
          service={selectedService}
          provider={selectedProvider}
          currentLanguage="en"
        />
      )}
      </main>
    </div>
  );
}
