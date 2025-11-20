import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { Service, ProviderProfile, Review } from '@/types/service';

export interface CustomerDashboardData {
  profile: ProviderProfile | null;
  reviews: Review[];
  services: Record<string, Service>;
  providers: Record<string, ProviderProfile>;
  favoritesCount: number;
  upcomingBookingsCount: number;
  completedBookingsCount: number;
  isLoading: boolean;
}

export const useCustomerDashboardData = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const [upcomingBookingsCount, setUpcomingBookingsCount] = useState(0);
  const [completedBookingsCount, setCompletedBookingsCount] = useState(0);
  const [realtimeReviews, setRealtimeReviews] = useState<Review[]>([]);

  const enabled = !!userId;

  // 1. Fetch Profile
  const profileQuery = useQuery({
    queryKey: ['customerProfile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const docRef = doc(db, 'profiles', userId);
      const snapshot = await getDoc(docRef);
      return { id: snapshot.id, ...snapshot.data() } as ProviderProfile;
    },
    enabled,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // 2. Real-time Reviews Listener
  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, 'reviews'), where('customer_id', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      
      // Sort by date descending
      reviewsData.sort((a, b) => {
        const aDate = a.created_at?.toDate?.() || new Date(a.created_at || 0);
        const bDate = b.created_at?.toDate?.() || new Date(b.created_at || 0);
        return bDate.getTime() - aDate.getTime();
      });
      
      setRealtimeReviews(reviewsData);
    });

    return () => unsubscribe();
  }, [userId]);

  // 3. Fetch Related Services & Providers (Dependent on Reviews)
  const serviceIds = [...new Set(realtimeReviews.map(r => r.service_id).filter(Boolean))] as string[];
  const providerIds = [...new Set(realtimeReviews.map(r => r.provider_id).filter(Boolean))] as string[];

  const relatedDataQuery = useQuery({
    queryKey: ['customerRelatedData', serviceIds, providerIds],
    queryFn: async () => {
      const servicesMap: Record<string, Service> = {};
      const providersMap: Record<string, ProviderProfile> = {};

      // Fetch Services
      await Promise.all(
        serviceIds.map(async (id) => {
          try {
            const d = await getDoc(doc(db, 'services', id));
            if (d.exists()) servicesMap[id] = { id: d.id, ...d.data() } as Service;
          } catch (e) { console.error(e); }
        })
      );

      // Fetch Providers
      await Promise.all(
        providerIds.map(async (id) => {
          try {
            const d = await getDoc(doc(db, 'profiles', id));
            if (d.exists()) providersMap[id] = { id: d.id, ...d.data() } as ProviderProfile;
          } catch (e) { console.error(e); }
        })
      );

      return { services: servicesMap, providers: providersMap };
    },
    enabled: serviceIds.length > 0 || providerIds.length > 0,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // 4. Fetch Favorites Count
  const favoritesQuery = useQuery({
    queryKey: ['customerFavoritesCount', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const q = query(collection(db, 'favorites'), where('user_id', '==', userId));
      const snap = await getDocs(q);
      return snap.size;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 5. Real-time Bookings Listener
  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, 'bookings'), where('customer_id', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => doc.data());
      const now = new Date();

      const upcoming = bookingsData.filter((booking: any) => {
        if (booking.status !== 'confirmed' && booking.status !== 'pending') return false;
        // Parse date/time safely
        try {
          const [year, month, day] = booking.booking_date.split('-').map(Number);
          const [hour, minute] = booking.start_time.split(':').map(Number);
          const bookingDate = new Date(year, month - 1, day, hour, minute);
          return bookingDate > now;
        } catch { return false; }
      }).length;

      const completed = bookingsData.filter((b: any) => b.status === 'completed').length;

      setUpcomingBookingsCount(upcoming);
      setCompletedBookingsCount(completed);
    });

    return () => unsubscribe();
  }, [userId]);

  return {
    profile: profileQuery.data || null,
    reviews: realtimeReviews,
    services: relatedDataQuery.data?.services || {},
    providers: relatedDataQuery.data?.providers || {},
    favoritesCount: favoritesQuery.data || 0,
    upcomingBookingsCount,
    completedBookingsCount,
    isLoading: profileQuery.isLoading
  };
};
