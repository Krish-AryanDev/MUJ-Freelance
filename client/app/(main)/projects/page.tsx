'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { GIG_CATEGORIES } from '../../../constants/categories';
import ProjectList from '../../../components/projects/ProjectList';
import SearchBar from '../../../components/shared/SearchBar';
import ErrorState from '../../../components/shared/ErrorState';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Pagination from '../../../components/ui/Pagination';
import Select from '../../../components/ui/Select';
import { useAuth } from '../../../hooks/useAuth';
import { projectService } from '../../../services/project.service';
import type { Project } from '../../../types/project.types';

type SortOption = 'newest' | 'budget-high' | 'budget-low';

interface FiltersState {
  page: number;
  limit: number;
  category: Project['category'] | '';
  budgetMin?: number;
  budgetMax?: number;
  skills: string;
  search: string;
  sort: SortOption;
}

export default function Page() {
  const { isClient } = useAuth();

  const [filters, setFilters] = useState<FiltersState>({
    page: 1,
    limit: 10,
    category: '',
    budgetMin: undefined,
    budgetMax: undefined,
    skills: '',
    search: '',
    sort: 'newest',
  });

  const queryFilters = useMemo(
    () => ({
      page: filters.page,
      limit: filters.limit,
      category: filters.category || undefined,
      budgetMin: filters.budgetMin,
      budgetMax: filters.budgetMax,
      skills: filters.skills || undefined,
      search: filters.search || undefined,
      sort: filters.sort,
    }),
    [filters],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['projects', queryFilters],
    queryFn: () => projectService.getAllProjects(queryFilters),
  });

  const projects = data && data.success ? data.data?.projects ?? [] : [];
  const meta: { page?: number; totalPages?: number } = data && data.success ? data.meta ?? {} : {};

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Browse Projects</h1>
          <p className="text-sm text-zinc-600">Discover client job posts and send proposals.</p>
        </div>

        {isClient ? (
          <Link href="/dashboard/client/projects">
            <Button>Post a Project</Button>
          </Link>
        ) : null}
      </div>

      <SearchBar
        value={filters.search}
        onSearch={(query) => {
          setFilters((current) => ({ ...current, search: query, page: 1 }));
        }}
        placeholder="Search projects"
      />

      <div className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Select
          label="Category"
          value={filters.category}
          options={[
            { value: '', label: 'All categories' },
            ...GIG_CATEGORIES.map((category) => ({ value: category.value, label: category.label })),
          ]}
          onChange={(event) => {
            setFilters((current) => ({
              ...current,
              category: event.target.value as FiltersState['category'],
              page: 1,
            }));
          }}
        />

        <Input
          label="Budget Min"
          type="number"
          min={0}
          value={filters.budgetMin ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            setFilters((current) => ({
              ...current,
              budgetMin: value ? Number(value) : undefined,
              page: 1,
            }));
          }}
        />

        <Input
          label="Budget Max"
          type="number"
          min={0}
          value={filters.budgetMax ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            setFilters((current) => ({
              ...current,
              budgetMax: value ? Number(value) : undefined,
              page: 1,
            }));
          }}
        />

        <Input
          label="Skills"
          value={filters.skills}
          placeholder="react,node"
          onChange={(event) => {
            setFilters((current) => ({ ...current, skills: event.target.value, page: 1 }));
          }}
        />

        <Select
          label="Sort by"
          value={filters.sort}
          options={[
            { value: 'newest', label: 'Newest' },
            { value: 'budget-high', label: 'Budget high' },
            { value: 'budget-low', label: 'Budget low' },
          ]}
          onChange={(event) => {
            setFilters((current) => ({ ...current, sort: event.target.value as SortOption, page: 1 }));
          }}
        />
      </div>

      {isError ? (
        <ErrorState
          title="Unable to load projects"
          message={error instanceof Error ? error.message : 'Please try again.'}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : (
        <ProjectList projects={projects} isLoading={isLoading} />
      )}

      <div className="flex justify-center">
        <Pagination
          page={typeof meta.page === 'number' ? meta.page : filters.page}
          totalPages={typeof meta.totalPages === 'number' ? meta.totalPages : 1}
          onPageChange={(nextPage) => {
            setFilters((current) => ({ ...current, page: nextPage }));
          }}
        />
      </div>
    </div>
  );
}

