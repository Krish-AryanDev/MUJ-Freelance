'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import ProjectDetail from '../../../../components/projects/ProjectDetail';
import ProposalForm from '../../../../components/projects/ProposalForm';
import ErrorState from '../../../../components/shared/ErrorState';
import Skeleton from '../../../../components/ui/Skeleton';
import { useAuth } from '../../../../hooks/useAuth';
import { projectService } from '../../../../services/project.service';
import toast from '../../../../utils/toast';

export default function Page() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user, isFreelancer } = useAuth();
  const [showProposalForm, setShowProposalForm] = useState(false);
  const projectId = String(params?.id || '');

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProjectById(projectId),
    enabled: Boolean(projectId),
  });

  const project = projectQuery.data;
  const isOwner = Boolean(project && user?.id && project.client.id === user.id);

  const proposalsQuery = useQuery({
    queryKey: ['project-proposals', projectId],
    queryFn: () => projectService.getProjectProposals(projectId),
    enabled: Boolean(projectId && isOwner),
  });

  const acceptProposalMutation = useMutation({
    mutationFn: (proposalId: string) => projectService.acceptProposal(projectId, proposalId),
    onSuccess: async () => {
      toast.success('Proposal accepted', 'Project status updated to in-progress.');
      await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['project-proposals', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast.error('Unable to accept proposal', error instanceof Error ? error.message : 'Please try again.');
    },
  });

  if (projectQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[540px] rounded-xl" />
      </div>
    );
  }

  if (projectQuery.isError || !project) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <ErrorState
          title="Project not found"
          message={projectQuery.error instanceof Error ? projectQuery.error.message : 'Please try again later.'}
          onRetry={() => {
            void projectQuery.refetch();
          }}
        />
      </div>
    );
  }

  const canShowProposalForm =
    Boolean(user?.id) &&
    isFreelancer &&
    !isOwner &&
    (project.status === 'open');

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
      <ProjectDetail
        project={project}
        proposals={proposalsQuery.data ?? []}
        isOwner={isOwner}
        showSubmitProposalButton={canShowProposalForm}
        onClickSubmitProposal={() => setShowProposalForm((current) => !current)}
        acceptingProposalId={acceptProposalMutation.variables ?? null}
        onAcceptProposal={(proposalId) => {
          acceptProposalMutation.mutate(proposalId);
        }}
      />

      {canShowProposalForm && showProposalForm ? (
        <ProposalForm
          projectId={project.id}
          onSubmitted={async () => {
            setShowProposalForm(false);
            await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          }}
        />
      ) : null}
    </div>
  );
}

