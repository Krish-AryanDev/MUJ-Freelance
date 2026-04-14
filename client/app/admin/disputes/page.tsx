'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import DisputeCard from '@/components/admin/DisputeCard';
import { queryClient } from '@/lib/queryClient';
import adminService from '@/services/admin.service';

export default function Page() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'disputes'],
    queryFn: () => adminService.getDisputes({ page: 1, limit: 20 }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ orderId, resolutionNote }: { orderId: string; resolutionNote: string }) =>
      adminService.resolveDispute(orderId, resolutionNote),
    onSuccess: (response) => {
      if (!response.success) {
        throw new Error(response.message || 'Failed to resolve dispute');
      }

      toast.success('Dispute resolved');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to resolve dispute');
    },
  });

  return (
    <div className="space-y-4">
      {isLoading ? <div className="p-4 text-sm text-zinc-600">Loading disputes...</div> : null}

      {isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Failed to load disputes'}
        </div>
      ) : null}

      {data?.success && data.data.disputes.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
          No active disputes.
        </div>
      ) : null}

      {data?.success ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {data.data.disputes.map((dispute) => (
            <DisputeCard
              key={dispute._id}
              dispute={dispute}
              onResolve={async (orderId, resolutionNote) => {
                await resolveMutation.mutateAsync({ orderId, resolutionNote });
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

