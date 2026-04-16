'use client';

import { isToday, isYesterday } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { messageService } from '@/services/message.service';
import { useChatStore } from '@/store/chatStore';
import type { Message } from '@/types/message.types';
import { formatDate } from '@/utils/formatDate';
import Avatar from '../ui/Avatar';
import EmptyState from '../shared/EmptyState';
import ErrorState from '../shared/ErrorState';
import Spinner from '../ui/Spinner';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  conversationId: string;
}

interface MessageGroup {
  label: string;
  messages: Message[];
}

const EMPTY_TYPING_USERS: string[] = [];

const senderId = (value: Message['sender']): string => (typeof value === 'string' ? value : value._id);

const formatGroupLabel = (dateValue: string): string => {
  const date = new Date(dateValue);

  if (isToday(date)) {
    return 'Today';
  }

  if (isYesterday(date)) {
    return 'Yesterday';
  }

  return formatDate(dateValue, 'dd MMM yyyy');
};

export default function ChatWindow({ conversationId }: ChatWindowProps) {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const conversations = useChatStore((state) => state.conversations);
  const messagesByConversation = useChatStore((state) => state.messages);
  const setMessages = useChatStore((state) => state.setMessages);
  const addMessage = useChatStore((state) => state.addMessage);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const typingUsersByConversation = useChatStore((state) => state.typingUsers);

  const endRef = useRef<HTMLDivElement | null>(null);

  const query = useQuery({
    queryKey: ['messages', 'conversation', conversationId],
    queryFn: () => messageService.getMessages(conversationId, 1, 100),
    refetchInterval: isConnected ? false : 15000,
    enabled: Boolean(conversationId),
  });

  const markAsReadQuery = useQuery({
    queryKey: ['messages', 'mark-read', conversationId],
    queryFn: () => messageService.markAsRead(conversationId),
    enabled: Boolean(conversationId),
    staleTime: 0,
  });

  useEffect(() => {
    setActiveConversation(conversationId);
    return () => setActiveConversation(null);
  }, [conversationId, setActiveConversation]);

  useEffect(() => {
    if (query.data?.success) {
      setMessages(conversationId, query.data.data.messages);
    }
  }, [conversationId, query.data, setMessages]);

  const messages = useMemo(() => messagesByConversation[conversationId] || [], [conversationId, messagesByConversation]);
  const typingUsers = useMemo(
    () => typingUsersByConversation[conversationId] || EMPTY_TYPING_USERS,
    [conversationId, typingUsersByConversation],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === conversationId),
    [conversationId, conversations],
  );

  const otherParticipant = useMemo(() => {
    const currentUserId = user?.id || '';
    return (
      activeConversation?.participants.find((participant) => participant._id !== currentUserId) ||
      activeConversation?.participants[0] ||
      null
    );
  }, [activeConversation?.participants, user?.id]);

  const groupedMessages = useMemo<MessageGroup[]>(() => {
    const groups: MessageGroup[] = [];

    messages.forEach((message) => {
      const label = formatGroupLabel(message.createdAt);
      const lastGroup = groups[groups.length - 1];

      if (!lastGroup || lastGroup.label !== label) {
        groups.push({ label, messages: [message] });
      } else {
        lastGroup.messages.push(message);
      }
    });

    return groups;
  }, [messages]);

  if (query.isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Spinner />
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Unable to load chat"
        message={query.error instanceof Error ? query.error.message : 'Please try again.'}
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar
            src={otherParticipant?.avatar?.url}
            alt={otherParticipant?.fullName || 'Participant'}
            fallback={otherParticipant?.fullName || 'User'}
            size="md"
          />
          <div>
            <p className="text-sm font-semibold text-zinc-900">{otherParticipant?.fullName || 'Conversation'}</p>
            <p className="text-xs text-zinc-500">{otherParticipant?.email || 'MUJ Freelance chat'}</p>
          </div>
        </div>

        <p className="text-xs text-zinc-500">{markAsReadQuery.isFetching ? 'Syncing...' : 'Synced'}</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {groupedMessages.length === 0 ? (
          <EmptyState title="No messages yet" description="Start the conversation with your first message." />
        ) : (
          groupedMessages.map((group) => (
            <div key={group.label} className="space-y-3">
              <div className="text-center text-xs font-medium text-zinc-500">{group.label}</div>
              {group.messages.map((message, index) => {
                const previous = group.messages[index - 1];
                const isOwn = senderId(message.sender) === String(user?.id || '');
                const showAvatar = !previous || senderId(previous.sender) !== senderId(message.sender);

                return <MessageBubble key={message._id} message={message} isOwn={isOwn} showAvatar={showAvatar} />;
              })}
            </div>
          ))
        )}

        {typingUsers.filter((typingUserId) => typingUserId !== String(user?.id || '')).length > 0 ? (
          <p className="text-xs italic text-zinc-500">Someone is typing...</p>
        ) : null}

        <div ref={endRef} />
      </div>

      <div className="border-t border-zinc-200 px-4 py-3">
        <MessageInput
          conversationId={conversationId}
          onMessageSent={(message) => {
            addMessage(conversationId, message);
          }}
        />
      </div>
    </div>
  );
}

export type { ChatWindowProps };
