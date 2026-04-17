'use client';

import { Check, CheckCheck, Info, Link2 } from 'lucide-react';

import type { Message } from '@/types/message.types';
import { formatDate } from '@/utils/formatDate';
import Avatar from '../ui/Avatar';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

const senderId = (value: Message['sender']): string => (typeof value === 'string' ? value : value._id);

export default function MessageBubble({ message, isOwn, showAvatar }: MessageBubbleProps) {
  const readByOthers = Array.isArray(message.readBy)
    ? message.readBy.some((entry) => senderId(entry.user as Message['sender']) !== senderId(message.sender))
    : false;

  const bubbleClass = isOwn
    ? 'bg-gradient-to-r from-[#8fae8e] to-[#7d9d7c] text-white border-transparent shadow-[0_10px_24px_rgba(79,112,78,0.28)]'
    : 'bg-white text-[#2f3e46] border-[#eadfce] shadow-[0_8px_24px_rgba(49,78,95,0.08)]';

  return (
    <div className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && showAvatar ? (
        <Avatar
          size="sm"
          src={typeof message.sender === 'string' ? undefined : message.sender.avatar?.url}
          fallback={typeof message.sender === 'string' ? 'U' : message.sender.fullName}
        />
      ) : !isOwn ? (
        <span className="h-8 w-8" />
      ) : null}

      <div className={`max-w-[78%] rounded-2xl border px-3.5 py-2.5 ${bubbleClass}`}>
        {message.messageType === 'order_update' ? (
          <div className="mb-2 flex items-center gap-2 rounded-md bg-[#eef5eb] px-2 py-1 text-xs font-medium text-[#4e6b4e]">
            <Info className="h-3.5 w-3.5" />
            Order update
          </div>
        ) : null}

        <p className={`text-sm ${message.deletedAt ? 'italic text-[#8b96a2]' : ''}`}>{message.content}</p>

        {message.attachments.length > 0 ? (
          <div className="mt-2 space-y-1">
            {message.attachments.map((attachment) => {
              const isImage = attachment.fileType.startsWith('image/');

              if (isImage) {
                return (
                  <a
                    key={`${message._id}-${attachment.url}`}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs underline"
                  >
                    🖼 {attachment.filename}
                  </a>
                );
              }

              return (
                <a
                  key={`${message._id}-${attachment.url}`}
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs underline"
                >
                  <Link2 className="h-3 w-3" />
                  {attachment.filename}
                </a>
              );
            })}
          </div>
        ) : null}

        <div className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${isOwn ? 'text-[#e7f3e2]' : 'text-[#8b96a2]'}`}>
          <span>{formatDate(message.createdAt, 'hh:mm a')}</span>
          {isOwn ? readByOthers ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" /> : null}
        </div>
      </div>
    </div>
  );
}

export type { MessageBubbleProps };
