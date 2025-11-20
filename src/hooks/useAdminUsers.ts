import { useInfiniteQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, startAt, endAt, limit, getDocs, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';

interface UseAdminUsersParams {
  roleFilter: "all" | "provider" | "customer";
  searchTerm: string;
  searchField: "email" | "full_name";
  enabled: boolean;
}

const PAGE_SIZE = 50;

export const useAdminUsers = ({ roleFilter, searchTerm, searchField, enabled }: UseAdminUsersParams) => {
  return useInfiniteQuery({
    queryKey: ['adminUsers', roleFilter, searchTerm, searchField],
    queryFn: async ({ pageParam }) => {
      const base = collection(db, 'profiles');
      let qBase;
      const term = searchTerm.trim();

      if (roleFilter === 'all') {
        if (term) {
          const end = term + '\\uf8ff';
          if (pageParam) {
             qBase = query(base, orderBy(searchField), startAt(term), endAt(end), startAfter(pageParam), limit(PAGE_SIZE));
          } else {
             qBase = query(base, orderBy(searchField), startAt(term), endAt(end), limit(PAGE_SIZE));
          }
        } else {
          if (pageParam) {
            qBase = query(base, orderBy('createdAt', 'desc'), startAfter(pageParam), limit(PAGE_SIZE));
          } else {
            qBase = query(base, orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
          }
        }
      } else {
        // Avoid composite index requirement with role filter: no orderBy
        if (pageParam) {
          qBase = query(base, where('user_type', '==', roleFilter), startAfter(pageParam), limit(PAGE_SIZE));
        } else {
          qBase = query(base, where('user_type', '==', roleFilter), limit(PAGE_SIZE));
        }
      }

      const snap = await getDocs(qBase);
      
      // Fallback logic: if All+no search returned empty on first load, retry without order
      if (!pageParam && roleFilter === 'all' && !term && snap.empty) {
         const snap2 = await getDocs(query(base, limit(PAGE_SIZE)));
         return {
            users: snap2.docs.map(d => ({ id: d.id, ...(d.data() as any) })),
            lastDoc: snap2.docs[snap2.docs.length - 1]
         };
      }

      return {
        users: snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })),
        lastDoc: snap.docs[snap.docs.length - 1]
      };
    },
    initialPageParam: null as QueryDocumentSnapshot<DocumentData> | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage.lastDoc || lastPage.users.length < PAGE_SIZE) return undefined;
      return lastPage.lastDoc;
    },
    enabled
  });
};
