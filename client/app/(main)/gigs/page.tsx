'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  List,
  Search,
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
    <div className="h-full bg-[#fffdf8] p-4">
      <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[#1d3557]">
        <SlidersHorizontal className="h-4 w-4 text-[#8fae8e]" />
        Filter
      </h3>

      <div className="mb-4 border-b border-[#f2e6d8] pb-4 last:border-0">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#3a506b]">Category</h4>
        <button
          type="button"
          onClick={() => setCategoryDropdownOpen((previous) => !previous)}
          className="flex w-full items-center justify-between rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-left text-sm text-[#3a506b] transition-colors hover:border-[#a9c29f]"
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
          className={`mt-2 overflow-hidden rounded-xl border border-[#f2e6d8] bg-[#fbfaf6] transition-all ${
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
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[#8fae8e]"
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
                  <span className="cursor-pointer text-sm text-[#5f7285] group-hover:text-[#1d3557]">
                    {categoryEmoji[item.value] || '💼'} {item.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {selectedCategories.length > 0 ? (
          <div className="mt-3 rounded-lg border border-[#c9d9c3] bg-[#eef5eb] px-2.5 py-2">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#4e6b4e]">
              Selected Categories
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedCategories.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#c9d9c3] bg-white px-2.5 py-1 text-xs font-medium text-[#3a506b]"
                >
                  {categoryEmoji[item] || '💼'} {getCategoryLabel(item)}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategories((previous) => previous.filter((value) => value !== item));
                      setPage(1);
                    }}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[#7f8b97] transition-colors hover:bg-[#e2eddc] hover:text-[#4e6b4e]"
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

      <div className="mb-4 border-b border-[#f2e6d8] pb-4 last:border-0">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#3a506b]">Price Range</h4>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#8b96a2]">Min Price (₹)</label>
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
          className="mb-3 w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm text-[#2f3e46] focus:border-[#8fae8e] focus:outline-none"
          placeholder="0"
        />

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#8b96a2]">Max Price (₹)</label>
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
          className="w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm text-[#2f3e46] focus:border-[#8fae8e] focus:outline-none"
          placeholder="10000"
        />
      </div>

      <div className="mb-4 border-b border-[#f2e6d8] pb-4 last:border-0">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#3a506b]">Delivery Days</h4>
        {deliveryDayOptions.map((days) => {
          const checked = draftFilters.deliveryDaysMax === days;
          return (
            <label key={days} className="group mb-2 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[#8fae8e]"
                checked={checked}
                onChange={() => {
                  setDraftFilters((previous) => ({
                    ...previous,
                    deliveryDaysMax: checked ? undefined : days,
                  }));
                }}
              />
              <span className="cursor-pointer text-sm text-[#5f7285] group-hover:text-[#1d3557]">
                {days} day{days > 1 ? 's' : ''}
              </span>
            </label>
          );
        })}
      </div>

      <div className="mb-4 border-b border-[#f2e6d8] pb-4 last:border-0">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#3a506b]">Rating</h4>
        {ratingOptions.map((rating) => {
          const checked = draftFilters.minRating === rating;
          return (
            <label key={rating} className="group mb-2 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[#8fae8e]"
                checked={checked}
                onChange={() => {
                  setDraftFilters((previous) => ({
                    ...previous,
                    minRating: checked ? undefined : rating,
                  }));
                }}
              />
              <span className="cursor-pointer text-sm text-[#5f7285] group-hover:text-[#1d3557]">
                <span className="text-yellow-400">{'⭐'.repeat(rating)}</span>{' '}
                {rating} star{rating > 1 ? 's' : ''}{rating < 5 ? ' & up' : ''}
              </span>
            </label>
          );
        })}
      </div>

      <button
        type="button"
        className="w-full rounded-xl bg-[#8fae8e] py-2.5 font-semibold text-white transition-colors hover:bg-[#7d9d7c]"
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
        className="mt-2 w-full cursor-pointer text-center text-sm text-[#7f8b97] transition-colors hover:text-[#1d3557]"
      >
        Reset All
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
        <div className="h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {renderFilterSidebar()}
        </div>
      </aside>

      <div className="relative xl:pl-[280px]">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-6">
          <main className="space-y-5">
            <div className="flex flex-col gap-3 rounded-2xl border border-[#eadfce] bg-white/95 px-4 py-3 shadow-[0_8px_24px_rgba(49,78,95,0.08)] lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="rounded-xl bg-[#8fae8e] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7d9d7c]"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => applyFilters({ ...draftFilters, sortBy: 'rating' })}
                  className="rounded-xl border border-[#c9d9c3] bg-[#eef5eb] px-4 py-2 text-sm font-medium text-[#4e6b4e] transition-colors hover:border-[#8fae8e] hover:text-[#3f5b3f]"
                >
                  Top Rated
                </button>
                <button
                  type="button"
                  onClick={() => applyFilters({ ...draftFilters, sortBy: 'newest' })}
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
                    className="w-full border-none bg-transparent text-sm text-[#2f3e46] placeholder:text-[#9aa6b2] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#eadfce] bg-white/95 p-4 shadow-[0_8px_24px_rgba(49,78,95,0.08)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#3a506b]">Categories</p>

                <div className="flex items-center gap-3">
                  <select
                    value={currentSort}
                    onChange={(event) => {
                      const nextSort = event.target.value as NonNullable<GigFiltersType['sortBy']>;
                      const nextDraft = { ...draftFilters, sortBy: nextSort };
                      applyFilters(nextDraft);
                    }}
                    className="cursor-pointer rounded-lg border border-[#eadfce] bg-white px-3 py-1.5 text-sm text-[#3a506b] focus:border-[#8fae8e] focus:outline-none"
                  >
                    {sortOptions.map((option) => (
                      <option key={`${option.value}-${option.label}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
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

              <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategories([]);
                    setPage(1);
                  }}
                  className={
                    selectedCategories.length === 0
                      ? 'snap-start flex-none whitespace-nowrap rounded-xl border border-[#8fae8e] bg-[#eef5eb] px-3 py-2 text-sm font-semibold text-[#4e6b4e]'
                      : 'snap-start flex-none whitespace-nowrap rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-sm font-medium text-[#5f7285] hover:border-[#a9c29f] hover:text-[#4e6b4e]'
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
                          ? 'snap-start flex-none whitespace-nowrap rounded-xl border border-[#8fae8e] bg-[#eef5eb] px-3 py-2 text-sm font-semibold text-[#4e6b4e]'
                          : 'snap-start flex-none whitespace-nowrap rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-sm font-medium text-[#5f7285] hover:border-[#a9c29f] hover:text-[#4e6b4e]'
                      }
                    >
                      {categoryEmoji[item.value] || '💼'} {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeChips.length > 0 ? (
              <div className="rounded-2xl border border-[#eadfce] bg-white/95 p-3 shadow-[0_8px_24px_rgba(49,78,95,0.08)]">
                <div className="flex flex-wrap items-center gap-2">
                  {activeChips.map((chip) => (
                    <span
                      key={chip.key}
                      className="flex items-center gap-1.5 rounded-full border border-[#c9d9c3] bg-[#eef5eb] px-3 py-1 text-xs font-medium text-[#4e6b4e]"
                    >
                      {chip.label}
                      <button
                        type="button"
                        className="ml-1 cursor-pointer text-[#7f8b97] transition-colors hover:text-[#1d3557]"
                        onClick={() => removeChip(chip.key)}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}

                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="ml-auto cursor-pointer text-xs font-semibold text-[#5f7a5f] transition-colors hover:text-[#4e6b4e]"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-[#eadfce] bg-white/95 p-4 shadow-[0_8px_24px_rgba(49,78,95,0.08)]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-[#5f7285]">
                  Showing {totalCount} gigs
                  {filters.search ? (
                    <>
                      {' '}
                      for <span className="font-semibold text-[#5f7a5f]">&quot;{filters.search}&quot;</span>
                    </>
                  ) : null}
                </p>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={`gig-skeleton-${index}`}
                      className="animate-pulse overflow-hidden rounded-xl border border-[#eadfce] bg-white"
                    >
                      <div className="h-44 bg-[#f6f4ef]" />
                      <div className="p-3">
                        <div className="mb-2 h-4 w-20 rounded bg-[#e8e3da]" />
                        <div className="mb-2 h-4 w-11/12 rounded bg-[#e8e3da]" />
                        <div className="mb-3 h-4 w-2/3 rounded bg-[#e8e3da]" />
                        <div className="h-4 w-1/2 rounded bg-[#e8e3da]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {!isLoading && isError ? (
                <div className="col-span-full py-24 text-center">
                  <p className="text-5xl">⚠️</p>
                  <h3 className="mt-4 text-xl font-bold text-[#1d3557]">Something went wrong</h3>
                  <p className="mt-2 text-sm text-[#5f7285]">
                    {error instanceof Error ? error.message : 'Failed to load gigs. Please try again.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      void refetch();
                    }}
                    className="mt-6 rounded-xl bg-[#8fae8e] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#7d9d7c]"
                  >
                    Retry
                  </button>
                </div>
              ) : null}

              {!isLoading && !isError && gigs.length === 0 ? (
                <div className="col-span-full py-24 text-center">
                  <p className="text-5xl">🔍</p>
                  <h3 className="mt-4 text-xl font-bold text-[#1d3557]">No gigs found</h3>
                  <p className="mt-2 text-sm text-[#5f7285]">Try adjusting your filters</p>
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="mt-6 rounded-xl bg-[#8fae8e] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#7d9d7c]"
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

            <div className="rounded-2xl border border-[#eadfce] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(49,78,95,0.08)]">
              <div className="flex items-center justify-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                  className="flex h-9 items-center justify-center rounded-lg border border-[#eadfce] px-3 text-sm text-[#5f7285] transition-colors hover:border-[#8fae8e] hover:text-[#5f7a5f] disabled:cursor-not-allowed disabled:opacity-40"
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
                        ? 'h-9 w-9 rounded-lg bg-[#8fae8e] text-sm font-bold text-white'
                        : 'h-9 w-9 rounded-lg border border-[#eadfce] text-sm text-[#5f7285] transition-colors hover:border-[#8fae8e] hover:text-[#5f7a5f]'
                    }
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
                  className="flex h-9 items-center justify-center rounded-lg border border-[#eadfce] px-3 text-sm text-[#5f7285] transition-colors hover:border-[#8fae8e] hover:text-[#5f7a5f] disabled:cursor-not-allowed disabled:opacity-40"
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
