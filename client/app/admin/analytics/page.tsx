'use client';

import { useQuery } from '@tanstack/react-query';

import RevenueChart from '@/components/admin/RevenueChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import adminService from '@/services/admin.service';

export default function Page() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: adminService.getAnalytics,
  });

  if (isLoading) {
    return <div className="p-4 text-sm text-zinc-600">Loading analytics...</div>;
  }

  if (isError || !data?.success) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error instanceof Error ? error.message : data?.message || 'Failed to load analytics'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RevenueChart data={data.data.monthlyRevenue} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Roles Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.data.usersByRole.map((item) => (
              <div key={item.role} className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2">
                <span className="text-sm capitalize text-zinc-700">{item.role}</span>
                <span className="text-sm font-semibold text-zinc-900">{item.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.data.ordersByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2">
                <span className="text-sm capitalize text-zinc-700">{item.status}</span>
                <span className="text-sm font-semibold text-zinc-900">{item.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

