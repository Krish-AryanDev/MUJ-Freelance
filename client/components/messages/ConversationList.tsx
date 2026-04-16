'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { messageService } from '@/services/message.service';
import { useChatStore } from '@/store/chatStore';
import type { Conversation, MessageParticipant } from '@/types/message.types';
import { formatDate } from '@/utils/formatDate';
import { truncateText } from '@/utils/helpers';
import Avatar from '../ui/Avatar';
import Input from '../ui/Input';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../shared/EmptyState';
import ErrorState from '../shared/ErrorState';

interface ConversationListProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

const getOtherParticipant = (conversation: Conversation, currentUserId: string): MessageParticipant | null => {
  return conversation.participants.find((participant) => participant._id !== currentUserId) || null;
};

export default function ConversationList({ activeConversationId, onSelectConversation }: ConversationListProps) {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const [search, setSearch] = useState('');

  const conversations = useChatStore((state) => state.conversations);
  const setConversations = useChatStore((state) => state.setConversations);

  const query = useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: messageService.getConversations,
    staleTime: 10000,
    refetchInterval: isConnected ? false : 30000,
  });

  useEffect(() => {
    if (query.data?.success) {
      setConversations(query.data.data);
    }
  }, [query.data, setConversations]);

  const filteredConversations = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();
    if (!normalizedSearch) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const other = getOtherParticipant(conversation, user?.id || '');
      return String(other?.fullName || '').toLowerCase().includes(normalizedSearch);
    });
  }, [conversations, search, user?.id]);

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 rounded-md" />
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={`conversation-skeleton-${index}`} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Unable to load conversations"
        message={query.error instanceof Error ? query.error.message : 'Please try again.'}
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  }

  if (filteredConversations.length === 0) {
    return (
      <div className="space-y-3">
        <Input
          id="message-conversation-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search conversations"
        />
        <EmptyState title="No conversations" description="Start a chat from a profile, project, or order." />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Input
        id="message-conversation-search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search conversations"
      />

      <div className="space-y-2">
        {filteredConversations.map((conversation) => {
          const other = getOtherParticipant(conversation, user?.id || '');
          const isActive = activeConversationId === conversation._id;
          const preview = conversation.lastMessage?.content || 'No messages yet';

          return (
            <button
              key={conversation._id}
              type="button"
              onClick={() => onSelectConversation(conversation._id)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                isActive
                  ? 'border-black bg-zinc-100'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <Avatar
                src={other?.avatar?.url}
                alt={other?.fullName || 'Participant'}
                fallback={other?.fullName || 'User'}
                size="md"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-zinc-900">{other?.fullName || 'Unknown user'}</p>
                  <p className="shrink-0 text-xs text-zinc-500">
                    {conversation.lastMessage?.createdAt
                      ? formatDate(conversation.lastMessage.createdAt, 'dd MMM, hh:mm a')
                      : '--'}
                  </p>
                </div>
                <p className="truncate text-xs text-zinc-600">{truncateText(preview, 40)}</p>
              </div>

              {conversation.unreadCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">
                  {conversation.unreadCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type { ConversationListProps };
