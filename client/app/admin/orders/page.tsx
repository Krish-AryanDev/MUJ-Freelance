'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import OrderTable from '@/components/admin/OrderTable';
import adminService from '@/services/admin.service';

export default function Page() {
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'orders', status],
    queryFn: () => adminService.getOrders({ page: 1, limit: 30, status: status || undefined }),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
        <select
          className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="delivered">Delivered</option>
          <option value="revision">Revision</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="disputed">Disputed</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {isLoading ? <div className="p-4 text-sm text-zinc-600">Loading orders...</div> : null}

      {isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Failed to load orders'}
        </div>
      ) : null}

      {data?.success ? <OrderTable orders={data.data.orders} /> : null}
    </div>
  );
}

