/**
 * Real-time messaging contracts for Socket.io + REST sync.
 */

import type { Id, ISODateString } from './api.types';
import type { User } from './user.types';

export type ConversationType = 'order' | 'project' | 'direct';
export type MessageType = 'text' | 'file' | 'system';

export interface MessageAttachment {
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeInBytes: number;
}

export interface Conversation {
  id: Id;
  type: ConversationType;
  participants: Array<Pick<User, 'id' | 'fullName' | 'avatar'>>;
  orderId?: Id;
  projectId?: Id;
  lastMessageAt: ISODateString;
  unreadCount: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ChatMessage {
  id: Id;
  conversationId: Id;
  sender: Pick<User, 'id' | 'fullName' | 'avatar'>;
  type: MessageType;
  content: string;
  attachments: MessageAttachment[];
  isEdited: boolean;
  readByUserIds: Id[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface SendMessageRequest {
  conversationId: Id;
  content: string;
  type?: Exclude<MessageType, 'system'>;
  attachments?: MessageAttachment[];
}

export interface TypingEventPayload {
  conversationId: Id;
  userId: Id;
  isTyping: boolean;
}
