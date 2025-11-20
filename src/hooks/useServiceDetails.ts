import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { Service } from '@/types/service';

export function useServiceDetails(serviceId: string | undefined) {
  return useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      const docRef = doc(db, 'services', serviceId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Service;
      }
      return null;
    },
    enabled: !!serviceId
  });
}
