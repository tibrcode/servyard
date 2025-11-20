// Lightweight Web Vitals collection
// Uses dynamic import to avoid adding dependency weight unless needed

type VitalsCallback = (metric: { name: string; value: number; id: string }) => void;

export async function collectWebVitals(cb: VitalsCallback) {
  try {
    // Dynamically import web-vitals (add to dependencies if not present)
    const mod = await import('web-vitals');
    mod.onCLS((m) => cb({ name: m.name, value: m.value, id: m.id }));
    mod.onLCP((m) => cb({ name: m.name, value: m.value, id: m.id }));
    mod.onFID((m) => cb({ name: m.name, value: m.value, id: m.id }));
    mod.onINP?.((m: any) => cb({ name: m.name, value: m.value, id: m.id })); // future-proof
  } catch (e) {
    console.warn('[Vitals] Failed to load web-vitals module', e);
  }
}

// Simple Firestore logging stub (optional)
// Replace with batching or analytics endpoint later
export async function logVital(metric: { name: string; value: number; id: string }) {
  try {
    // Lazy import Firestore only when needed to reduce initial bundle
    const { db } = await import('@/integrations/firebase/client');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    await addDoc(collection(db, 'web_vitals'), {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      ts: serverTimestamp(),
      ua: navigator.userAgent.slice(0, 120),
    });
  } catch (e) {
    console.warn('[Vitals] logVital failed (non-critical)', e);
  }
}
