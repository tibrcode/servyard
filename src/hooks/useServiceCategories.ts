import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { upsertDefaultServiceCategories } from '@/lib/firebase/defaultCategories';
import { ServiceCategory } from '@/lib/firebase/collections';

export function useServiceCategories() {
  return useQuery({
    queryKey: ['serviceCategories'],
    queryFn: async () => {
      // Upsert default categories
      try {
        await upsertDefaultServiceCategories();
      } catch (e) {
        console.warn('Failed to upsert default categories:', e);
      }

      // Fetch categories
      const categoriesQuery = query(
        collection(db, 'service_categories'),
        where('is_active', '==', true),
        orderBy('display_order')
      );
      
      let categoriesSnapshot;
      try {
        categoriesSnapshot = await getDocs(categoriesQuery);
      } catch (e) {
        console.warn('Failed to fetch categories with orderBy, trying fallback:', e);
        // Fallback without orderBy if index is missing
        const q = query(
            collection(db, 'service_categories'),
            where('is_active', '==', true)
        );
        categoriesSnapshot = await getDocs(q);
      }

      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceCategory[];

      // Deduplicate
      const seen = new Set<string>();
      const deduped: ServiceCategory[] = [];
      for (const cat of categoriesData) {
        const key = ((cat.name_en || cat.name_ar || cat.id) + '').trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(cat);
        }
      }
      
      return deduped.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
