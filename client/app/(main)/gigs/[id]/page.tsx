'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

import GigDetail from '../../../../components/gigs/GigDetail';
import ErrorState from '../../../../components/shared/ErrorState';
import Skeleton from '../../../../components/ui/Skeleton';
import { gigService } from '../../../../services/gig.service';

export default function Page() {
  const params = useParams<{ id: string }>();
  const gigId = String(params?.id || '');
  console.log('[GigDetailPage] gigId param', gigId);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['gig-detail', gigId],
    queryFn: async () => {
      try {
        const gig = await gigService.getGigById(gigId);
        console.log('[GigDetailPage] API response gig', gig);
        return gig;
      } catch (queryError) {
        console.error('[GigDetailPage] API error', queryError);
        throw queryError;
      }
    },
    enabled: Boolean(gigId),
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <ErrorState
          title="Gig not found"
          message={error instanceof Error ? error.message : 'Please try again later.'}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <GigDetail gig={data} />
    </div>
  );
}

