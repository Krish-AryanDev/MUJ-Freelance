import Link from 'next/link';
import type { ReactNode } from 'react';

import { classNames } from '../../utils/helpers';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  title = 'Nothing here yet',
  description = 'There is no data available for this section right now.',
  icon,
  actionLabel,
  actionHref,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={classNames(
        'flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center',
        className,
      )}
    >
      <div className="mb-3 text-3xl" aria-hidden="true">
        {icon ?? '📭'}
      </div>
      <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-zinc-600">{description}</p>

      {action ??
        (actionLabel && actionHref ? (
          <Link
            href={actionHref}
            className="mt-5 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            {actionLabel}
          </Link>
        ) : null)}
    </div>
  );
}
