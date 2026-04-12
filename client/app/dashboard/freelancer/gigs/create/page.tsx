'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import GigCreateForm from '../../../../../components/gigs/GigCreateForm';
import ErrorState from '../../../../../components/shared/ErrorState';
import { gigService } from '../../../../../services/gig.service';
import type { CreateGigRequest } from '../../../../../types/gig.types';

export default function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createGigMutation = useMutation({
    mutationFn: (payload: CreateGigRequest) => gigService.createGig(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-gigs'] });
      await queryClient.invalidateQueries({ queryKey: ['gigs'] });
      router.push('/dashboard/freelancer/gigs');
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Create New Gig</h1>
        <p className="text-sm text-zinc-600">Add your service details and publish when ready.</p>
      </div>

      {createGigMutation.isError ? (
        <ErrorState
          title="Unable to create gig"
          message={createGigMutation.error instanceof Error ? createGigMutation.error.message : 'Please try again.'}
        />
      ) : null}

      <GigCreateForm
        mode="create"
        isSubmitting={createGigMutation.isPending}
        onSubmit={async (payload) => {
          await createGigMutation.mutateAsync(payload as CreateGigRequest);
        }}
      />
    </div>
  );
}

