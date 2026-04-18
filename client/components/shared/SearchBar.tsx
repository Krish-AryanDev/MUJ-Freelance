'use client';

import { useEffect, useState } from 'react';

import { classNames } from '../../utils/helpers';

interface SearchBarProps {
  value?: string;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  onSearch: (query: string) => void;
}

export default function SearchBar({
  value,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
  onSearch,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(value ?? '');
  const isControlled = typeof value === 'string';
  const currentValue = isControlled ? value : internalValue;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(currentValue.trim());
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [currentValue, debounceMs, onSearch]);

  return (
    <div className={classNames('relative w-full', className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
        🔍
      </span>
      <label htmlFor="shared-search-bar" className="sr-only">
        Search
      </label>
      <input
        id="shared-search-bar"
        name="search"
        type="search"
        value={currentValue}
        onChange={(event) => {
          setInternalValue(event.target.value);
        }}
        placeholder={placeholder}
        className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-black/20 transition focus:ring-2"
      />
    </div>
  );
}
