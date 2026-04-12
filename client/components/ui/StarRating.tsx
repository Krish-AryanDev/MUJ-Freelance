'use client';

import { classNames } from '../../utils/helpers';

interface StarRatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  className?: string;
}

export default function StarRating({
  value,
  max = 5,
  onChange,
  readOnly = false,
  className,
}: StarRatingProps) {
  return (
    <div className={classNames('inline-flex items-center gap-1', className)}>
      {Array.from({ length: max }, (_, index) => index + 1).map((starValue) => {
        const isFilled = starValue <= value;

        return (
          <button
            key={starValue}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(starValue)}
            className={classNames(
              'text-xl leading-none transition-colors',
              isFilled ? 'text-yellow-400' : 'text-zinc-300',
              readOnly ? 'cursor-default' : 'cursor-pointer',
            )}
            aria-label={`Rate ${starValue} out of ${max}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
