'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import ChatWindow from './ChatWindow';
import ConversationList from './ConversationList';

interface ConversationPageClientProps {
  conversationId: string;
}

export default function ConversationPageClient({ conversationId }: ConversationPageClientProps) {
  return (
    <div className="mx-auto grid h-[calc(100vh-9rem)] w-full max-w-7xl grid-cols-1 gap-4 px-4 py-6 md:grid-cols-[320px_1fr] sm:px-6 lg:px-8">
      <section className="hidden rounded-xl border border-zinc-200 bg-white p-3 md:block">
        <ConversationList
          activeConversationId={conversationId}
          onSelectConversation={(id) => {
            if (id !== conversationId) {
              window.location.href = `/messages/${id}`;
            }
          }}
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3 md:hidden">
          <Link href="/messages" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
            <ArrowLeft className="h-4 w-4" />
            Back to conversations
          </Link>
        </div>
        <ChatWindow conversationId={conversationId} />
      </section>
    </div>
  );
}

export type { ConversationPageClientProps };
