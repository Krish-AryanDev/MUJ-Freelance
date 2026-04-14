import Image from 'next/image';
import { useState } from 'react';
import { ExternalLink, Github } from 'lucide-react';

import { classNames, truncateText } from '../../utils/helpers';

interface PortfolioItem {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  projectUrl?: string;
  githubUrl?: string;
  tags?: string[];
}

interface PortfolioSectionProps {
  items: PortfolioItem[];
  title?: string;
  emptyMessage?: string;
  className?: string;
}

export default function PortfolioSection({
  items,
  title = 'Portfolio',
  emptyMessage = 'No portfolio projects added yet.',
  className,
}: PortfolioSectionProps) {
  const [activeImage, setActiveImage] = useState<{ src: string; alt: string } | null>(null);

  return (
    <section className={classNames('rounded-xl border border-zinc-200 bg-white p-5 shadow-sm', className)}>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>

      {items.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">{emptyMessage}</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item._id || item.id || item.title} className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
              {item.imageUrl ? (
                <button
                  type="button"
                  onClick={() => setActiveImage({ src: item.imageUrl || '', alt: item.title })}
                  className="relative block h-40 w-full"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 420px"
                    className="object-cover transition duration-200 hover:scale-105"
                  />
                </button>
              ) : (
                <div className="flex h-40 items-center justify-center bg-zinc-100 text-sm text-zinc-500">
                  No preview image
                </div>
              )}

              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-zinc-900">{item.title}</h3>
                </div>

                {item.description ? (
                  <p className="text-sm text-zinc-600">{truncateText(item.description, 180)}</p>
                ) : null}

                {item.tags && item.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tech) => (
                      <span
                        key={`${item._id || item.id || item.title}-${tech}`}
                        className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="flex items-center gap-3 text-xs">
                  {item.projectUrl ? (
                    <a href={item.projectUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                      <ExternalLink className="h-3.5 w-3.5" /> Project
                    </a>
                  ) : null}
                  {item.githubUrl ? (
                    <a href={item.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-zinc-700 hover:underline">
                      <Github className="h-3.5 w-3.5" /> GitHub
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {activeImage ? (
        <button
          type="button"
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-6"
        >
          <Image
            src={activeImage.src}
            alt={activeImage.alt}
            width={1600}
            height={900}
            unoptimized
            className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain"
          />
        </button>
      ) : null}
    </section>
  );
}

export type { PortfolioItem };
