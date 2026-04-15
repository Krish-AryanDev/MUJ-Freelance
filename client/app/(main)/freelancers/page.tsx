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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                      ? 'grid grid-cols-1 gap-4'
                      : 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'
                  }
                >
                  {cards.map((card) => (
                    <article
                      key={card._id}
                      className="rounded-2xl border border-[#eadfce] bg-gradient-to-b from-white to-[#fff8f1] p-4 shadow-[0_6px_20px_rgba(49,78,95,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(49,78,95,0.12)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar src={card.avatar || card.user.avatar?.url} alt={card.user.fullName || 'Freelancer'} fallback={card.user.fullName || 'F'} size="lg" className="h-16 w-16 border-2 border-[#b7d5ae]" />
                          <div>
                            <h3 className="text-lg font-semibold text-[#1d3557]">{card.user.fullName || card.user.name || 'Freelancer'}</h3>
                            <p className="line-clamp-2 text-sm text-[#5f7285]">{card.tagline || 'No tagline added yet'}</p>
                          </div>
                        </div>
                        {card.isPremium ? <span className="rounded-full bg-[#ffe8cf] px-2 py-1 text-xs font-semibold text-[#ba6d27]">Premium</span> : null}
                      </div>

                      <div className="mt-3 flex items-center gap-3 text-sm text-[#5f7285]">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {card.location || 'Jaipur'}</span>
                        <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-[#8fae8e] text-[#8fae8e]" /> {card.averageRating.toFixed(1)} ({card.totalReviews})</span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {card.skills.slice(0, 4).map((skill) => (
                          <span key={`${card._id}-${skill}`} className="rounded-full bg-[#eef5eb] px-2.5 py-1 text-xs text-[#4e6b4e]">
                            {skill}
                          </span>
                        ))}
                        {card.skills.length > 4 ? <span className="rounded-full bg-[#eef5eb] px-2.5 py-1 text-xs text-[#4e6b4e]">+{card.skills.length - 4}</span> : null}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-[#8b96a2]">Completed</p>
                          <p className="font-semibold text-[#1d3557]">{card.completedProjects}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#8b96a2]">Rate</p>
                          <p className="font-semibold text-[#1d3557]">{card.hourlyRate ? `INR ${card.hourlyRate}/hr` : 'N/A'}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-xs text-green-700">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          {card.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                        <span className="text-xs text-[#8b96a2]">{card.responseTime?.replaceAll('_', ' ') || 'Response time not set'}</span>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Link href={`/profile/${card.user._id || card.user.id}`} className="flex-1">
                          <Button className="w-full" variant="outline">View Profile</Button>
                        </Link>
                        <Link href="/messages" className="flex-1">
                          <Button className="w-full" leftIcon={<MessageCircle className="h-4 w-4" />}>Message</Button>
                        </Link>
                      </div>
                    </article>
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
