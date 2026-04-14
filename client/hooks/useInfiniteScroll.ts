import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

interface InfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

interface InfiniteScrollResult {
  ref: RefObject<HTMLDivElement>;
}

export const useInfiniteScroll = (
  callback: () => void,
  options: InfiniteScrollOptions = {},
): InfiniteScrollResult => {
  const { threshold = 0.1, rootMargin = '100px', enabled = true } = options;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry?.isIntersecting) {
          callback();
        }
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [callback, enabled, rootMargin, threshold]);

  return { ref };
};