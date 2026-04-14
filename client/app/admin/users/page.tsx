'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import UserTable from '@/components/admin/UserTable';
import { queryClient } from '@/lib/queryClient';
import adminService from '@/services/admin.service';

const USER_LIMIT = 20;

export default function Page() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: USER_LIMIT,
      search: search.trim() || undefined,
      role: role || undefined,
      status: status || undefined,
    }),
    [role, search, status],
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'users', queryParams],
    queryFn: () => adminService.getUsers(queryParams),
  });

  const banMutation = useMutation({
    mutationFn: (userId: string) => adminService.banUser(userId),
    onSuccess: (response) => {
      if (!response.success) {
        throw new Error(response.message || 'Failed to ban user');
      }

      toast.success('User banned successfully');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to ban user');
    },
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: string) => adminService.unbanUser(userId),
    onSuccess: (response) => {
      if (!response.success) {
        throw new Error(response.message || 'Failed to unban user');
      }

      toast.success('User unbanned successfully');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to unban user');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search by name or email"
          className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          <option value="">All roles</option>
          <option value="client">Client</option>
          <option value="freelancer">Freelancer</option>
          <option value="admin">Admin</option>
        </select>
        <select
          className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="pending_verification">Pending verification</option>
          <option value="suspended">Suspended</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {isLoading ? <div className="p-4 text-sm text-zinc-600">Loading users...</div> : null}

      {isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Failed to load users'}
        </div>
      ) : null}

      {data?.success ? (
        <UserTable
          users={data.data.users}
          onBanUser={async (userId) => {
            await banMutation.mutateAsync(userId);
          }}
          onUnbanUser={async (userId) => {
            await unbanMutation.mutateAsync(userId);
          }}
        />
      ) : null}
    </div>
  );
}

