'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
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
  const [selectedCategories, setSelectedCategories] = useState<GigCategory[]>([]);
  const [filters, setFilters] = useState<GigFiltersType>({ sortBy: 'relevance' });
  const [draftFilters, setDraftFilters] = useState<GigFiltersType>({ sortBy: 'relevance' });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const query = {
    page,
    limit: 12,
    category: selectedCategories.length > 0 ? selectedCategories : undefined,
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

    if (selectedCategories.length > 0) {
      chips.push({
        key: 'category',
        label: `Categories: ${selectedCategories.map((item) => getCategoryLabel(item)).join(', ')}`,
      });
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
  }, [filters.deliveryDaysMax, filters.maxPrice, filters.minPrice, filters.minRating, filters.search, selectedCategories]);

  const pageNumbers = useMemo(() => getPageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  const applyFilters = (nextFilters: GigFiltersType) => {
    const normalized = normalizeFilters(nextFilters);
    setFilters(normalized);
    setDraftFilters(normalized);
    setPage(1);
  };

  const resetAllFilters = () => {
    const resetState: GigFiltersType = { sortBy: 'relevance' };
    setSelectedCategories([]);
    setFilters(resetState);
    setDraftFilters(resetState);
    setPage(1);
  };

  const removeChip = (key: string) => {
    if (key === 'category') {
      setSelectedCategories([]);
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
    <div className="h-full bg-white p-4">
      <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
        <SlidersHorizontal className="h-4 w-4 text-orange-500" />
        Filter
      </h3>

      <div className="mb-4 border-b border-gray-100 pb-4 last:border-0">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">Category</h4>
        <button
          type="button"
          onClick={() => setCategoryDropdownOpen((previous) => !previous)}
          className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:border-orange-300"
        >
          <span>
            {selectedCategories.length > 0
              ? `${selectedCategories.length} categories selected`
              : 'Select categories'}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <div
          className={`mt-2 overflow-hidden rounded-lg border border-gray-100 bg-gray-50/40 transition-all ${
            categoryDropdownOpen ? 'max-h-72 p-2' : 'max-h-0 border-0 p-0'
          }`}
        >
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {CATEGORIES.map((item) => {
              const checked = selectedCategories.includes(item.value);
              return (
                <label key={item.value} className="group flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-orange-500"
                    checked={checked}
                    onChange={() => {
                      setSelectedCategories((previous) => {
                        if (previous.includes(item.value)) {
                          return previous.filter((value) => value !== item.value);
                        }

                        return [...previous, item.value];
                      });
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
        </div>

        {selectedCategories.length > 0 ? (
          <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-2">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-orange-600">
              Selected Categories
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedCategories.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700"
                >
                  {categoryEmoji[item] || '💼'} {getCategoryLabel(item)}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategories((previous) => previous.filter((value) => value !== item));
                      setPage(1);
                    }}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-orange-100 hover:text-orange-600"
                    aria-label={`Remove ${getCategoryLabel(item)} category`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : null}
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
                className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-orange-500"
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
                className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-orange-500"
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
    <div className="relative min-h-screen bg-[#F2F3EE]">
      <aside className="fixed bottom-0 left-0 top-16 z-20 hidden w-[280px] border-r border-gray-200 bg-white xl:block">
        <div className="h-full overflow-y-auto">{renderFilterSidebar()}</div>
      </aside>

      <div className="relative xl:pl-[280px]">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-6">
          <main className="space-y-5">
            <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => applyFilters({ ...draftFilters, sortBy: 'rating' })}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-orange-300 hover:text-orange-600"
                >
                  Top Rated
                </button>
                <button
                  type="button"
                  onClick={() => applyFilters({ ...draftFilters, sortBy: 'newest' })}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-orange-300 hover:text-orange-600"
                >
                  Newest
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 xl:hidden"
                >
                  <Filter size={16} />
                  Filters
                </button>

                <div className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 lg:w-[360px]">
                  <input
                    type="search"
                    value={draftFilters.search || ''}
                    onChange={(event) => {
                      setDraftFilters((previous) => ({
                        ...previous,
                        search: event.target.value,
                      }));
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        applyFilters(draftFilters);
                      }
                    }}
                    placeholder="Search gigs by title or keyword"
                    className="w-full border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => applyFilters(draftFilters)}
                    className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-700">Categories</p>

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

              <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategories([]);
                    setPage(1);
                  }}
                  className={
                    selectedCategories.length === 0
                      ? 'snap-start flex-none whitespace-nowrap rounded-xl border border-orange-500 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-600'
                      : 'snap-start flex-none whitespace-nowrap rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:border-orange-300 hover:text-orange-600'
                  }
                >
                  All
                </button>

                {CATEGORIES.map((item) => {
                  const active = selectedCategories.includes(item.value);
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setSelectedCategories((previous) => {
                          if (previous.includes(item.value)) {
                            return previous.filter((value) => value !== item.value);
                          }

                          return [...previous, item.value];
                        });
                        setPage(1);
                      }}
                      className={
                        active
                          ? 'snap-start flex-none whitespace-nowrap rounded-xl border border-orange-500 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-600'
                          : 'snap-start flex-none whitespace-nowrap rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:border-orange-300 hover:text-orange-600'
                      }
                    >
                      {categoryEmoji[item.value] || '💼'} {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeChips.length > 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
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
              </div>
            ) : null}

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {totalCount} gigs
                  {filters.search ? (
                    <>
                      {' '}
                      for <span className="font-semibold text-orange-500">&quot;{filters.search}&quot;</span>
                    </>
                  ) : null}
                </p>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={`gig-skeleton-${index}`}
                      className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white"
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
                <div
                  className={
                    viewMode === 'list'
                      ? 'grid grid-cols-1 gap-4'
                      : 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'
                  }
                >
                  {gigs.map((gig) => (
                    <GigCard key={gig._id || gig.id || gig.slug} gig={gig} />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
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
