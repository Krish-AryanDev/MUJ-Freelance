import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

import type { Project } from '../../types/project.types';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface ProjectCardProps {
  project: Project;
  className?: string;
}

const statusVariant: Record<Project['status'], 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  open: 'success',
  'in-progress': 'warning',
  in_progress: 'warning',
  completed: 'info',
  cancelled: 'danger',
  closed: 'default',
};

const formatBudgetType = (budgetType: Project['budget']['type']): string =>
  budgetType === 'hourly' ? 'Hourly' : 'Fixed';

export default function ProjectCard({ project, className }: ProjectCardProps) {
  return (
    <Card className={className}>
      <Link href={`/projects/${project.id}`} className="block">
        <CardHeader>
          <div className="mb-2 flex items-center justify-between gap-2">
            <Badge variant="info">{project.category.replaceAll('_', ' ')}</Badge>
            <Badge variant={statusVariant[project.status]}>{project.status}</Badge>
          </div>
          <CardTitle className="line-clamp-2 text-lg">{project.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Avatar src={project.client.avatar?.url} fallback={project.client.fullName} size="sm" />
            <p className="text-sm text-zinc-700">{project.client.fullName}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Budget</p>
              <p className="font-medium text-zinc-900">
                Rs {project.budget.min} - Rs {project.budget.max}
              </p>
              <p className="text-xs text-zinc-500">{formatBudgetType(project.budget.type)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Deadline</p>
              <p className="font-medium text-zinc-900">{new Date(project.deadline).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {project.skillsRequired.slice(0, 6).map((skill) => (
              <Badge key={skill}>{skill}</Badge>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{project.proposalCount} proposals</span>
            <span>
              Posted {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

export type { ProjectCardProps };