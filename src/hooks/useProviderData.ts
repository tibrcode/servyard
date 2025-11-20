import { useQuery } from '@tanstack/react-query';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { Service, Offer, Review, ProviderProfile } from '@/types/service';

export const useProviderData = (providerId: string | undefined) => {
  const enabled = !!providerId;

  // Fetch Provider Profile
  const profileQuery = useQuery({
    queryKey: ['provider', providerId],
    queryFn: async () => {
      if (!providerId) throw new Error('No provider ID');
      const docRef = doc(db, 'profiles', providerId);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as ProviderProfile;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch Services
  const servicesQuery = useQuery({
    queryKey: ['provider-services', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      const q = query(
        collection(db, 'services'),
        where('provider_id', '==', providerId),
        where('is_active', '==', true)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[];
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch Offers
  const offersQuery = useQuery({
    queryKey: ['provider-offers', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      const q = query(
        collection(db, 'offers'),
        where('provider_id', '==', providerId),
        where('is_active', '==', true)
      );
      const snapshot = await getDocs(q);
      const offers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Offer[];
      
      // Filter valid offers
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return offers.filter(offer => {
        const validUntilDate = new Date(offer.valid_until.seconds ? offer.valid_until.toDate() : offer.valid_until);
        return validUntilDate >= today;
      });
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch Reviews
  const reviewsQuery = useQuery({
    queryKey: ['provider-reviews', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      const q = query(
        collection(db, 'reviews'),
        where('provider_id', '==', providerId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch Main Category
  const mainCategoryQuery = useQuery({
    queryKey: ['provider-main-category', profileQuery.data?.main_category_id],
    queryFn: async () => {
      if (!profileQuery.data?.main_category_id) return null;
      const docRef = doc(db, 'service_categories', profileQuery.data.main_category_id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return snapshot.data();
    },
    enabled: !!profileQuery.data?.main_category_id,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return {
    profile: profileQuery.data,
    services: servicesQuery.data || [],
    offers: offersQuery.data || [],
    reviews: reviewsQuery.data || [],
    mainCategory: mainCategoryQuery.data,
    isLoading: profileQuery.isLoading || servicesQuery.isLoading || offersQuery.isLoading || reviewsQuery.isLoading || mainCategoryQuery.isLoading,
    error: profileQuery.error || servicesQuery.error || offersQuery.error || reviewsQuery.error || mainCategoryQuery.error,
    refetch: () => {
      profileQuery.refetch();
      servicesQuery.refetch();
      offersQuery.refetch();
      reviewsQuery.refetch();
      mainCategoryQuery.refetch();
    }
  };
};
