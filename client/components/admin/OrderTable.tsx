import Badge from '@/components/ui/Badge';
import type { AdminOrder } from '@/types/admin.types';

interface OrderTableProps {
  orders: AdminOrder[];
}

const orderStatusVariant = (status: string) => {
  if (status === 'completed' || status === 'resolved') {
    return 'success';
  }

  if (status === 'cancelled') {
    return 'danger';
  }

  if (status === 'disputed' || status === 'revision') {
    return 'warning';
  }

  return 'info';
};

const getUserName = (user: AdminOrder['clientId']) => {
  if (!user || typeof user === 'string') {
    return 'Unknown';
  }

  return user.fullName;
};

const getOrderTitle = (gig: AdminOrder['gigId']) => {
  if (!gig || typeof gig === 'string') {
    return 'Order';
  }

  return gig.title;
};

export default function OrderTable({ orders }: OrderTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Order</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Client</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Freelancer</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Status</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {orders.map((order) => (
            <tr key={order._id} className="hover:bg-zinc-50/70">
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-900">{getOrderTitle(order.gigId)}</p>
                <p className="text-sm text-zinc-500">{order._id}</p>
              </td>
              <td className="px-4 py-3 text-sm text-zinc-700">{getUserName(order.clientId)}</td>
              <td className="px-4 py-3 text-sm text-zinc-700">{getUserName(order.freelancerId)}</td>
              <td className="px-4 py-3">
                <Badge variant={orderStatusVariant(order.status)} className="capitalize">
                  {order.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right font-medium text-zinc-800">₹{order.amount.toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
