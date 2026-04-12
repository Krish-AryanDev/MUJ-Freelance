import { classNames } from '../../utils/helpers';

interface ProfileStatsProps {
  completedOrders?: number;
  totalEarnings?: number;
  averageRating?: number;
  totalReviews?: number;
  responseTime?: string;
  className?: string;
}

interface StatItem {
  label: string;
  value: string;
  hint?: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function ProfileStats({
  completedOrders = 0,
  totalEarnings = 0,
  averageRating = 0,
  totalReviews = 0,
  responseTime,
  className,
}: ProfileStatsProps) {
  const stats: StatItem[] = [
    {
      label: 'Completed Orders',
      value: String(completedOrders),
    },
    {
      label: 'Total Earnings',
      value: formatCurrency(totalEarnings),
    },
    {
      label: 'Average Rating',
      value: averageRating.toFixed(1),
      hint: `${totalReviews} reviews`,
    },
    {
      label: 'Public Reviews',
      value: String(totalReviews),
    },
    {
      label: 'Response Time',
      value: responseTime ?? 'Not available',
    },
  ];

  return (
    <section className={classNames('grid gap-3 sm:grid-cols-2 lg:grid-cols-5', className)}>
      {stats.map((stat) => (
        <article key={stat.label} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">{stat.label}</p>
          <p className="mt-2 text-xl font-semibold text-zinc-900">{stat.value}</p>
          {stat.hint ? <p className="mt-1 text-xs text-zinc-500">{stat.hint}</p> : null}
        </article>
      ))}
    </section>
  );
}
