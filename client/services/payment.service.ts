import { apiClient } from '@/lib/axios';
import type { EarningsSummary, InitiatePaymentResponse, Payment } from '@/types/payment.types';

interface PaymentHistoryResponse {
  success: boolean;
  message: string;
  data: {
    payments: Payment[];
  };
}

interface EarningsResponse {
  success: boolean;
  message: string;
  data: {
    earnings: EarningsSummary;
    payments: Payment[];
  };
}

interface ConfirmPaymentResponse {
  success: boolean;
  message: string;
  data: {
    payment: Payment;
  };
}

export const paymentService = {
  initiatePayment: async (orderId: string) => {
    const response = await apiClient.post<{ data: InitiatePaymentResponse }>('/payments/initiate', { orderId });
    return response.data;
  },

  confirmPayment: async (paymentId: string, action: 'success' | 'failure') => {
    const response = await apiClient.post<ConfirmPaymentResponse>('/payments/confirm', { paymentId, action });
    return response.data;
  },

  getPaymentHistory: async () => {
    const response = await apiClient.get<PaymentHistoryResponse>('/payments/history');
    return response.data;
  },

  getEarnings: async () => {
    const response = await apiClient.get<EarningsResponse>('/payments/earnings');
    return response.data;
  },
};

export default paymentService;
