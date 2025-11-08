import { db } from '@/integrations/firebase/client';
import { collection, getDocs } from 'firebase/firestore';
import type { ServiceCategory } from '@/lib/firebase/collections';

type CacheShape = { data: ServiceCategory[]; ts: number };
const MEM_KEY = 'svc-cats:v1';
let MEM: CacheShape | null = null;

function normalizeName(c: any) {
  return ((c.name_en || c.name_ar || c.id) + '').trim().toLowerCase();
}

function dedupeAndSort(list: ServiceCategory[]): ServiceCategory[] {
  const seen = new Set<string>();
  const out: ServiceCategory[] = [];
  for (const c of list) {
    const key = normalizeName(c);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(c);
    }
  }
  out.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
  return out;
}

export async function getServiceCategoriesCached(ttlMs = 15 * 60 * 1000): Promise<ServiceCategory[]> {
  const now = Date.now();

  // Memory cache
  if (MEM && now - MEM.ts < ttlMs) return MEM.data;

  // Session storage cache
  try {
    const raw = sessionStorage.getItem(MEM_KEY);
    if (raw) {
      const parsed: CacheShape = JSON.parse(raw);
      if (now - parsed.ts < ttlMs && Array.isArray(parsed.data)) {
        MEM = parsed;
        return parsed.data;
      }
    }
  } catch {}

  // Fetch from Firestore
  const snap = await getDocs(collection(db, 'service_categories'));
  const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ServiceCategory[];
  const processed = dedupeAndSort(data);

  MEM = { data: processed, ts: now };
  try {
    sessionStorage.setItem(MEM_KEY, JSON.stringify(MEM));
  } catch {}
  return processed;
}
