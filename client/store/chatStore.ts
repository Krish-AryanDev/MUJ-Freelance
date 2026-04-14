import { create } from 'zustand';

import type { Conversation, Message } from '@/types/message.types';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  unreadCount: number;
  isConnected: boolean;
  typingUsers: Record<string, string[]>;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  setActiveConversation: (conversationId: string | null) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  setUnreadCount: (count: number) => void;
  decrementUnreadCount: () => void;
  incrementUnreadCount: () => void;
  setIsConnected: (status: boolean) => void;
  setTypingUser: (conversationId: string, userId: string, isTyping: boolean) => void;
  reset: () => void;
}

const sortConversations = (conversations: Conversation[]): Conversation[] => {
  return [...conversations].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  unreadCount: 0,
  isConnected: false,
  typingUsers: {},

  setConversations: (conversations) => {
    set({ conversations: sortConversations(conversations) });
  },

  addConversation: (conversation) => {
    set((state) => {
      const exists = state.conversations.some((item) => item._id === conversation._id);
      if (exists) {
        return {
          conversations: sortConversations(
            state.conversations.map((item) => (item._id === conversation._id ? conversation : item)),
          ),
        };
      }

      return {
        conversations: sortConversations([conversation, ...state.conversations]),
      };
    });
  },

  updateConversation: (conversationId, updates) => {
    set((state) => ({
      conversations: sortConversations(
        state.conversations.map((item) =>
          item._id === conversationId
            ? {
                ...item,
                ...updates,
                updatedAt: updates.updatedAt || new Date().toISOString(),
              }
            : item,
        ),
      ),
    }));
  },

  setActiveConversation: (conversationId) => {
    set({ activeConversationId: conversationId });
  },

  setMessages: (conversationId, messages) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    }));
  },

  addMessage: (conversationId, message) => {
    set((state) => {
      const existing = state.messages[conversationId] || [];
      const alreadyExists = existing.some((item) => item._id === message._id);
      const updatedMessages = alreadyExists
        ? existing.map((item) => (item._id === message._id ? { ...item, ...message } : item))
        : [...existing, message];

      const updatedConversations = state.conversations.map((conversation) =>
        conversation._id === conversationId
          ? {
              ...conversation,
              lastMessage: message,
              updatedAt: message.createdAt || new Date().toISOString(),
            }
          : conversation,
      );

      return {
        messages: {
          ...state.messages,
          [conversationId]: updatedMessages,
        },
        conversations: sortConversations(updatedConversations),
      };
    });
  },

  updateMessage: (conversationId, messageId, updates) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((message) =>
          message._id === messageId ? { ...message, ...updates } : message,
        ),
      },
    }));
  },

  setUnreadCount: (count) => {
    set({ unreadCount: Math.max(0, count) });
  },

  decrementUnreadCount: () => {
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) }));
  },

  incrementUnreadCount: () => {
    set((state) => ({ unreadCount: state.unreadCount + 1 }));
  },

  setIsConnected: (status) => {
    set({ isConnected: status });
  },

  setTypingUser: (conversationId, userId, isTyping) => {
    set((state) => {
      const existing = state.typingUsers[conversationId] || [];
      const nextUsers = isTyping
        ? Array.from(new Set([...existing, userId]))
        : existing.filter((id) => id !== userId);

      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: nextUsers,
        },
      };
    });
  },

  reset: () => {
    set({
      conversations: [],
      activeConversationId: null,
      messages: {},
      unreadCount: 0,
      isConnected: false,
      typingUsers: {},
    });
  },
}));

export type { ChatState };
