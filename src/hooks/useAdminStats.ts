import { useQuery } from '@tanstack/react-query';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';

export interface AdminStats {
  totalUsers: number;
  totalProviders: number;
  totalServices: number;
  customers: number;
  incomplete: number;
  pendingReports: number;
  activeBookings: number;
}

export const useAdminStats = (enabled: boolean) => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const profilesRef = collection(db, "profiles");
      const servicesRef = collection(db, "services");

      const [usersSnap, providersSnap, servicesSnap, customersSnap] = await Promise.all([
        getCountFromServer(profilesRef),
        getCountFromServer(query(profilesRef, where("user_type", "==", "provider"))),
        getCountFromServer(servicesRef),
        getCountFromServer(query(profilesRef, where("user_type", "==", "customer"))),
      ]);

      const totalUsers = usersSnap.data().count || 0;
      const totalProviders = providersSnap.data().count || 0;
      const totalServices = servicesSnap.data().count || 0;
      const customers = customersSnap.data().count || 0;
      const incomplete = Math.max(0, totalUsers - totalProviders - customers);

      return {
        totalUsers,
        totalProviders,
        totalServices,
        customers,
        incomplete,
        pendingReports: 0, // Placeholder as per original code
        activeBookings: 0  // Placeholder as per original code
      } as AdminStats;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
