import { apiClient } from '@/lib/axios';
import type { ApiResponse, ErrorResponse } from '@/types/api.types';
import type {
  GigReviewsResponse,
  OrderReviewsResponse,
  Review,
  ReviewFilters,
  ReviewFormData,
  UserReviewsResponse,
} from '@/types/review.types';

const buildQueryParams = (params?: ReviewFilters): Record<string, string | number> => {
  if (!params) {
    return {};
  }

  const query: Record<string, string | number> = {};

  if (params.page) {
    query.page = params.page;
  }

  if (params.limit) {
    query.limit = params.limit;
  }

  if (params.sort) {
    query.sort = params.sort;
  }

  return query;
};

const toErrorResponse = <T>(payload: ApiResponse<unknown>): ApiResponse<T> => {
  const errorPayload = payload as ErrorResponse;
  return {
    success: false,
    statusCode: errorPayload.statusCode,
    message: errorPayload.message,
    errors: errorPayload.errors,
    errorCode: errorPayload.errorCode,
  };
};

export const reviewService = {
  createReview: async (payload: ReviewFormData): Promise<ApiResponse<Review>> => {
    const response = await apiClient.post<ApiResponse<unknown>>('/reviews', payload);
    return reviewService.normalizeReviewResponse(response.data);
  },

  getGigReviews: async (gigId: string, params?: ReviewFilters): Promise<ApiResponse<GigReviewsResponse>> => {
    const response = await apiClient.get<ApiResponse<unknown>>(`/reviews/gig/${gigId}`, {
      params: buildQueryParams(params),
    });

    return reviewService.normalizeGigReviewsResponse(response.data);
  },

  getUserReviews: async (userId: string, params?: ReviewFilters): Promise<ApiResponse<UserReviewsResponse>> => {
    const response = await apiClient.get<ApiResponse<unknown>>(`/reviews/user/${userId}`, {
      params: buildQueryParams(params),
    });

    return reviewService.normalizeUserReviewsResponse(response.data);
  },

  getOrderReviews: async (orderId: string): Promise<ApiResponse<OrderReviewsResponse>> => {
    const response = await apiClient.get<ApiResponse<unknown>>(`/reviews/order/${orderId}`);
    return reviewService.normalizeOrderReviewsResponse(response.data);
  },

  updateReview: async (reviewId: string, payload: Partial<ReviewFormData>): Promise<ApiResponse<Review>> => {
    const response = await apiClient.put<ApiResponse<unknown>>(`/reviews/${reviewId}`, payload);
    return reviewService.normalizeReviewResponse(response.data);
  },

  deleteReview: async (reviewId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>(`/reviews/${reviewId}`);
    return response.data;
  },

  getMyReviews: async (params?: ReviewFilters): Promise<ApiResponse<UserReviewsResponse>> => {
    const response = await apiClient.get<ApiResponse<unknown>>('/reviews/my-reviews', {
      params: buildQueryParams(params),
    });

    return reviewService.normalizeUserReviewsResponse(response.data);
  },

  normalizeReviewResponse: (payload: ApiResponse<unknown>): ApiResponse<Review> => {
    if (!payload.success) {
      return toErrorResponse<Review>(payload);
    }

    return {
      ...payload,
      data: reviewService.toReview(payload.data),
    };
  },

  normalizeGigReviewsResponse: (payload: ApiResponse<unknown>): ApiResponse<GigReviewsResponse> => {
    if (!payload.success) {
      return toErrorResponse<GigReviewsResponse>(payload);
    }

    const data = payload.data as {
      reviews?: unknown[];
      totalReviews?: number;
      averageRating?: number;
      ratingBreakdown?: Partial<Record<1 | 2 | 3 | 4 | 5, number>>;
      currentPage?: number;
      totalPages?: number;
    };

    return {
      ...payload,
      data: {
        reviews: Array.isArray(data.reviews) ? data.reviews.map((item) => reviewService.toReview(item)) : [],
        totalReviews: Number(data.totalReviews || 0),
        averageRating: Number(data.averageRating || 0),
        ratingBreakdown: {
          1: Number(data.ratingBreakdown?.[1] || 0),
          2: Number(data.ratingBreakdown?.[2] || 0),
          3: Number(data.ratingBreakdown?.[3] || 0),
          4: Number(data.ratingBreakdown?.[4] || 0),
          5: Number(data.ratingBreakdown?.[5] || 0),
        },
        currentPage: Number(data.currentPage || 1),
        totalPages: Number(data.totalPages || 1),
      },
    };
  },

  normalizeUserReviewsResponse: (payload: ApiResponse<unknown>): ApiResponse<UserReviewsResponse> => {
    if (!payload.success) {
      return toErrorResponse<UserReviewsResponse>(payload);
    }

    const data = payload.data as {
      reviews?: unknown[];
      totalReviews?: number;
      averageRating?: number;
      ratingBreakdown?: Partial<Record<1 | 2 | 3 | 4 | 5, number>>;
      currentPage?: number;
      totalPages?: number;
    };

    return {
      ...payload,
      data: {
        reviews: Array.isArray(data.reviews) ? data.reviews.map((item) => reviewService.toReview(item)) : [],
        totalReviews: Number(data.totalReviews || 0),
        averageRating: Number(data.averageRating || 0),
        ratingBreakdown: {
          1: Number(data.ratingBreakdown?.[1] || 0),
          2: Number(data.ratingBreakdown?.[2] || 0),
          3: Number(data.ratingBreakdown?.[3] || 0),
          4: Number(data.ratingBreakdown?.[4] || 0),
          5: Number(data.ratingBreakdown?.[5] || 0),
        },
        currentPage: Number(data.currentPage || 1),
        totalPages: Number(data.totalPages || 1),
      },
    };
  },

  normalizeOrderReviewsResponse: (payload: ApiResponse<unknown>): ApiResponse<OrderReviewsResponse> => {
    if (!payload.success) {
      return toErrorResponse<OrderReviewsResponse>(payload);
    }

    const data = payload.data as {
      reviews?: unknown[];
      canReviewAsClient?: boolean;
      canReviewAsFreelancer?: boolean;
    };

    return {
      ...payload,
      data: {
        reviews: Array.isArray(data.reviews) ? data.reviews.map((item) => reviewService.toReview(item)) : [],
        canReviewAsClient: Boolean(data.canReviewAsClient),
        canReviewAsFreelancer: Boolean(data.canReviewAsFreelancer),
      },
    };
  },

  toReview: (value: unknown): Review => {
    const item = (value || {}) as {
      _id?: string;
      reviewer?: { _id?: string; id?: string; fullName?: string; name?: string; avatar?: { url?: string } | string };
      reviewee?: { _id?: string; id?: string; fullName?: string; name?: string; avatar?: { url?: string } | string };
      gig?: { _id?: string; id?: string; title?: string } | string;
      order?: string | { _id?: string };
      rating?: number;
      comment?: string;
      type?: 'client_to_freelancer' | 'freelancer_to_client';
      isPublic?: boolean;
      createdAt?: string;
      updatedAt?: string;
    };

    const reviewerAvatar =
      typeof item.reviewer?.avatar === 'string' ? item.reviewer.avatar : item.reviewer?.avatar?.url || '';
    const revieweeAvatar =
      typeof item.reviewee?.avatar === 'string' ? item.reviewee.avatar : item.reviewee?.avatar?.url || '';

    return {
      _id: String(item._id || ''),
      reviewer: {
        _id: String(item.reviewer?._id || item.reviewer?.id || ''),
        name: String(item.reviewer?.name || item.reviewer?.fullName || 'User'),
        avatar: reviewerAvatar,
      },
      reviewee: {
        _id: String(item.reviewee?._id || item.reviewee?.id || ''),
        name: String(item.reviewee?.name || item.reviewee?.fullName || 'User'),
        avatar: revieweeAvatar,
      },
      gig:
        item.gig && typeof item.gig !== 'string'
          ? {
              _id: String(item.gig._id || item.gig.id || ''),
              title: String(item.gig.title || ''),
            }
          : undefined,
      order: typeof item.order === 'string' ? item.order : String(item.order?._id || ''),
      rating: Number(item.rating || 0),
      comment: String(item.comment || ''),
      type: item.type || 'client_to_freelancer',
      isPublic: item.isPublic !== false,
      createdAt: String(item.createdAt || new Date().toISOString()),
      updatedAt: String(item.updatedAt || new Date().toISOString()),
    };
  },
};

export default reviewService;
