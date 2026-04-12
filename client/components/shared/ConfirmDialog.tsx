'use client';

import type { ReactNode } from 'react';

import Modal from '../ui/Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger';
}

export default function ConfirmDialog({
  isOpen,
  title = 'Please confirm',
  message = 'Are you sure you want to continue?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isConfirming = false,
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmDialogProps) {
  const confirmButtonClassName =
    variant === 'danger'
      ? 'rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700'
      : 'rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button
            type="button"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            onClick={onCancel}
            disabled={isConfirming}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmButtonClassName}
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? 'Processing...' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-zinc-700">{message}</p>
    </Modal>
  );
}
