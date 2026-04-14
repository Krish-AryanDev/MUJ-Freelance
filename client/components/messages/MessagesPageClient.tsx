'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import ChatWindow from './ChatWindow';
import ConversationList from './ConversationList';

export default function MessagesPageClient() {
  const router = useRouter();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  return (
    <div className="mx-auto grid h-[calc(100vh-9rem)] w-full max-w-7xl grid-cols-1 gap-4 px-4 py-6 md:grid-cols-[320px_1fr] sm:px-6 lg:px-8">
      <section className="rounded-xl border border-zinc-200 bg-white p-3">
        <ConversationList
          activeConversationId={activeConversationId}
          onSelectConversation={(conversationId) => {
            setActiveConversationId(conversationId);
            router.push(`/messages/${conversationId}`);
          }}
        />
      </section>

      <section className="hidden rounded-xl border border-zinc-200 bg-white md:block">
        {activeConversationId ? (
          <ChatWindow conversationId={activeConversationId} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">Select a conversation</div>
        )}
      </section>
    </div>
  );
}
