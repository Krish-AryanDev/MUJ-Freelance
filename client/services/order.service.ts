import { apiClient } from '@/lib/axios';
import type { CreateOrderInput, OrderResponse, OrdersResponse } from '@/types/order.types';

export const orderService = {
  createOrder: async (data: CreateOrderInput): Promise<OrderResponse> => {
    const response = await apiClient.post<OrderResponse>('/orders', data);
    return response.data;
  },

  getMyOrders: async (status?: string): Promise<OrdersResponse> => {
    const params = status ? { status } : {};
    const response = await apiClient.get<OrdersResponse>('/orders', { params });
    return response.data;
  },

  getOrderById: async (id: string): Promise<OrderResponse> => {
    const response = await apiClient.get<OrderResponse>(`/orders/${id}`);
    return response.data;
  },

  deliverOrder: async (
    id: string,
    data: {
      deliveryMessage: string;
      attachments?: string[];
    },
  ): Promise<OrderResponse> => {
    const response = await apiClient.put<OrderResponse>(`/orders/${id}/deliver`, data);
    return response.data;
  },

  acceptDelivery: async (id: string): Promise<OrderResponse> => {
    const response = await apiClient.put<OrderResponse>(`/orders/${id}/accept`);
    return response.data;
  },

  requestRevision: async (id: string, revisionNote: string): Promise<OrderResponse> => {
    const response = await apiClient.put<OrderResponse>(`/orders/${id}/revision`, {
      revisionNote,
    });
    return response.data;
  },

  cancelOrder: async (id: string): Promise<OrderResponse> => {
    const response = await apiClient.put<OrderResponse>(`/orders/${id}/cancel`);
    return response.data;
  },

  createDispute: async (id: string, reason: string): Promise<OrderResponse> => {
    const response = await apiClient.post<OrderResponse>(`/orders/${id}/dispute`, {
      reason,
    });
    return response.data;
  },
};

export default orderService;
