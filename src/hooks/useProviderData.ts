import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
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

  // Real-time Services
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    if (!providerId) {
      setServices([]);
      setServicesLoading(false);
      return;
    }

    const q = query(
      collection(db, 'services'),
      where('provider_id', '==', providerId),
      where('is_active', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[];
      setServices(data);
      setServicesLoading(false);
    }, (error) => {
      console.error("Error fetching provider services:", error);
      setServicesLoading(false);
    });

    return () => unsubscribe();
  }, [providerId]);

  // Real-time Offers
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);

  useEffect(() => {
    if (!providerId) {
      setOffers([]);
      setOffersLoading(false);
      return;
    }

    const q = query(
      collection(db, 'offers'),
      where('provider_id', '==', providerId),
      where('is_active', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rawOffers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Offer[];
      
      // Filter valid offers
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const validOffers = rawOffers.filter(offer => {
        const validUntilDate = new Date(offer.valid_until.seconds ? offer.valid_until.toDate() : offer.valid_until);
        return validUntilDate >= today;
      });
      
      setOffers(validOffers);
      setOffersLoading(false);
    }, (error) => {
      console.error("Error fetching provider offers:", error);
      setOffersLoading(false);
    });

    return () => unsubscribe();
  }, [providerId]);

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
    services,
    offers,
    reviews: reviewsQuery.data || [],
    mainCategory: mainCategoryQuery.data,
    isLoading: profileQuery.isLoading || servicesLoading || offersLoading || reviewsQuery.isLoading || mainCategoryQuery.isLoading,
    error: profileQuery.error || reviewsQuery.error || mainCategoryQuery.error,
    refetch: () => {
      profileQuery.refetch();
      // services and offers are real-time, no need to refetch manually
      reviewsQuery.refetch();
      mainCategoryQuery.refetch();
    }
  };
};
