'use client';

import { useState } from 'react';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import type { User } from '@/types/user.types';

interface UserTableProps {
  users: User[];
  onBanUser: (userId: string) => Promise<void>;
  onUnbanUser: (userId: string) => Promise<void>;
}

type PendingAction =
  | { type: 'ban'; user: User }
  | { type: 'unban'; user: User }
  | null;

const accountStatusVariant = (status?: string) => {
  if (status === 'active') {
    return 'success';
  }

  if (status === 'blocked') {
    return 'danger';
  }

  if (status === 'suspended' || status === 'pending_verification') {
    return 'warning';
  }

  return 'default';
};

export default function UserTable({ users, onBanUser, onUnbanUser }: UserTableProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const runAction = async () => {
    if (!pendingAction) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (pendingAction.type === 'ban') {
        await onBanUser(pendingAction.user.id);
      } else {
        await onUnbanUser(pendingAction.user.id);
      }

      setPendingAction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Roles</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Joined</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((user) => {
              const isBlocked = user.accountStatus === 'blocked';

              return (
                <tr key={user.id} className="hover:bg-zinc-50/70">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900">{user.fullName}</p>
                    <p className="text-sm text-zinc-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {user.roles.map((role) => (
                        <Badge key={role} variant="info" className="capitalize">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={accountStatusVariant(user.accountStatus)} className="capitalize">
                      {user.accountStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isBlocked ? (
                      <Button size="sm" variant="outline" onClick={() => setPendingAction({ type: 'unban', user })}>
                        Unban
                      </Button>
                    ) : (
                      <Button size="sm" variant="danger" onClick={() => setPendingAction({ type: 'ban', user })}>
                        Ban
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={Boolean(pendingAction)}
        title={pendingAction?.type === 'ban' ? 'Ban user?' : 'Unban user?'}
        message={
          pendingAction
            ? `${pendingAction.type === 'ban' ? 'Block' : 'Unblock'} ${pendingAction.user.fullName}?`
            : ''
        }
        confirmLabel={pendingAction?.type === 'ban' ? 'Ban User' : 'Unban User'}
        variant={pendingAction?.type === 'ban' ? 'danger' : 'default'}
        isConfirming={isSubmitting}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          void runAction();
        }}
      />
    </>
  );
}
