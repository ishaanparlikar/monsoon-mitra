'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-paper-dry flex flex-col items-center justify-center p-8 text-center safe-all">
      <div className="w-20 h-20 rounded-full bg-danger-100 flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-danger-500" />
      </div>

      <h1 className="text-xl font-bold text-storm-900 mb-2">Something went wrong</h1>
      <p className="text-sm text-cloud-600 mb-2 max-w-xs leading-relaxed">
        We couldn&apos;t load this page. Please check your connection and try again.
      </p>
      {error.message && (
        <p className="text-xs text-cloud-400 font-mono mb-6 bg-cloud-50 px-3 py-1.5 rounded-lg max-w-xs break-all">
          {error.message}
        </p>
      )}

      <Button
        variant="primary"
        leftIcon={<RefreshCw className="w-4 h-4" />}
        onClick={reset}
      >
        Try Again
      </Button>
    </div>
  );
}
