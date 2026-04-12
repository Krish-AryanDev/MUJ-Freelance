import Avatar from '../ui/Avatar';
import StarRating from '../ui/StarRating';
import { classNames, truncateText } from '../../utils/helpers';

interface ReviewItem {
  id: string;
  reviewerName: string;
  reviewerAvatarUrl?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

interface ReviewsSectionProps {
  reviews: ReviewItem[];
  title?: string;
  emptyMessage?: string;
  className?: string;
}

const formatDate = (value?: string): string | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function ReviewsSection({
  reviews,
  title = 'Reviews',
  emptyMessage = 'No reviews yet.',
  className,
}: ReviewsSectionProps) {
  return (
    <section className={classNames('rounded-xl border border-zinc-200 bg-white p-5 shadow-sm', className)}>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>

      {reviews.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">{emptyMessage}</p>
      ) : (
        <div className="mt-4 space-y-4">
          {reviews.map((review) => {
            const formattedDate = formatDate(review.createdAt);

            return (
              <article key={review.id} className="rounded-lg border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={review.reviewerAvatarUrl}
                      alt={review.reviewerName}
                      fallback={review.reviewerName}
                      size="md"
                    />
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{review.reviewerName}</p>
                      {formattedDate ? <p className="text-xs text-zinc-500">{formattedDate}</p> : null}
                    </div>
                  </div>

                  <StarRating value={Math.max(0, Math.min(5, review.rating))} readOnly />
                </div>

                {review.comment ? (
                  <p className="mt-3 text-sm leading-relaxed text-zinc-700">
                    {truncateText(review.comment, 420)}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export type { ReviewItem };
