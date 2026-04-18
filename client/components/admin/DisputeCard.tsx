'use client';

import { useMemo, useState } from 'react';

import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { DisputeOrder } from '@/types/admin.types';

interface DisputeCardProps {
  dispute: DisputeOrder;
  onResolve: (orderId: string, resolutionNote: string) => Promise<void>;
}

const getUserName = (user: DisputeOrder['clientId']) => {
  if (!user || typeof user === 'string') {
    return 'Unknown';
  }

  return user.fullName;
};

const getOrderTitle = (gig: DisputeOrder['gigId']) => {
  if (!gig || typeof gig === 'string') {
    return 'Order';
  }

  return gig.title;
};

export default function DisputeCard({ dispute, onResolve }: DisputeCardProps) {
  const [resolutionNote, setResolutionNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const disabled = useMemo(() => !resolutionNote.trim() || isResolving, [resolutionNote, isResolving]);

  const submitResolution = async () => {
    setIsResolving(true);

    try {
      await onResolve(dispute._id, resolutionNote.trim());
      setResolutionNote('');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{getOrderTitle(dispute.gigId)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-zinc-600">Order: {dispute._id}</p>
        <p className="text-sm text-zinc-700">
          <span className="font-medium">Client:</span> {getUserName(dispute.clientId)}
        </p>
        <p className="text-sm text-zinc-700">
          <span className="font-medium">Freelancer:</span> {getUserName(dispute.freelancerId)}
        </p>
        <p className="text-sm text-zinc-700">
          <span className="font-medium">Reason:</span> {dispute.disputeReason || 'No reason provided.'}
        </p>

        <label htmlFor={`resolution-note-${dispute._id}`} className="sr-only">
          Resolution note
        </label>
        <textarea
          id={`resolution-note-${dispute._id}`}
          name="resolutionNote"
          rows={3}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-0 focus:border-zinc-500"
          placeholder="Write a resolution note for both parties"
          value={resolutionNote}
          onChange={(event) => setResolutionNote(event.target.value)}
        />

        <Button
          size="sm"
          className="w-full"
          onClick={() => {
            void submitResolution();
          }}
          disabled={disabled}
          isLoading={isResolving}
        >
          Resolve Dispute
        </Button>
      </CardContent>
    </Card>
  );
}
