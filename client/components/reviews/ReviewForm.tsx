'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { z } from 'zod';

import { reviewService } from '@/services/review.service';
import type { Review, ReviewFormData } from '@/types/review.types';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';

interface ReviewFormProps {
  orderId: string;
  gigId?: string;
  revieweeId: string;
  revieweeName: string;
  type: 'client_to_freelancer' | 'freelancer_to_client';
  existingReview?: Review;
  onSuccess: (review: Review) => void;
  onCancel: () => void;
}

const schema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(1000),
});

type FormValues = z.infer<typeof schema>;

const ratingLabels: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export default function ReviewForm({
  orderId,
  gigId,
  revieweeName,
  type,
  existingReview,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [hoveredRating, setHoveredRating] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      rating: existingReview?.rating || 5,
      comment: existingReview?.comment || '',
    },
  });

  const selectedRating = form.watch('rating');
  const comment = form.watch('comment');

  const mutation = useMutation({
    mutationFn: async (payload: ReviewFormData) => {
      if (existingReview) {
        return reviewService.updateReview(existingReview._id, payload);
      }

      return reviewService.createReview(payload);
    },
    onSuccess: (response) => {
      if (!response.success) {
        toast.error(response.message || 'Failed to submit review');
        return;
      }

      toast.success(existingReview ? 'Review updated successfully' : 'Review submitted successfully');
      onSuccess(response.data);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to submit review');
    },
  });

  const effectiveRating = hoveredRating || selectedRating;

  const ratingText = useMemo(() => ratingLabels[selectedRating] || '', [selectedRating]);
  const isClientBehaviorReview = type === 'freelancer_to_client';

  const handleSubmit = form.handleSubmit((values) => {
    mutation.mutate({
      orderId,
      gigId,
      rating: values.rating,
      comment: values.comment,
      type,
    });
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-zinc-900">
          {isClientBehaviorReview ? 'Review Client Behavior' : `Review for ${revieweeName}`}
        </p>
        <p className="text-xs text-zinc-500">
          {isClientBehaviorReview
            ? 'Rate the client\'s communication, professionalism, and collaboration.'
            : 'Share your experience honestly.'}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-900">Rating</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => {
            const isActive = value <= effectiveRating;
            return (
              <button
                key={value}
                type="button"
                className={`text-2xl leading-none transition-colors ${isActive ? 'text-yellow-400' : 'text-zinc-300'}`}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => form.setValue('rating', value, { shouldValidate: true })}
                aria-label={`Rate ${value} stars`}
              >
                ★
              </button>
            );
          })}
        </div>
        <p className="text-xs text-zinc-600">{ratingText}</p>
        {form.formState.errors.rating ? (
          <p className="text-xs text-red-600">{form.formState.errors.rating.message}</p>
        ) : null}
      </div>

      <Textarea
        label={isClientBehaviorReview ? 'Behavior Feedback' : 'Comment'}
        rows={4}
        placeholder={
          isClientBehaviorReview
            ? 'Describe how the client behaved during the project.'
            : 'Share details about your experience.'
        }
        value={comment}
        onChange={(event) => {
          form.setValue('comment', event.target.value, { shouldValidate: true });
        }}
        error={form.formState.errors.comment?.message}
      />

      <p className="text-right text-xs text-zinc-500">{comment.length} / 1000</p>

      <div className="flex items-center gap-2">
        <Button type="submit" isLoading={mutation.isPending}>
          {existingReview ? 'Update Review' : 'Submit Review'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export type { ReviewFormProps };
