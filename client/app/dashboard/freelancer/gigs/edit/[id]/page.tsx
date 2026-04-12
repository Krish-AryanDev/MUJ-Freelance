'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';

import GigCreateForm from '../../../../../../components/gigs/GigCreateForm';
import ErrorState from '../../../../../../components/shared/ErrorState';
import Skeleton from '../../../../../../components/ui/Skeleton';
import { gigService } from '../../../../../../services/gig.service';
import type { UpdateGigRequest } from '../../../../../../types/gig.types';

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const gigId = String(params?.id || '');

  const gigQuery = useQuery({
    queryKey: ['gig-edit', gigId],
    queryFn: () => gigService.getGigById(gigId),
    enabled: Boolean(gigId),
  });

  const updateGigMutation = useMutation({
    mutationFn: (payload: UpdateGigRequest) => gigService.updateGig(gigId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-gigs'] });
      await queryClient.invalidateQueries({ queryKey: ['gigs'] });
      await queryClient.invalidateQueries({ queryKey: ['gig-detail', gigId] });
      router.push('/dashboard/freelancer/gigs');
    },
  });

  if (gigQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[650px] rounded-xl" />
      </div>
    );
  }

  if (gigQuery.isError || !gigQuery.data) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <ErrorState
          title="Unable to load gig"
          message={gigQuery.error instanceof Error ? gigQuery.error.message : 'Please try again.'}
          onRetry={() => {
            void gigQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Edit Gig</h1>
        <p className="text-sm text-zinc-600">Update details, packages, and status for this listing.</p>
      </div>

      {updateGigMutation.isError ? (
        <ErrorState
          title="Unable to update gig"
          message={updateGigMutation.error instanceof Error ? updateGigMutation.error.message : 'Please try again.'}
        />
      ) : null}

      <GigCreateForm
        mode="edit"
        initialValues={gigQuery.data}
        isSubmitting={updateGigMutation.isPending}
        onSubmit={async (payload) => {
          await updateGigMutation.mutateAsync(payload as UpdateGigRequest);
        }}
      />
    </div>
  );
}

