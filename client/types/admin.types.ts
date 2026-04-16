import type { ApiResponse } from './api.types';
import type { Order } from './order.types';
import type { User } from './user.types';

export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalProjects: number;
  disputedOrders: number;
  totalRevenue: number;
}

export interface RevenuePoint {
  month: number;
  value: number;
}

export interface UsersByRolePoint {
  role: string;
  count: number;
}

export interface OrdersByStatusPoint {
  status: string;
  count: number;
}

export interface AdminOrder extends Order {
  adminResolution?: {
    note?: string;
    resolvedAt?: string;
    resolvedBy?: {
      _id: string;
      fullName: string;
      email: string;
    };
  };
}

export type DisputeOrder = AdminOrder;

export interface GetDashboardStatsPayload {
  stats: DashboardStats;
  monthlyRevenue: RevenuePoint[];
}

export interface GetUsersPayload {
  users: User[];
}

export interface GetOrdersPayload {
  orders: AdminOrder[];
}

export interface GetDisputesPayload {
  disputes: DisputeOrder[];
}

export interface ResolveDisputePayload {
  order: AdminOrder;
}

export interface AnalyticsPayload {
  monthlyRevenue: RevenuePoint[];
  usersByRole: UsersByRolePoint[];
  ordersByStatus: OrdersByStatusPoint[];
}

export type GetDashboardStatsResponse = ApiResponse<GetDashboardStatsPayload>;
export type GetUsersResponse = ApiResponse<GetUsersPayload>;
export type GetOrdersResponse = ApiResponse<GetOrdersPayload>;
export type GetDisputesResponse = ApiResponse<GetDisputesPayload>;
export type ResolveDisputeResponse = ApiResponse<ResolveDisputePayload>;
export type AnalyticsResponse = ApiResponse<AnalyticsPayload>;
