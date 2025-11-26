// Favorites Page - Customer's favorite services and providers
// صفحة المفضلة - الخدمات ومزودي الخدمة المفضلين للعميل

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MapPin, Star, Trash2, ArrowRight, Package, Users, AlertCircle, ExternalLink, ChevronDown, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BookingModal } from '@/components/booking/BookingModal';
import { useTranslation } from '@/lib/i18n';
import { getCategoryIcon, getCategoryColor } from '@/lib/categoryIcons';
import { Service, ProviderProfile } from '@/types/service';
import { useFavoritesData } from '@/hooks/useFavoritesData';

interface FavoritesProps {
  currentLanguage?: string;
}

export default function Favorites({ currentLanguage = 'en' }: FavoritesProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, isRTL } = useTranslation(currentLanguage);
  
  const { 
    serviceFavorites, 
    providerFavorites, 
    isLoading: loading, 
    removeFavorite 
  } = useFavoritesData();

  const [activeTab, setActiveTab] = useState<'services' | 'providers'>('services');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<(Service & { provider_id: string }) | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);

  const handleRemove = async (itemId: string) => {
    if (!user?.uid) return;

    setRemovingId(itemId);
    try {
      await removeFavorite(itemId);

      toast({
        title: t.favorites.removed,
        description: t.favorites.removedDesc,
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        variant: 'destructive',
        title: t.toast.error,
        description: t.favorites.removeError,
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handleBookingClick = (service: Service, provider?: ProviderProfile) => {
    setSelectedService({ ...service, provider_id: service.provider_id });
    if (provider) {
      setSelectedProvider(provider);
      setBookingModalOpen(true);
    } else {
      toast({
        variant: 'destructive',
        title: t.toast.error,
        description: t.favorites.providerNotFound,
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
          {t.favorites.loginRequired}
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
            {t.favorites.title}
          </h1>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {t.favorites.services} ({serviceFavorites.length})
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t.favorites.providers} ({providerFavorites.length})
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
                  {t.favorites.noFavoriteServices}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t.favorites.startAddingServices}
                </p>
                <Button onClick={() => navigate('/services')}>
                  {t.favorites.browseServices}
                  <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceFavorites.map((favorite) => {
                const service = favorite.details;
                const hasFetchError = (favorite as { fetchError?: boolean }).fetchError;
                const isDeleted = !service && !hasFetchError;
                const isExpanded = expandedServiceId === favorite.item_id;
                const CategoryIcon = getCategoryIcon(favorite.item_category);
                const categoryColor = getCategoryColor(favorite.item_category);
                const rating = favorite.rating || { avg: 0, count: 0 };
                const isTopService = rating.avg >= 4.5;

                // Skip if there was a fetch error (likely permission issue, not actually deleted)
                if (hasFetchError) {
                  return null;
                }

                if (isDeleted) {
                  return (
                    <Card key={favorite.favorite_id} className="border-dashed border-red-300 bg-red-50 dark:bg-red-950/20">
                      <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
                        <h3 className="font-semibold mb-2 text-red-700 dark:text-red-300">
                          {t.favorites.serviceUnavailable}
                        </h3>
                        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                          {t.favorites.serviceDeleted}
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
                          {t.favorites.removeFromFavorites}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                }

                // We know service is defined here because of the check above
                // But TypeScript might need help if we don't assert or check again
                if (!service) return null;

                // We don't have provider details directly attached to service in the hook yet
                // Wait, the hook fetches service details, but does it fetch the provider of that service?
                // The hook logic:
                // const serviceDoc = await getDoc(doc(db, 'services', fav.item_id));
                // It does NOT fetch the provider of the service.
                // But wait, the original code did:
                // const provider = service.provider_id ? providerDetails[service.provider_id] : null;
                // And providerDetails were fetched separately.
                
                // My hook implementation for serviceFavorites only fetches the service doc and ratings.
                // It does NOT fetch the provider profile for that service.
                if (!service) return null;

                const provider = favorite.provider;

                return (
                  <Card 
                    key={favorite.favorite_id} 
                    className="overflow-hidden border hover:border-primary/40 transition-all duration-300 hover:shadow-lg relative"
                  >
                    {/* TOP Badge - Top Right Corner */}
                    {isTopService && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: isRTL ? 'auto' : '8px',
                          left: isRTL ? '8px' : 'auto',
                          zIndex: 10
                        }}
                      >
                        <Badge className="bg-amber-500 text-white text-xs px-2 py-0.5">
                          {t.favorites.top}
                        </Badge>
                      </div>
                    )}
                    
                    <CardContent className="p-0 flex flex-col h-full">
                      {/* Compact Header - Always Visible */}
                      <div
                        className="flex flex-col p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setExpandedServiceId(isExpanded ? null : favorite.item_id)}
                      >
                        {/* Service Name with Category Icon */}
                        <div 
                          className="text-foreground flex items-center gap-2"
                          style={{
                            fontSize: '13px',
                            fontWeight: '700',
                            marginBottom: '10px',
                            lineHeight: '1.4',
                            paddingRight: isTopService ? '50px' : '0'
                          }}
                        >
                          <div className={`${categoryColor.bg} p-2 rounded-md flex-shrink-0`}>
                            <CategoryIcon className={`w-5 h-5 ${categoryColor.text}`} />
                          </div>
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {service.name}
                          </span>
                        </div>
                        
                        {/* Rating & Reviews with Favorite Button */}
                        {rating.avg > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{
                                color: '#fbbf24',
                                fontSize: '12px',
                                letterSpacing: '0.5px',
                                lineHeight: 1
                              }}>
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const fullStars = Math.floor(rating.avg);
                                  const hasHalfStar = rating.avg % 1 >= 0.5;
                                  if (star <= fullStars) return '★';
                                  if (star === fullStars + 1 && hasHalfStar) return '⯨';
                                  return '☆';
                                }).join('')}
                              </div>
                              <span className="text-foreground" style={{ fontSize: '12px', fontWeight: '600' }}>
                                {rating.avg.toFixed(1)}
                              </span>
                              <span className="text-muted-foreground" style={{ fontSize: '10px' }}>
                                ({rating.count})
                              </span>
                            </div>
                            
                            {/* Favorite Button - Remove Action */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 hover:bg-red-200 dark:hover:bg-red-900/40 flex-shrink-0 bg-red-100 dark:bg-red-900/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(favorite.item_id);
                              }}
                              disabled={removingId === favorite.item_id}
                              title={t.favorites.removeFromFavorites}
                            >
                              {removingId === favorite.item_id ? (
                                <div className="h-4 w-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', height: '16px' }}>
                            <div className="text-muted-foreground" style={{ fontSize: '10px' }}>
                              ⭐ {t.favorites.noReviews}
                            </div>
                            
                            {/* Favorite Button - Remove Action */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 hover:bg-red-200 dark:hover:bg-red-900/40 flex-shrink-0 bg-red-100 dark:bg-red-900/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(favorite.item_id);
                              }}
                              disabled={removingId === favorite.item_id}
                              title={t.favorites.removeFromFavorites}
                            >
                              {removingId === favorite.item_id ? (
                                <div className="h-4 w-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                          </div>
                        )}
                        
                        {/* Price + Expand Arrow */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ fontSize: '18px', color: '#f59e0b', fontWeight: '700' }}>
                            {service.approximate_price 
                              ? `${service.approximate_price} ${provider?.currency_code || 'AED'}`
                              : service.price_range || t.favorites.priceOnRequest
                            }
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

                            {/* Specialty Description */}
                            {service.specialty_description && (
                              <div className="mt-2 pt-2 border-t border-dashed">
                                <p className="text-xs font-semibold text-primary mb-1">
                                  {t.addService.specialtyDescription}
                                </p>
                                <p className="text-foreground text-sm">
                                  {service.specialty_description}
                                </p>
                              </div>
                            )}

                            {/* Provider */}
                            {provider?.full_name && (
                              <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                                <span className="text-primary" style={{ fontWeight: '600' }}>
                                  {t.favorites.provider}
                                </span> {provider.full_name}
                              </p>
                            )}

                            {/* Duration */}
                            {service.duration_minutes && (
                              <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                                <span className="text-primary" style={{ fontWeight: '600' }}>
                                  {t.favorites.duration}
                                </span> {service.duration_minutes} {t.favorites.minutes}
                              </p>
                            )}

                            {/* City */}
                            {provider?.city && (
                              <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                                <span className="text-primary" style={{ fontWeight: '600' }}>
                                  {t.favorites.city}
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
                                    handleBookingClick(service, provider);
                                  }}
                                >
                                  <Calendar className="h-4 w-4 mr-2" />
                                  {t.favorites.bookAppointment}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewProvider(service.provider_id);
                                }}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                {t.favorites.viewProvider}
                              </Button>
                            </div>
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
                  {t.favorites.noFavoriteProviders}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t.favorites.startAddingProviders}
                </p>
                <Button onClick={() => navigate('/services')}>
                  {t.favorites.browseServices}
                  <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providerFavorites.map((favorite) => {
                const provider = favorite.details;
                const isDeleted = !provider;

                if (isDeleted) {
                  return (
                    <Card key={favorite.favorite_id} className="border-dashed border-red-300 bg-red-50 dark:bg-red-950/20">
                      <CardContent className="p-6 flex flex-col items-center justify-center min-h-[250px] text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
                        <h3 className="font-semibold mb-2 text-red-700 dark:text-red-300">
                          {t.favorites.providerUnavailable}
                        </h3>
                        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                          {t.favorites.providerDeleted}
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
                          {t.favorites.removeFromFavorites}
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
                            <Trash2 className="h-4 w-4 text-red-600" />
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
                        {t.favorites.viewProfile}
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
          currentLanguage={currentLanguage}
        />
      )}
      </main>
    </div>
  );
}
