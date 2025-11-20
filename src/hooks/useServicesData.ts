import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, doc, getDoc, documentId, onSnapshot } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { Service, Offer, ProviderProfile } from '@/types/service';
import { ServiceCategory } from '@/lib/firebase/collections';
import { useServiceCategories } from './useServiceCategories';

export interface ServicesData {
  categories: ServiceCategory[];
  services: Service[];
  providers: Record<string, ProviderProfile>;
  offers: Record<string, Offer[]>;
  providerRatings: Record<string, { avg: number; count: number }>;
  serviceRatings: Record<string, { avg: number; count: number }>;
  isLoading: boolean;
  isError: boolean;
}

export const useServicesData = () => {
    // 1. Fetch Categories
  const categoriesQuery = useServiceCategories();

  // 2. Fetch Services (Real-time)
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(false);

  useEffect(() => {
    const colRef = collection(db, 'services');
    const q = query(colRef, where('is_active', '==', true));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Service));
      setServices(data);
      setServicesLoading(false);
    }, (error) => {
      console.error("Error fetching services:", error);
      setServicesError(true);
      setServicesLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const providerIds = services 
    ? [...new Set(services.map(s => s.provider_id))] 
    : [];

  // 3. Fetch Providers
  const providersQuery = useQuery({
    queryKey: ['providers', providerIds],
    queryFn: async () => {
      if (providerIds.length === 0) return {};
      
      const providersMap: Record<string, ProviderProfile> = {};
      // Fetch in parallel
      await Promise.all(
        providerIds.map(async (pid) => {
          try {
            const d = await getDoc(doc(db, 'profiles', pid));
            if (d.exists()) {
              providersMap[pid] = { id: d.id, ...d.data() } as ProviderProfile;
            }
          } catch (e) {
            console.error(`Failed to fetch provider ${pid}`, e);
          }
        })
      );
      return providersMap;
    },
    enabled: providerIds.length > 0,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // 4. Fetch Reviews (Ratings)
  const ratingsQuery = useQuery({
    queryKey: ['providerRatings', providerIds],
    queryFn: async () => {
      if (providerIds.length === 0) return {};

      const chunks: string[][] = [];
      for (let i = 0; i < providerIds.length; i += 10) {
        chunks.push(providerIds.slice(i, i + 10));
      }

      const ratingsMap: Record<string, { sum: number; count: number }> = {};
      
      await Promise.all(
        chunks.map(async (chunk) => {
          const reviewsRef = collection(db, 'reviews');
          const q = query(reviewsRef, where('provider_id', 'in', chunk));
          const snap = await getDocs(q);
          snap.forEach(d => {
            const data = d.data();
            const pid = data.provider_id;
            const approved = (data.is_approved === undefined) ? true : !!data.is_approved;
            if (!pid || typeof data.rating !== 'number' || !approved) return;
            
            if (!ratingsMap[pid]) ratingsMap[pid] = { sum: 0, count: 0 };
            ratingsMap[pid].sum += data.rating;
            ratingsMap[pid].count += 1;
          });
        })
      );

      const finalRatings: Record<string, { avg: number; count: number }> = {};
      Object.entries(ratingsMap).forEach(([pid, { sum, count }]) => {
        if (count > 0) finalRatings[pid] = { avg: sum / count, count };
      });
      return finalRatings;
    },
    enabled: providerIds.length > 0,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  // 5. Fetch Offers
  const offersQuery = useQuery({
    queryKey: ['offers', providerIds],
    queryFn: async () => {
      if (providerIds.length === 0) return {};

      const chunks: string[][] = [];
      for (let i = 0; i < providerIds.length; i += 10) {
        chunks.push(providerIds.slice(i, i + 10));
      }

      const offersMap: Record<string, Offer[]> = {};
      
      await Promise.all(
        chunks.map(async (chunk) => {
          const offersRef = collection(db, 'offers');
          const q = query(offersRef, where('provider_id', 'in', chunk), where('is_active', '==', true));
          const snap = await getDocs(q);
          snap.forEach(d => {
            const data = d.data();
            const offer = { id: d.id, ...data } as Offer;
            if (!offersMap[offer.provider_id!]) offersMap[offer.provider_id!] = [];
            offersMap[offer.provider_id!].push(offer);
          });
        })
      );
      return offersMap;
    },
    enabled: providerIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const serviceIds = services ? services.map(s => s.id) : [];

  // 6. Fetch Service Ratings
  const serviceRatingsQuery = useQuery({
    queryKey: ['serviceRatings', serviceIds],
    queryFn: async () => {
      if (serviceIds.length === 0) return {};

      const chunks: string[][] = [];
      for (let i = 0; i < serviceIds.length; i += 10) {
        chunks.push(serviceIds.slice(i, i + 10));
      }

      const ratingsMap: Record<string, { sum: number; count: number }> = {};
      
      await Promise.all(
        chunks.map(async (chunk) => {
          const reviewsRef = collection(db, 'reviews');
          const q = query(reviewsRef, where('service_id', 'in', chunk));
          const snap = await getDocs(q);
          snap.forEach(d => {
            const data = d.data();
            const sid = data.service_id;
            const approved = (data.is_approved === undefined) ? true : !!data.is_approved;
            if (!sid || typeof data.rating !== 'number' || !approved) return;
            
            if (!ratingsMap[sid]) ratingsMap[sid] = { sum: 0, count: 0 };
            ratingsMap[sid].sum += data.rating;
            ratingsMap[sid].count += 1;
          });
        })
      );

      const finalRatings: Record<string, { avg: number; count: number }> = {};
      Object.entries(ratingsMap).forEach(([sid, { sum, count }]) => {
        if (count > 0) finalRatings[sid] = { avg: sum / count, count };
      });
      return finalRatings;
    },
    enabled: serviceIds.length > 0,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  return {
    categories: categoriesQuery.data || [],
    services: services || [],
    providers: providersQuery.data || {},
    providerRatings: ratingsQuery.data || {},
    offers: offersQuery.data || {},
    serviceRatings: serviceRatingsQuery.data || {},
    isLoading: categoriesQuery.isLoading || servicesLoading || (providerIds.length > 0 && providersQuery.isLoading),
    isError: categoriesQuery.isError || servicesError || providersQuery.isError
  };
};
