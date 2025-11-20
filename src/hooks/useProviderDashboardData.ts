import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { Service, Offer, ProviderProfile, Review } from '@/types/service';

export interface ProviderDashboardData {
  profile: ProviderProfile | null;
  services: Service[];
  offers: Offer[];
  reviews: Review[];
  confirmedBookingsCount: number;
  pendingBookingsCount: number;
  isLoading: boolean;
}

export const useProviderDashboardData = (userId: string | undefined) => {
  const [confirmedBookingsCount, setConfirmedBookingsCount] = useState(0);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);

  const enabled = !!userId;

  // 1. Fetch Profile
  const profileQuery = useQuery({
    queryKey: ['providerProfile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const docRef = doc(db, 'profiles', userId);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      
      const data = { id: snapshot.id, ...snapshot.data() } as ProviderProfile;
      if (data.user_type !== 'provider') return null;
      return data;
    },
    enabled,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // 2. Fetch Services
  const servicesQuery = useQuery({
    queryKey: ['providerServices', userId],
    queryFn: async () => {
      if (!userId) return [];
      const q = query(collection(db, 'services'), where('provider_id', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Service));
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 3. Fetch Offers
  const offersQuery = useQuery({
    queryKey: ['providerOffers', userId],
    queryFn: async () => {
      if (!userId) return [];
      const q = query(collection(db, 'offers'), where('provider_id', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Offer));
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 4. Fetch Reviews
  const reviewsQuery = useQuery({
    queryKey: ['providerReviews', userId],
    queryFn: async () => {
      if (!userId) return [];
      const q = query(collection(db, 'reviews'), where('provider_id', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Review));
    },
    enabled,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // 5. Real-time Bookings Listener
  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, 'bookings'), where('provider_id', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => doc.data());
      
      const confirmed = bookingsData.filter((b: any) => b.status === 'confirmed').length;
      const pending = bookingsData.filter((b: any) => b.status === 'pending').length;

      setConfirmedBookingsCount(confirmed);
      setPendingBookingsCount(pending);
    });

    return () => unsubscribe();
  }, [userId]);

  return {
    profile: profileQuery.data || null,
    services: servicesQuery.data || [],
    offers: offersQuery.data || [],
    reviews: reviewsQuery.data || [],
    confirmedBookingsCount,
    pendingBookingsCount,
    isLoading: profileQuery.isLoading || servicesQuery.isLoading
  };
};
