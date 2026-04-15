'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Filter, LayoutGrid, List, MapPin, MessageCircle, Search, SlidersHorizontal, Star, X } from 'lucide-react';

import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { searchFreelancers } from '@/services/profile.service';
import type { FreelancerCard, FreelancerSearchParams } from '@/types/user.types';

type ViewMode = 'grid' | 'list';

const cardFromProfile = (freelancer: any): FreelancerCard => {
  const user = freelancer.user || {};

  return {
    _id: freelancer._id,
    user: {
      id: user._id || user.id || freelancer._id,
      _id: user._id,
      fullName: user.name || user.fullName || 'Freelancer',
      name: user.name,
      avatar: user.avatar ? { url: user.avatar } : undefined,
      email: user.email || '',
    },
    tagline: freelancer.tagline,
    avatar: freelancer.avatar,
    coverImage: freelancer.coverImage,
    location: freelancer.location,
    isAvailable: Boolean(freelancer.isAvailable),
    responseTime: freelancer.responseTime,
    hourlyRate: freelancer.hourlyRate,
    experienceLevel: freelancer.experienceLevel,
    skills: freelancer.skills || [],
    averageRating: freelancer.averageRating || 0,
    totalReviews: freelancer.totalReviews || 0,
    completedProjects: freelancer.completedProjects || 0,
    profileCompletionScore: freelancer.profileCompletionScore || 0,
    isPremium: Boolean(freelancer.isPremium),
    premiumBadge: freelancer.premiumBadge,
  };
};

export default function FreelancersPage() {
  const [filters, setFilters] = useState<FreelancerSearchParams>({
    q: '',
    experienceLevel: '',
    minRate: undefined,
    maxRate: undefined,
    minRating: undefined,
    isAvailable: undefined,
    sort: 'recommended',
    page: 1,
    limit: 12,
  });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const searchQuery = useQuery({
    queryKey: ['freelancers', filters],
    queryFn: () => searchFreelancers(filters),
  });

  const cards = useMemo(() => {
    const freelancers = searchQuery.data?.freelancers || [];
    return freelancers.map(cardFromProfile);
  }, [searchQuery.data?.freelancers]);

  const availableCount = useMemo(() => cards.filter((card) => card.isAvailable).length, [cards]);

  const clearFilters = () => {
    setFilters({
      q: '',
      experienceLevel: '',
      minRate: undefined,
      maxRate: undefined,
      minRating: undefined,
      isAvailable: undefined,
      sort: 'recommended',
      page: 1,
      limit: 12,
    });
  };

  const onPageChange = (delta: number) => {
    setFilters((previous) => ({
      ...previous,
      page: Math.max(1, (previous.page || 1) + delta),
    }));
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
          placeholder="Name, skill, tagline"
          value={filters.q || ''}
          onChange={(event) => setFilters((previous) => ({ ...previous, q: event.target.value, page: 1 }))}
          className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-sm text-[#2f3e46] placeholder:text-[#9aa6b2] focus:border-[#8fae8e] focus:outline-none"
        />
      </div>

      <div className="mb-4 border-b border-[#f2e6d8] pb-4 last:border-0">
        <h4 className="mb-2 text-sm font-bold text-[#3a506b]">Experience</h4>
        <select
          value={filters.experienceLevel || ''}
          onChange={(event) => setFilters((previous) => ({ ...previous, experienceLevel: event.target.value, page: 1 }))}
          className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-sm text-[#3a506b] focus:border-[#8fae8e] focus:outline-none"
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="expert">Expert</option>
        </select>
      </div>

      <div className="mb-4 border-b border-[#f2e6d8] pb-4 last:border-0">
        <h4 className="mb-2 text-sm font-bold text-[#3a506b]">Rate Range</h4>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#8b96a2]">Min Rate</label>
        <input
          type="number"
          value={filters.minRate ?? ''}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              minRate: event.target.value ? Number(event.target.value) : undefined,
              page: 1,
            }))
          }
          className="mb-3 w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm text-[#2f3e46] focus:border-[#8fae8e] focus:outline-none"
        />
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#8b96a2]">Max Rate</label>
        <input
          type="number"
          value={filters.maxRate ?? ''}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              maxRate: event.target.value ? Number(event.target.value) : undefined,
              page: 1,
            }))
          }
          className="w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm text-[#2f3e46] focus:border-[#8fae8e] focus:outline-none"
        />
      </div>

      <div className="mb-4 border-b border-[#f2e6d8] pb-4 last:border-0">
        <h4 className="mb-2 text-sm font-bold text-[#3a506b]">Min Rating</h4>
        <select
          value={filters.minRating ? String(filters.minRating) : ''}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              minRating: event.target.value ? Number(event.target.value) : undefined,
              page: 1,
            }))
          }
          className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-sm text-[#3a506b] focus:border-[#8fae8e] focus:outline-none"
        >
          <option value="">Any rating</option>
          <option value="4.5">4.5+</option>
          <option value="4.0">4.0+</option>
          <option value="3.5">3.5+</option>
        </select>
      </div>

      <div className="mb-4 border-b border-[#f2e6d8] pb-4 last:border-0">
        <label className="inline-flex items-center gap-2 text-sm text-[#425466]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 accent-[#8fae8e]"
            checked={filters.isAvailable ?? false}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                isAvailable: event.target.checked ? true : undefined,
                page: 1,
              }))
            }
          />
          Only show available freelancers
        </label>
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
                  onClick={() => setFilters((previous) => ({ ...previous, sort: 'rating', page: 1 }))}
                  className="rounded-xl border border-[#c9d9c3] bg-[#eef5eb] px-4 py-2 text-sm font-medium text-[#4e6b4e] transition-colors hover:border-[#8fae8e] hover:text-[#3f5b3f]"
                >
                  Top Rated
                </button>
                <button
                  type="button"
                  onClick={() => setFilters((previous) => ({ ...previous, sort: 'newest', page: 1 }))}
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
                    value={filters.q || ''}
                    onChange={(event) => setFilters((previous) => ({ ...previous, q: event.target.value, page: 1 }))}
                    placeholder="Search freelancers by name or skill"
                    className="w-full border-none bg-transparent text-sm text-[#2f3e46] placeholder:text-[#9aa6b2] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#eadfce] bg-white/95 p-4 shadow-[0_8px_24px_rgba(49,78,95,0.08)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#3a506b]">Freelancer Filters</p>

                <div className="flex items-center gap-3">
                  <select
                    value={filters.sort || 'recommended'}
                    onChange={(event) =>
                      setFilters((previous) => ({
                        ...previous,
                        sort: event.target.value as FreelancerSearchParams['sort'],
                        page: 1,
                      }))
                    }
                    className="cursor-pointer rounded-lg border border-[#eadfce] bg-white px-3 py-1.5 text-sm text-[#3a506b] focus:border-[#8fae8e] focus:outline-none"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="rating">Rating</option>
                    <option value="newest">Newest</option>
                    <option value="rate_low">Rate: Low to High</option>
                    <option value="rate_high">Rate: High to Low</option>
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
                {filters.q ? <span className="rounded-full bg-[#f2f8ef] px-3 py-1 text-xs text-[#5f7a5f]">q: {filters.q}</span> : null}
                {filters.experienceLevel ? (
                  <span className="rounded-full bg-[#eef5eb] px-3 py-1 text-xs text-[#4e6b4e]">{filters.experienceLevel}</span>
                ) : null}
                {filters.isAvailable ? <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">Available</span> : null}
                <span className="rounded-full bg-[#e6f2e0] px-3 py-1 text-xs font-medium text-[#4e6b4e]">
                  {availableCount} available now
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#eadfce] bg-white/95 p-4 shadow-[0_8px_24px_rgba(49,78,95,0.08)]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-[#5f7285]">Showing {searchQuery.data?.totalCount || 0} freelancers</p>
              </div>

              {searchQuery.isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-72 rounded-xl" />
                  ))}
                </div>
              ) : null}

              {searchQuery.isError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
                  <p className="font-semibold">Unable to load freelancers.</p>
                  <p className="text-sm">{searchQuery.error instanceof Error ? searchQuery.error.message : 'Please retry.'}</p>
                  <Button className="mt-3" variant="outline" onClick={() => void searchQuery.refetch()}>
                    Retry
                  </Button>
                </div>
              ) : null}

              {!searchQuery.isLoading && !searchQuery.isError && cards.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
                  <Search className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
                  <h3 className="text-lg font-semibold text-zinc-900">No freelancers found</h3>
                  <p className="mt-1 text-sm text-zinc-600">Try changing your filters or clearing search criteria.</p>
                  <Button className="mt-4" variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              ) : null}

              {!searchQuery.isLoading && !searchQuery.isError && cards.length > 0 ? (
                <div
                  className={
                    viewMode === 'list'
                      ? 'grid grid-cols-1 gap-3'
                      : 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'
                  }
                >
                  {cards.map((card) => (
                    viewMode === 'list' ? (
                      <article
                        key={card._id}
                        className="group relative overflow-hidden rounded-3xl border border-[#dde1e6] bg-white p-2.5 shadow-[0_8px_24px_rgba(49,78,95,0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(49,78,95,0.16)]"
                      >
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-14 overflow-hidden">
                          {card.coverImage ? (
                            <div
                              className="absolute inset-0 bg-cover bg-center"
                              style={{ backgroundImage: `url(${card.coverImage})` }}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-r from-[#d7e1ea] to-[#e3e8ee]" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/92" />
                        </div>

                        {card.isPremium ? (
                          <div className="absolute left-2.5 top-2.5">
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                              ✦ Premium
                            </span>
                          </div>
                        ) : null}

                        <div className="relative z-10 flex flex-col gap-2.5 pt-5 md:flex-row md:items-center md:justify-between">
                          <div className="flex min-w-0 flex-1 items-start gap-2.5 pt-1.5 md:pt-1">
                            <Avatar
                              src={card.avatar || card.user.avatar?.url}
                              alt={card.user.fullName || 'Freelancer'}
                              fallback={card.user.fullName || 'F'}
                              size="lg"
                              className="h-12 w-12 rounded-full border-4 border-white/80 shadow-md"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="truncate text-base font-bold text-[#1a2e45]">
                                    {card.user.fullName || card.user.name || 'Freelancer'}
                                  </h3>
                                  <p className="mt-0.5 line-clamp-1 text-xs text-[#4a6080]">
                                    {card.tagline || 'No tagline added yet'}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/60 text-[#3a506b] backdrop-blur-sm transition hover:bg-white/90"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                    <polyline points="16 6 12 2 8 6" />
                                    <line x1="12" y1="2" x2="12" y2="15" />
                                  </svg>
                                </button>
                              </div>

                              <div className="mt-2 flex flex-wrap gap-1">
                                {card.skills.slice(0, 4).map((skill) => (
                                  <span
                                    key={`${card._id}-${skill}`}
                                    className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-medium text-[#2d4a6a] backdrop-blur-sm"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {card.skills.length > 4 ? (
                                  <span className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-medium text-[#2d4a6a] backdrop-blur-sm">
                                    +{card.skills.length - 4}
                                  </span>
                                ) : null}
                              </div>

                              <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-xs text-[#4a6080] sm:grid-cols-4">
                                <div className="rounded-xl bg-white/55 px-2.5 py-1.5 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs font-bold text-[#1a2e45]">
                                      {card.averageRating > 0 ? card.averageRating.toFixed(1) : 'N/A'}
                                    </span>
                                  </div>
                                  <p className="mt-1">Rating</p>
                                </div>

                                <div className="rounded-xl bg-white/55 px-2.5 py-1.5 text-center">
                                  <p className="text-xs font-bold text-[#1a2e45]">{card.completedProjects > 0 ? `${card.completedProjects}+` : '\u2014'}</p>
                                  <p className="mt-1">Completed</p>
                                </div>

                                <div className="rounded-xl bg-white/55 px-2.5 py-1.5 text-center">
                                  <p className="text-xs font-bold text-[#1a2e45]">{card.hourlyRate ? `$${card.hourlyRate}/hr` : 'N/A'}</p>
                                  <p className="mt-1">Rate</p>
                                </div>

                                <div className="rounded-xl bg-white/55 px-2.5 py-1.5 text-center">
                                  <span className="inline-flex items-center justify-center gap-1.5">
                                    <span className={`h-2 w-2 rounded-full ${card.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    <span className={card.isAvailable ? 'font-medium text-green-700' : 'text-gray-500'}>
                                      {card.isAvailable ? 'Available' : 'Unavailable'}
                                    </span>
                                  </span>
                                  <p className="mt-1">Status</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-row items-center gap-2 md:w-[180px] md:flex-col md:items-stretch">
                            <Link href={`/profile/${card.user._id || card.user.id}`} className="flex-1 md:w-full">
                              <button
                                type="button"
                                className="w-full rounded-2xl bg-[#1a2e45] py-2 text-xs font-semibold text-white transition hover:bg-[#243d5a]"
                              >
                                Get in touch
                              </button>
                            </Link>

                            <Link href="/messages" className="md:w-full">
                              <button
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/70 text-[#1a2e45] backdrop-blur-sm transition hover:bg-white md:h-9 md:w-full md:gap-2"
                              >
                                <MessageCircle className="h-4 w-4" />
                                <span className="hidden text-xs font-medium md:inline">Message</span>
                              </button>
                            </Link>

                            {card.location ? (
                              <div className="hidden items-center justify-center gap-1 rounded-xl bg-white/55 px-2.5 py-1.5 text-[11px] text-[#4a6080] md:flex">
                                <MapPin className="h-3 w-3" />
                                {card.location}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ) : (
                      <article
                        key={card._id}
                        className="group relative overflow-hidden rounded-3xl border border-[#dde1e6] bg-white p-3 shadow-[0_8px_32px_rgba(49,78,95,0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(49,78,95,0.18)]"
                      >
                        <div className="absolute inset-x-0 top-0 h-20 overflow-hidden rounded-t-3xl bg-[#dbe2e8]">
                          {card.coverImage ? (
                            <div
                              className="absolute inset-0 bg-cover bg-center"
                              style={{ backgroundImage: `url(${card.coverImage})` }}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-r from-[#d7e1ea] to-[#e3e8ee]" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/92" />
                        </div>

                        <div className="absolute right-2.5 top-2.5">
                          <button
                            type="button"
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/60 text-[#3a506b] backdrop-blur-sm transition hover:bg-white/90"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                              <polyline points="16 6 12 2 8 6" />
                              <line x1="12" y1="2" x2="12" y2="15" />
                            </svg>
                          </button>
                        </div>

                        <div className="relative z-10 mb-2.5 pt-10">
                          <div className="mb-2">
                            <Avatar
                              src={card.avatar || card.user.avatar?.url}
                              alt={card.user.fullName || 'Freelancer'}
                              fallback={card.user.fullName || 'F'}
                              size="lg"
                              className="h-12 w-12 rounded-full border-4 border-white/80 shadow-md"
                            />
                          </div>

                          <div className="flex items-start justify-between pr-8">
                            <div>
                              <h3 className="text-base font-bold text-[#1a2e45]">
                                {card.user.fullName || card.user.name || 'Freelancer'}
                              </h3>
                              <p className="mt-0.5 line-clamp-1 text-xs text-[#4a6080]">
                                {card.tagline || 'No tagline added yet'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1">
                            {card.skills.slice(0, 3).map((skill) => (
                              <span
                                key={`${card._id}-${skill}`}
                                className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-medium text-[#2d4a6a] backdrop-blur-sm"
                              >
                                {skill}
                              </span>
                            ))}
                            {card.skills.length > 3 ? (
                              <span className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-medium text-[#2d4a6a] backdrop-blur-sm">
                                +{card.skills.length - 3}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="mb-2 h-px bg-white/40" />

                        <div className="mb-3 grid grid-cols-3 gap-1.5 text-center">
                          <div>
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-bold text-[#1a2e45]">
                                {card.averageRating > 0 ? card.averageRating.toFixed(1) : 'N/A'}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-[#4a6080]">Rating</p>
                          </div>

                          <div>
                            <p className="text-sm font-bold text-[#1a2e45]">
                              {card.completedProjects > 0 ? `${card.completedProjects}+` : '\u2014'}
                            </p>
                            <p className="mt-0.5 text-xs text-[#4a6080]">Completed</p>
                          </div>

                          <div>
                            <p className="text-sm font-bold text-[#1a2e45]">
                              {card.hourlyRate ? `$${card.hourlyRate}/hr` : 'N/A'}
                            </p>
                            <p className="mt-0.5 text-xs text-[#4a6080]">Rate</p>
                          </div>
                        </div>

                        <div className="mb-2.5 flex items-center justify-between text-xs text-[#4a6080]">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full ${card.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`}
                            />
                            <span className={card.isAvailable ? 'font-medium text-green-700' : 'text-gray-500'}>
                              {card.isAvailable ? 'Available now' : 'Unavailable'}
                            </span>
                          </span>
                          {card.location ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {card.location}
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2">
                          <Link href={`/profile/${card.user._id || card.user.id}`} className="flex-1">
                            <button
                              type="button"
                              className="w-full rounded-2xl bg-[#1a2e45] py-2 text-xs font-semibold text-white transition hover:bg-[#243d5a]"
                            >
                              Get in touch
                            </button>
                          </Link>

                          <Link href="/messages">
                            <button
                              type="button"
                              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/70 text-[#1a2e45] backdrop-blur-sm transition hover:bg-white"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </button>
                          </Link>
                        </div>

                        {card.isPremium ? (
                          <div className="absolute left-2.5 top-2.5">
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                              ✦ Premium
                            </span>
                          </div>
                        ) : null}
                      </article>
                    )
                  ))}
                </div>
              ) : null}
            </div>

            {!searchQuery.isLoading && !searchQuery.isError && (searchQuery.data?.totalPages || 1) > 1 ? (
              <div className="flex items-center justify-between rounded-xl border border-[#eadfce] bg-white p-4">
                <Button variant="outline" onClick={() => onPageChange(-1)} disabled={(filters.page || 1) <= 1}>
                  Previous
                </Button>
                <span className="text-sm text-[#5f7285]">
                  Page {filters.page || 1} of {searchQuery.data?.totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  onClick={() => onPageChange(1)}
                  disabled={(filters.page || 1) >= (searchQuery.data?.totalPages || 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </main>
        </div>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 lg:hidden">
          <div className="max-h-[90vh] overflow-y-auto rounded-xl bg-[#fffdf8] p-4">
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
