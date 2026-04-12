import type { AxiosResponse } from 'axios';

import { apiClient } from '../lib/axios';
import type { ApiResponse, PaginationMeta } from '../types/api.types';
import type {
  CreateGigRequest,
  Gig,
  GigCategory,
  GigFaq,
  GigFilters,
  GigImage,
  GigPackage,
  GigStatus,
  UpdateGigRequest,
} from '../types/gig.types';
import { buildQueryString, getErrorMessage } from '../utils/helpers';

interface BackendUser {
  id?: string;
  _id?: string;
  fullName?: string;
  name?: string;
  avatar?: {
    url?: string;
    publicId?: string;
  };
}

interface BackendGig {
  id?: string;
  _id?: string;
  title: string;
  slug?: string;
  description: string;
  category: GigCategory;
  subcategory?: string;
  tags?: string[];
  packages?: GigPackage[];
  images?: GigImage[];
  faqs?: GigFaq[];
  status: GigStatus;
  isFeatured?: boolean;
  averageRating?: number;
  totalReviews?: number;
  totalOrders?: number;
  freelancer?: BackendUser;
  createdBy?: BackendUser;
  createdAt: string;
  updatedAt: string;
}

interface GigPayload {
  gig: BackendGig;
}

interface GigListPayload {
  gigs: BackendGig[];
}

type GigListApiResponse = ApiResponse<GigListPayload>;

interface GigListQuery extends GigFilters {
  page?: number;
  limit?: number;
  status?: GigStatus;
  freelancerId?: string;
}

interface GigListResult {
  gigs: Gig[];
  pagination: PaginationMeta | null;
}

const tierOrder: Record<string, number> = {
  basic: 0,
  standard: 1,
  premium: 2,
};

const emptyPackage = (tier: 'basic' | 'standard' | 'premium'): GigPackage => ({
  tier,
  title: '',
  description: '',
  deliveryDays: 1,
  revisions: 0,
  price: 1,
  features: [],
});

const mapPagination = (meta?: {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  hasPreviousPage?: boolean;
}): PaginationMeta | null => {
  if (!meta) {
    return null;
  }

  return {
    page: meta.page ?? 1,
    limit: meta.limit ?? 10,
    totalItems: meta.total ?? 0,
    totalPages: meta.totalPages ?? 1,
    hasNextPage: Boolean(meta.hasNextPage),
    hasPreviousPage: Boolean(meta.hasPreviousPage ?? meta.hasPrevPage),
  };
};

const normalizePackages = (packages: GigPackage[] | undefined): [GigPackage, GigPackage, GigPackage] => {
  const sorted = [...(packages ?? [])].sort((first, second) => {
    return (tierOrder[first.tier] ?? 99) - (tierOrder[second.tier] ?? 99);
  });

  const basic = sorted.find((item) => item.tier === 'basic') ?? emptyPackage('basic');
  const standard = sorted.find((item) => item.tier === 'standard') ?? emptyPackage('standard');
  const premium = sorted.find((item) => item.tier === 'premium') ?? emptyPackage('premium');

  return [basic, standard, premium];
};

const normalizeGig = (gig: BackendGig): Gig => {
  const id = gig.id ?? gig._id;

  if (!id) {
    throw new Error('Gig id is missing in API response');
  }

  const owner = gig.createdBy ?? gig.freelancer;
  const ownerId = owner?.id ?? owner?._id ?? '';

  return {
    id,
    title: gig.title,
    slug: gig.slug ?? id,
    description: gig.description,
    category: gig.category,
    subcategory: gig.subcategory ?? '',
    tags: gig.tags ?? [],
    packages: normalizePackages(gig.packages),
    images: gig.images ?? [],
    faqs: gig.faqs ?? [],
    status: gig.status,
    isFeatured: Boolean(gig.isFeatured),
    averageRating: gig.averageRating ?? 0,
    totalReviews: gig.totalReviews ?? 0,
    totalOrders: gig.totalOrders ?? 0,
    createdBy: {
      id: ownerId || id,
      fullName: owner?.fullName ?? owner?.name ?? 'Freelancer',
      avatar: {
        url: owner?.avatar?.url ?? '',
      },
    },
    createdAt: gig.createdAt,
    updatedAt: gig.updatedAt,
  };
};

const unwrapResponse = <TData>(response: AxiosResponse<ApiResponse<TData>>): TData => {
  const payload = response.data;

  if (!payload.success) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data;
};

const mapCreatePayload = (payload: CreateGigRequest): Record<string, unknown> => ({
  ...payload,
  packages: payload.packages.map((item) => ({
    tier: item.tier,
    name: item.title,
    description: item.description,
    deliveryDays: item.deliveryDays,
    revisions: item.revisions,
    price: item.price,
    features: item.features,
  })),
});

const mapUpdatePayload = (payload: UpdateGigRequest): Record<string, unknown> => {
  if (!payload.packages) {
    return payload as Record<string, unknown>;
  }

  return {
    ...payload,
    packages: payload.packages.map((item) => ({
      tier: item.tier,
      name: item.title,
      description: item.description,
      deliveryDays: item.deliveryDays,
      revisions: item.revisions,
      price: item.price,
      features: item.features,
    })),
  };
};

const listGigs = async (query: GigListQuery = {}): Promise<GigListResult> => {
  try {
    const queryString = buildQueryString(query);
    const response = await apiClient.get<ApiResponse<GigListPayload>>(`/gigs${queryString}`);
    const data = unwrapResponse(response);

    return {
      gigs: data.gigs.map(normalizeGig),
      pagination: mapPagination(response.data.success ? response.data.meta : undefined),
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch gigs'));
  }
};

const listMyGigs = async (query: Omit<GigListQuery, 'freelancerId'> = {}): Promise<GigListResult> => {
  try {
    const queryString = buildQueryString(query);
    const response = await apiClient.get<ApiResponse<GigListPayload>>(`/gigs/me/list${queryString}`);
    const data = unwrapResponse(response);

    return {
      gigs: data.gigs.map(normalizeGig),
      pagination: mapPagination(response.data.success ? response.data.meta : undefined),
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch your gigs'));
  }
};

const getAllGigs = async (params: GigListQuery = {}): Promise<GigListApiResponse> => {
  try {
    const response = await apiClient.get<GigListApiResponse>('/gigs', { params });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch gigs'));
  }
};

const getGigById = async (gigIdOrSlug: string): Promise<Gig> => {
  try {
    const endpoint = `/gigs/${gigIdOrSlug}`;
    console.log('[gigService.getGigById] request', { gigIdOrSlug, endpoint });

    const response = await apiClient.get<ApiResponse<GigPayload>>(endpoint);
    console.log('[gigService.getGigById] raw response', response.data);

    const data = unwrapResponse(response);
    console.log('[gigService.getGigById] parsed gig payload', data.gig);

    return normalizeGig(data.gig);
  } catch (error) {
    console.error('[gigService.getGigById] error', error);
    throw new Error(getErrorMessage(error, 'Failed to fetch gig details'));
  }
};

const createGig = async (payload: CreateGigRequest): Promise<Gig> => {
  try {
    const response = await apiClient.post<ApiResponse<GigPayload>>('/gigs', mapCreatePayload(payload));
    const data = unwrapResponse(response);
    return normalizeGig(data.gig);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to create gig'));
  }
};

const updateGig = async (gigIdOrSlug: string, payload: UpdateGigRequest): Promise<Gig> => {
  try {
    const response = await apiClient.patch<ApiResponse<GigPayload>>(
      `/gigs/${gigIdOrSlug}`,
      mapUpdatePayload(payload),
    );
    const data = unwrapResponse(response);
    return normalizeGig(data.gig);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update gig'));
  }
};

const updateGigStatus = async (gigIdOrSlug: string, status: GigStatus): Promise<Gig> => {
  try {
    const response = await apiClient.patch<ApiResponse<GigPayload>>(`/gigs/${gigIdOrSlug}/status`, {
      status,
    });
    const data = unwrapResponse(response);
    return normalizeGig(data.gig);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update gig status'));
  }
};

const deleteGig = async (gigIdOrSlug: string): Promise<void> => {
  try {
    await apiClient.delete<ApiResponse<null>>(`/gigs/${gigIdOrSlug}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to delete gig'));
  }
};

export const gigService = {
  getAllGigs,
  listGigs,
  listMyGigs,
  getGigById,
  createGig,
  updateGig,
  updateGigStatus,
  deleteGig,
};

export type { GigListApiResponse, GigListQuery, GigListResult };