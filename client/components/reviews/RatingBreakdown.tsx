import StarRating from '../ui/StarRating';
import type { RatingBreakdownData } from '@/types/review.types';

interface RatingBreakdownProps {
  breakdown: RatingBreakdownData;
  totalReviews: number;
  averageRating: number;
}

const ratingLevels = [5, 4, 3, 2, 1] as const;

export default function RatingBreakdown({ breakdown, totalReviews, averageRating }: RatingBreakdownProps) {
  if (totalReviews === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
        No reviews yet
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-3xl font-bold text-zinc-900">{averageRating.toFixed(1)}</p>
          <StarRating value={Math.round(averageRating)} readOnly />
          <p className="mt-1 text-xs text-zinc-600">{totalReviews} reviews</p>
        </div>
      </div>

      <div className="space-y-2">
        {ratingLevels.map((rating) => {
          const count = Number(breakdown[rating] || 0);
          const width = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

          return (
            <div key={rating} className="grid grid-cols-[42px_1fr_34px] items-center gap-2 text-xs text-zinc-700">
              <span>{rating} star</span>
              <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200">
                <div className="h-full rounded-full bg-yellow-400" style={{ width: `${width}%` }} />
              </div>
              <span className="text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { RatingBreakdownProps };
