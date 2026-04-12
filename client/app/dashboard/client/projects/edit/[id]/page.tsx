'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';

import ProjectPostForm from '../../../../../../components/projects/ProjectPostForm';
import type { ProjectFormData } from '../../../../../../components/projects/ProjectPostForm';
import ErrorState from '../../../../../../components/shared/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/Card';
import Skeleton from '../../../../../../components/ui/Skeleton';
import { projectService } from '../../../../../../services/project.service';
import toast from '../../../../../../utils/toast';

export default function EditClientProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = String(params?.id ?? '');

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProjectById(projectId),
    enabled: Boolean(projectId),
  });

  const updateProjectMutation = useMutation({
    mutationFn: (payload: ProjectFormData) => projectService.updateProject(projectId, payload),
    onSuccess: () => {
      toast.success('Project updated', 'Your changes have been saved.');
      router.push('/dashboard/client/projects');
    },
    onError: (error) => {
      toast.error('Unable to update project', error instanceof Error ? error.message : 'Please try again.');
    },
  });

  if (projectQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-[520px] w-full rounded-xl" />
      </div>
    );
  }

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <ErrorState
        title="Project not found"
        message={projectQuery.error instanceof Error ? projectQuery.error.message : 'Unable to load project.'}
        onRetry={() => {
          void projectQuery.refetch();
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Project</CardTitle>
      </CardHeader>
      <CardContent>
        <ProjectPostForm
          initialData={projectQuery.data}
          isLoading={updateProjectMutation.isPending}
          onSubmit={async (payload) => {
            await updateProjectMutation.mutateAsync(payload);
          }}
        />
      </CardContent>
    </Card>
  );
}
