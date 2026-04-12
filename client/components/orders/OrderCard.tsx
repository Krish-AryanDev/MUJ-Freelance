import Link from 'next/link';

import type { Order, UserSummary } from '@/types/order.types';
import { formatDate } from '@/utils/formatDate';
import { formatPrice } from '@/utils/formatPrice';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface OrderCardProps {
  order: Order;
  viewAs: 'client' | 'freelancer';
}

const statusClassMap: Record<Order['status'] | 'pending', string> = {
  active: 'bg-blue-100 text-blue-700 border-blue-200',
  delivered: 'bg-purple-100 text-purple-700 border-purple-200',
  revision: 'bg-orange-100 text-orange-700 border-orange-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  disputed: 'bg-red-100 text-red-700 border-red-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const packageLabelMap: Record<Order['packageTier'], string> = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
};

const getGigTitle = (order: Order): string =>
  typeof order.gigId === 'string' ? 'Gig order' : order.gigId.title || 'Gig order';

const getOtherParty = (order: Order, viewAs: OrderCardProps['viewAs']): UserSummary | null => {
  const party = viewAs === 'client' ? order.freelancerId : order.clientId;
  return typeof party === 'string' ? null : party;
};

export default function OrderCard({ order, viewAs }: OrderCardProps) {
  const otherParty = getOtherParty(order, viewAs);
  const shortOrderId = order._id.slice(0, 8).toUpperCase();
  const statusVariantClass = statusClassMap[order.status] || statusClassMap.pending;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Order #{shortOrderId}</p>
          <CardTitle className="text-lg">{getGigTitle(order)}</CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={statusVariantClass}>{order.status}</Badge>
          <Badge>{packageLabelMap[order.packageTier]}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar
            src={otherParty?.avatar?.url}
            alt={otherParty?.fullName || 'User'}
            fallback={otherParty?.fullName}
            size="sm"
          />
          <div>
            <p className="text-xs text-zinc-500">{viewAs === 'client' ? 'Freelancer' : 'Client'}</p>
            <p className="text-sm font-medium text-zinc-800">{otherParty?.fullName || 'Unknown User'}</p>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
          <p>
            Amount: <span className="font-medium text-zinc-900">{formatPrice(order.amount)}</span>
          </p>
          <p>
            Deadline: <span className="font-medium text-zinc-900">{formatDate(order.deadline)}</span>
          </p>
          <p>
            Created: <span className="font-medium text-zinc-900">{formatDate(order.createdAt)}</span>
          </p>
        </div>

        <Link href={`/orders/${order._id}`}>
          <Button size="sm" variant="outline">
            View Order
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export type { OrderCardProps };
