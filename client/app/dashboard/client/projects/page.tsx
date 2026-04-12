'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import ProjectPostForm from '../../../../components/projects/ProjectPostForm';
import EmptyState from '../../../../components/shared/EmptyState';
import ErrorState from '../../../../components/shared/ErrorState';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import Skeleton from '../../../../components/ui/Skeleton';
import { projectService } from '../../../../services/project.service';
import type { CreateProjectRequest } from '../../../../types/project.types';
import toast from '../../../../utils/toast';

export default function Page() {
  const queryClient = useQueryClient();
  const [showPostForm, setShowPostForm] = useState(false);

  const projectsQuery = useQuery({
    queryKey: ['client-projects'],
    queryFn: () => projectService.getClientProjects(),
  });

  const createProjectMutation = useMutation({
    mutationFn: (payload: CreateProjectRequest) => projectService.createProject(payload),
    onSuccess: async () => {
      setShowPostForm(false);
      await queryClient.invalidateQueries({ queryKey: ['client-projects'] });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => projectService.deleteProject(projectId),
    onSuccess: async () => {
      toast.success('Project deleted');
      await queryClient.invalidateQueries({ queryKey: ['client-projects'] });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast.error('Unable to delete project', error instanceof Error ? error.message : 'Please try again.');
    },
  });

  const closeProjectMutation = useMutation({
    mutationFn: (projectId: string) => projectService.closeProject(projectId),
    onSuccess: async () => {
      toast.success('Project closed');
      await queryClient.invalidateQueries({ queryKey: ['client-projects'] });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast.error('Unable to close project', error instanceof Error ? error.message : 'Please try again.');
    },
  });

  const projects = projectsQuery.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">My Projects</h1>
          <p className="text-sm text-zinc-600">Manage projects posted by you.</p>
        </div>
        <Button type="button" onClick={() => setShowPostForm((current) => !current)}>
          Post New Project
        </Button>
      </div>

      {showPostForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Create Project</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectPostForm
              isLoading={createProjectMutation.isPending}
              onSubmit={async (payload) => {
                await createProjectMutation.mutateAsync(payload);
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      {projectsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`client-project-skeleton-${index}`} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : null}

      {projectsQuery.isError ? (
        <ErrorState
          title="Unable to load projects"
          message={projectsQuery.error instanceof Error ? projectsQuery.error.message : 'Please try again.'}
          onRetry={() => {
            void projectsQuery.refetch();
          }}
        />
      ) : null}

      {!projectsQuery.isLoading && !projectsQuery.isError && projects.length === 0 ? (
        <EmptyState
          title="No projects posted yet"
          description="Create your first project to start receiving freelancer proposals."
        />
      ) : null}

      {!projectsQuery.isLoading && !projectsQuery.isError ? (
        <div className="space-y-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="mb-1 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <p className="text-sm text-zinc-600">{project.proposalCount} proposals</p>
                </div>
                <Badge>{project.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-zinc-600">
                  Budget: Rs {project.budget.min} - Rs {project.budget.max} ({project.budget.type})
                </div>
                <div className="text-sm text-zinc-600">
                  Deadline: {new Date(project.deadline).toLocaleDateString()}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/projects/${project.id}`}>
                    <Button size="sm" variant="outline">
                      View Proposals
                    </Button>
                  </Link>
                  <Link href={`/dashboard/client/projects/edit/${project.id}`}>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => closeProjectMutation.mutate(project.id)}
                    isLoading={closeProjectMutation.isPending}
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteProjectMutation.mutate(project.id)}
                    isLoading={deleteProjectMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

