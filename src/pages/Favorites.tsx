// Favorites Page - Customer's favorite services and providers
// صفحة المفضلة - الخدمات ومزودي الخدمة المفضلين للعميل

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MapPin, Star, Trash2, ArrowRight, Package, Users } from 'lucide-react';
import { getUserFavoritesByType, removeFavorite } from '@/lib/firebase/favoriteFunctions';
import { Favorite } from '@/types/favorites';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';

export default function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'services' | 'providers'>('services');
  const [serviceFavorites, setServiceFavorites] = useState<Favorite[]>([]);
  const [providerFavorites, setProviderFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isRTL = true; // You can get this from context

  const t = {
    favorites: isRTL ? 'المفضلة' : 'Favorites',
    services: isRTL ? 'الخدمات' : 'Services',
    providers: isRTL ? 'مزودو الخدمة' : 'Providers',
    noFavoriteServices: isRTL ? 'لا توجد خدمات مفضلة' : 'No favorite services',
    noFavoriteProviders: isRTL ? 'لا يوجد مزودو خدمة مفضلين' : 'No favorite providers',
    addFavoriteServices: isRTL ? 'ابدأ بإضافة خدماتك المفضلة' : 'Start adding your favorite services',
    addFavoriteProviders: isRTL ? 'ابدأ بإضافة مزودي خدمة مفضلين' : 'Start adding your favorite providers',
    browseServices: isRTL ? 'تصفح الخدمات' : 'Browse Services',
    viewDetails: isRTL ? 'عرض التفاصيل' : 'View Details',
    remove: isRTL ? 'إزالة' : 'Remove',
    removing: isRTL ? 'جاري الإزالة...' : 'Removing...',
    removed: isRTL ? 'تمت الإزالة' : 'Removed',
    removedDesc: isRTL ? 'تم إزالة العنصر من المفضلة' : 'Item removed from favorites',
  };

  useEffect(() => {
    if (user?.uid) {
      loadFavorites();
    }
  }, [user?.uid]);

  const loadFavorites = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const [services, providers] = await Promise.all([
        getUserFavoritesByType(user.uid, 'service'),
        getUserFavoritesByType(user.uid, 'provider'),
      ]);

      setServiceFavorites(services);
      setProviderFavorites(providers);
    } catch (error) {
      console.error('Error loading favorites:', error);
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
        title: t.removed,
        description: t.removedDesc,
      });

      // Reload favorites
      await loadFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
    } finally {
      setRemovingId(null);
    }
  };

  const handleViewDetails = (type: 'service' | 'provider', itemId: string) => {
    if (type === 'service') {
      navigate(`/services?service=${itemId}`);
    } else {
      navigate(`/provider/${itemId}`);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">يرجى تسجيل الدخول لعرض المفضلة</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 fill-red-500" />
          {t.favorites}
        </h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} dir={isRTL ? 'rtl' : 'ltr'}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {t.services} ({serviceFavorites.length})
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t.providers} ({providerFavorites.length})
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <h3 className="text-lg font-semibold mb-2">{t.noFavoriteServices}</h3>
                <p className="text-muted-foreground mb-4">{t.addFavoriteServices}</p>
                <Button onClick={() => navigate('/services')}>
                  {t.browseServices}
                  <ArrowRight className="h-4 w-4 mr-2" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceFavorites.map((favorite) => (
                <Card key={favorite.favorite_id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    {/* Image */}
                    {favorite.item_image && (
                      <div className="relative h-40 overflow-hidden rounded-t-lg">
                        <img
                          src={favorite.item_image}
                          alt={favorite.item_title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleRemove(favorite.item_id)}
                            disabled={removingId === favorite.item_id}
                          >
                            {removingId === favorite.item_id ? (
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-2">
                        {favorite.item_title || 'خدمة'}
                      </h3>
                      {favorite.item_category && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {favorite.item_category}
                        </p>
                      )}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleViewDetails('service', favorite.item_id)}
                      >
                        {t.viewDetails}
                        <ArrowRight className="h-4 w-4 mr-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
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
                <h3 className="text-lg font-semibold mb-2">{t.noFavoriteProviders}</h3>
                <p className="text-muted-foreground mb-4">{t.addFavoriteProviders}</p>
                <Button onClick={() => navigate('/services')}>
                  {t.browseServices}
                  <ArrowRight className="h-4 w-4 mr-2" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {providerFavorites.map((favorite) => (
                <Card key={favorite.favorite_id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    {/* Avatar */}
                    <div className="relative inline-block mb-4">
                      {favorite.item_image ? (
                        <img
                          src={favorite.item_image}
                          alt={favorite.item_title}
                          className="h-20 w-20 rounded-full object-cover mx-auto"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                          <Users className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 rounded-full absolute -top-1 -right-1"
                        onClick={() => handleRemove(favorite.item_id)}
                        disabled={removingId === favorite.item_id}
                      >
                        {removingId === favorite.item_id ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Name */}
                    <h3 className="font-semibold mb-2">{favorite.item_title || 'مزود خدمة'}</h3>

                    {/* Rating */}
                    {favorite.item_rating && (
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{favorite.item_rating.toFixed(1)}</span>
                      </div>
                    )}

                    {/* Location */}
                    {favorite.item_location && (
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-4">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{favorite.item_location}</span>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleViewDetails('provider', favorite.item_id)}
                    >
                      {t.viewDetails}
                      <ArrowRight className="h-4 w-4 mr-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
