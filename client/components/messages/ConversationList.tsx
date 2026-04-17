'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { messageService } from '@/services/message.service';
import { useChatStore } from '@/store/chatStore';
import type { Conversation, MessageParticipant } from '@/types/message.types';
import { formatDate } from '@/utils/formatDate';
import { truncateText } from '@/utils/helpers';
import Avatar from '../ui/Avatar';
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
        <Skeleton className="h-10 rounded-xl" />
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={`conversation-skeleton-${index}`} className="h-16 rounded-xl" />
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
        <div className="flex items-center gap-2 rounded-xl border border-[#eadfce] bg-white px-3 py-2">
          <Search className="h-4 w-4 text-[#b7c3cd]" />
          <input
            id="message-conversation-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search here"
            className="w-full bg-transparent text-sm text-[#2f3e46] placeholder:text-[#9aa6b2] focus:outline-none"
          />
        </div>
        <EmptyState title="No conversations" description="Start a chat from a profile, project, or order." />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-[#eadfce] bg-white px-3 py-2">
        <Search className="h-4 w-4 text-[#b7c3cd]" />
        <input
          id="message-conversation-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search here"
          className="w-full bg-transparent text-sm text-[#2f3e46] placeholder:text-[#9aa6b2] focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        {filteredConversations.map((conversation) => {
          const other = getOtherParticipant(conversation, user?.id || '');
          const isActive = activeConversationId === conversation._id;
          const preview = conversation.lastMessage?.content || 'No messages yet';

          return (
            <button
              key={conversation._id}
              type="button"
              onClick={() => onSelectConversation(conversation._id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                isActive
                  ? 'border-[#d7e4d1] bg-[#eef5eb]'
                  : 'border-transparent bg-transparent hover:border-[#eadfce] hover:bg-white'
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
                  <p className="truncate text-sm font-semibold text-[#1a2e45]">{other?.fullName || 'Unknown user'}</p>
                  <p className="shrink-0 text-xs text-[#8b96a2]">
                    {conversation.lastMessage?.createdAt
                      ? formatDate(conversation.lastMessage.createdAt, 'dd MMM, hh:mm a')
                      : '--'}
                  </p>
                </div>
                <p className="truncate text-xs text-[#5f7285]">{truncateText(preview, 40)}</p>
              </div>

              {conversation.unreadCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8fae8e] px-1.5 text-xs font-semibold text-white">
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
