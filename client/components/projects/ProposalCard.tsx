'use client';

import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

import type { Proposal } from '../../types/project.types';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface ProposalCardProps {
  proposal: Proposal;
  isOwnerView?: boolean;
  onAccept?: (proposalId: string) => void;
  isAccepting?: boolean;
}

const statusVariant: Record<Proposal['status'], 'default' | 'info' | 'success' | 'danger' | 'warning'> = {
  pending: 'warning',
  shortlisted: 'info',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: 'default',
};

export default function ProposalCard({
  proposal,
  isOwnerView = false,
  onAccept,
  isAccepting = false,
}: ProposalCardProps) {
  const [expanded, setExpanded] = useState(false);

  const previewText = expanded
    ? proposal.coverLetter
    : proposal.coverLetter.length > 180
      ? `${proposal.coverLetter.slice(0, 180)}...`
      : proposal.coverLetter;

  return (
    <Card>
      <CardHeader className="mb-2 flex flex-row items-start justify-between">
        <div className="flex items-center gap-2">
          <Avatar src={proposal.freelancer.avatar?.url} fallback={proposal.freelancer.fullName} size="sm" />
          <div>
            <CardTitle className="text-base">{proposal.freelancer.fullName}</CardTitle>
            <p className="text-xs text-zinc-500">
              Submitted {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <Badge variant={statusVariant[proposal.status]}>{proposal.status}</Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Bid amount</p>
            <p className="font-semibold text-zinc-900">Rs {proposal.bidAmount}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Delivery</p>
            <p className="font-semibold text-zinc-900">{proposal.deliveryDays} days</p>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Cover letter</p>
          <p className="mt-1 text-sm text-zinc-700">{previewText}</p>
          {proposal.coverLetter.length > 180 ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="mt-1 text-xs font-medium text-zinc-700 underline"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          ) : null}
        </div>

        {isOwnerView && proposal.status === 'pending' ? (
          <Button
            type="button"
            size="sm"
            onClick={() => onAccept?.(proposal.id)}
            isLoading={isAccepting}
          >
            Accept proposal
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export type { ProposalCardProps };