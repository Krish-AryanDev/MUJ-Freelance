'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { io, type Socket } from 'socket.io-client';

import { authStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useChatStore } from '@/store/chatStore';
import type { Message } from '@/types/message.types';

interface NewMessageEvent {
  conversationId: string;
  message: Message;
}

interface ConversationUpdatedEvent {
  conversationId: string;
  lastMessage?: Message;
  updatedAt?: string;
}

interface TypingEvent {
  conversationId: string;
  userId: string;
}

let socketInstance: Socket | null = null;
let subscribers = 0;
let blockedAuthKey = '';
let isAuthBlocked = false;
let latestAuthKey = '';

const getSocketUrl = (): string => process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

const getSocketErrorStatus = (error: unknown): number | null => {
  const candidate = error as {
    status?: number;
    data?: { statusCode?: number };
    description?: { status?: number };
    context?: { status?: number };
  };

  const status =
    candidate?.status ??
    candidate?.data?.statusCode ??
    candidate?.description?.status ??
    candidate?.context?.status;

  return typeof status === 'number' ? status : null;
};

export const useSocket = () => {
  const { initialized, isAuthenticated, user, accessToken } = useAuth();
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const isConnected = useChatStore((state) => state.isConnected);
  const setIsConnected = useChatStore((state) => state.setIsConnected);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const incrementUnreadCount = useChatStore((state) => state.incrementUnreadCount);
  const setTypingUser = useChatStore((state) => state.setTypingUser);

  const previousConversationRef = useRef<string | null>(null);

  useEffect(() => {
    subscribers += 1;

    return () => {
      subscribers = Math.max(subscribers - 1, 0);

      if (subscribers === 0 && socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
    };
  }, []);

  useEffect(() => {
    const storeState = authStore.getState();
    const token = String(accessToken || storeState.accessToken || '').trim();
    const authUser = user || storeState.user;
    const userId = String(authUser?.id || authUser?._id || '').trim();
    const shouldConnect = Boolean(initialized && isAuthenticated && token && userId);
    const authKey = `${userId}:${token}`;

    latestAuthKey = authKey;

    if (isAuthBlocked && blockedAuthKey && blockedAuthKey !== authKey) {
      isAuthBlocked = false;
      blockedAuthKey = '';
    }

    if (!shouldConnect) {
      if (socketInstance) {
        socketInstance.io.opts.reconnection = false;
        socketInstance.disconnect();
      }

      setIsConnected(false);
      return;
    }

    if (isAuthBlocked && blockedAuthKey === authKey) {
      setIsConnected(false);
      return;
    }

    if (!socketInstance) {
      socketInstance = io(getSocketUrl(), {
        autoConnect: false,
        withCredentials: true,
        transports: ['polling', 'websocket'],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: 5,
        auth: {
          token,
        },
        query: {
          token,
        },
      });

      socketInstance.on('connect', () => {
        setIsConnected(true);
        const currentUserId = authStore.getState().user?.id;
        if (currentUserId) {
          socketInstance?.emit('register_user', { userId: currentUserId });
        }
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        setIsConnected(false);

        const message = String(error?.message || '').toLowerCase();
        const statusCode = getSocketErrorStatus(error);
        const shouldBlock =
          statusCode === 400 ||
          statusCode === 401 ||
          message.includes('unauthorized') ||
          message.includes('authentication') ||
          message.includes('invalid token');

        if (shouldBlock) {
          isAuthBlocked = true;
          blockedAuthKey = latestAuthKey;
          if (socketInstance) {
            socketInstance.io.opts.reconnection = false;
          }
          socketInstance?.disconnect();
        }
      });

      socketInstance.on('new_message', (payload: NewMessageEvent) => {
        if (!payload?.conversationId || !payload?.message) {
          return;
        }

        addMessage(payload.conversationId, payload.message);
        updateConversation(payload.conversationId, {
          lastMessage: payload.message,
          updatedAt: payload.message.updatedAt,
        });

        const currentActiveId = useChatStore.getState().activeConversationId;
        if (currentActiveId !== payload.conversationId) {
          incrementUnreadCount();
          const sender = payload.message.sender;
          const senderName = typeof sender === 'string' ? 'Someone' : sender.fullName;
          toast(`${senderName}: ${payload.message.content || 'Sent an attachment'}`);
        }
      });

      socketInstance.on('conversation_updated', (payload: ConversationUpdatedEvent) => {
        if (!payload?.conversationId) {
          return;
        }

        updateConversation(payload.conversationId, {
          lastMessage: payload.lastMessage,
          updatedAt: payload.updatedAt || new Date().toISOString(),
        });
      });

      socketInstance.on('typing_start', (payload: TypingEvent) => {
        if (!payload?.conversationId || !payload?.userId) {
          return;
        }
        setTypingUser(payload.conversationId, payload.userId, true);
      });

      socketInstance.on('typing_stop', (payload: TypingEvent) => {
        if (!payload?.conversationId || !payload?.userId) {
          return;
        }
        setTypingUser(payload.conversationId, payload.userId, false);
      });
    } else {
      const liveToken = String(authStore.getState().accessToken || token || '').trim();
      socketInstance.auth = {
        token: liveToken,
      };

      socketInstance.io.opts.query = {
        token: liveToken,
      };

      socketInstance.io.opts.reconnection = true;

      if (!socketInstance.connected) {
        socketInstance.connect();
      } else if (userId) {
        socketInstance.emit('register_user', { userId });
      }
    }
  }, [
    accessToken,
    addMessage,
    incrementUnreadCount,
    initialized,
    isAuthenticated,
    setIsConnected,
    setTypingUser,
    updateConversation,
    user?.id,
  ]);

  useEffect(() => {
    if (!socketInstance || !socketInstance.connected) {
      previousConversationRef.current = activeConversationId;
      return;
    }

    const previousId = previousConversationRef.current;
    if (previousId && previousId !== activeConversationId) {
      socketInstance.emit('leave_conversation', { conversationId: previousId });
    }

    if (activeConversationId) {
      socketInstance.emit('join_conversation', { conversationId: activeConversationId });
    }

    previousConversationRef.current = activeConversationId;
  }, [activeConversationId]);

  const emitTypingStart = (conversationId: string): void => {
    const userId = authStore.getState().user?.id;
    if (!socketInstance || !userId || !conversationId) {
      return;
    }

    socketInstance.emit('typing_start', {
      conversationId,
      userId,
    });
  };

  const emitTypingStop = (conversationId: string): void => {
    const userId = authStore.getState().user?.id;
    if (!socketInstance || !userId || !conversationId) {
      return;
    }

    socketInstance.emit('typing_stop', {
      conversationId,
      userId,
    });
  };

  return {
    socket: socketInstance,
    isConnected,
    emitTypingStart,
    emitTypingStop,
  };
};

export default useSocket;
