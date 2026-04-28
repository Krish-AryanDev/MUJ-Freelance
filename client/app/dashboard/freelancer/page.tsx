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
  if (status === 'completed') return 'success';
  if (status === 'active' || status === 'delivered') return 'info';
  if (status === 'revision') return 'warning';
  if (status === 'cancelled' || status === 'disputed') return 'danger';
  return 'default';
};

const getBuyerName = (client: Order['clientId']): string => {
  if (typeof client === 'string') return 'Client';
  return client.fullName || 'Client';
};

const getBuyerAvatar = (client: Order['clientId']): string => {
  if (typeof client === 'string') return '';
  return client.avatar?.url || '';
};

const getOrderTitle = (gig: Order['gigId']): string => {
  if (typeof gig === 'string') return 'Order';
  return gig.title || 'Order';
};

const getOrderFreelancerId = (freelancer: Order['freelancerId']): string => {
  if (typeof freelancer === 'string') return freelancer;
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
  <div className="relative overflow-hidden rounded-xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-l-4 border-[#87A878]">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">{title}</p>
        <p className="mt-2 text-2xl font-bold text-[#1a1a1a]">{value}</p>
      </div>
      <div className={classNames('rounded-full p-2', accent)}>{icon}</div>
    </div>
    <div className="mt-4 flex items-end gap-1 h-8">
      {[40, 70, 45, 90, 65, 85, 60].map((height, i) => (
        <div key={i} className="w-full bg-[#87A878]/10 rounded-t-sm relative" style={{ height: '100%' }}>
          <div className="absolute bottom-0 w-full bg-[#87A878] rounded-t-sm transition-all duration-500" style={{ height: `${height}%` }} />
        </div>
      ))}
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
    
    // Earnings calculation
    const totalEarnings = completedOrdersList.reduce(
      (sum, order) => sum + calculateFreelancerPayout(order.amount),
      0,
    );
    const pendingEarnings = freelancerOrders.filter(o => o.status === 'active' || o.status === 'delivered').reduce(
      (sum, order) => sum + calculateFreelancerPayout(order.amount),
      0,
    );
    
    const activeProposals = proposals.filter(
      (proposal) => proposal.status === 'pending' || proposal.status === 'shortlisted',
    ).length;
    const totalProposals = proposals.length;

    return {
      activeOrders,
      completedOrders,
      totalEarnings,
      pendingEarnings,
      activeProposals,
      totalProposals,
    };
  }, [freelancerOrders, proposals]);

  const recentOrders = useMemo(() => {
    return [...freelancerOrders]
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
      .slice(0, 5);
  }, [freelancerOrders]);

  if (isAuthLoading || !initialized) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`skeleton-${index}`} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const earningsTotal = stats.totalEarnings + stats.pendingEarnings;
  const earningsCompletedPct = earningsTotal > 0 ? (stats.totalEarnings / earningsTotal) * 100 : 0;
  const earningsPendingPct = earningsTotal > 0 ? (stats.pendingEarnings / earningsTotal) * 100 : 0;

  return (
    <div className="space-y-6 pb-10">
      {/* 1. TOP HEADER SECTION */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Welcome back, {user?.fullName || 'Freelancer'}!</h1>
          <p className="mt-1 text-sm font-medium text-[#6B7280]">{formatDate(new Date(), 'EEEE, dd MMM yyyy')}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <Link
            href="/projects"
            className="rounded-lg bg-[#87A878] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#769767]"
          >
            Browse Projects
          </Link>
          <Link
            href="/dashboard/freelancer/proposals"
            className="rounded-lg border border-[#87A878] bg-white px-5 py-2.5 text-sm font-medium text-[#87A878] transition hover:bg-zinc-50"
          >
            View Proposals
          </Link>
        </div>
      </section>

      {/* 2. STATS CARDS ROW */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      {/* 3. MAIN CONTENT AREA */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1a1a1a]">Recent Orders</h2>
              <Link
                href="/dashboard/freelancer/orders"
                className="text-sm font-semibold text-[#87A878] hover:underline"
              >
                View All
              </Link>
            </div>

            {ordersQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={`row-skeleton-${index}`} className="h-16 rounded-lg" />
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
                icon={<ShoppingBag className="mx-auto h-8 w-8 text-[#87A878]" />}
                title="No orders yet"
                description="Apply to projects to start receiving orders"
                actionLabel="Browse Projects"
                actionHref="/projects"
              />
            ) : null}

            {!ordersQuery.isLoading && !ordersQuery.isError && recentOrders.length > 0 ? (
              <div className="divide-y divide-zinc-100/80">
                {recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="grid grid-cols-1 gap-4 py-4 first:pt-0 last:pb-0 md:grid-cols-6 md:items-center transition-colors hover:bg-[#87A878]/[0.03] -mx-4 px-4 rounded-lg"
                  >
                    <div className="md:col-span-2">
                      <p className="text-[15px] font-bold text-[#1a1a1a] leading-tight">
                        {truncateText(getOrderTitle(order.gigId), 55)}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs font-medium text-[#6B7280]">
                        {getBuyerAvatar(order.clientId) ? (
                          <Image
                            src={getBuyerAvatar(order.clientId)}
                            alt={getBuyerName(order.clientId)}
                            width={24}
                            height={24}
                            unoptimized
                            className="h-6 w-6 rounded-full border border-zinc-200 object-cover shadow-sm"
                          />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600 shadow-sm">
                            {getBuyerName(order.clientId).slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span>{getBuyerName(order.clientId)}</span>
                      </div>
                    </div>
                    <div>
                      <Badge variant={getOrderStatusVariant(order.status)}>{order.status}</Badge>
                    </div>
                    <p className="text-sm font-bold text-[#1a1a1a]">{formatPrice(order.amount)}</p>
                    <p className="text-xs font-medium text-[#6B7280]">{formatDate(order.createdAt)}</p>
                    <div className="text-right">
                      <Link href={`/orders/${order._id}`} className="text-sm font-bold text-[#87A878] hover:underline">
                        View Order
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Earnings Summary Card */}
          <div className="rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-6">Earnings Overview</h2>
            
            <div className="mb-8">
              <div className="relative mx-auto h-40 w-40">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <path
                    className="text-zinc-100"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {earningsTotal > 0 && (
                    <path
                      className="text-[#87A878] transition-all duration-1000 ease-out"
                      strokeDasharray={`${earningsCompletedPct}, 100`}
                      strokeWidth="4"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Total</span>
                  <span className="text-xl font-bold text-[#1a1a1a]">{formatPrice(stats.totalEarnings)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-[#87A878]"></div>
                    <span className="font-medium text-[#6B7280]">Completed</span>
                  </div>
                  <span className="font-bold text-[#1a1a1a]">{formatPrice(stats.totalEarnings)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-zinc-200"></div>
                    <span className="font-medium text-[#6B7280]">Pending</span>
                  </div>
                  <span className="font-bold text-[#1a1a1a]">{formatPrice(stats.pendingEarnings)}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-zinc-100">
              <p className="text-sm font-medium text-[#6B7280]">Total Earnings</p>
              <p className="text-3xl font-bold text-[#1a1a1a] mt-1">{formatPrice(stats.totalEarnings)}</p>
            </div>
          </div>

          {/* Proposals Summary Card */}
          <div className="rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-[#1a1a1a]">Proposals</h2>
              <Link href="/dashboard/freelancer/proposals" className="text-xs font-bold text-[#87A878] hover:underline">
                View All
              </Link>
            </div>
            
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Active Proposals</p>
            <p className="text-4xl font-bold text-[#1a1a1a] mt-1">{stats.activeProposals}</p>
            
            <div className="mt-6">
              <div className="flex justify-between text-xs font-medium text-[#6B7280] mb-2">
                <span>Success Rate (Active/Total)</span>
                <span>
                  {stats.totalProposals > 0 
                    ? Math.round((stats.activeProposals / stats.totalProposals) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#87A878] rounded-full transition-all duration-1000"
                  style={{ width: `${stats.totalProposals > 0 ? (stats.activeProposals / stats.totalProposals) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
