/**
 * Review and rating contracts shown after order completion.
 */

import type { Id, ISODateString } from './api.types';
import type { User } from './user.types';

export interface RatingBreakdown {
  communication: number;
  quality: number;
  valueForMoney: number;
  wouldRecommend: boolean;
}

export interface Review {
  id: Id;
  orderId: Id;
  reviewer: Pick<User, 'id' | 'fullName' | 'avatar'>;
  reviewee: Pick<User, 'id' | 'fullName' | 'avatar'>;
  rating: number;
  comment: string;
  breakdown: RatingBreakdown;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateReviewRequest {
  orderId: Id;
  rating: number;
  comment: string;
  breakdown: RatingBreakdown;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingCounts: Record<1 | 2 | 3 | 4 | 5, number>;
}
