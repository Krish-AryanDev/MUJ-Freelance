'use client';

import { GIG_CATEGORIES } from '../../constants/categories';
import type { GigCategory } from '../../types/gig.types';
import { classNames } from '../../utils/helpers';

interface GigCategoryBarProps {
  selectedCategory?: GigCategory;
  onSelect: (category?: GigCategory) => void;
}

export default function GigCategoryBar({ selectedCategory, onSelect }: GigCategoryBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={classNames(
          'whitespace-nowrap rounded-full border px-4 py-2 text-sm transition',
          !selectedCategory
            ? 'border-black bg-black text-white'
            : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400',
        )}
      >
        All
      </button>

      {GIG_CATEGORIES.map((category) => (
        <button
          key={category.value}
          type="button"
          onClick={() => onSelect(category.value)}
          className={classNames(
            'whitespace-nowrap rounded-full border px-4 py-2 text-sm transition',
            selectedCategory === category.value
              ? 'border-black bg-black text-white'
              : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400',
          )}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
