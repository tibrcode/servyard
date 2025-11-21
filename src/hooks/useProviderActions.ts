import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProviderProfile } from '@/types/service';

export const useProviderActions = () => {
  const queryClient = useQueryClient();

  const updateOnlineStatus = useMutation({
    mutationFn: async ({ uid, isOnline }: { uid: string; isOnline: boolean }) => {
      const profileRef = doc(db, 'profiles', uid);
      await updateDoc(profileRef, {
        is_online: isOnline,
        updated_at: new Date()
      });
    },
    onMutate: async ({ uid, isOnline }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['providerProfile', uid] });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData<ProviderProfile>(['providerProfile', uid]);

      // Optimistically update to the new value
      if (previousProfile) {
        queryClient.setQueryData(['providerProfile', uid], {
          ...previousProfile,
          is_online: isOnline,
        });
      }

      // Return a context object with the snapshotted value
      return { previousProfile };
    },
    onError: (err, { uid }, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['providerProfile', uid], context.previousProfile);
      }
    },
    onSettled: (_, __, { uid }) => {
      queryClient.invalidateQueries({ queryKey: ['providerProfile', uid] });
    },
  });

  return { updateOnlineStatus };
};
