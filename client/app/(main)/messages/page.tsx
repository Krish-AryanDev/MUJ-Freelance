import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import MessagesPageClient from '@/components/messages/MessagesPageClient';

export const metadata: Metadata = {
  title: 'Messages | MUJ Freelance',
};

export default async function Page() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  if (!accessToken) {
    redirect('/login');
  }

  return <MessagesPageClient />;
}

