import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import ConversationPageClient from '@/components/messages/ConversationPageClient';

export const metadata: Metadata = {
  title: 'Chat | MUJ Freelance',
};

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function Page({ params }: ConversationPageProps) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  if (!accessToken) {
    redirect('/login');
  }

  const { conversationId } = await params;

  return <ConversationPageClient conversationId={conversationId} />;
}

