import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type {
  Notification,
  NotificationFilters,
  NotificationsResponse,
} from '@/types/notification.types';

const buildQueryParams = (params?: NotificationFilters): Record<string, string | number | boolean> => {
  if (!params) {
    return {};
  }

  const query: Record<string, string | number | boolean> = {};

  if (params.page) {
    query.page = params.page;
  }

  if (params.limit) {
    query.limit = params.limit;
  }

  if (typeof params.isRead === 'boolean') {
    query.isRead = params.isRead;
  }

  return query;
};

export const notificationService = {
  getNotifications: async (
    params?: NotificationFilters,
  ): Promise<ApiResponse<NotificationsResponse>> => {
    const response = await apiClient.get<ApiResponse<NotificationsResponse>>('/notifications', {
      params: buildQueryParams(params),
    });

    return response.data;
  },

  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<ApiResponse<Notification>> => {
    const response = await apiClient.put<ApiResponse<Notification>>(
      `/notifications/${notificationId}/read`,
    );

    return response.data;
  },

  markAllAsRead: async (): Promise<ApiResponse<{ modifiedCount: number }>> => {
    const response = await apiClient.put<ApiResponse<{ modifiedCount: number }>>(
      '/notifications/mark-all-read',
    );

    return response.data;
  },

  deleteNotification: async (notificationId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>(`/notifications/${notificationId}`);
    return response.data;
  },

  deleteAllRead: async (): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>('/notifications/read');
    return response.data;
  },
};

export default notificationService;
