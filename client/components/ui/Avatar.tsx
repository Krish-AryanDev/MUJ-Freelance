import Image from 'next/image';
import { useMemo } from 'react';

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

export default function Avatar({ src, alt = 'Avatar', fallback, size = 'md', className }: AvatarProps) {
  const initials = useMemo(() => {
    if (fallback && fallback.trim()) {
      return fallback.trim().slice(0, 2).toUpperCase();
    }

    return alt.slice(0, 2).toUpperCase();
  }, [alt, fallback]);

  return (
    <div
      className={classNames(
        'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-zinc-200 font-medium text-zinc-700',
        sizeClasses[size],
        className,
      )}
      aria-label={alt}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes="56px" className="object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
