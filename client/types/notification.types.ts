export type NotificationType =
  | 'order_placed'
  | 'order_accepted'
  | 'order_delivered'
  | 'order_completed'
  | 'order_cancelled'
  | 'order_revision'
  | 'new_message'
  | 'new_review'
  | 'new_proposal'
  | 'proposal_accepted'
  | 'proposal_rejected'
  | 'payment_received'
  | 'payment_released'
  | 'account_verified'
  | 'gig_approved'
  | 'gig_rejected'
  | 'system';

export interface Notification {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  currentPage: number;
  totalPages: number;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  isRead?: boolean;
}
