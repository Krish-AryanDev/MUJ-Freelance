'use client';

import {
  Bell,
  DollarSign,
  FileText,
  FileX,
  MessageSquare,
  Package,
  ShoppingBag,
  Star,
  X,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { formatRelativeTime } from '../../utils/formatDate';
import { classNames } from '../../utils/helpers';
import type { Notification } from '../../types/notification.types';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  if (['order_placed', 'order_accepted', 'order_completed'].includes(type)) {
    return <ShoppingBag className="h-4 w-4 text-emerald-600" />;
  }

  if (type === 'order_delivered') {
    return <Package className="h-4 w-4 text-blue-600" />;
  }

  if (type === 'order_cancelled') {
    return <XCircle className="h-4 w-4 text-red-600" />;
  }

  if (type === 'new_message') {
    return <MessageSquare className="h-4 w-4 text-blue-600" />;
  }

  if (type === 'new_review') {
    return <Star className="h-4 w-4 text-yellow-500" />;
  }

  if (['new_proposal', 'proposal_accepted'].includes(type)) {
    return <FileText className="h-4 w-4 text-purple-600" />;
  }

  if (type === 'proposal_rejected') {
    return <FileX className="h-4 w-4 text-red-600" />;
  }

  if (['payment_received', 'payment_released'].includes(type)) {
    return <DollarSign className="h-4 w-4 text-emerald-600" />;
  }

  return <Bell className="h-4 w-4 text-zinc-500" />;
};

const truncateMessage = (value: string, max = 80) => {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 1)}…`;
};

export default function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        onMarkAsRead(notification._id);
        if (notification.link) {
          router.push(notification.link);
        }
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }

        event.preventDefault();
        onMarkAsRead(notification._id);
        if (notification.link) {
          router.push(notification.link);
        }
      }}
      className={classNames(
        'group relative flex cursor-pointer items-start gap-3 border-b border-zinc-100 px-3 py-3 transition duration-200 hover:bg-zinc-50',
        notification.isRead ? 'bg-white' : 'bg-blue-50/60',
      )}
    >
      {!notification.isRead ? (
        <span className="absolute left-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-500" />
      ) : null}

      <div className="mt-0.5 shrink-0 rounded-full bg-zinc-100 p-1.5">{getNotificationIcon(notification.type)}</div>

      <div className="min-w-0 flex-1 pr-4">
        <p className={classNames('text-sm text-zinc-900', !notification.isRead ? 'font-semibold' : 'font-medium')}>
          {notification.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-zinc-600">{truncateMessage(notification.message)}</p>
        <p className="mt-1 text-[11px] text-zinc-500">{formatRelativeTime(notification.createdAt)}</p>
      </div>

      <button
        type="button"
        aria-label="Delete notification"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDelete(notification._id);
        }}
        className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:bg-zinc-200 hover:text-zinc-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
