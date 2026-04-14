'use client';

import { Paperclip, Send, Smile } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useSocket } from '@/hooks/useSocket';
import { messageService } from '@/services/message.service';
import type { Message } from '@/types/message.types';
import Button from '../ui/Button';

interface MessageInputProps {
  conversationId: string;
  onMessageSent: (message: Message) => void;
}

export default function MessageInput({ conversationId, onMessageSent }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const { emitTypingStart, emitTypingStop } = useSocket();

  const canSend = useMemo(() => Boolean(content.trim()) || Boolean(file), [content, file]);

  const sendMutation = useMutation({
    mutationFn: () => {
      const attachments = file
        ? [
            {
              url: URL.createObjectURL(file),
              filename: file.name,
              fileType: file.type || 'application/octet-stream',
              size: file.size,
            },
          ]
        : [];

      return messageService.sendMessage(conversationId, {
        content: content.trim(),
        messageType: file ? (file.type.startsWith('image/') ? 'image' : 'file') : 'text',
        attachments,
      });
    },
    onSuccess: (response) => {
      if (!response.success) {
        toast.error(response.message || 'Failed to send message');
        return;
      }

      onMessageSent(response.data);
      setContent('');
      setFile(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      emitTypingStop(conversationId);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    },
  });

  const autoResize = () => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
  };

  useEffect(() => {
    autoResize();
  }, [content]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTyping = (nextValue: string) => {
    setContent(nextValue);
    emitTypingStart(conversationId);

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      emitTypingStop(conversationId);
    }, 2000);
  };

  const handleSubmit = () => {
    if (!canSend || sendMutation.isPending) {
      return;
    }

    sendMutation.mutate();
  };

  return (
    <div className="space-y-2 border-t border-zinc-200 pt-3">
      {file ? (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
          Selected file: {file.name}
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
          aria-label="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
          aria-label="Emoji picker placeholder"
        >
          <Smile className="h-4 w-4" />
        </button>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => handleTyping(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Type a message..."
          rows={1}
          className="min-h-10 max-h-56 flex-1 resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-black/20 transition focus:ring-2"
        />

        <Button type="button" onClick={handleSubmit} isLoading={sendMutation.isPending} disabled={!canSend}>
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {content.length > 500 ? (
        <p className="text-right text-xs text-zinc-500">{content.length} characters</p>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={(event) => {
          const selectedFile = event.target.files?.[0] || null;
          setFile(selectedFile);
        }}
      />
    </div>
  );
}

export type { MessageInputProps };
