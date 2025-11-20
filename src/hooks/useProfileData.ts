import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { deleteCurrentUserFully } from '@/lib/firebase/deleteAccount';

export interface ProfileData {
  full_name: string;
  email: string;
  phone_numbers: string[];
  whatsapp_number: string;
  city: string;
  country: string;
  profile_description: string;
  website_url: string;
  google_business_url: string;
  license_number: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  currency_code?: string;
  timezone?: string;
  main_category_id?: string;
  latitude?: number;
  longitude?: number;
  location_address?: string;
}

export function useProfileData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const docRef = doc(db, 'profiles', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as ProfileData;
      }
      return null;
    },
    enabled: !!user?.uid,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProfileData>) => {
      if (!user?.uid) throw new Error('User not authenticated');
      const docRef = doc(db, 'profiles', user.uid);
      await updateDoc(docRef, {
        ...data,
        updated_at: new Date()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.uid] });
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!user?.uid) throw new Error('User not authenticated');
      await deleteCurrentUserFully();
    },
  });

  return {
    profile,
    isLoading,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    deleteAccount: deleteAccountMutation.mutateAsync,
    isDeleting: deleteAccountMutation.isPending
  };
}
