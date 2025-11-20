import { db } from '@/integrations/firebase/client';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Service } from '@/types/service';

type CacheShape = { data: Service[]; ts: number };
const MEM_KEY = 'svc-list:v1';
let MEM: CacheShape | null = null;

// Helper to deduplicate services by id and sort by active status, then by name
function dedupeAndSort(list: Service[]): Service[] {
  const seen = new Set<string>();
  const out: Service[] = [];
  for (const s of list) {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      out.push(s);
    }
  }
  // Sort: active first, then alphabetically by name
  out.sort((a, b) => {
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });
  return out;
}

/**
 * Fetch all active services with TTL-based caching (memory + sessionStorage).
 * Default TTL: 10 minutes (services can change more frequently than categories).
 * Returns deduplicated and sorted list.
 */
export async function getServicesCached(ttlMs = 10 * 60 * 1000): Promise<Service[]> {
  const now = Date.now();

  // Check memory cache
  if (MEM && now - MEM.ts < ttlMs) return MEM.data;

  // Check session storage cache
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
  const snap = await getDocs(collection(db, 'services'));
  const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Service[];
  const processed = dedupeAndSort(data);

  // Update both caches
  MEM = { data: processed, ts: now };
  try {
    sessionStorage.setItem(MEM_KEY, JSON.stringify(MEM));
  } catch {}

  return processed;
}

/**
 * Optional: Fetch services by provider with caching.
 * Uses a separate cache key per provider to avoid excessive memory use.
 */
export async function getServicesByProviderCached(
  providerId: string,
  ttlMs = 10 * 60 * 1000
): Promise<Service[]> {
  const providerKey = `svc-provider:${providerId}:v1`;
  const now = Date.now();

  // Check sessionStorage only (no shared memory cache for provider-specific queries)
  try {
    const raw = sessionStorage.getItem(providerKey);
    if (raw) {
      const parsed: CacheShape = JSON.parse(raw);
      if (now - parsed.ts < ttlMs && Array.isArray(parsed.data)) {
        return parsed.data;
      }
    }
  } catch {}

  // Fetch from Firestore
  const q = query(collection(db, 'services'), where('provider_id', '==', providerId));
  const snap = await getDocs(q);
  const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Service[];
  const processed = dedupeAndSort(data);

  // Cache result
  const cacheEntry: CacheShape = { data: processed, ts: now };
  try {
    sessionStorage.setItem(providerKey, JSON.stringify(cacheEntry));
  } catch {}

  return processed;
}

/**
 * Invalidate the services cache (call after creating/updating/deleting a service).
 */
export function invalidateServicesCache() {
  MEM = null;
  try {
    sessionStorage.removeItem(MEM_KEY);
    // Optionally clear all provider-specific caches
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('svc-provider:')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {}
}
