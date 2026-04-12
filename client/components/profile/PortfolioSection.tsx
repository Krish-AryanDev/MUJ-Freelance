import { classNames, truncateText } from '../../utils/helpers';

interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  projectUrl?: string;
  technologies?: string[];
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
  return (
    <section className={classNames('rounded-xl border border-zinc-200 bg-white p-5 shadow-sm', className)}>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>

      {items.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">{emptyMessage}</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-lg border border-zinc-200">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="h-40 w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-40 items-center justify-center bg-zinc-100 text-sm text-zinc-500">
                  No preview image
                </div>
              )}

              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-zinc-900">{item.title}</h3>
                  {item.projectUrl ? (
                    <a
                      href={item.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      View
                    </a>
                  ) : null}
                </div>

                {item.description ? (
                  <p className="text-sm text-zinc-600">{truncateText(item.description, 180)}</p>
                ) : null}

                {item.technologies && item.technologies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {item.technologies.map((tech) => (
                      <span
                        key={`${item.id}-${tech}`}
                        className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export type { PortfolioItem };
