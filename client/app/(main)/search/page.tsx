'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import GigGrid from '../../../components/gigs/GigGrid';
import ProjectList from '../../../components/projects/ProjectList';
import EmptyState from '../../../components/shared/EmptyState';
import ErrorState from '../../../components/shared/ErrorState';
import SearchBar from '../../../components/shared/SearchBar';
import Select from '../../../components/ui/Select';
import { GIG_CATEGORIES } from '../../../constants/categories';
import { gigService } from '../../../services/gig.service';
import { projectService } from '../../../services/project.service';
import type { GigCategory } from '../../../types/gig.types';

type SearchScope = 'all' | 'gigs' | 'projects';
type GigSort = 'relevance' | 'newest' | 'price_low_to_high' | 'price_high_to_low' | 'rating';
type ProjectSort = 'newest' | 'budget-high' | 'budget-low';

const DEFAULT_LIMIT_ALL = 6;
const DEFAULT_LIMIT_SINGLE = 18;

export default function Page() {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const [category, setCategory] = useState<GigCategory | ''>('');

  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [gigSort, setGigSort] = useState<GigSort>('relevance');

  const [budgetMin, setBudgetMin] = useState<number | undefined>(undefined);
  const [budgetMax, setBudgetMax] = useState<number | undefined>(undefined);
  const [projectSort, setProjectSort] = useState<ProjectSort>('newest');

  const shouldShowGigs = scope === 'all' || scope === 'gigs';
  const shouldShowProjects = scope === 'all' || scope === 'projects';

  const gigsQuery = useQuery({
    queryKey: ['search', 'gigs', query, category, minPrice, maxPrice, gigSort, scope],
    queryFn: () =>
      gigService.getAllGigs({
        search: query || undefined,
        category: category || undefined,
        minPrice,
        maxPrice,
        sortBy: gigSort,
        limit: scope === 'gigs' ? DEFAULT_LIMIT_SINGLE : DEFAULT_LIMIT_ALL,
        page: 1,
      }),
    enabled: shouldShowGigs,
  });

  const projectsQuery = useQuery({
    queryKey: ['search', 'projects', query, category, budgetMin, budgetMax, projectSort, scope],
    queryFn: () =>
      projectService.getAllProjects({
        search: query || undefined,
        category: category || undefined,
        budgetMin,
        budgetMax,
        sort: projectSort,
        limit: scope === 'projects' ? DEFAULT_LIMIT_SINGLE : DEFAULT_LIMIT_ALL,
        page: 1,
      }),
    enabled: shouldShowProjects,
  });

  const gigs = useMemo(() => {
    if (!gigsQuery.data?.success) {
      return [];
    }

    return gigsQuery.data.data.gigs || [];
  }, [gigsQuery.data]);

  const projects = useMemo(() => {
    if (!projectsQuery.data?.success) {
      return [];
    }

    return projectsQuery.data.data.projects || [];
  }, [projectsQuery.data]);

  const noResults =
    !gigsQuery.isLoading &&
    !projectsQuery.isLoading &&
    !gigsQuery.isError &&
    !projectsQuery.isError &&
    ((scope === 'gigs' && gigs.length === 0) ||
      (scope === 'projects' && projects.length === 0) ||
      (scope === 'all' && gigs.length === 0 && projects.length === 0));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Search Marketplace</h1>
        <p className="text-sm text-zinc-600">Find gigs and projects with targeted filters.</p>
      </div>

      <SearchBar
        onSearch={(value) => {
          setQuery(value);
        }}
        placeholder="Search gigs, projects, skills, categories..."
        debounceMs={350}
      />

      <div className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <div className="xl:col-span-2">
          <Select
            label="Search In"
            value={scope}
            onChange={(event) => {
              setScope(event.target.value as SearchScope);
            }}
            options={[
              { value: 'all', label: 'All' },
              { value: 'gigs', label: 'Gigs' },
              { value: 'projects', label: 'Projects' },
            ]}
          />
        </div>

        <div className="xl:col-span-2">
          <Select
            label="Category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value as GigCategory | '');
            }}
            options={[
              { value: '', label: 'All categories' },
              ...GIG_CATEGORIES.map((item) => ({ value: item.value, label: item.label })),
            ]}
          />
        </div>

        <div className="xl:col-span-2">
          <Select
            label="Gig Sort"
            value={gigSort}
            onChange={(event) => {
              setGigSort(event.target.value as GigSort);
            }}
            options={[
              { value: 'relevance', label: 'Relevance' },
              { value: 'newest', label: 'Newest' },
              { value: 'price_low_to_high', label: 'Price Low to High' },
              { value: 'price_high_to_low', label: 'Price High to Low' },
              { value: 'rating', label: 'Rating' },
            ]}
          />
        </div>

        <div className="xl:col-span-2">
          <Select
            label="Project Sort"
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
          <label className="mb-1 block text-sm font-medium text-zinc-900">Min Price</label>
          <input
            type="number"
            min={0}
            value={minPrice ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              setMinPrice(value ? Number(value) : undefined);
            }}
            className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none ring-black/20 transition focus:ring-2"
          />
        </div>

        <div className="xl:col-span-1">
          <label className="mb-1 block text-sm font-medium text-zinc-900">Max Price</label>
          <input
            type="number"
            min={0}
            value={maxPrice ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              setMaxPrice(value ? Number(value) : undefined);
            }}
            className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none ring-black/20 transition focus:ring-2"
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

      {gigsQuery.isError || projectsQuery.isError ? (
        <ErrorState
          title="Search failed"
          message={
            gigsQuery.error instanceof Error
              ? gigsQuery.error.message
              : projectsQuery.error instanceof Error
                ? projectsQuery.error.message
                : 'Unable to load search results. Please retry.'
          }
          onRetry={() => {
            void gigsQuery.refetch();
            void projectsQuery.refetch();
          }}
        />
      ) : null}

      {noResults ? (
        <EmptyState
          title="No results found"
          description="Try broader keywords or adjust category and budget filters."
        />
      ) : null}

      {shouldShowGigs ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900">Gigs</h2>
            <span className="text-xs text-zinc-500">{gigs.length} result(s)</span>
          </div>
          <GigGrid gigs={gigs} isLoading={gigsQuery.isLoading} />
        </section>
      ) : null}

      {shouldShowProjects ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900">Projects</h2>
            <span className="text-xs text-zinc-500">{projects.length} result(s)</span>
          </div>
          <ProjectList projects={projects} isLoading={projectsQuery.isLoading} />
        </section>
      ) : null}
    </div>
  );
}

