'use client';

import { Edit3, Trash2 } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import type { Review } from '@/types/review.types';
import { formatDate } from '@/utils/formatDate';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import StarRating from '../ui/StarRating';

interface ReviewCardProps {
  review: Review;
  showGigTitle?: boolean;
  showActions?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
}

export default function ReviewCard({
  review,
  showGigTitle = false,
  showActions = false,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  const { user } = useAuth();
  const canManage = showActions && user?.id === review.reviewer._id;
  const reviewTypeLabel =
    review.type === 'freelancer_to_client' ? 'Client Behavior Review' : 'Service Review';

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar
            src={review.reviewer.avatar}
            alt={review.reviewer.name}
            fallback={review.reviewer.name}
            size="md"
          />
          <div>
            <p className="text-sm font-semibold text-zinc-900">{review.reviewer.name}</p>
            <p className="text-xs text-zinc-500">{formatDate(review.createdAt, 'dd MMM yyyy')}</p>
            <p className="mt-1 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
              {reviewTypeLabel}
            </p>
          </div>
        </div>

        <StarRating value={review.rating} readOnly />
      </div>

      {showGigTitle && review.gig?.title ? (
        <p className="mt-2 text-xs font-medium text-zinc-600">Gig: {review.gig.title}</p>
      ) : null}

      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        {review.comment?.trim().length > 0 ? review.comment : 'Review text is unavailable.'}
      </p>

      {canManage ? (
        <div className="mt-3 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Edit3 className="h-3.5 w-3.5" />}
            onClick={() => onEdit?.(review)}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => onDelete?.(review._id)}
          >
            Delete
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export type { ReviewCardProps };
