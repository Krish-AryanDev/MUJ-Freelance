'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { MapPin, MessageCircle, Search, Star } from 'lucide-react';

import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import { searchFreelancers } from '@/services/profile.service';
import type { FreelancerCard, FreelancerSearchParams } from '@/types/user.types';

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

  const searchQuery = useQuery({
    queryKey: ['freelancers', filters],
    queryFn: () => searchFreelancers(filters),
  });

  const cards = useMemo(() => {
    const freelancers = searchQuery.data?.freelancers || [];
    return freelancers.map(cardFromProfile);
  }, [searchQuery.data?.freelancers]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="h-fit space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:sticky lg:top-20">
          <h1 className="text-xl font-bold text-zinc-900">Find Freelancers</h1>

          <Input
            label="Search"
            placeholder="Name, skill, tagline"
            value={filters.q || ''}
            onChange={(event) => setFilters((previous) => ({ ...previous, q: event.target.value, page: 1 }))}
          />

          <Select
            label="Experience"
            value={filters.experienceLevel || ''}
            onChange={(event) => setFilters((previous) => ({ ...previous, experienceLevel: event.target.value, page: 1 }))}
            options={[
              { label: 'All Levels', value: '' },
              { label: 'Beginner', value: 'beginner' },
              { label: 'Intermediate', value: 'intermediate' },
              { label: 'Expert', value: 'expert' },
            ]}
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Input
              label="Min Rate"
              type="number"
              value={filters.minRate ?? ''}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  minRate: event.target.value ? Number(event.target.value) : undefined,
                  page: 1,
                }))
              }
            />
            <Input
              label="Max Rate"
              type="number"
              value={filters.maxRate ?? ''}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  maxRate: event.target.value ? Number(event.target.value) : undefined,
                  page: 1,
                }))
              }
            />
          </div>

          <Select
            label="Min Rating"
            value={filters.minRating ? String(filters.minRating) : ''}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                minRating: event.target.value ? Number(event.target.value) : undefined,
                page: 1,
              }))
            }
            options={[
              { label: 'Any rating', value: '' },
              { label: '4.5+', value: '4.5' },
              { label: '4.0+', value: '4.0' },
              { label: '3.5+', value: '3.5' },
            ]}
          />

          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              className="h-4 w-4"
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

          <Select
            label="Sort By"
            value={filters.sort || 'recommended'}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                sort: event.target.value as FreelancerSearchParams['sort'],
                page: 1,
              }))
            }
            options={[
              { label: 'Recommended', value: 'recommended' },
              { label: 'Rating', value: 'rating' },
              { label: 'Newest', value: 'newest' },
              { label: 'Rate: Low to High', value: 'rate_low' },
              { label: 'Rate: High to Low', value: 'rate_high' },
            ]}
          />

          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </aside>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm text-zinc-500">Results</p>
              <h2 className="text-lg font-semibold text-zinc-900">{searchQuery.data?.totalCount || 0} freelancers found</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.q ? <span className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700">q: {filters.q}</span> : null}
              {filters.experienceLevel ? (
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">{filters.experienceLevel}</span>
              ) : null}
              {filters.isAvailable ? <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">Available</span> : null}
            </div>
          </div>

          {searchQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <article key={card._id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar src={card.avatar || card.user.avatar?.url} alt={card.user.fullName || 'Freelancer'} fallback={card.user.fullName || 'F'} size="lg" className="h-16 w-16 border-2 border-orange-200" />
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900">{card.user.fullName || card.user.name || 'Freelancer'}</h3>
                        <p className="line-clamp-2 text-sm text-zinc-600">{card.tagline || 'No tagline added yet'}</p>
                      </div>
                    </div>
                    {card.isPremium ? <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">Premium</span> : null}
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-sm text-zinc-600">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {card.location || 'Jaipur'}</span>
                    <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" /> {card.averageRating.toFixed(1)} ({card.totalReviews})</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {card.skills.slice(0, 4).map((skill) => (
                      <span key={`${card._id}-${skill}`} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">
                        {skill}
                      </span>
                    ))}
                    {card.skills.length > 4 ? <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">+{card.skills.length - 4}</span> : null}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-zinc-500">Completed</p>
                      <p className="font-semibold text-zinc-900">{card.completedProjects}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Rate</p>
                      <p className="font-semibold text-zinc-900">{card.hourlyRate ? `INR ${card.hourlyRate}/hr` : 'N/A'}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-green-700">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      {card.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                    <span className="text-xs text-zinc-500">{card.responseTime?.replaceAll('_', ' ') || 'Response time not set'}</span>
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

          {!searchQuery.isLoading && !searchQuery.isError && (searchQuery.data?.totalPages || 1) > 1 ? (
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4">
              <Button variant="outline" onClick={() => onPageChange(-1)} disabled={(filters.page || 1) <= 1}>
                Previous
              </Button>
              <span className="text-sm text-zinc-600">
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
        </section>
      </div>
    </div>
  );
}
