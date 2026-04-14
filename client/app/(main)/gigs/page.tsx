'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import GigCard from '@/components/gigs/GigCard';
import { GIG_CATEGORIES as CATEGORIES } from '@/constants/categories';
import { gigService } from '@/services/gig.service';
import type { GigCategory, GigFilters as GigFiltersType } from '@/types/gig.types';

type ViewMode = 'grid' | 'list';

const categoryEmoji: Record<string, string> = {
  WEB_DEVELOPMENT: '💻',
  APP_DEVELOPMENT: '📱',
  MOBILE_DEVELOPMENT: '📱',
  UI_UX_DESIGN: '🎨',
  GRAPHIC_DESIGN: '✏️',
  CONTENT_WRITING: '✍️',
  VIDEO_EDITING: '🎬',
  PHOTOGRAPHY: '📷',
  DIGITAL_MARKETING: '📣',
  DATA_ANALYTICS: '📊',
  DATA_SCIENCE: '📊',
  AI_ML: '🤖',
  MACHINE_LEARNING: '🤖',
  CYBERSECURITY: '🔒',
  CLOUD_COMPUTING: '☁️',
  DEVOPS: '⚙️',
  BLOCKCHAIN: '⛓️',
  GAME_DEVELOPMENT: '🎮',
  MUSIC_PRODUCTION: '🎵',
  ANIMATION: '🎭',
  TUTORING: '📚',
  ASSIGNMENT_HELP: '📚',
  TRANSLATION: '🌐',
  RESUME_PORTFOLIO: '💼',
  OTHER: '💼',
};

const ratingOptions = [5, 4, 3] as const;
const deliveryDayOptions = [1, 3, 7, 14, 30] as const;

const sortOptions: Array<{ label: string; value: NonNullable<GigFiltersType['sortBy']> }> = [
  { label: 'Best Match', value: 'relevance' },
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_low_to_high' },
  { label: 'Price: High to Low', value: 'price_high_to_low' },
  { label: 'Highest Rated', value: 'rating' },
  { label: 'Most Popular', value: 'relevance' },
];

const sortLabelMap: Record<string, string> = {
  relevance: 'Best Match',
  newest: 'Newest First',
  price_low_to_high: 'Price: Low to High',
  price_high_to_low: 'Price: High to Low',
  rating: 'Highest Rated',
};

const parseNumberish = (value: string): number | undefined => {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
};

const formatNumberish = (value?: number): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '';
  }

  return String(value);
};

const normalizeFilters = (nextFilters: GigFiltersType): GigFiltersType => ({
  ...nextFilters,
  search: nextFilters.search?.trim() || undefined,
  minPrice: typeof nextFilters.minPrice === 'number' ? nextFilters.minPrice : undefined,
  maxPrice: typeof nextFilters.maxPrice === 'number' ? nextFilters.maxPrice : undefined,
  deliveryDaysMax:
    typeof nextFilters.deliveryDaysMax === 'number' ? nextFilters.deliveryDaysMax : undefined,
  minRating: typeof nextFilters.minRating === 'number' ? nextFilters.minRating : undefined,
  sortBy: nextFilters.sortBy || 'relevance',
});

const getCategoryLabel = (category?: GigCategory): string => {
  if (!category) {
    return 'All';
  }

  const match = CATEGORIES.find((item) => item.value === category);
  return match?.label || category.replaceAll('_', ' ');
};

const getPageNumbers = (currentPage: number, totalPages: number): number[] => {
  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  return Array.from(pages)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((first, second) => first - second);
};

export default function Page() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<GigCategory | undefined>(undefined);
  const [filters, setFilters] = useState<GigFiltersType>({ sortBy: 'relevance' });
  const [draftFilters, setDraftFilters] = useState<GigFiltersType>({ sortBy: 'relevance' });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const query = {
    page,
    limit: 12,
    category,
    ...filters,
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['gigs', query],
    queryFn: () => gigService.getAllGigs(query),
  });

  const gigs = data?.success ? data.data?.gigs ?? [] : [];
  const meta: { page?: number; totalPages?: number; totalItems?: number } = data?.success
    ? data.meta ?? {}
    : {};

  const totalCount = typeof meta.totalItems === 'number' ? meta.totalItems : gigs.length;
  const totalPages = typeof meta.totalPages === 'number' ? meta.totalPages : 1;
  const currentPage = typeof meta.page === 'number' ? meta.page : page;

  const currentSort = filters.sortBy || 'relevance';
  const currentSortLabel = sortLabelMap[currentSort] || 'Best Match';

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string }> = [];

    if (category) {
      chips.push({ key: 'category', label: getCategoryLabel(category) });
    }

    if (filters.search) {
      chips.push({ key: 'search', label: `Search: ${filters.search}` });
    }

    if (typeof filters.minPrice === 'number' || typeof filters.maxPrice === 'number') {
      chips.push({
        key: 'price',
        label: `₹${filters.minPrice ?? 0} - ₹${filters.maxPrice ?? 'Any'}`,
      });
    }

    if (typeof filters.deliveryDaysMax === 'number') {
      chips.push({ key: 'deliveryDaysMax', label: `${filters.deliveryDaysMax} days` });
    }

    if (typeof filters.minRating === 'number') {
      chips.push({ key: 'minRating', label: `${filters.minRating}+ stars` });
    }

    return chips;
  }, [category, filters.deliveryDaysMax, filters.maxPrice, filters.minPrice, filters.minRating, filters.search]);

  const pageNumbers = useMemo(() => getPageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  const applyFilters = (nextFilters: GigFiltersType) => {
    const normalized = normalizeFilters(nextFilters);
    setFilters(normalized);
    setDraftFilters(normalized);
    setPage(1);
  };

  const resetAllFilters = () => {
    const resetState: GigFiltersType = { sortBy: 'relevance' };
    setCategory(undefined);
    setFilters(resetState);
    setDraftFilters(resetState);
    setPage(1);
  };

  const removeChip = (key: string) => {
    if (key === 'category') {
      setCategory(undefined);
      setPage(1);
      return;
    }

    const nextDraft: GigFiltersType = { ...draftFilters };

    if (key === 'search') {
      nextDraft.search = undefined;
    }

    if (key === 'price') {
      nextDraft.minPrice = undefined;
      nextDraft.maxPrice = undefined;
    }

    if (key === 'deliveryDaysMax') {
      nextDraft.deliveryDaysMax = undefined;
    }

    if (key === 'minRating') {
      nextDraft.minRating = undefined;
    }

    applyFilters(nextDraft);
  };

  const renderFilterSidebar = () => (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
        <SlidersHorizontal className="h-4 w-4 text-orange-500" />
        Filter
      </h3>

      <div className="mb-4 border-b border-gray-100 pb-4 last:border-0">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">Category</h4>
        {CATEGORIES.map((item) => {
          const checked = category === item.value;
          return (
            <label key={item.value} className="group mb-2 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-orange-500 cursor-pointer border-gray-300"
                checked={checked}
                onChange={() => {
                  setCategory(checked ? undefined : item.value);
                  setPage(1);
                }}
              />
              <span className="cursor-pointer text-sm text-gray-600 group-hover:text-gray-900">
                {categoryEmoji[item.value] || '💼'} {item.label}
              </span>
            </label>
          );
        })}
      </div>

      <div className="mb-4 border-b border-gray-100 pb-4 last:border-0">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">Price Range</h4>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">Min Price (₹)</label>
        <input
          type="number"
          min={0}
          value={formatNumberish(draftFilters.minPrice)}
          onChange={(event) => {
            setDraftFilters((previous) => ({
              ...previous,
              minPrice: parseNumberish(event.target.value),
            }));
          }}
          className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
          placeholder="0"
        />

        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">Max Price (₹)</label>
        <input
          type="number"
          min={0}
          value={formatNumberish(draftFilters.maxPrice)}
          onChange={(event) => {
            setDraftFilters((previous) => ({
              ...previous,
              maxPrice: parseNumberish(event.target.value),
            }));
          }}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
          placeholder="10000"
        />
      </div>

      <div className="mb-4 border-b border-gray-100 pb-4 last:border-0">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">Delivery Days</h4>
        {deliveryDayOptions.map((days) => {
          const checked = draftFilters.deliveryDaysMax === days;
          return (
            <label key={days} className="group mb-2 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-orange-500 cursor-pointer border-gray-300"
                checked={checked}
                onChange={() => {
                  setDraftFilters((previous) => ({
                    ...previous,
                    deliveryDaysMax: checked ? undefined : days,
                  }));
                }}
              />
              <span className="cursor-pointer text-sm text-gray-600 group-hover:text-gray-900">
                {days} day{days > 1 ? 's' : ''}
              </span>
            </label>
          );
        })}
      </div>

      <div className="mb-4 border-b border-gray-100 pb-4 last:border-0">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">Rating</h4>
        {ratingOptions.map((rating) => {
          const checked = draftFilters.minRating === rating;
          return (
            <label key={rating} className="group mb-2 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-orange-500 cursor-pointer border-gray-300"
                checked={checked}
                onChange={() => {
                  setDraftFilters((previous) => ({
                    ...previous,
                    minRating: checked ? undefined : rating,
                  }));
                }}
              />
              <span className="cursor-pointer text-sm text-gray-600 group-hover:text-gray-900">
                {'⭐'.repeat(rating)} {rating} star{rating > 1 ? 's' : ''}{rating < 5 ? ' & up' : ''}
              </span>
            </label>
          );
        })}
      </div>

      <button
        type="button"
        className="w-full rounded-lg bg-orange-500 py-2.5 font-semibold text-white transition-colors hover:bg-orange-600"
        onClick={() => {
          applyFilters(draftFilters);
          setMobileFiltersOpen(false);
        }}
      >
        Apply Filters
      </button>

      <button
        type="button"
        onClick={() => {
          resetAllFilters();
          setMobileFiltersOpen(false);
        }}
        className="mt-2 w-full cursor-pointer text-center text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        Reset All
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex items-start gap-6">
          <aside className="sticky top-20 hidden w-56 flex-shrink-0 lg:block">
            {renderFilterSidebar()}
          </aside>

          <main className="min-w-0 flex-1">
            <div className="mb-4 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700"
              >
                <Filter size={16} />
                Filters
              </button>
            </div>

            <div className="mb-3 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-sm text-gray-600">
                Showing {totalCount} gigs
                {filters.search ? (
                  <>
                    {' '}
                    for <span className="font-semibold text-orange-500">&quot;{filters.search}&quot;</span>
                  </>
                ) : null}
              </p>

              <div className="flex items-center gap-3">
                <select
                  value={currentSort}
                  onChange={(event) => {
                    const nextSort = event.target.value as NonNullable<GigFiltersType['sortBy']>;
                    const nextDraft = { ...draftFilters, sortBy: nextSort };
                    applyFilters(nextDraft);
                  }}
                  className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-orange-500 focus:outline-none"
                >
                  {sortOptions.map((option) => (
                    <option key={`${option.value}-${option.label}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <div className="flex overflow-hidden rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={
                      viewMode === 'grid'
                        ? 'bg-gray-900 p-1.5 text-white'
                        : 'p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-900'
                    }
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={
                      viewMode === 'list'
                        ? 'bg-gray-900 p-1.5 text-white'
                        : 'p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-900'
                    }
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {activeChips.length > 0 ? (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {activeChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700"
                  >
                    {chip.label}
                    <button
                      type="button"
                      className="ml-1 cursor-pointer text-gray-400 transition-colors hover:text-gray-900"
                      onClick={() => removeChip(chip.key)}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="ml-auto cursor-pointer text-xs font-semibold text-orange-500 transition-colors hover:text-orange-600"
                >
                  Clear All Filters
                </button>
              </div>
            ) : null}

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={`gig-skeleton-${index}`}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white animate-pulse"
                  >
                    <div className="h-44 bg-gray-100" />
                    <div className="p-3">
                      <div className="mb-2 h-4 w-20 rounded bg-gray-200" />
                      <div className="mb-2 h-4 w-11/12 rounded bg-gray-200" />
                      <div className="mb-3 h-4 w-2/3 rounded bg-gray-200" />
                      <div className="h-4 w-1/2 rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {!isLoading && isError ? (
              <div className="col-span-full py-24 text-center">
                <p className="text-5xl">⚠️</p>
                <h3 className="mt-4 text-xl font-bold text-gray-900">Something went wrong</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {error instanceof Error ? error.message : 'Failed to load gigs. Please try again.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void refetch();
                  }}
                  className="mt-6 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
                >
                  Retry
                </button>
              </div>
            ) : null}

            {!isLoading && !isError && gigs.length === 0 ? (
              <div className="col-span-full py-24 text-center">
                <p className="text-5xl">🔍</p>
                <h3 className="mt-4 text-xl font-bold text-gray-900">No gigs found</h3>
                <p className="mt-2 text-sm text-gray-500">Try adjusting your filters</p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-6 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
                >
                  Clear Filters
                </button>
              </div>
            ) : null}

            {!isLoading && !isError && gigs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {gigs.map((gig) => (
                  <GigCard key={gig._id || gig.id || gig.slug} gig={gig} />
                ))}
              </div>
            ) : null}

            <div className="mt-8 flex flex-col items-center">
              <div className="flex items-center justify-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                  className="flex h-9 items-center justify-center rounded-lg border border-gray-200 px-3 text-sm text-gray-600 transition-colors hover:border-orange-500 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {pageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={
                      pageNumber === currentPage
                        ? 'h-9 w-9 rounded-lg bg-orange-500 text-sm font-bold text-white'
                        : 'h-9 w-9 rounded-lg border border-gray-200 text-sm text-gray-600 transition-colors hover:border-orange-500 hover:text-orange-500'
                    }
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
                  className="flex h-9 items-center justify-center rounded-lg border border-gray-200 px-3 text-sm text-gray-600 transition-colors hover:border-orange-500 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 lg:hidden">
          <div className="max-h-[90vh] overflow-y-auto rounded-xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900">Filters</h3>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
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
