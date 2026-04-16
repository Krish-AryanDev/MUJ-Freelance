'use client';

import { useQuery } from '@tanstack/react-query';
import { Filter, LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { GIG_CATEGORIES } from '../../../constants/categories';
import ProjectCard from '../../../components/projects/ProjectCard';
import ErrorState from '../../../components/shared/ErrorState';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import Skeleton from '../../../components/ui/Skeleton';
import { useAuth } from '../../../hooks/useAuth';
import { projectService } from '../../../services/project.service';
import type { Project } from '../../../types/project.types';

type SortOption = 'newest' | 'budget-high' | 'budget-low';
type ViewMode = 'grid' | 'list';

interface FiltersState {
  page: number;
  limit: 10 | 12;
  category: Project['category'] | '';
  budgetMin?: number;
  budgetMax?: number;
  skills: string;
  search: string;
  sort: SortOption;
}

export default function Page() {
  const { isClient, isFreelancer } = useAuth();

  const [filters, setFilters] = useState<FiltersState>({
    page: 1,
    limit: 12,
    category: '',
    budgetMin: undefined,
    budgetMax: undefined,
    skills: '',
    search: '',
    sort: 'newest',
  });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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
  const meta: { page?: number; totalPages?: number; totalItems?: number } =
    data && data.success ? data.meta ?? {} : {};

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      category: '',
      budgetMin: undefined,
      budgetMax: undefined,
      skills: '',
      search: '',
      sort: 'newest',
    });
  };

  const renderFilterSidebar = () => (
    <div className="h-full bg-[#fffdf8] p-4">
      <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[#1d3557]">
        <SlidersHorizontal className="h-4 w-4 text-[#8fae8e]" />
        Filter
      </h3>

      <div className="mb-4 border-b border-[#f2e6d8] pb-4 last:border-0">
        <h4 className="mb-2 text-sm font-bold text-[#3a506b]">Search</h4>
        <input
          type="text"
          placeholder="Project title or keyword"
          value={filters.search}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              search: event.target.value,
              page: 1,
            }))
          }
          className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-sm text-[#2f3e46] placeholder:text-[#9aa6b2] focus:border-[#8fae8e] focus:outline-none"
        />
      </div>

      <div className="mb-4 border-b border-[#f2e6d8] pb-4 last:border-0">
        <h4 className="mb-2 text-sm font-bold text-[#3a506b]">Category</h4>
        <select
          value={filters.category}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              category: event.target.value as FiltersState['category'],
              page: 1,
            }))
          }
          className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-sm text-[#3a506b] focus:border-[#8fae8e] focus:outline-none"
        >
          <option value="">All categories</option>
          {GIG_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 border-b border-[#f2e6d8] pb-4 last:border-0">
        <h4 className="mb-2 text-sm font-bold text-[#3a506b]">Budget Range</h4>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#8b96a2]">Min Budget</label>
        <input
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
          className="mb-3 w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm text-[#2f3e46] focus:border-[#8fae8e] focus:outline-none"
        />

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#8b96a2]">Max Budget</label>
        <input
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
          className="w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm text-[#2f3e46] focus:border-[#8fae8e] focus:outline-none"
        />
      </div>

      <div className="mb-4 border-b border-[#f2e6d8] pb-4 last:border-0">
        <h4 className="mb-2 text-sm font-bold text-[#3a506b]">Skills</h4>
        <input
          type="text"
          placeholder="react,node,ui"
          value={filters.skills}
          onChange={(event) => setFilters((current) => ({ ...current, skills: event.target.value, page: 1 }))}
          className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-sm text-[#2f3e46] placeholder:text-[#9aa6b2] focus:border-[#8fae8e] focus:outline-none"
        />
      </div>

      <button
        type="button"
        onClick={clearFilters}
        className="w-full rounded-xl border border-[#eadfce] bg-white py-2.5 text-sm font-semibold text-[#3a506b] transition-colors hover:border-[#a9c29f] hover:text-[#5f7a5f]"
      >
        Clear Filters
      </button>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#fff8ef]">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#d8e7d1]/45 blur-3xl" />
        <div className="absolute right-10 top-10 h-56 w-56 rounded-full bg-[#ffd3a8]/50 blur-3xl" />
      </div>

      <aside className="fixed bottom-0 left-0 top-16 z-20 hidden w-[280px] border-r border-[#eadfce] bg-[#fffdf8] xl:block">
        <div className="h-full overflow-y-auto">{renderFilterSidebar()}</div>
      </aside>

      <div className="relative xl:pl-[280px]">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-6">
          <main className="space-y-5">
            <div className="flex flex-col gap-3 rounded-2xl border border-[#eadfce] bg-white/95 px-4 py-3 shadow-[0_8px_24px_rgba(49,78,95,0.08)] lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl bg-[#8fae8e] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7d9d7c]"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilters((current) => ({ ...current, sort: 'budget-high', page: 1 }))}
                  className="rounded-xl border border-[#c9d9c3] bg-[#eef5eb] px-4 py-2 text-sm font-medium text-[#4e6b4e] transition-colors hover:border-[#8fae8e] hover:text-[#3f5b3f]"
                >
                  High Budget
                </button>
                <button
                  type="button"
                  onClick={() => setFilters((current) => ({ ...current, sort: 'newest', page: 1 }))}
                  className="rounded-xl border border-[#d7e4d1] bg-[#eef5eb] px-4 py-2 text-sm font-medium text-[#4e6b4e] transition-colors hover:border-[#9fba95] hover:text-[#3f5b3f]"
                >
                  Newest
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#eadfce] bg-white px-4 py-2.5 text-sm font-medium text-[#3a506b] xl:hidden"
                >
                  <Filter size={16} />
                  Filters
                </button>

                <div className="flex w-full items-center gap-2 rounded-xl border border-[#eadfce] bg-white px-3 py-2 lg:w-[360px]">
                  <Search className="h-4 w-4 flex-shrink-0 text-[#b7c3cd]" />
                  <input
                    type="search"
                    value={filters.search}
                    onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))}
                    placeholder="Search projects by title or keyword"
                    className="w-full border-none bg-transparent text-sm text-[#2f3e46] placeholder:text-[#9aa6b2] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#eadfce] bg-white/95 p-4 shadow-[0_8px_24px_rgba(49,78,95,0.08)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#3a506b]">Project Filters</p>

                <div className="flex items-center gap-3">
                  <select
                    value={filters.sort}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        sort: event.target.value as SortOption,
                        page: 1,
                      }))
                    }
                    className="cursor-pointer rounded-lg border border-[#eadfce] bg-white px-3 py-1.5 text-sm text-[#3a506b] focus:border-[#8fae8e] focus:outline-none"
                  >
                    <option value="newest">Newest</option>
                    <option value="budget-high">Budget: High to Low</option>
                    <option value="budget-low">Budget: Low to High</option>
                  </select>

                  <div className="flex overflow-hidden rounded-lg border border-[#eadfce]">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={
                        viewMode === 'grid'
                          ? 'bg-[#8fae8e] p-1.5 text-white'
                          : 'p-1.5 text-[#9aa6b2] transition-colors hover:bg-[#eef5eb] hover:text-[#5f7a5f]'
                      }
                    >
                      <LayoutGrid size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={
                        viewMode === 'list'
                          ? 'bg-[#8fae8e] p-1.5 text-white'
                          : 'p-1.5 text-[#9aa6b2] transition-colors hover:bg-[#eef5eb] hover:text-[#5f7a5f]'
                      }
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {filters.search ? (
                  <span className="rounded-full bg-[#f2f8ef] px-3 py-1 text-xs text-[#5f7a5f]">q: {filters.search}</span>
                ) : null}
                {filters.category ? (
                  <span className="rounded-full bg-[#eef5eb] px-3 py-1 text-xs text-[#4e6b4e]">{filters.category}</span>
                ) : null}
                {filters.skills ? (
                  <span className="rounded-full bg-[#eef5eb] px-3 py-1 text-xs text-[#4e6b4e]">skills: {filters.skills}</span>
                ) : null}
                {typeof filters.budgetMin === 'number' || typeof filters.budgetMax === 'number' ? (
                  <span className="rounded-full bg-[#e6f2e0] px-3 py-1 text-xs font-medium text-[#4e6b4e]">
                    Rs {filters.budgetMin ?? 0} - Rs {filters.budgetMax ?? 'Any'}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-[#eadfce] bg-white/95 p-4 shadow-[0_8px_24px_rgba(49,78,95,0.08)]">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Browse Projects</p>
                  <p className="text-xs text-zinc-600">
                    Showing {typeof meta.totalItems === 'number' ? meta.totalItems : projects.length} project(s)
                  </p>
                </div>

                {isClient || isFreelancer ? (
                  <div className="flex items-center gap-2">
                    {isFreelancer ? (
                      <Link href="/dashboard/freelancer/proposals">
                        <Button variant="outline">View My Proposals</Button>
                      </Link>
                    ) : null}

                    {isClient ? (
                      <Link href="/dashboard/client/projects">
                        <Button>Post a Project</Button>
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={`project-skeleton-${index}`} className="h-72 rounded-xl" />
                  ))}
                </div>
              ) : null}

              {isError ? (
                <ErrorState
                  title="Unable to load projects"
                  message={error instanceof Error ? error.message : 'Please try again.'}
                  onRetry={() => {
                    void refetch();
                  }}
                />
              ) : null}

              {!isLoading && !isError && projects.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
                  <Search className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
                  <h3 className="text-lg font-semibold text-zinc-900">No projects found</h3>
                  <p className="mt-1 text-sm text-zinc-600">Try changing your filters or clear search criteria.</p>
                  <Button className="mt-4" variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              ) : null}

              {!isLoading && !isError && projects.length > 0 ? (
                <div
                  className={
                    viewMode === 'list'
                      ? 'grid grid-cols-1 gap-3'
                      : 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'
                  }
                >
                  {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} className="h-full" />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-[#eadfce] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(49,78,95,0.08)]">
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
          </main>
        </div>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 lg:hidden">
          <div className="max-h-[90vh] overflow-y-auto rounded-xl bg-[#fffdf8] p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#1d3557]">Filters</h3>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-md p-1 text-[#7f8b97] transition-colors hover:bg-[#f4f7f8] hover:text-[#1d3557]"
              >
                <X size={18} />
              </button>
            </div>
            {renderFilterSidebar()}
          </div>
        </div>
      ) : null}
    </div>
  );
}

