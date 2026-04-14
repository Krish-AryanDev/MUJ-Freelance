'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle, DollarSign, FileText, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
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
import type { Project } from '@/types/project.types';
import { classNames, truncateText } from '@/utils/helpers';
import { formatDate } from '@/utils/formatDate';
import { formatPrice } from '@/utils/formatPrice';

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

const getProjectStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  if (status === 'completed') {
    return 'success';
  }

  if (status === 'open' || status === 'in-progress' || status === 'in_progress') {
    return 'info';
  }

  if (status === 'cancelled') {
    return 'danger';
  }

  return 'default';
};

const getGigTitle = (gig: Order['gigId']): string => {
  if (typeof gig === 'string') {
    return 'Gig';
  }

  return gig.title || 'Gig';
};

const getSellerName = (freelancer: Order['freelancerId']): string => {
  if (typeof freelancer === 'string') {
    return 'Freelancer';
  }

  return freelancer.fullName || 'Freelancer';
};

const getSellerAvatar = (freelancer: Order['freelancerId']): string => {
  if (typeof freelancer === 'string') {
    return '';
  }

  return freelancer.avatar?.url || '';
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

export default function ClientDashboardHomePage() {
  const router = useRouter();
  const { user, initialized, isLoading: isAuthLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    document.title = 'Client Dashboard | MUJ Freelance';
  }, []);

  useEffect(() => {
    if (initialized && !isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [initialized, isAuthenticated, isAuthLoading, router]);

  const ordersQuery = useQuery({
    queryKey: ['orders', 'client-dashboard'],
    queryFn: () => orderService.getMyOrders(),
    enabled: isAuthenticated,
  });

  const projectsQuery = useQuery({
    queryKey: ['projects', 'client-dashboard'],
    queryFn: () => projectService.getClientProjects(),
    enabled: isAuthenticated,
  });

  const orders = useMemo(() => {
    return ordersQuery.data?.success ? ordersQuery.data.data.orders : [];
  }, [ordersQuery.data]);

  const projects = projectsQuery.data ?? [];

  const stats = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status === 'active').length;
    const completedOrdersList = orders.filter((order) => order.status === 'completed');
    const completedOrders = completedOrdersList.length;
    const totalSpent = completedOrdersList.reduce((sum, order) => sum + order.amount, 0);

    return {
      activeOrders,
      completedOrders,
      totalSpent,
      postedProjects: projects.length,
    };
  }, [orders, projects.length]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
      .slice(0, 5);
  }, [orders]);

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
      .slice(0, 3);
  }, [projects]);

  if (isAuthLoading || !initialized) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={`client-dashboard-skeleton-${index}`} className="h-24 rounded-xl" />
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
            <h1 className="text-2xl font-bold text-zinc-900">Welcome back, {user?.fullName || 'Client'}!</h1>
            <p className="mt-1 text-sm text-zinc-600">{formatDate(new Date(), 'EEEE, dd MMM yyyy')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/client/projects"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Post a Project
            </Link>
            <Link
              href="/gigs"
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
            >
              Browse Gigs
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
          title="Total Spent"
          value={formatPrice(stats.totalSpent)}
          icon={<DollarSign className="h-5 w-5 text-yellow-600" />}
          accent="bg-yellow-50"
        />
        <StatCard
          title="Posted Projects"
          value={String(stats.postedProjects)}
          icon={<FileText className="h-5 w-5 text-purple-600" />}
          accent="bg-purple-50"
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Recent Orders</h2>
          <Link href="/dashboard/client/orders" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            View All
          </Link>
        </div>

        {ordersQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={`client-orders-row-skeleton-${index}`} className="h-16 rounded-lg" />
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
            description="Browse gigs and place your first order"
            actionLabel="Browse Gigs"
            actionHref="/gigs"
          />
        ) : null}

        {!ordersQuery.isLoading && !ordersQuery.isError && recentOrders.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-zinc-200">
            {recentOrders.map((order) => (
              <div key={order._id} className="grid grid-cols-1 gap-3 border-b border-zinc-100 p-4 last:border-b-0 md:grid-cols-6 md:items-center">
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-zinc-900">{truncateText(getGigTitle(order.gigId), 55)}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
                    {getSellerAvatar(order.freelancerId) ? (
                      <img
                        src={getSellerAvatar(order.freelancerId)}
                        alt={getSellerName(order.freelancerId)}
                        className="h-5 w-5 rounded-full border border-zinc-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-[10px] font-semibold text-zinc-600">
                        {getSellerName(order.freelancerId).slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span>{getSellerName(order.freelancerId)}</span>
                  </div>
                </div>
                <div>
                  <Badge variant={getOrderStatusVariant(order.status)}>{order.status}</Badge>
                </div>
                <p className="text-sm font-semibold text-zinc-900">{formatPrice(order.amount)}</p>
                <p className="text-xs text-zinc-600">{formatDate(order.createdAt)}</p>
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
          <h2 className="text-lg font-semibold text-zinc-900">My Projects</h2>
          <Link href="/dashboard/client/projects" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            View All
          </Link>
        </div>

        {projectsQuery.isLoading ? (
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={`client-project-card-skeleton-${index}`} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : null}

        {projectsQuery.isError ? (
          <ErrorState
            title="Unable to load projects"
            message={projectsQuery.error instanceof Error ? projectsQuery.error.message : 'Please try again.'}
            onRetry={() => {
              void projectsQuery.refetch();
            }}
          />
        ) : null}

        {!projectsQuery.isLoading && !projectsQuery.isError && recentProjects.length === 0 ? (
          <EmptyState
            title="No projects posted"
            description="Post your first project to start getting proposals."
            actionLabel="Post a Project"
            actionHref="/dashboard/client/projects"
          />
        ) : null}

        {!projectsQuery.isLoading && !projectsQuery.isError && recentProjects.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {recentProjects.map((project: Project) => (
              <article key={project.id} className="rounded-xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-zinc-900">{truncateText(project.title, 60)}</h3>
                  <Badge variant={getProjectStatusVariant(project.status)}>{project.status}</Badge>
                </div>
                <p className="mt-3 text-xs text-zinc-600">
                  Budget: {formatPrice(project.budget.min)} - {formatPrice(project.budget.max)}
                </p>
                <p className="mt-1 text-xs text-zinc-600">{project.proposalCount} proposals</p>
                <p className="mt-1 text-xs text-zinc-500">Posted {formatDate(project.createdAt)}</p>
                <Link
                  href={`/projects/${project.id}`}
                  className="mt-4 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View Project
                </Link>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

