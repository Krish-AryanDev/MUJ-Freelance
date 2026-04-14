'use client';

import { useSocket } from '@/hooks/useSocket';

export default function SocketInitializer() {
  useSocket();
  return null;
}
