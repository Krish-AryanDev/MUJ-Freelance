'use client';

import { useMemo, useState } from 'react';
import { useEffect } from 'react';
import { Briefcase } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import OrderCard from '@/components/orders/OrderCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/order.service';
import { reviewService } from '@/services/review.service';
import type { Order } from '@/types/order.types';
import { formatPrice } from '@/utils/formatPrice';

const tabs = ['All', 'Active', 'Delivered', 'Revision', 'Completed'] as const;

export default function FreelancerOrdersDashboardPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('All');
  const router = useRouter();
  const { user, isAuthenticated, isClient, initialized, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (initialized && !isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [initialized, isAuthLoading, isAuthenticated, router]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['orders', 'freelancer', activeTab],
    queryFn: () => orderService.getMyOrders(activeTab === 'All' ? undefined : activeTab.toLowerCase()),
    enabled: isAuthenticated,
  });

  const reviewsSummaryQuery = useQuery({
    queryKey: ['reviews', 'user-summary', user?.id || ''],
    queryFn: () =>
      reviewService.getUserReviews(String(user?.id || ''), {
        page: 1,
        limit: 1,
        sort: 'recent',
      }),
    enabled: isAuthenticated && Boolean(user?.id),
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

    const freelancerOrders = orders.filter((order) => getUserId(order.freelancerId) === currentUserId);
    const clientOrders = orders.filter((order) => getUserId(order.clientId) === currentUserId);

    const completedOrders = freelancerOrders.filter((order) => order.status === 'completed');
    const activeOrders = freelancerOrders.filter((order) => ['active', 'revision'].includes(order.status));

    const totalEarnings = completedOrders.reduce((sum, order) => sum + order.amount, 0);
    const totalSpent = clientOrders
      .filter((order) => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.amount, 0);
    const avgRating = reviewsSummaryQuery.data?.success ? Number(reviewsSummaryQuery.data.data.averageRating || 0) : 0;

    return {
      totalEarnings,
      totalSpent,
      activeCount: activeOrders.length,
      completedCount: completedOrders.length,
      avgRating,
    };
  }, [orders, reviewsSummaryQuery.data, user?.id]);

  if (isAuthLoading || !initialized) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={`freelancer-orders-auth-skeleton-${index}`} className="h-48 rounded-xl" />
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
        <p className="text-sm text-zinc-600">Manage your active work</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings Summary</CardTitle>
        </CardHeader>
        <CardContent className={`grid gap-3 sm:grid-cols-2 ${isClient ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
          <div>
            <p className="text-xs text-zinc-500">Total Earnings</p>
            <p className="text-lg font-semibold text-zinc-900">{formatPrice(summary.totalEarnings)}</p>
          </div>
          {isClient ? (
            <div>
              <p className="text-xs text-zinc-500">Total Spent (Client)</p>
              <p className="text-lg font-semibold text-zinc-900">{formatPrice(summary.totalSpent)}</p>
            </div>
          ) : null}
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

