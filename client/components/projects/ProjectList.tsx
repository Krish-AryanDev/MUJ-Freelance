import type { Project } from '../../types/project.types';
import EmptyState from '../shared/EmptyState';
import Skeleton from '../ui/Skeleton';
import ProjectCard from './ProjectCard';

interface ProjectListProps {
  projects: Project[];
  isLoading?: boolean;
}

export default function ProjectList({ projects, isLoading = false }: ProjectListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={`project-skeleton-${index}`} className="h-72 rounded-xl" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects found"
        description="Try changing filters or posting the first project."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

export type { ProjectListProps };