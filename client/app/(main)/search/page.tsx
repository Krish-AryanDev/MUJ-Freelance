'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import ProjectList from '../../../components/projects/ProjectList';
import EmptyState from '../../../components/shared/EmptyState';
import ErrorState from '../../../components/shared/ErrorState';
import SearchBar from '../../../components/shared/SearchBar';
import Select from '../../../components/ui/Select';
import { GIG_CATEGORIES } from '../../../constants/categories';
import { projectService } from '../../../services/project.service';

type CategoryValue = (typeof GIG_CATEGORIES)[number]['value'];

type ProjectSort = 'newest' | 'budget-high' | 'budget-low';

const DEFAULT_LIMIT = 18;

export default function Page() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryValue | ''>('');
  const [budgetMin, setBudgetMin] = useState<number | undefined>(undefined);
  const [budgetMax, setBudgetMax] = useState<number | undefined>(undefined);
  const [projectSort, setProjectSort] = useState<ProjectSort>('newest');

  const projectsQuery = useQuery({
    queryKey: ['search', 'projects-only', query, category, budgetMin, budgetMax, projectSort],
    queryFn: () =>
      projectService.getAllProjects({
        search: query || undefined,
        category: category || undefined,
        budgetMin,
        budgetMax,
        sort: projectSort,
        limit: DEFAULT_LIMIT,
        page: 1,
      }),
  });

  const projects = useMemo(() => {
    if (!projectsQuery.data?.success) {
      return [];
    }

    return projectsQuery.data.data.projects || [];
  }, [projectsQuery.data]);

  const noResults = !projectsQuery.isLoading && !projectsQuery.isError && projects.length === 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Search Projects</h1>
        <p className="text-sm text-zinc-600">Find projects with targeted filters.</p>
      </div>

      <SearchBar
        onSearch={(value) => {
          setQuery(value);
        }}
        placeholder="Search projects, skills, categories..."
        debounceMs={350}
      />

      <div className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <div className="xl:col-span-2">
          <Select
            label="Category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value as CategoryValue | '');
            }}
            options={[
              { value: '', label: 'All categories' },
              ...GIG_CATEGORIES.map((item) => ({ value: item.value, label: item.label })),
            ]}
          />
        </div>

        <div className="xl:col-span-2">
          <Select
            label="Sort"
            value={projectSort}
            onChange={(event) => {
              setProjectSort(event.target.value as ProjectSort);
            }}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'budget-high', label: 'Budget High' },
              { value: 'budget-low', label: 'Budget Low' },
            ]}
          />
        </div>

        <div className="xl:col-span-1">
          <label className="mb-1 block text-sm font-medium text-zinc-900">Budget Min</label>
          <input
            type="number"
            min={0}
            value={budgetMin ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              setBudgetMin(value ? Number(value) : undefined);
            }}
            className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none ring-black/20 transition focus:ring-2"
          />
        </div>

        <div className="xl:col-span-1">
          <label className="mb-1 block text-sm font-medium text-zinc-900">Budget Max</label>
          <input
            type="number"
            min={0}
            value={budgetMax ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              setBudgetMax(value ? Number(value) : undefined);
            }}
            className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none ring-black/20 transition focus:ring-2"
          />
        </div>
      </div>

      {projectsQuery.isError ? (
        <ErrorState
          title="Search failed"
          message={
            projectsQuery.error instanceof Error
              ? projectsQuery.error.message
              : 'Unable to load search results. Please retry.'
          }
          onRetry={() => {
            void projectsQuery.refetch();
          }}
        />
      ) : null}

      {noResults ? (
        <EmptyState
          title="No projects found"
          description="Try broader keywords or adjust category and budget filters."
        />
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Projects</h2>
          <span className="text-xs text-zinc-500">{projects.length} result(s)</span>
        </div>
        <ProjectList projects={projects} isLoading={projectsQuery.isLoading} />
      </section>
    </div>
  );
}
