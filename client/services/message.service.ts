import { apiClient } from '@/lib/axios';
import type { ApiResponse, ErrorResponse } from '@/types/api.types';
import type { Conversation, Message, SendMessagePayload } from '@/types/message.types';

interface PaginatedMessages {
  messages: Message[];
  totalPages: number;
  currentPage: number;
}

const toParticipant = (participant: unknown) => {
  const user = (participant || {}) as {
    _id?: string;
    id?: string;
    fullName?: string;
    email?: string;
    avatar?: { url?: string; publicId?: string };
  };

  return {
    _id: user._id || user.id || '',
    fullName: user.fullName || 'User',
    email: user.email || '',
    avatar: user.avatar || { url: '' },
  };
};

const toMessage = (message: unknown): Message => {
  const item = (message || {}) as {
    _id?: string;
    id?: string;
    conversation?: string;
    sender?: unknown;
    content?: string;
    messageType?: string;
    type?: string;
    attachments?: Array<{ url?: string; filename?: string; name?: string; fileType?: string; mimeType?: string; size?: number }>;
    isRead?: boolean;
    readAt?: string | null;
    readBy?: Array<{ user: string | { _id?: string; id?: string; fullName?: string; email?: string; avatar?: { url?: string } }; readAt: string }>;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  };

  return {
    _id: item._id || item.id || '',
    conversation: String(item.conversation || ''),
    sender: typeof item.sender === 'string' ? item.sender : toParticipant(item.sender),
    content: item.content || '',
    messageType: (item.messageType || item.type || 'text') as Message['messageType'],
    attachments: Array.isArray(item.attachments)
      ? item.attachments.map((attachment) => ({
          url: attachment.url || '',
          filename: attachment.filename || attachment.name || 'Attachment',
          fileType: attachment.fileType || attachment.mimeType || '',
          size: Number(attachment.size || 0),
        }))
      : [],
    isRead: Boolean(item.isRead),
    readAt: item.readAt || null,
    readBy: Array.isArray(item.readBy)
      ? item.readBy.map((entry) => ({
          user: typeof entry.user === 'string' ? entry.user : toParticipant(entry.user),
          readAt: entry.readAt,
        }))
      : [],
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    deletedAt: item.deletedAt || null,
  };
};

const toConversation = (conversation: unknown): Conversation => {
  const item = (conversation || {}) as {
    _id?: string;
    id?: string;
    participants?: unknown[];
    lastMessage?: unknown;
    relatedOrder?: string | null;
    relatedGig?: string | null;
    unreadCount?: number;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };

  return {
    _id: item._id || item.id || '',
    participants: Array.isArray(item.participants) ? item.participants.map((participant) => toParticipant(participant)) : [],
    lastMessage: item.lastMessage ? toMessage(item.lastMessage) : null,
    relatedOrder: item.relatedOrder || null,
    relatedGig: item.relatedGig || null,
    unreadCount: Number(item.unreadCount || 0),
    isActive: item.isActive !== false,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  };
};

export const messageService = {
  getConversations: async (): Promise<ApiResponse<Conversation[]>> => {
    const response = await apiClient.get<ApiResponse<unknown[]>>('/messages/conversations');

    if (!response.data.success) {
      const errorPayload = response.data as ErrorResponse;
      return {
        success: false,
        statusCode: errorPayload.statusCode,
        message: errorPayload.message,
        errors: errorPayload.errors,
        errorCode: errorPayload.errorCode,
      };
    }

    return {
      ...response.data,
      data: Array.isArray(response.data.data)
        ? response.data.data.map((conversation) => toConversation(conversation))
        : [],
    };
  },

  getOrCreateConversation: async (payload: {
    otherUserId: string;
    relatedGig?: string;
    relatedOrder?: string;
  }): Promise<ApiResponse<Conversation>> => {
    const response = await apiClient.post<ApiResponse<unknown>>('/messages/conversations', payload);

    if (!response.data.success) {
      const errorPayload = response.data as ErrorResponse;
      return {
        success: false,
        statusCode: errorPayload.statusCode,
        message: errorPayload.message,
        errors: errorPayload.errors,
        errorCode: errorPayload.errorCode,
      };
    }

    return {
      ...response.data,
      data: toConversation(response.data.data),
    };
  },

  getMessages: async (
    conversationId: string,
    page = 1,
    limit = 50,
  ): Promise<ApiResponse<PaginatedMessages>> => {
    const response = await apiClient.get<ApiResponse<{ messages: unknown[]; totalPages: number; currentPage: number }>>(
      `/messages/conversations/${conversationId}`,
      {
        params: { page, limit },
      },
    );

    if (!response.data.success) {
      const errorPayload = response.data as ErrorResponse;
      return {
        success: false,
        statusCode: errorPayload.statusCode,
        message: errorPayload.message,
        errors: errorPayload.errors,
        errorCode: errorPayload.errorCode,
      };
    }

    return {
      ...response.data,
      data: {
        messages: Array.isArray(response.data.data.messages)
          ? response.data.data.messages.map((message) => toMessage(message))
          : [],
        totalPages: Number(response.data.data.totalPages || 1),
        currentPage: Number(response.data.data.currentPage || 1),
      },
    };
  },

  sendMessage: async (conversationId: string, payload: SendMessagePayload): Promise<ApiResponse<Message>> => {
    const response = await apiClient.post<ApiResponse<unknown>>(`/messages/conversations/${conversationId}`, payload);

    if (!response.data.success) {
      const errorPayload = response.data as ErrorResponse;
      return {
        success: false,
        statusCode: errorPayload.statusCode,
        message: errorPayload.message,
        errors: errorPayload.errors,
        errorCode: errorPayload.errorCode,
      };
    }

    return {
      ...response.data,
      data: toMessage(response.data.data),
    };
  },

  markAsRead: async (conversationId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.put<ApiResponse<null>>(`/messages/conversations/${conversationId}/read`);
    return response.data;
  },

  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await apiClient.get<ApiResponse<{ count: number }>>('/messages/unread-count');
    return response.data;
  },

  deleteMessage: async (messageId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>(`/messages/${messageId}`);
    return response.data;
  },
};

export default messageService;
