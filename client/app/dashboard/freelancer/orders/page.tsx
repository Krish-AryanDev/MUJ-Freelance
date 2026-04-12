'use client';

import { useMemo, useState } from 'react';
import { Briefcase } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import OrderCard from '@/components/orders/OrderCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { orderService } from '@/services/order.service';
import { formatPrice } from '@/utils/formatPrice';

const tabs = ['All', 'Active', 'Delivered', 'Revision', 'Completed'] as const;

export default function FreelancerOrdersDashboardPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('All');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['orders', 'freelancer', activeTab],
    queryFn: () => orderService.getMyOrders(activeTab === 'All' ? undefined : activeTab.toLowerCase()),
  });

  const orders = data?.success ? data.data.orders : [];

  const summary = useMemo(() => {
    const completedOrders = orders.filter((order) => order.status === 'completed');
    const activeOrders = orders.filter((order) => ['active', 'revision'].includes(order.status));

    const totalEarnings = completedOrders.reduce((sum, order) => sum + order.amount, 0);
    const avgRating = 0;

    return {
      totalEarnings,
      activeCount: activeOrders.length,
      completedCount: completedOrders.length,
      avgRating,
    };
  }, [orders]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">My Orders</h1>
        <p className="text-sm text-zinc-600">Manage your active work</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-zinc-500">Total Earnings</p>
            <p className="text-lg font-semibold text-zinc-900">{formatPrice(summary.totalEarnings)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Active Orders</p>
            <p className="text-lg font-semibold text-zinc-900">{summary.activeCount}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Completed Orders</p>
            <p className="text-lg font-semibold text-zinc-900">{summary.completedCount}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Average Rating</p>
            <p className="text-lg font-semibold text-zinc-900">{summary.avgRating.toFixed(1)}</p>
          </div>
        </CardContent>
      </Card>

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
            <Skeleton key={`freelancer-orders-skeleton-${index}`} className="h-48 rounded-xl" />
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
          icon={<Briefcase className="mx-auto h-8 w-8" />}
          title="No orders yet"
          description="Create gigs to start receiving orders"
          actionLabel="Create a Gig"
          actionHref="/dashboard/freelancer/gigs/create"
        />
      ) : null}

      {!isLoading && !isError ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} viewAs="freelancer" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

