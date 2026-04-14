import { classNames } from '../../utils/helpers';

interface ProfileStatsProps {
  completedProjects?: number;
  totalReviews?: number;
  averageRating?: number;
  profileViews?: number;
  className?: string;
}

interface StatItem {
  label: string;
  value: string;
  hint?: string;
}

export default function ProfileStats({
  completedProjects = 0,
  totalReviews = 0,
  averageRating = 0,
  profileViews = 0,
  className,
}: ProfileStatsProps) {
  const stats: StatItem[] = [
    {
      label: 'Completed Projects',
      value: String(completedProjects),
    },
    {
      label: 'Total Reviews',
      value: String(totalReviews),
    },
    {
      label: 'Average Rating',
      value: averageRating.toFixed(1),
      hint: 'Out of 5.0',
    },
    {
      label: 'Profile Views',
      value: String(profileViews),
    },
  ];

  return (
    <section className={classNames('grid gap-3 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {stats.map((stat) => (
        <article key={stat.label} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">{stat.label}</p>
          <p className="mt-2 text-xl font-semibold text-zinc-900">{stat.value}</p>
          {stat.hint ? <p className="mt-1 text-xs text-zinc-500">{stat.hint}</p> : null}
        </article>
      ))}
    </section>
  );
}
