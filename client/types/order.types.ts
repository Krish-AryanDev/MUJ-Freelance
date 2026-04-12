import type { ApiResponse, ISODateString } from './api.types';

export type PackageTier = 'basic' | 'standard' | 'premium';
export type OrderStatus = 'active' | 'delivered' | 'revision' | 'completed' | 'cancelled' | 'disputed';

export interface GigSummary {
  _id: string;
  title: string;
  images?: Array<{ url: string; publicId?: string }>;
  packages?: Array<{
    tier: PackageTier;
    title: string;
    price: number;
    deliveryDays: number;
    revisions: number;
  }>;
}

export interface UserSummary {
  _id: string;
  fullName: string;
  email?: string;
  avatar?: {
    url?: string;
    publicId?: string;
  };
  rating?: number;
}

export interface Order {
  _id: string;
  gigId: string | GigSummary;
  clientId: string | UserSummary;
  freelancerId: string | UserSummary;
  packageTier: PackageTier;
  amount: number;
  status: OrderStatus;
  deadline: ISODateString;
  revisionsAllowed: number;
  revisionsUsed: number;
  deliveryMessage?: string;
  attachments?: string[];
  revisionNote?: string;
  deliveredAt?: ISODateString;
  completedAt?: ISODateString;
  cancelledAt?: ISODateString;
  disputeReason?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateOrderInput {
  gigId: string;
  packageTier: PackageTier;
}

export interface OrderDataPayload {
  order: Order;
}

export interface OrdersDataPayload {
  orders: Order[];
}

export type OrderResponse = ApiResponse<OrderDataPayload>;
export type OrdersResponse = ApiResponse<OrdersDataPayload>;
