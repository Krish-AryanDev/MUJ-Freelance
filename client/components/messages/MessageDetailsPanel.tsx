'use client';

import { useMemo } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useChatStore } from '@/store/chatStore';
import Avatar from '../ui/Avatar';

interface MessageDetailsPanelProps {
  conversationId: string | null;
}

const senderId = (sender: { _id?: string } | string): string =>
  typeof sender === 'string' ? sender : String(sender?._id || '');

export default function MessageDetailsPanel({ conversationId }: MessageDetailsPanelProps) {
  const { user } = useAuth();
  const conversations = useChatStore((state) => state.conversations);
  const messagesByConversation = useChatStore((state) => state.messages);

  const conversation = useMemo(
    () => conversations.find((item) => item._id === conversationId) || null,
    [conversationId, conversations],
  );

  const otherParticipant = useMemo(() => {
    const currentUserId = String(user?.id || '');

    return (
      conversation?.participants.find((participant) => participant._id !== currentUserId) ||
      conversation?.participants[0] ||
      null
    );
  }, [conversation?.participants, user?.id]);

  const attachments = useMemo(() => {
    if (!conversationId) {
      return [];
    }

    const conversationMessages = messagesByConversation[conversationId] || [];

    return conversationMessages
      .flatMap((message) =>
        (message.attachments || []).map((attachment) => ({
          ...attachment,
          messageId: message._id,
          sender: senderId(message.sender),
        })),
      )
      .slice(0, 8);
  }, [conversationId, messagesByConversation]);

  if (!conversationId || !conversation) {
    return (
      <aside className="hidden h-full bg-[#fffdf8] p-4 xl:block">
        <p className="text-sm text-[#5f7285]">Select a chat to view details.</p>
      </aside>
    );
  }

  return (
    <aside className="hidden h-full bg-[#fffdf8] p-4 xl:block">
      <div className="rounded-xl border border-[#eadfce] bg-white p-4 text-center shadow-[0_8px_24px_rgba(49,78,95,0.08)]">
        <Avatar
          src={otherParticipant?.avatar?.url}
          alt={otherParticipant?.fullName || 'Participant'}
          fallback={otherParticipant?.fullName || 'User'}
          size="lg"
          className="mx-auto h-20 w-20"
        />
        <p className="mt-3 text-lg font-bold text-[#1a2e45]">{otherParticipant?.fullName || 'Conversation'}</p>
        <p className="mt-1 text-xs text-[#5f7285]">MUJ Freelance Member</p>
      </div>

      <div className="mt-4 space-y-2">
        <button type="button" className="flex w-full items-center justify-between rounded-lg border border-[#eadfce] bg-white px-3 py-2 text-sm font-medium text-[#3a506b] transition-colors hover:bg-[#eef5eb]">
          Information
          <ChevronDown className="h-4 w-4" />
        </button>

        <button type="button" className="flex w-full items-center justify-between rounded-lg border border-[#eadfce] bg-white px-3 py-2 text-sm font-medium text-[#3a506b] transition-colors hover:bg-[#eef5eb]">
          Images ({attachments.filter((item) => item.fileType.startsWith('image/')).length})
          <ChevronDown className="h-4 w-4" />
        </button>

        <button type="button" className="flex w-full items-center justify-between rounded-lg border border-[#eadfce] bg-white px-3 py-2 text-sm font-medium text-[#3a506b] transition-colors hover:bg-[#eef5eb]">
          Files ({attachments.filter((item) => !item.fileType.startsWith('image/')).length})
          <ChevronUp className="h-4 w-4" />
        </button>

        <div className="rounded-lg border border-[#eadfce] bg-white px-3 py-2">
          {attachments.length === 0 ? (
            <p className="text-xs text-[#5f7285]">No shared files yet.</p>
          ) : (
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <a
                  key={`${attachment.messageId}-${attachment.url}`}
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#3a506b] transition-colors hover:bg-[#eef5eb]"
                >
                  <FileText className="h-4 w-4 text-[#8fae8e]" />
                  <span className="truncate">{attachment.filename}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        <button type="button" className="flex w-full items-center justify-between rounded-lg border border-[#eadfce] bg-white px-3 py-2 text-sm font-medium text-[#3a506b] transition-colors hover:bg-[#eef5eb]">
          Pinned items
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

export type { MessageDetailsPanelProps };
