'use client';

import { useEffect, useState } from 'react';

import type { GigFilters as GigFiltersType } from '../../types/gig.types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface GigFiltersProps {
  value: GigFiltersType;
  onApply: (filters: GigFiltersType) => void;
}

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_low_to_high', label: 'Price low to high' },
  { value: 'price_high_to_low', label: 'Price high to low' },
  { value: 'rating', label: 'Top rated' },
];

export default function GigFilters({ value, onApply }: GigFiltersProps) {
  const [localFilters, setLocalFilters] = useState<GigFiltersType>(value);

  useEffect(() => {
    setLocalFilters(value);
  }, [value]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          label="Search"
          placeholder="Search gigs"
          value={localFilters.search ?? ''}
          onChange={(event) => {
            setLocalFilters((prev) => ({ ...prev, search: event.target.value }));
          }}
        />

        <Input
          label="Min Price"
          type="number"
          min={0}
          value={localFilters.minPrice ?? ''}
          onChange={(event) => {
            const valueAsNumber = Number(event.target.value);
            setLocalFilters((prev) => ({
              ...prev,
              minPrice: Number.isFinite(valueAsNumber) && event.target.value !== '' ? valueAsNumber : undefined,
            }));
          }}
        />

        <Input
          label="Max Price"
          type="number"
          min={0}
          value={localFilters.maxPrice ?? ''}
          onChange={(event) => {
            const valueAsNumber = Number(event.target.value);
            setLocalFilters((prev) => ({
              ...prev,
              maxPrice: Number.isFinite(valueAsNumber) && event.target.value !== '' ? valueAsNumber : undefined,
            }));
          }}
        />

        <Input
          label="Max Delivery Days"
          type="number"
          min={1}
          value={localFilters.deliveryDaysMax ?? ''}
          onChange={(event) => {
            const valueAsNumber = Number(event.target.value);
            setLocalFilters((prev) => ({
              ...prev,
              deliveryDaysMax:
                Number.isFinite(valueAsNumber) && event.target.value !== '' ? valueAsNumber : undefined,
            }));
          }}
        />

        <Select
          label="Sort By"
          value={localFilters.sortBy ?? 'relevance'}
          onChange={(event) => {
            setLocalFilters((prev) => ({
              ...prev,
              sortBy: event.target.value as GigFiltersType['sortBy'],
            }));
          }}
          options={sortOptions}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={() => {
            onApply(localFilters);
          }}
        >
          Apply Filters
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const resetFilters: GigFiltersType = { sortBy: 'relevance' };
            setLocalFilters(resetFilters);
            onApply(resetFilters);
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
