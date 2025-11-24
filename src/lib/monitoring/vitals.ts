// Lightweight Web Vitals collection
// Uses dynamic import to avoid adding dependency weight unless needed

type VitalsCallback = (metric: { name: string; value: number; id: string }) => void;

// Sample rate for storing metrics (10% to reduce Firestore costs)
const VITALS_SAMPLE_RATE = 0.1;
const ERROR_SAMPLE_RATE = 0.2;

export async function collectWebVitals(cb: VitalsCallback) {
  try {
    // Dynamically import web-vitals (add to dependencies if not present)
    const mod = await import('web-vitals');
    mod.onCLS((m) => cb({ name: m.name, value: m.value, id: m.id }));
    mod.onLCP((m) => cb({ name: m.name, value: m.value, id: m.id }));
    mod.onFID((m) => cb({ name: m.name, value: m.value, id: m.id }));
    mod.onINP?.((m: any) => cb({ name: m.name, value: m.value, id: m.id })); // future-proof
    mod.onFCP?.((m: any) => cb({ name: m.name, value: m.value, id: m.id }));
    mod.onTTFB?.((m: any) => cb({ name: m.name, value: m.value, id: m.id }));
  } catch (e) {
    console.warn('[Vitals] Failed to load web-vitals module', e);
  }
}

// Simple Firestore logging stub (optional)
// Replace with batching or analytics endpoint later
export async function logVital(metric: { name: string; value: number; id: string }) {
  // Only sample 10% of metrics to reduce Firestore costs
  if (Math.random() > VITALS_SAMPLE_RATE) return;
  
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
      url: window.location.pathname,
      connection: (navigator as any).connection?.effectiveType || 'unknown',
    });
  } catch (e) {
    console.warn('[Vitals] logVital failed (non-critical)', e);
  }
}

// Error tracking
export async function logError(error: Error, context?: Record<string, any>): Promise<void> {
  // Only sample 20% of errors to reduce costs
  if (Math.random() > ERROR_SAMPLE_RATE) return;

  try {
    const { db } = await import('@/integrations/firebase/client');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    await addDoc(collection(db, 'error_logs'), {
      message: error.message,
      stack: error.stack?.slice(0, 1000),
      name: error.name,
      url: window.location.pathname,
      ua: navigator.userAgent.slice(0, 120),
      ts: serverTimestamp(),
      context: context || {},
    });
  } catch (e) {
    console.debug('[ErrorTracker] Failed to report:', e);
  }
}

// Global error handler initialization
export function initErrorTracking(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), {
      type: 'uncaught',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    logError(error, { type: 'unhandled_promise' });
  });

  console.debug('[ErrorTracking] Initialized');
}
