import type { Order, UserSummary } from './order.types';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'released' | 'refunded';

export interface Payment {
  _id: string;
  orderId: string | Order;
  clientId: string | UserSummary;
  freelancerId: string | UserSummary;
  amount: number;
  commission: number;
  freelancerAmount: number;
  commissionPercent: number;
  currency: string;
  status: PaymentStatus;
  paidAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EarningsSummary {
  totalEarnings: number;
  pendingEarnings: number;
  thisMonthEarnings: number;
  totalOrders: number;
  commissionPaid: number;
}

export interface InitiatePaymentResponse {
  payment: {
    _id: string;
    orderId: string;
    amount: number;
    commission: number;
    freelancerAmount: number;
    commissionPercent: number;
    status: string;
  };
}
