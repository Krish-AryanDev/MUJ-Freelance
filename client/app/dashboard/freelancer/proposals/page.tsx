'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import EmptyState from '../../../../components/shared/EmptyState';
import ErrorState from '../../../../components/shared/ErrorState';
import Badge from '../../../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import Skeleton from '../../../../components/ui/Skeleton';
import { projectService } from '../../../../services/project.service';

export default function Page() {
  const proposalsQuery = useQuery({
    queryKey: ['freelancer-proposals'],
    queryFn: () => projectService.getFreelancerProposals(),
  });

  const proposals = proposalsQuery.data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">My Proposals</h1>
        <p className="text-sm text-zinc-600">Track all proposals submitted by you.</p>
      </div>

      {proposalsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`freelancer-proposal-skeleton-${index}`} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : null}

      {proposalsQuery.isError ? (
        <ErrorState
          title="Unable to load proposals"
          message={proposalsQuery.error instanceof Error ? proposalsQuery.error.message : 'Please try again.'}
          onRetry={() => {
            void proposalsQuery.refetch();
          }}
        />
      ) : null}

      {!proposalsQuery.isLoading && !proposalsQuery.isError && proposals.length === 0 ? (
        <EmptyState
          title="No proposals submitted"
          description="Browse open projects and submit your first proposal."
          actionLabel="Browse Projects"
          actionHref="/projects"
        />
      ) : null}

      {!proposalsQuery.isLoading && !proposalsQuery.isError ? (
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <Card key={proposal.id}>
              <CardHeader className="mb-1 flex flex-row items-start justify-between">
                <CardTitle className="text-lg">{proposal.projectTitle || 'Project'}</CardTitle>
                <Badge>{proposal.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-600">
                <p>Bid Amount: Rs {proposal.bidAmount}</p>
                <p>Delivery Days: {proposal.deliveryDays}</p>
                <p>Submitted: {new Date(proposal.createdAt).toLocaleDateString()}</p>
                <Link href={`/projects/${proposal.project}`} className="text-sm font-medium text-zinc-900 underline">
                  View Project
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

