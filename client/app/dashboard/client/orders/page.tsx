'use client';

import { ShoppingBag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import OrderCard from '@/components/orders/OrderCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/order.service';
import type { Order } from '@/types/order.types';
import { formatPrice } from '@/utils/formatPrice';
import { useQuery } from '@tanstack/react-query';

const tabs = ['All', 'Active', 'Delivered', 'Completed', 'Cancelled'] as const;

export default function ClientOrdersDashboardPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('All');
  const router = useRouter();
  const { user, isFreelancer, isAuthenticated, initialized, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (initialized && !isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [initialized, isAuthLoading, isAuthenticated, router]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['orders', 'client', activeTab],
    queryFn: () => orderService.getMyOrders(activeTab === 'All' ? undefined : activeTab.toLowerCase()),
    enabled: isAuthenticated,
  });

  const orders = useMemo(() => (data?.success ? data.data.orders : []), [data]);

  const getUserId = (value: Order['clientId'] | Order['freelancerId']): string => {
    if (typeof value === 'string') {
      return value;
    }

    return String(value?._id || '');
  };

  const summary = useMemo(() => {
    const currentUserId = String(user?.id || '');

    const clientOrders = orders.filter((order) => getUserId(order.clientId) === currentUserId);
    const freelancerOrders = orders.filter((order) => getUserId(order.freelancerId) === currentUserId);

    const totalSpent = clientOrders
      .filter((order) => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.amount, 0);

    const totalEarnings = freelancerOrders
      .filter((order) => order.status === 'completed')
      .reduce((sum, order) => sum + order.amount, 0);

    return {
      totalSpent,
      totalEarnings,
      clientOrdersCount: clientOrders.length,
    };
  }, [orders, user?.id]);

  if (isAuthLoading || !initialized) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={`client-orders-auth-skeleton-${index}`} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">My Orders</h1>
        <p className="text-sm text-zinc-600">Track and manage your orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spending Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-zinc-500">Total Spent</p>
            <p className="text-lg font-semibold text-zinc-900">{formatPrice(summary.totalSpent)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Orders Placed</p>
            <p className="text-lg font-semibold text-zinc-900">{summary.clientOrdersCount}</p>
          </div>
          {isFreelancer ? (
            <div>
              <p className="text-xs text-zinc-500">Total Earnings (Freelancer)</p>
              <p className="text-lg font-semibold text-zinc-900">{formatPrice(summary.totalEarnings)}</p>
            </div>
          ) : null}
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

