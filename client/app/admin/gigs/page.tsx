'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import GigTable from '@/components/admin/GigTable';
import { queryClient } from '@/lib/queryClient';
import adminService from '@/services/admin.service';

const GIG_LIMIT = 20;

export default function Page() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: GIG_LIMIT,
      search: search.trim() || undefined,
      status: status || undefined,
    }),
    [search, status],
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'gigs', queryParams],
    queryFn: () => adminService.getGigs(queryParams),
  });

  const approveGigMutation = useMutation({
    mutationFn: (gigId: string) => adminService.approveGig(gigId),
    onSuccess: (response) => {
      if (!response.success) {
        throw new Error(response.message || 'Failed to approve gig');
      }

      toast.success('Gig approved');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'gigs'] });
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to approve gig');
    },
  });

  const rejectGigMutation = useMutation({
    mutationFn: (gigId: string) => adminService.rejectGig(gigId),
    onSuccess: (response) => {
      if (!response.success) {
        throw new Error(response.message || 'Failed to reject gig');
      }

      toast.success('Gig rejected');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'gigs'] });
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to reject gig');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search gigs"
          className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {isLoading ? <div className="p-4 text-sm text-zinc-600">Loading gigs...</div> : null}

      {isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Failed to load gigs'}
        </div>
      ) : null}

      {data?.success ? (
        <GigTable
          gigs={data.data.gigs}
          onApproveGig={async (gigId) => {
            await approveGigMutation.mutateAsync(gigId);
          }}
          onRejectGig={async (gigId) => {
            await rejectGigMutation.mutateAsync(gigId);
          }}
        />
      ) : null}
    </div>
  );
}

