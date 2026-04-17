'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus } from 'lucide-react';

import ChatWindow from './ChatWindow';
import ConversationList from './ConversationList';
import MessageDetailsPanel from './MessageDetailsPanel';

export default function MessagesPageClient() {
  const router = useRouter();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  return (
    <div className="h-[calc(100vh-4rem)] w-full bg-[#fff8ef]">
      <div className="grid h-full w-full lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_300px]">
        <section className="border-b border-[#eadfce] bg-[#fffdf8] p-4 lg:border-b-0 lg:border-r">
          <button
            type="button"
            className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[#eadfce] bg-white px-3 py-2 text-sm font-semibold text-[#3a506b] transition-colors hover:border-[#a9c29f] hover:text-[#5f7a5f]"
          >
            <Plus className="h-4 w-4" />
            New conversation
          </button>

          <h2 className="mb-2 text-3xl font-black tracking-tight text-[#1d3557]">Chats</h2>

          <ConversationList
            activeConversationId={activeConversationId}
            onSelectConversation={(conversationId) => {
              setActiveConversationId(conversationId);
              router.push(`/messages/${conversationId}`);
            }}
          />
        </section>

        <section className="min-h-0 bg-[#fffdf8] xl:border-r xl:border-[#eadfce]">
          {activeConversationId ? (
            <ChatWindow conversationId={activeConversationId} />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#fffdf8] text-sm text-[#5f7285]">
              Select a conversation
            </div>
          )}
        </section>

        <MessageDetailsPanel conversationId={activeConversationId} />
      </div>
    </div>
  );
}
