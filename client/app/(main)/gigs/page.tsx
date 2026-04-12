'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import GigCategoryBar from '../../../components/gigs/GigCategoryBar';
import GigFilters from '../../../components/gigs/GigFilters';
import GigGrid from '../../../components/gigs/GigGrid';
import ErrorState from '../../../components/shared/ErrorState';
import Pagination from '../../../components/ui/Pagination';
import { gigService } from '../../../services/gig.service';
import type { GigCategory, GigFilters as GigFiltersType } from '../../../types/gig.types';

export default function Page() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<GigCategory | undefined>(undefined);
  const [filters, setFilters] = useState<GigFiltersType>({ sortBy: 'relevance' });

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
  const meta: { page?: number; totalPages?: number } = data?.success ? data.meta ?? {} : {};

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-zinc-900">Browse Gigs</h1>
        <p className="text-sm text-zinc-600">Discover services from freelancers across categories.</p>
      </div>

      <GigCategoryBar
        selectedCategory={category}
        onSelect={(nextCategory) => {
          setCategory(nextCategory);
          setPage(1);
        }}
      />

      <GigFilters
        value={filters}
        onApply={(nextFilters) => {
          setFilters(nextFilters);
          setPage(1);
        }}
      />

      {isError ? (
        <ErrorState
          title="Unable to load gigs"
          message={error instanceof Error ? error.message : 'Please try again.'}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : (
        <GigGrid gigs={gigs} isLoading={isLoading} />
      )}

      <div className="flex justify-center">
        <Pagination
          page={typeof meta.page === 'number' ? meta.page : page}
          totalPages={typeof meta.totalPages === 'number' ? meta.totalPages : 1}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

