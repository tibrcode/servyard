import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getUserFavoritesByType, removeFavorite as removeFavoriteApi } from '@/lib/firebase/favoriteFunctions';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { Service, ProviderProfile } from '@/types/service';
import { Favorite } from '@/types/favorites';
import { useServiceCategories } from './useServiceCategories';

export interface EnrichedServiceFavorite extends Favorite {
  details?: Service;
  provider?: ProviderProfile;
  rating?: { avg: number; count: number };
}

export interface EnrichedProviderFavorite extends Favorite {
  details?: ProviderProfile;
}

export function useFavoritesData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

    // Fetch Categories
  const { data: categories = [] } = useServiceCategories();

  // Fetch Service Favorites
  const { data: serviceFavorites = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['favorites', 'services', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const favs = await getUserFavoritesByType(user.uid, 'service');
      
      const enriched = await Promise.all(favs.map(async (fav) => {
        try {
          const serviceDoc = await getDoc(doc(db, 'services', fav.item_id));
          let details: Service | undefined;
          let provider: ProviderProfile | undefined;
          let rating = { avg: 0, count: 0 };

          if (serviceDoc.exists()) {
            details = { id: serviceDoc.id, ...serviceDoc.data() } as Service;
            
            // Fetch provider details
            if (details.provider_id) {
              const providerDoc = await getDoc(doc(db, 'provider_profiles', details.provider_id));
              // Fallback to 'profiles' collection if not found in 'provider_profiles' (legacy support)
              if (providerDoc.exists()) {
                provider = { id: providerDoc.id, ...providerDoc.data() } as ProviderProfile;
              } else {
                 const profileDoc = await getDoc(doc(db, 'profiles', details.provider_id));
                 if (profileDoc.exists()) {
                    provider = { id: profileDoc.id, ...profileDoc.data() } as ProviderProfile;
                 }
              }
            }

            // Fetch ratings
            const reviewsQuery = query(
              collection(db, 'reviews'),
              where('service_id', '==', fav.item_id)
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);
            if (!reviewsSnapshot.empty) {
              const total = reviewsSnapshot.docs.reduce((acc, doc) => acc + (doc.data().rating || 0), 0);
              rating = {
                avg: total / reviewsSnapshot.size,
                count: reviewsSnapshot.size
              };
            }
          }
          
          return { ...fav, details, provider, rating } as EnrichedServiceFavorite;
        } catch (error) {
          console.error(`Error fetching details for service ${fav.item_id}:`, error);
          return fav as EnrichedServiceFavorite;
        }
      }));
      
      return enriched;
    },
    enabled: !!user?.uid
  });

  // Fetch Provider Favorites
  const { data: providerFavorites = [], isLoading: providersLoading } = useQuery({
    queryKey: ['favorites', 'providers', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const favs = await getUserFavoritesByType(user.uid, 'provider');
      
      const enriched = await Promise.all(favs.map(async (fav) => {
        try {
          let details: ProviderProfile | undefined;
          
          // Try provider_profiles first
          const providerDoc = await getDoc(doc(db, 'provider_profiles', fav.item_id));
          if (providerDoc.exists()) {
            details = { id: providerDoc.id, ...providerDoc.data() } as ProviderProfile;
          } else {
            // Fallback to profiles collection (legacy support)
            const profileDoc = await getDoc(doc(db, 'profiles', fav.item_id));
            if (profileDoc.exists()) {
              details = { id: profileDoc.id, ...profileDoc.data() } as ProviderProfile;
            }
          }
          
          return { ...fav, details } as EnrichedProviderFavorite;
        } catch (error) {
          console.error(`Error fetching details for provider ${fav.item_id}:`, error);
          return fav as EnrichedProviderFavorite;
        }
      }));
      
      return enriched;
    },
    enabled: !!user?.uid
  });

  // Remove Favorite Mutation
  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user?.uid) throw new Error('User not authenticated');
      await removeFavoriteApi(user.uid, itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });

  return {
    categories,
    serviceFavorites,
    providerFavorites,
    isLoading: servicesLoading || providersLoading,
    removeFavorite: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending
  };
}
