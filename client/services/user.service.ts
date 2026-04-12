import type { AxiosResponse } from 'axios';

import { apiClient } from '../lib/axios';
import type { ApiListQuery, ApiResponse, PaginationMeta } from '../types/api.types';
import type { UpdateProfileRequest, User, UserRole } from '../types/user.types';
import { buildQueryString, getErrorMessage } from '../utils/helpers';

interface BackendUser extends Omit<User, 'id'> {
  id?: string;
  _id?: string;
  role?: UserRole;
}

interface PublicProfileStats {
  totalPublicReviews: number;
  gigsPublished: number;
  projectsPosted: number;
  ordersCompleted: number;
}

interface MyProfilePayload {
  user: BackendUser;
  freelancerProfile: User['freelancerProfile'] | null;
}

interface PublicProfilePayload {
  user: BackendUser;
  freelancerProfile: User['freelancerProfile'] | null;
  stats: PublicProfileStats;
}

interface UserListPayload {
  users: BackendUser[];
}

interface ListUsersQuery extends ApiListQuery {
  role?: 'client' | 'freelancer' | 'admin';
  status?: 'pending_verification' | 'active' | 'suspended' | 'blocked';
}

interface ListUsersResult {
  users: User[];
  pagination: PaginationMeta | null;
}

interface PublicProfileResult {
  user: User;
  freelancerProfile: User['freelancerProfile'] | null;
  stats: PublicProfileStats;
}

const normalizeUser = (user: BackendUser): User => {
  const normalizedId = user.id ?? user._id;

  if (!normalizedId) {
    throw new Error('User id is missing in API response');
  }

  return {
    ...user,
    id: normalizedId,
    roles:
      Array.isArray(user.roles) && user.roles.length > 0
        ? user.roles
        : user.role
          ? [user.role]
          : [],
    avatar: user.avatar ?? { url: '' },
  };
};

const unwrapResponse = <TData>(response: AxiosResponse<ApiResponse<TData>>): TData => {
  const payload = response.data;

  if (!payload.success) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data;
};

const mapPagination = (meta?: PaginationMeta): PaginationMeta | null => {
  if (!meta) {
    return null;
  }

  return {
    page: meta.page,
    limit: meta.limit,
    totalItems: meta.totalItems,
    totalPages: meta.totalPages,
    hasNextPage: meta.hasNextPage,
    hasPreviousPage: meta.hasPreviousPage,
  };
};

const getMyProfile = async (): Promise<MyProfilePayload> => {
  try {
    const response = await apiClient.get<ApiResponse<MyProfilePayload>>('/users/me');
    const data = unwrapResponse(response);

    return {
      user: normalizeUser(data.user),
      freelancerProfile: data.freelancerProfile ?? null,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch your profile'));
  }
};

const updateMyProfile = async (payload: UpdateProfileRequest): Promise<User> => {
  try {
    const response = await apiClient.patch<ApiResponse<{ user: BackendUser }>>('/users/me', {
      fullName: payload.fullName,
      avatarUrl: payload.avatar?.url,
      avatarPublicId: payload.avatar?.publicId,
    });

    const data = unwrapResponse(response);
    return normalizeUser(data.user);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update profile'));
  }
};

const getPublicProfile = async (userId: string): Promise<PublicProfileResult> => {
  try {
    const response = await apiClient.get<ApiResponse<PublicProfilePayload>>(`/users/${userId}`);
    const data = unwrapResponse(response);

    return {
      user: normalizeUser(data.user),
      freelancerProfile: data.freelancerProfile ?? null,
      stats: data.stats,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch public profile'));
  }
};

const getUserProfile = async (userId: string): Promise<PublicProfileResult> => {
  return getPublicProfile(userId);
};

const listUsersForAdmin = async (query: ListUsersQuery = {}): Promise<ListUsersResult> => {
  try {
    const queryString = buildQueryString(query);
    const response = await apiClient.get<ApiResponse<UserListPayload>>(`/users/admin/list${queryString}`);
    const data = unwrapResponse(response);

    const meta = response.data.success ? response.data.meta : undefined;

    return {
      users: data.users.map(normalizeUser),
      pagination: mapPagination(meta),
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch users list'));
  }
};

export const userService = {
  getMyProfile,
  updateMyProfile,
  getUserProfile,
  getPublicProfile,
  listUsersForAdmin,
};

export type { ListUsersQuery, ListUsersResult, PublicProfileResult };
