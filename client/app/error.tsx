'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-500 mb-6">{error.message || 'An unexpected error occurred'}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800">
            Try again
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
