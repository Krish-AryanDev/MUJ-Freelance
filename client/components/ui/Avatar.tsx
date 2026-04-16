import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import { classNames } from '../../utils/helpers';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

const normalizeAvatarSrc = (value?: string): string | null => {
  if (!value) {
    return null;
  }

  let normalized = value.trim();
  if (!normalized) {
    return null;
  }

  // Handle accidentally URL-encoded full URLs from older/seeded records.
  if (normalized.includes('%3A%2F%2F')) {
    try {
      normalized = decodeURIComponent(normalized);
    } catch (_error) {
      return null;
    }
  }

  if (normalized.startsWith('//')) {
    normalized = `https:${normalized}`;
  }

  if (normalized.startsWith('http://')) {
    normalized = `https://${normalized.slice('http://'.length)}`;
  }

  if (normalized.startsWith('/')) {
    return normalized;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    return parsed.toString();
  } catch (_error) {
    return null;
  }
};

export default function Avatar({ src, alt = 'Avatar', fallback, size = 'md', className }: AvatarProps) {
  const [hasImageError, setHasImageError] = useState(false);

  const initials = useMemo(() => {
    if (fallback && fallback.trim()) {
      return fallback.trim().slice(0, 2).toUpperCase();
    }

    return alt.slice(0, 2).toUpperCase();
  }, [alt, fallback]);

  const normalizedSrc = useMemo(() => normalizeAvatarSrc(src), [src]);

  useEffect(() => {
    setHasImageError(false);
  }, [normalizedSrc]);

  return (
    <div
      className={classNames(
        'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-zinc-200 font-medium text-zinc-700',
        sizeClasses[size],
        className,
      )}
      aria-label={alt}
    >
      {normalizedSrc && !hasImageError ? (
        <Image
          src={normalizedSrc}
          alt={alt}
          fill
          sizes="56px"
          unoptimized
          className="object-cover"
          onError={() => {
            setHasImageError(true);
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
