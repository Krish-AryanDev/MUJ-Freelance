'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import EmptyState from '../../../../components/shared/EmptyState';
import ErrorState from '../../../../components/shared/ErrorState';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import Pagination from '../../../../components/ui/Pagination';
import Select from '../../../../components/ui/Select';
import Skeleton from '../../../../components/ui/Skeleton';
import { gigService } from '../../../../services/gig.service';
import type { GigStatus } from '../../../../types/gig.types';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
];

const badgeVariantByStatus: Record<GigStatus, 'default' | 'success' | 'warning' | 'danger'> = {
  active: 'success',
  draft: 'default',
  published: 'success',
  paused: 'warning',
  archived: 'danger',
};

export default function Page() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<GigStatus | undefined>(undefined);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-gigs', page, status],
    queryFn: () =>
      gigService.listMyGigs({
        page,
        limit: 10,
        status,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ gigId, nextStatus }: { gigId: string; nextStatus: GigStatus }) =>
      gigService.updateGigStatus(gigId, nextStatus),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-gigs'] });
      await queryClient.invalidateQueries({ queryKey: ['gigs'] });
    },
  });

  const deleteGigMutation = useMutation({
    mutationFn: (gigId: string) => gigService.deleteGig(gigId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-gigs'] });
      await queryClient.invalidateQueries({ queryKey: ['gigs'] });
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">My Gigs</h1>
          <p className="text-sm text-zinc-600">Manage your listings, status, and updates.</p>
        </div>
        <Link href="/dashboard/freelancer/gigs/create">
          <Button>Create Gig</Button>
        </Link>
      </div>

      <div className="max-w-xs">
        <Select
          label="Filter by status"
          value={status ?? ''}
          onChange={(event) => {
            setStatus((event.target.value || undefined) as GigStatus | undefined);
            setPage(1);
          }}
          options={statusOptions}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`gig-row-skeleton-${index}`} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <ErrorState
          title="Unable to load your gigs"
          message={error instanceof Error ? error.message : 'Please try again later.'}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      {!isLoading && !isError && (data?.gigs.length ?? 0) === 0 ? (
        <EmptyState
          title="No gigs yet"
          description="Create your first gig to start receiving orders."
          actionLabel="Create gig"
          actionHref="/dashboard/freelancer/gigs/create"
        />
      ) : null}

      {!isLoading && !isError ? (
        <div className="space-y-3">
          {data?.gigs.map((gig) => (
            <Card key={gig.id}>
              <CardHeader className="mb-1 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{gig.title}</CardTitle>
                <Badge variant={badgeVariantByStatus[gig.status]}>{gig.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="line-clamp-2 text-sm text-zinc-600">{gig.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/gigs/${gig.slug || gig.id}`}>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </Link>
                  <Link href={`/dashboard/freelancer/gigs/edit/${gig.id}`}>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </Link>

                  {gig.status !== 'published' ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        updateStatusMutation.mutate({ gigId: gig.id, nextStatus: 'published' });
                      }}
                      isLoading={updateStatusMutation.isPending}
                    >
                      Publish
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        updateStatusMutation.mutate({ gigId: gig.id, nextStatus: 'paused' });
                      }}
                      isLoading={updateStatusMutation.isPending}
                    >
                      Pause
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      deleteGigMutation.mutate(gig.id);
                    }}
                    isLoading={deleteGigMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="flex justify-center">
        <Pagination
          page={data?.pagination?.page ?? page}
          totalPages={data?.pagination?.totalPages ?? 1}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

