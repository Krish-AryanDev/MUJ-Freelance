import { apiClient } from '@/lib/axios';
import type {
  AnalyticsResponse,
  GetDashboardStatsResponse,
  GetDisputesResponse,
  GetGigsResponse,
  GetOrdersResponse,
  GetUsersResponse,
  ResolveDisputeResponse,
} from '@/types/admin.types';
import type { ApiResponse } from '@/types/api.types';

interface PaginationParams {
  page?: number;
  limit?: number;
}

export const adminService = {
  getDashboardStats: async (): Promise<GetDashboardStatsResponse> => {
    const response = await apiClient.get<GetDashboardStatsResponse>('/admin/dashboard-stats');
    return response.data;
  },

  getUsers: async (
    params?: PaginationParams & { search?: string; role?: string; status?: string },
  ): Promise<GetUsersResponse> => {
    const response = await apiClient.get<GetUsersResponse>('/admin/users', { params });
    return response.data;
  },

  banUser: async (userId: string): Promise<ApiResponse<{ user: unknown }>> => {
    const response = await apiClient.put<ApiResponse<{ user: unknown }>>(`/admin/users/${userId}/ban`);
    return response.data;
  },

  unbanUser: async (userId: string): Promise<ApiResponse<{ user: unknown }>> => {
    const response = await apiClient.put<ApiResponse<{ user: unknown }>>(`/admin/users/${userId}/unban`);
    return response.data;
  },

  getGigs: async (
    params?: PaginationParams & { search?: string; status?: string; freelancerId?: string },
  ): Promise<GetGigsResponse> => {
    const response = await apiClient.get<GetGigsResponse>('/admin/gigs', { params });
    return response.data;
  },

  approveGig: async (gigId: string): Promise<ApiResponse<{ gig: unknown }>> => {
    const response = await apiClient.put<ApiResponse<{ gig: unknown }>>(`/admin/gigs/${gigId}/approve`);
    return response.data;
  },

  rejectGig: async (gigId: string): Promise<ApiResponse<{ gig: unknown }>> => {
    const response = await apiClient.put<ApiResponse<{ gig: unknown }>>(`/admin/gigs/${gigId}/reject`);
    return response.data;
  },

  getOrders: async (params?: PaginationParams & { status?: string }): Promise<GetOrdersResponse> => {
    const response = await apiClient.get<GetOrdersResponse>('/admin/orders', { params });
    return response.data;
  },

  getDisputes: async (params?: PaginationParams): Promise<GetDisputesResponse> => {
    const response = await apiClient.get<GetDisputesResponse>('/admin/disputes', { params });
    return response.data;
  },

  resolveDispute: async (
    orderId: string,
    resolutionNote: string,
  ): Promise<ResolveDisputeResponse> => {
    const response = await apiClient.put<ResolveDisputeResponse>(
      `/admin/orders/${orderId}/resolve-dispute`,
      {
        resolutionNote,
      },
    );

    return response.data;
  },

  getAnalytics: async (): Promise<AnalyticsResponse> => {
    const response = await apiClient.get<AnalyticsResponse>('/admin/analytics');
    return response.data;
  },
};

export default adminService;
