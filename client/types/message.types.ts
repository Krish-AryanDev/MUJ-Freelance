import type { ISODateString } from './api.types';

export type MessageType = 'text' | 'image' | 'file' | 'order_update';

export interface MessageParticipant {
  _id: string;
  fullName: string;
  email?: string;
  avatar?: {
    url?: string;
    publicId?: string;
  };
}

export interface MessageAttachment {
  url: string;
  filename: string;
  fileType: string;
  size?: number;
}

export interface MessageReadReceipt {
  user: string | MessageParticipant;
  readAt: ISODateString;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: string | MessageParticipant;
  content: string;
  messageType: MessageType;
  attachments: MessageAttachment[];
  isRead: boolean;
  readAt?: ISODateString | null;
  readBy?: MessageReadReceipt[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
  deletedAt?: ISODateString | null;
}

export interface Conversation {
  _id: string;
  participants: MessageParticipant[];
  lastMessage?: Message | null;
  relatedOrder?: string | null;
  relatedGig?: string | null;
  unreadCount: number;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface SendMessagePayload {
  content: string;
  messageType?: MessageType;
  attachments?: MessageAttachment[];
}

export interface ConversationFilters {
  search?: string;
}
