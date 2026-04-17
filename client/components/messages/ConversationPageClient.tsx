'use client';

import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';

import ChatWindow from './ChatWindow';
import ConversationList from './ConversationList';
import MessageDetailsPanel from './MessageDetailsPanel';

interface ConversationPageClientProps {
  conversationId: string;
}

export default function ConversationPageClient({ conversationId }: ConversationPageClientProps) {
  return (
    <div className="h-[calc(100vh-4rem)] w-full bg-[#fff8ef]">
      <div className="grid h-full w-full lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_300px]">
        <section className="hidden border-r border-[#eadfce] bg-[#fffdf8] p-4 lg:block">
          <button
            type="button"
            className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[#eadfce] bg-white px-3 py-2 text-sm font-semibold text-[#3a506b] transition-colors hover:border-[#a9c29f] hover:text-[#5f7a5f]"
          >
            <Plus className="h-4 w-4" />
            New conversation
          </button>

          <h2 className="mb-2 text-3xl font-black tracking-tight text-[#1d3557]">Chats</h2>

          <ConversationList
            activeConversationId={conversationId}
            onSelectConversation={(id) => {
              if (id !== conversationId) {
                window.location.href = `/messages/${id}`;
              }
            }}
          />
        </section>

        <section className="min-h-0 bg-[#fffdf8] xl:border-r xl:border-[#eadfce]">
          <div className="h-full bg-[#fffdf8]">
            <div className="border-b border-[#eadfce] bg-white px-4 py-3 lg:hidden">
              <Link href="/messages" className="inline-flex items-center gap-2 text-sm font-medium text-[#3a506b]">
                <ArrowLeft className="h-4 w-4" />
                Back to conversations
              </Link>
            </div>
            <ChatWindow conversationId={conversationId} />
          </div>
        </section>

        <MessageDetailsPanel conversationId={conversationId} />
      </div>
    </div>
  );
}

export type { ConversationPageClientProps };
