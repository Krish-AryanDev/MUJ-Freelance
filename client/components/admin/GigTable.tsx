'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { AdminGig } from '@/types/admin.types';

interface GigTableProps {
  gigs: AdminGig[];
  onApproveGig: (gigId: string) => Promise<void>;
  onRejectGig: (gigId: string) => Promise<void>;
}

const statusVariant = (status: string) => {
  if (status === 'active' || status === 'published') {
    return 'success';
  }

  if (status === 'inactive' || status === 'archived') {
    return 'danger';
  }

  if (status === 'draft' || status === 'paused') {
    return 'warning';
  }

  return 'default';
};

export default function GigTable({ gigs, onApproveGig, onRejectGig }: GigTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Gig</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Freelancer</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Status</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {gigs.map((gig) => (
            <tr key={gig._id} className="hover:bg-zinc-50/70">
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-900">{gig.title}</p>
                <p className="text-sm text-zinc-500">{gig.category.replaceAll('_', ' ')}</p>
              </td>
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-zinc-800">{gig.freelancer?.fullName || 'Unknown'}</p>
                <p className="text-sm text-zinc-500">{gig.freelancer?.email || ''}</p>
              </td>
              <td className="px-4 py-3">
                <Badge variant={statusVariant(gig.status)} className="capitalize">
                  {gig.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => void onApproveGig(gig._id)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void onRejectGig(gig._id)}>
                    Reject
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
