import { create } from 'zustand';

import type { Notification } from '../types/notification.types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  currentPage: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  setIsLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setCurrentPage: (page: number) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  notifications: [] as Notification[],
  unreadCount: 0,
  isLoading: false,
  hasMore: true,
  currentPage: 1,
};

export const useNotificationStore = create<NotificationState>((set) => ({
  ...INITIAL_STATE,

  setNotifications: (notifications) => {
    set({ notifications });
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications.filter((item) => item._id !== notification._id)],
    }));
  },

  markAsRead: (notificationId) => {
    set((state) => {
      const current = state.notifications.find((item) => item._id === notificationId);
      const nextNotifications = state.notifications.map((notification) => {
        if (notification._id !== notificationId) {
          return notification;
        }

        return {
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        };
      });

      return {
        notifications: nextNotifications,
        unreadCount:
          current && !current.isRead ? Math.max(state.unreadCount - 1, 0) : state.unreadCount,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        isRead: true,
        readAt: notification.readAt || new Date().toISOString(),
      })),
      unreadCount: 0,
    }));
  },

  removeNotification: (notificationId) => {
    set((state) => {
      const current = state.notifications.find((item) => item._id === notificationId);

      return {
        notifications: state.notifications.filter((notification) => notification._id !== notificationId),
        unreadCount:
          current && !current.isRead ? Math.max(state.unreadCount - 1, 0) : state.unreadCount,
      };
    });
  },

  setUnreadCount: (count) => {
    set({ unreadCount: Math.max(Number(count) || 0, 0) });
  },

  incrementUnreadCount: () => {
    set((state) => ({ unreadCount: state.unreadCount + 1 }));
  },

  decrementUnreadCount: () => {
    set((state) => ({ unreadCount: Math.max(state.unreadCount - 1, 0) }));
  },

  setIsLoading: (isLoading) => {
    set({ isLoading });
  },

  setHasMore: (hasMore) => {
    set({ hasMore });
  },

  setCurrentPage: (currentPage) => {
    set({ currentPage });
  },

  reset: () => {
    set({ ...INITIAL_STATE });
  },
}));

export default useNotificationStore;
