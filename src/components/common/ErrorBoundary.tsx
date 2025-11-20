import React from 'react';
import { db } from '@/integrations/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

type Props = { children: React.ReactNode; fallback?: React.ReactNode };

type State = { hasError: boolean; error?: any };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  async componentDidCatch(error: any, info: any) {
    console.error('[ErrorBoundary] Caught runtime error:', error, info);
    try {
      // Sample: only log ~20% to control write costs at scale
      if (Math.random() < 0.2) {
        const payload = {
          message: (error && error.message) ? error.message : String(error),
          stack: (error && error.stack) ? String(error.stack).slice(0, 1500) : null,
          componentStack: info?.componentStack ? String(info.componentStack).slice(0, 1500) : null,
          userAgent: navigator.userAgent,
          ts: serverTimestamp(),
        };
        await addDoc(collection(db, 'error_logs'), payload);
      }
    } catch (e) {
      // swallow - logging must never crash UI
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-[40vh] flex items-center justify-center p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground">Please refresh the page. If the issue persists, contact support.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
