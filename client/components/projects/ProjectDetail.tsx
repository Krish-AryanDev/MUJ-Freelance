import Link from 'next/link';
import type { Proposal, Project } from '../../types/project.types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import ProposalCard from './ProposalCard';

interface ProjectDetailProps {
  project: Project;
  proposals?: Proposal[];
  showSubmitProposalButton?: boolean;
  showViewMyProposalsButton?: boolean;
  onClickSubmitProposal?: () => void;
  isOwner?: boolean;
  onAcceptProposal?: (proposalId: string) => void;
  acceptingProposalId?: string | null;
}

const statusVariant: Record<Project['status'], 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
  open: 'success',
  'in-progress': 'warning',
  in_progress: 'warning',
  completed: 'info',
  cancelled: 'danger',
  closed: 'default',
};

export default function ProjectDetail({
  project,
  proposals = [],
  showSubmitProposalButton = false,
  showViewMyProposalsButton = false,
  onClickSubmitProposal,
  isOwner = false,
  onAcceptProposal,
  acceptingProposalId = null,
}: ProjectDetailProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="info">{project.category.replaceAll('_', ' ')}</Badge>
              <Badge variant={statusVariant[project.status]}>{project.status}</Badge>
            </div>
            <CardTitle className="text-2xl">{project.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-zinc-700">{project.description}</p>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Skills required</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {project.skillsRequired.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
            </div>

            {project.attachments.length > 0 ? (
              <div>
                <p className="text-sm font-semibold text-zinc-900">Attachments</p>
                <div className="mt-2 space-y-2">
                  {project.attachments.map((attachment) => (
                    <a
                      key={`${attachment.name}-${attachment.url}`}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      {attachment.name}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {showSubmitProposalButton ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={onClickSubmitProposal}>
                  Submit proposal
                </Button>
                {showViewMyProposalsButton ? (
                  <Link href="/dashboard/freelancer/proposals">
                    <Button type="button" variant="outline">View My Proposals</Button>
                  </Link>
                ) : null}
              </div>
            ) : null}

            {!showSubmitProposalButton && showViewMyProposalsButton ? (
              <Link href="/dashboard/freelancer/proposals">
                <Button type="button" variant="outline">View My Proposals</Button>
              </Link>
            ) : null}
          </CardContent>
        </Card>

        {isOwner ? (
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-zinc-900">Proposals ({proposals.length})</h3>
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                isOwnerView
                isAccepting={acceptingProposalId === proposal.id}
                onAccept={onAcceptProposal}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium text-zinc-900">{project.client.fullName}</p>
            <p className="text-zinc-600">Proposals: {project.proposalCount}</p>
            <p className="text-zinc-600">Deadline: {new Date(project.deadline).toLocaleDateString()}</p>
            <p className="text-zinc-600">
              Budget: Rs {project.budget.min} - Rs {project.budget.max} ({project.budget.type})
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export type { ProjectDetailProps };