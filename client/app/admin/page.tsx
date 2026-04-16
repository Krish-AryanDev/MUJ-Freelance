'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, FileText, IndianRupee, ShoppingCart, Users } from 'lucide-react';

import RevenueChart from '@/components/admin/RevenueChart';
import StatsCard from '@/components/admin/StatsCard';
import adminService from '@/services/admin.service';

export default function Page() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: adminService.getDashboardStats,
  });

  if (isLoading) {
    return <div className="p-4 text-sm text-zinc-600">Loading dashboard stats...</div>;
  }

  if (isError || !data?.success) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error instanceof Error ? error.message : data?.message || 'Failed to load dashboard'}
      </div>
    );
  }

  const { stats, monthlyRevenue } = data.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard title="Total Users" value={stats.totalUsers} icon={Users} />
        <StatsCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} />
        <StatsCard title="Total Projects" value={stats.totalProjects} icon={FileText} />
        <StatsCard title="Open Disputes" value={stats.disputedOrders} icon={AlertCircle} />
        <StatsCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
          icon={IndianRupee}
        />
      </div>

      <RevenueChart data={monthlyRevenue} />
    </div>
  );
}

