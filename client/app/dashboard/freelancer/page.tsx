'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle, DollarSign, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/order.service';
import { projectService } from '@/services/project.service';
import type { Order } from '@/types/order.types';
import type { Proposal } from '@/types/project.types';
import { classNames, truncateText } from '@/utils/helpers';
import { formatDate } from '@/utils/formatDate';
import { formatPrice } from '@/utils/formatPrice';

const PLATFORM_FEE_PERCENT = 3;

const calculateFreelancerPayout = (amount: number): number => {
  const commission = Math.round((amount * PLATFORM_FEE_PERCENT) / 100);
  return amount - commission;
};

const getOrderStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  if (status === 'completed') {
    return 'success';
  }

  if (status === 'active' || status === 'delivered') {
    return 'info';
  }

  if (status === 'revision') {
    return 'warning';
  }

  if (status === 'cancelled' || status === 'disputed') {
    return 'danger';
  }

  return 'default';
};

const getProposalVariant = (status: Proposal['status']): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  if (status === 'accepted') {
    return 'success';
  }

  if (status === 'rejected' || status === 'withdrawn') {
    return 'danger';
  }

  if (status === 'shortlisted') {
    return 'info';
  }

  return 'warning';
};

const getBuyerName = (client: Order['clientId']): string => {
  if (typeof client === 'string') {
    return 'Client';
  }

  return client.fullName || 'Client';
};

const getBuyerAvatar = (client: Order['clientId']): string => {
  if (typeof client === 'string') {
    return '';
  }

  return client.avatar?.url || '';
};

const getOrderTitle = (gig: Order['gigId']): string => {
  if (typeof gig === 'string') {
    return 'Order';
  }

  return gig.title || 'Order';
};

const getOrderFreelancerId = (freelancer: Order['freelancerId']): string => {
  if (typeof freelancer === 'string') {
    return freelancer;
  }

  return String(freelancer?._id || '');
};

const StatCard = ({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  accent: string;
}) => (
  <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-zinc-900">{value}</p>
      </div>
      <div className={classNames('rounded-lg p-2', accent)}>{icon}</div>
    </div>
  </div>
);

export default function FreelancerDashboardHomePage() {
  const router = useRouter();
  const { user, initialized, isLoading: isAuthLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    document.title = 'Freelancer Dashboard | MUJ Freelance';
  }, []);

  useEffect(() => {
    if (initialized && !isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [initialized, isAuthenticated, isAuthLoading, router]);

  const ordersQuery = useQuery({
    queryKey: ['orders', 'freelancer-dashboard'],
    queryFn: () => orderService.getMyOrders(),
    enabled: isAuthenticated,
  });

  const proposalsQuery = useQuery({
    queryKey: ['proposals', 'freelancer-dashboard'],
    queryFn: () => projectService.getFreelancerProposals(),
    enabled: isAuthenticated,
  });

  const freelancerOrders = useMemo(() => {
    const userId = String(user?.id || '');
    const orders = ordersQuery.data?.success ? ordersQuery.data.data.orders : [];

    return orders.filter((order) => getOrderFreelancerId(order.freelancerId) === userId);
  }, [ordersQuery.data, user?.id]);

  const proposals = useMemo(() => proposalsQuery.data ?? [], [proposalsQuery.data]);

  const stats = useMemo(() => {
    const activeOrders = freelancerOrders.filter((order) => order.status === 'active').length;
    const completedOrdersList = freelancerOrders.filter((order) => order.status === 'completed');
    const completedOrders = completedOrdersList.length;
    const totalEarnings = completedOrdersList.reduce(
      (sum, order) => sum + calculateFreelancerPayout(order.amount),
      0,
    );
    const activeProposals = proposals.filter(
      (proposal) => proposal.status === 'pending' || proposal.status === 'shortlisted',
    ).length;

    return {
      activeOrders,
      completedOrders,
      totalEarnings,
      activeProposals,
    };
  }, [freelancerOrders, proposals]);

  const recentOrders = useMemo(() => {
    return [...freelancerOrders]
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
      .slice(0, 5);
  }, [freelancerOrders]);

  const recentProposals = useMemo(() => {
    return [...proposals]
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
      .slice(0, 3);
  }, [proposals]);

  if (isAuthLoading || !initialized) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={`freelancer-dashboard-skeleton-${index}`} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Welcome back, {user?.fullName || 'Freelancer'}!</h1>
            <p className="mt-1 text-sm text-zinc-600">{formatDate(new Date(), 'EEEE, dd MMM yyyy')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/projects"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Browse Projects
            </Link>
            <Link
              href="/dashboard/freelancer/proposals"
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
            >
              View Proposals
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active Orders"
          value={String(stats.activeOrders)}
          icon={<ShoppingBag className="h-5 w-5 text-blue-600" />}
          accent="bg-blue-50"
        />
        <StatCard
          title="Completed Orders"
          value={String(stats.completedOrders)}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          accent="bg-green-50"
        />
        <StatCard
          title="Total Earnings"
          value={formatPrice(stats.totalEarnings)}
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          accent="bg-green-50"
        />
        <StatCard
          title="Active Proposals"
          value={String(stats.activeProposals)}
          icon={<CheckCircle className="h-5 w-5 text-purple-600" />}
          accent="bg-purple-50"
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Recent Orders</h2>
          <Link
            href="/dashboard/freelancer/orders"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View All
          </Link>
        </div>

        {ordersQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={`freelancer-orders-row-skeleton-${index}`} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : null}

        {ordersQuery.isError ? (
          <ErrorState
            title="Unable to load orders"
            message={ordersQuery.error instanceof Error ? ordersQuery.error.message : 'Please try again.'}
            onRetry={() => {
              void ordersQuery.refetch();
            }}
          />
        ) : null}

        {!ordersQuery.isLoading && !ordersQuery.isError && recentOrders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="mx-auto h-8 w-8" />}
            title="No orders yet"
            description="Apply to projects to start receiving orders"
            actionLabel="Browse Projects"
            actionHref="/projects"
          />
        ) : null}

        {!ordersQuery.isLoading && !ordersQuery.isError && recentOrders.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-zinc-200">
            {recentOrders.map((order) => (
              <div
                key={order._id}
                className="grid grid-cols-1 gap-3 border-b border-zinc-100 p-4 last:border-b-0 md:grid-cols-6 md:items-center"
              >
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-zinc-900">{truncateText(getOrderTitle(order.gigId), 55)}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
                    {getBuyerAvatar(order.clientId) ? (
                      <Image
                        src={getBuyerAvatar(order.clientId)}
                        alt={getBuyerName(order.clientId)}
                        width={20}
                        height={20}
                        unoptimized
                        className="h-5 w-5 rounded-full border border-zinc-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-[10px] font-semibold text-zinc-600">
                        {getBuyerName(order.clientId).slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span>{getBuyerName(order.clientId)}</span>
                  </div>
                </div>
                <div>
                  <Badge variant={getOrderStatusVariant(order.status)}>{order.status}</Badge>
                </div>
                <p className="text-sm font-semibold text-zinc-900">{formatPrice(order.amount)}</p>
                <p className="text-xs text-zinc-600">{formatDate(order.deliveredAt || order.deadline)}</p>
                <Link href={`/orders/${order._id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  View Order
                </Link>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Recent Proposals</h2>
          <Link
            href="/dashboard/freelancer/proposals"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View All
          </Link>
        </div>

        {proposalsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={`freelancer-proposal-row-skeleton-${index}`} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : null}

        {proposalsQuery.isError ? (
          <ErrorState
            title="Unable to load proposals"
            message={proposalsQuery.error instanceof Error ? proposalsQuery.error.message : 'Please try again.'}
            onRetry={() => {
              void proposalsQuery.refetch();
            }}
          />
        ) : null}

        {!proposalsQuery.isLoading && !proposalsQuery.isError && recentProposals.length === 0 ? (
          <EmptyState
            title="No proposals submitted"
            description="Browse projects and submit proposals to win work."
            actionLabel="Browse Projects"
            actionHref="/projects"
          />
        ) : null}

        {!proposalsQuery.isLoading && !proposalsQuery.isError && recentProposals.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-zinc-200">
            {recentProposals.map((proposal) => (
              <div
                key={proposal.id}
                className="grid grid-cols-1 gap-3 border-b border-zinc-100 p-4 last:border-b-0 md:grid-cols-5 md:items-center"
              >
                <p className="md:col-span-2 text-sm font-medium text-zinc-900">
                  {truncateText(proposal.projectTitle || 'Project', 60)}
                </p>
                <p className="text-sm font-semibold text-zinc-900">{formatPrice(proposal.bidAmount)}</p>
                <Badge variant={getProposalVariant(proposal.status)}>{proposal.status}</Badge>
                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <p className="text-xs text-zinc-600">{formatDate(proposal.createdAt)}</p>
                  <Link href={`/projects/${proposal.project}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    View Project
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
