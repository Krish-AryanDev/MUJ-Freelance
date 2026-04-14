'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useNotifications } from '../../hooks/useNotifications';
import type { Notification } from '../../types/notification.types';
import { classNames } from '../../utils/helpers';
import EmptyState from '../shared/EmptyState';
import Spinner from '../ui/Spinner';
import NotificationItem from './NotificationItem';

type NotificationFilter = 'all' | 'unread';

type NotificationsHookResult = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<unknown>;
  markAllAsRead: () => Promise<unknown>;
  deleteNotification: (notificationId: string) => Promise<unknown>;
  deleteAllRead: () => Promise<unknown>;
  refetch: () => Promise<unknown>;
};

export default function NotificationBell() {
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');

  const notificationsApi =
    ((useNotifications() as unknown as NotificationsHookResult | null | undefined) ?? {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    markAsRead: async () => null,
    markAllAsRead: async () => null,
    deleteNotification: async () => null,
    deleteAllRead: async () => null,
    refetch: async () => null,
  });

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
  } = notificationsApi;

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter((notification) => !notification.isRead);
    }

    return notifications;
  }, [filter, notifications]);

  const topNotifications = useMemo(() => filteredNotifications.slice(0, 10), [filteredNotifications]);
  const hasReadNotifications = useMemo(
    () => notifications.some((notification) => notification.isRead),
    [notifications],
  );

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark notification as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark all as read');
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      await deleteAllRead();
      toast.success('Read notifications deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete read notifications');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((current) => !current);
        }}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-11 z-50 w-90 origin-top-right rounded-xl border border-zinc-200 bg-white shadow-lg transition-all duration-200 ease-out data-[state=open]:translate-y-0 data-[state=open]:opacity-100" data-state={isOpen ? 'open' : 'closed'}>
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  void handleMarkAllRead();
                }}
                className="text-xs font-medium text-blue-600 transition hover:text-blue-700"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-1 border-b border-zinc-100 px-3 py-2">
            {(['all', 'unread'] as NotificationFilter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setFilter(item);
                }}
                className={classNames(
                  'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition',
                  filter === item
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
                )}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="max-h-105 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" className="text-zinc-600" />
              </div>
            ) : topNotifications.length === 0 ? (
              <EmptyState
                className="min-h-55 rounded-none border-0"
                icon={<Bell className="mx-auto h-8 w-8 text-zinc-400" />}
                title="No notifications yet"
                description="You're all caught up for now."
              />
            ) : (
              topNotifications.map((notification: Notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={(notificationId) => {
                    void handleMarkAsRead(notificationId);
                  }}
                  onDelete={(notificationId) => {
                    void handleDeleteNotification(notificationId);
                  }}
                />
              ))
            )}
          </div>

          <div className="space-y-2 border-t border-zinc-100 px-4 py-3">
            {hasReadNotifications ? (
              <button
                type="button"
                onClick={() => {
                  void handleDeleteAllRead();
                }}
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Delete all read
              </button>
            ) : null}

            <Link
              href="/notifications"
              className="block w-full rounded-md bg-zinc-900 px-3 py-2 text-center text-xs font-medium text-white transition hover:bg-zinc-800"
            >
              View all
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
