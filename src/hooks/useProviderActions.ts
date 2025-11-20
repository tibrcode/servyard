import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useMutation } from '@tanstack/react-query';

export const useProviderActions = () => {
  const updateOnlineStatus = useMutation({
    mutationFn: async ({ uid, isOnline }: { uid: string; isOnline: boolean }) => {
      const profileRef = doc(db, 'profiles', uid);
      await updateDoc(profileRef, {
        is_online: isOnline,
        updated_at: new Date()
      });
    }
  });

  return { updateOnlineStatus };
};
