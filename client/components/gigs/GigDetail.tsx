"use client";

import { useMutation } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { toast } from 'react-hot-toast';

import { messageService } from '@/services/message.service';
import { reviewService } from '@/services/review.service';
import { authStore } from '@/store/authStore';
import type { ReviewFilters } from '@/types/review.types';

import { GIG_CATEGORIES } from '../../constants/categories';
import type { Gig } from '../../types/gig.types';
import EmptyState from '../shared/EmptyState';
import ErrorState from '../shared/ErrorState';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import GigImageSlider from './GigImageSlider';
import GigPackages from './GigPackages';
import RatingBreakdown from '../reviews/RatingBreakdown';
import ReviewCard from '../reviews/ReviewCard';

interface GigDetailProps {
  gig: Gig;
}

type GigWithSeller = Gig & {
  _id?: string;
  freelancer?: {
    _id?: string;
    name?: string;
  };
};

const resolveCategoryLabel = (category: string): string => {
  return GIG_CATEGORIES.find((item) => item.value === category)?.label ?? category.replaceAll('_', ' ');
};

export default function GigDetail({ gig }: GigDetailProps) {
  const router = useRouter();
  const { user } = useSyncExternalStore(authStore.subscribe, authStore.getState, authStore.getState);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewSort, setReviewSort] = useState<ReviewFilters['sort']>('recent');

  const extendedGig = gig as GigWithSeller;
  const sellerId = extendedGig.freelancer?._id || gig.createdBy.id;
  const gigId = extendedGig._id || gig.id;
  const currentUserId = user?.id || '';
  const isSeller = Boolean(currentUserId) && currentUserId === sellerId;
  const isLoggedIn = Boolean(user);

  const reviewsQuery = useQuery({
    queryKey: ['gig-reviews', gigId, reviewPage, reviewSort],
    queryFn: () =>
      reviewService.getGigReviews(gigId, {
        page: reviewPage,
        limit: 5,
        sort: reviewSort,
      }),
    enabled: Boolean(gigId),
  });

  const reviewsPayload = reviewsQuery.data?.success
    ? reviewsQuery.data.data
    : {
        reviews: [],
        totalReviews: 0,
        averageRating: 0,
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        currentPage: 1,
        totalPages: 1,
      };

  const { mutate: startConversation, isPending } = useMutation({
    mutationFn: () =>
      messageService.getOrCreateConversation({
        otherUserId: sellerId,
        relatedGig: gigId,
      }),
    onSuccess: (response) => {
      if (!response.success) {
        toast.error(response.message || 'Failed to start conversation. Try again.');
        return;
      }

      router.push(`/messages/${response.data._id}`);
    },
    onError: () => {
      toast.error('Failed to start conversation. Try again.');
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
      <div className="space-y-4">
        <GigImageSlider images={gig.images} title={gig.title} />

        <Card>
          <CardHeader>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge>{resolveCategoryLabel(gig.category)}</Badge>
              <Badge variant="info">{gig.status}</Badge>
            </div>
            <CardTitle className="text-2xl">{gig.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-relaxed text-zinc-700">{gig.description}</p>

            <div className="flex flex-wrap gap-2">
              {gig.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">
                  #{tag}
                </span>
              ))}
            </div>

            {gig.faqs.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Frequently asked questions</h3>
                <div className="space-y-3">
                  {gig.faqs.map((faq) => (
                    <div key={faq.question} className="rounded-lg border border-zinc-200 p-3">
                      <p className="font-medium text-zinc-900">{faq.question}</p>
                      <p className="mt-1 text-sm text-zinc-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-xl">Reviews</CardTitle>
              <select
                value={reviewSort}
                onChange={(event) => {
                  setReviewSort(event.target.value as ReviewFilters['sort']);
                  setReviewPage(1);
                }}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
              >
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
            </div>

            <RatingBreakdown
              breakdown={reviewsPayload.ratingBreakdown}
              totalReviews={reviewsPayload.totalReviews}
              averageRating={reviewsPayload.averageRating}
            />
          </CardHeader>

          <CardContent className="space-y-3">
            {reviewsQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={`gig-review-skeleton-${index}`} className="h-28 rounded-lg" />
                ))}
              </div>
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

            {!reviewsQuery.isLoading && !reviewsQuery.isError && reviewsPayload.reviews.length === 0 ? (
              <EmptyState
                title="No reviews yet"
                description="This gig has not received reviews yet."
              />
            ) : null}

            {!reviewsQuery.isLoading && !reviewsQuery.isError && reviewsPayload.reviews.length > 0 ? (
              <>
                <div className="space-y-3">
                  {reviewsPayload.reviews.map((review) => (
                    <ReviewCard key={review._id} review={review} />
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-zinc-200 pt-3">
                  <button
                    type="button"
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-50"
                    onClick={() => setReviewPage((previous) => Math.max(previous - 1, 1))}
                    disabled={reviewPage <= 1}
                  >
                    Previous
                  </button>

                  <span className="text-xs text-zinc-600">
                    Page {reviewsPayload.currentPage} of {reviewsPayload.totalPages}
                  </span>

                  <button
                    type="button"
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-50"
                    onClick={() =>
                      setReviewPage((previous) => Math.min(previous + 1, reviewsPayload.totalPages))
                    }
                    disabled={reviewPage >= reviewsPayload.totalPages}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Avatar src={gig.createdBy.avatar?.url} fallback={gig.createdBy.fullName} size="lg" />
            <div>
              <p className="font-semibold text-zinc-900">{gig.createdBy.fullName}</p>
              <p className="text-sm text-zinc-600">{gig.totalOrders} completed orders</p>
              <p className="text-xs text-zinc-500">Joined {format(new Date(gig.createdAt), 'MMM yyyy')}</p>
            </div>
          </CardContent>
        </Card>

        <GigPackages packages={gig.packages} />

        {!isSeller ? (
          <button
            onClick={() => {
              if (!isLoggedIn) {
                router.push('/login');
                return;
              }

              startConversation();
            }}
            disabled={isLoggedIn ? isPending : false}
            className="w-full flex items-center justify-center gap-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg py-3 px-4 font-medium transition-colors disabled:opacity-50"
          >
            <MessageSquare className="h-4 w-4" />
            {isLoggedIn ? (isPending ? 'Opening chat...' : 'Message Seller') : 'Message Seller'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
