'use client';

import { CheckCircle2, Clock3, Hourglass, Percent, TrendingUp } from 'lucide-react';

import { formatPrice } from '@/utils/formatPrice';
import Skeleton from '../ui/Skeleton';

interface EarningsCardProps {
  totalEarnings: number;
  pendingEarnings: number;
  thisMonthEarnings: number;
  totalOrders: number;
  commissionPaid: number;
  isLoading?: boolean;
}

export default function EarningsCard({
  totalEarnings,
  pendingEarnings,
  thisMonthEarnings,
  totalOrders,
  commissionPaid,
  isLoading = false,
}: EarningsCardProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={`earnings-card-skeleton-${index}`} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Earnings',
      value: formatPrice(totalEarnings),
      subtitle: '',
      icon: TrendingUp,
      className: 'border-green-200 bg-green-50',
    },
    {
      label: 'This Month',
      value: formatPrice(thisMonthEarnings),
      subtitle: '',
      icon: Clock3,
      className: 'border-blue-200 bg-blue-50',
    },
    {
      label: 'Pending Release',
      value: formatPrice(pendingEarnings),
      subtitle: 'Active orders in progress',
      icon: Hourglass,
      className: 'border-yellow-200 bg-yellow-50',
    },
    {
      label: 'Completed Orders',
      value: String(totalOrders),
      subtitle: '',
      icon: CheckCircle2,
      className: 'border-purple-200 bg-purple-50',
    },
    {
      label: 'Commission Paid',
      value: formatPrice(commissionPaid),
      subtitle: '3% platform fee',
      icon: Percent,
      className: 'border-zinc-200 bg-zinc-50',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.label} className={`rounded-xl border p-4 ${item.className}`}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-600">{item.label}</p>
              <Icon className="h-4 w-4 text-zinc-700" />
            </div>
            <p className="text-xl font-semibold text-zinc-900">{item.value}</p>
            {item.subtitle ? <p className="mt-1 text-xs text-zinc-500">{item.subtitle}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

export type { EarningsCardProps };
