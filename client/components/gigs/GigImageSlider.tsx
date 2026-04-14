'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

import type { GigImage } from '../../types/gig.types';
import { classNames } from '../../utils/helpers';
import Button from '../ui/Button';

interface GigImageSliderProps {
  images: GigImage[];
  title: string;
  className?: string;
}

export default function GigImageSlider({ images, title, className }: GigImageSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const safeImages = useMemo(() => {
    return images.filter((image) => Boolean(image.url) && !image.url.includes('example.com'));
  }, [images]);

  if (safeImages.length === 0) {
    return (
      <div
        className={classNames(
          'flex h-72 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-500',
          className,
        )}
      >
        No image available
      </div>
    );
  }

  const image = safeImages[activeIndex] ?? safeImages[0];

  return (
    <div className={classNames('space-y-3', className)}>
      <div className="relative h-72 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 sm:h-96">
        <Image src={image.url} alt={title} fill sizes="(max-width: 768px) 100vw, 60vw" className="object-cover" />
      </div>

      {safeImages.length > 1 ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {safeImages.map((item, index) => (
            <button
              key={`${item.publicId || item.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={classNames(
                'relative h-16 w-24 shrink-0 overflow-hidden rounded-md border',
                index === activeIndex ? 'border-black ring-2 ring-black/20' : 'border-zinc-200',
              )}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={item.url}
                alt={`${title} preview ${index + 1}`}
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      {safeImages.length > 1 ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActiveIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActiveIndex((prev) => (prev + 1) % safeImages.length)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
