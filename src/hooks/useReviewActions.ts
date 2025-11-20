import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useMutation } from '@tanstack/react-query';

export const useReviewActions = () => {
  const updateReview = useMutation({
    mutationFn: async ({ id, rating }: { id: string; rating: number }) => {
      const reviewRef = doc(db, 'reviews', id);
      await updateDoc(reviewRef, {
        rating,
        created_at: new Date()
      });
    }
  });

  return { updateReview };
};
