// Session trace utilities: generate a short trace-id and attach to outgoing requests
// Version tagging for client traces (align with backend DEPLOYMENT_VERSION)
const CLIENT_VERSION = '2025-11-08.1'; // Update per deploy to match backend

const TRACE_KEY = 'trace-id:v1';

export function getTraceId(): string {
  try {
    let id = sessionStorage.getItem(TRACE_KEY) || '';
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(TRACE_KEY, id);
    }
    return id;
  } catch {
    // Fallback if storage blocked
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

export function withTrace(init?: RequestInit): RequestInit {
  const traceId = getTraceId();
  const baseHeaders: Record<string, string> = {
    'x-trace-id': traceId,
    'x-client-version': CLIENT_VERSION,
  };
  const mergedHeaders: Record<string, any> = {
    ...(init?.headers || {}),
    ...baseHeaders,
  };
  return { ...(init || {}), headers: mergedHeaders };
}
