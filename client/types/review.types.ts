export interface Review {
  _id: string;
  reviewer: {
    _id: string;
    name: string;
    avatar?: string;
  };
  reviewee: {
    _id: string;
    name: string;
    avatar?: string;
  };
  gig?: {
    _id: string;
    title: string;
  };
  order: string;
  rating: number;
  comment: string;
  type: 'client_to_freelancer' | 'freelancer_to_client';
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFormData {
  orderId: string;
  rating: number;
  comment: string;
  type: 'client_to_freelancer' | 'freelancer_to_client';
  gigId?: string;
}

export interface RatingBreakdownData {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface GigReviewsResponse {
  reviews: Review[];
  totalReviews: number;
  averageRating: number;
  ratingBreakdown: RatingBreakdownData;
  currentPage: number;
  totalPages: number;
}

export interface UserReviewsResponse {
  reviews: Review[];
  totalReviews: number;
  averageRating: number;
  ratingBreakdown: RatingBreakdownData;
  currentPage: number;
  totalPages: number;
}

export interface OrderReviewsResponse {
  reviews: Review[];
  canReviewAsClient: boolean;
  canReviewAsFreelancer: boolean;
}

export interface ReviewFilters {
  page?: number;
  limit?: number;
  sort?: 'recent' | 'highest' | 'lowest';
}
