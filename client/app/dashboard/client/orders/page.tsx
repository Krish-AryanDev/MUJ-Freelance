'use client';

import { ShoppingBag } from 'lucide-react';
import { useState } from 'react';

import OrderCard from '@/components/orders/OrderCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import Skeleton from '@/components/ui/Skeleton';
import { orderService } from '@/services/order.service';
import { useQuery } from '@tanstack/react-query';

const tabs = ['All', 'Active', 'Delivered', 'Completed', 'Cancelled'] as const;

export default function ClientOrdersDashboardPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('All');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['orders', 'client', activeTab],
    queryFn: () => orderService.getMyOrders(activeTab === 'All' ? undefined : activeTab.toLowerCase()),
  });

  const orders = data?.success ? data.data.orders : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">My Orders</h1>
        <p className="text-sm text-zinc-600">Track and manage your orders</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`client-orders-skeleton-${index}`} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <ErrorState
          title="Unable to load orders"
          message={error instanceof Error ? error.message : 'Please try again.'}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      {!isLoading && !isError && orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="mx-auto h-8 w-8" />}
          title="No orders yet"
          description="Browse gigs and place your first order"
          actionLabel="Browse Gigs"
          actionHref="/gigs"
        />
      ) : null}

      {!isLoading && !isError ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} viewAs="client" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

