'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { reviewService } from '@/services/review.service';
import type { ReviewFilters } from '@/types/review.types';
import { classNames } from '../../utils/helpers';
import EmptyState from '../shared/EmptyState';
import ErrorState from '../shared/ErrorState';
import RatingBreakdown from '../reviews/RatingBreakdown';
import ReviewCard from '../reviews/ReviewCard';
import Skeleton from '../ui/Skeleton';

interface ReviewsSectionProps {
  reviews?: unknown[];
  userId?: string;
  title?: string;
  emptyMessage?: string;
  className?: string;
}

export default function ReviewsSection({
  userId,
  title = 'Reviews',
  emptyMessage = 'No reviews yet.',
  className,
}: ReviewsSectionProps) {
  const params = useParams<{ id: string }>();
  const targetUserId = userId || String(params?.id || '');

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ReviewFilters['sort']>('recent');

  const reviewsQuery = useQuery({
    queryKey: ['user-reviews', targetUserId, page, sort],
    queryFn: () =>
      reviewService.getUserReviews(targetUserId, {
        page,
        limit: 5,
        sort,
      }),
    enabled: Boolean(targetUserId),
  });

  const payload = reviewsQuery.data?.success
    ? reviewsQuery.data.data
    : {
        reviews: [],
        totalReviews: 0,
        averageRating: 0,
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        currentPage: 1,
        totalPages: 1,
      };

  return (
    <section className={classNames('rounded-xl border border-zinc-200 bg-white p-5 shadow-sm', className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as ReviewFilters['sort']);
            setPage(1);
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
        >
          <option value="recent">Most Recent</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
      </div>

      <RatingBreakdown
        breakdown={payload.ratingBreakdown}
        totalReviews={payload.totalReviews}
        averageRating={payload.averageRating}
      />

      <div className="mt-4 space-y-3">
        {reviewsQuery.isLoading ? (
          <>
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </>
        ) : null}

        {reviewsQuery.isError ? (
          <ErrorState
            title="Unable to load reviews"
            message={reviewsQuery.error instanceof Error ? reviewsQuery.error.message : 'Please try again.'}
            onRetry={() => {
              void reviewsQuery.refetch();
            }}
          />
        ) : null}

        {!reviewsQuery.isLoading && !reviewsQuery.isError && payload.reviews.length === 0 ? (
          <EmptyState title="No reviews yet" description={emptyMessage} />
        ) : null}

        {!reviewsQuery.isLoading && !reviewsQuery.isError && payload.reviews.length > 0 ? (
          <>
            {payload.reviews.map((review) => (
              <ReviewCard key={review._id} review={review} showGigTitle />
            ))}

            <div className="flex items-center justify-between border-t border-zinc-200 pt-3">
              <button
                type="button"
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-50"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={payload.currentPage <= 1}
              >
                Previous
              </button>

              <span className="text-xs text-zinc-600">
                Page {payload.currentPage} of {payload.totalPages}
              </span>

              <button
                type="button"
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-50"
                onClick={() => setPage((prev) => Math.min(prev + 1, payload.totalPages))}
                disabled={payload.currentPage >= payload.totalPages}
              >
                Next
              </button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

export type { ReviewsSectionProps };
