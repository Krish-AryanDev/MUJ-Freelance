'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

import { useAuth } from './useAuth';
import { useSocket } from './useSocket';
import { notificationService } from '../services/notification.service';
import { useNotificationStore } from '../store/notificationStore';
import { isServiceUnavailableError } from '../utils/helpers';

const NOTIFICATION_QUERY_LIMIT = 20;

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();

  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isLoading = useNotificationStore((state) => state.isLoading);

  const setNotifications = useNotificationStore((state) => state.setNotifications);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const storeMarkAsRead = useNotificationStore((state) => state.markAsRead);
  const storeMarkAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const incrementUnreadCount = useNotificationStore((state) => state.incrementUnreadCount);
  const setIsLoading = useNotificationStore((state) => state.setIsLoading);
  const setHasMore = useNotificationStore((state) => state.setHasMore);
  const setCurrentPage = useNotificationStore((state) => state.setCurrentPage);
  const reset = useNotificationStore((state) => state.reset);

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications({ page: 1, limit: NOTIFICATION_QUERY_LIMIT }),
    enabled: isAuthenticated,
    staleTime: 45000,
    retry: (failureCount, error) => {
      if (isServiceUnavailableError(error)) {
        return false;
      }

      return failureCount < 2;
    },
    refetchInterval: (query) => {
      if (isServiceUnavailableError(query.state.error)) {
        return false;
      }

      return 90000;
    },
    refetchOnWindowFocus: false,
  });

  const unreadCountQuery = useQuery({
    queryKey: ['notificationUnreadCount'],
    queryFn: notificationService.getUnreadCount,
    enabled: isAuthenticated,
    staleTime: 10000,
    retry: (failureCount, error) => {
      if (isServiceUnavailableError(error)) {
        return false;
      }

      return failureCount < 2;
    },
    refetchInterval: (query) => {
      if (isServiceUnavailableError(query.state.error)) {
        return false;
      }

      return 45000;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setIsLoading(Boolean(notificationsQuery.isLoading));
  }, [notificationsQuery.isLoading, setIsLoading]);

  useEffect(() => {
    if (!isAuthenticated) {
      reset();
      return;
    }

    if (!notificationsQuery.data?.success) {
      return;
    }

    const data = notificationsQuery.data.data;
    setNotifications(data.notifications || []);
    setUnreadCount(data.unreadCount || 0);
    setCurrentPage(data.currentPage || 1);
    setHasMore((data.currentPage || 1) < (data.totalPages || 1));
  }, [
    isAuthenticated,
    notificationsQuery.data,
    reset,
    setCurrentPage,
    setHasMore,
    setNotifications,
    setUnreadCount,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!unreadCountQuery.data?.success) {
      return;
    }

    setUnreadCount(unreadCountQuery.data.data.count || 0);
  }, [isAuthenticated, setUnreadCount, unreadCountQuery.data]);

  useEffect(() => {
    if (!socket || !isAuthenticated) {
      return;
    }

    const handleNewNotification = (incomingNotification: Parameters<typeof addNotification>[0]) => {
      addNotification(incomingNotification);
      if (!incomingNotification.isRead) {
        incrementUnreadCount();
      }

      toast(`🔔 ${incomingNotification.title}`);
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [addNotification, incrementUnreadCount, isAuthenticated, socket]);

  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: async (response, notificationId) => {
      if (!response.success) {
        return;
      }

      storeMarkAsRead(notificationId);
      await queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: (response) => {
      if (!response.success) {
        return;
      }

      storeMarkAllAsRead();
      void queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: notificationService.deleteNotification,
    onSuccess: (response, notificationId) => {
      if (!response.success) {
        return;
      }

      removeNotification(notificationId);
      void queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
    },
  });

  const deleteAllReadMutation = useMutation({
    mutationFn: notificationService.deleteAllRead,
    onSuccess: (response) => {
      if (!response.success) {
        return;
      }

      void notificationsQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading: isLoading || notificationsQuery.isFetching,
    markAsRead: (notificationId: string) => markAsReadMutation.mutateAsync(notificationId),
    markAllAsRead: () => markAllAsReadMutation.mutateAsync(),
    deleteNotification: (notificationId: string) => deleteNotificationMutation.mutateAsync(notificationId),
    deleteAllRead: () => deleteAllReadMutation.mutateAsync(),
    refetch: notificationsQuery.refetch,
  };
};

export default useNotifications;
