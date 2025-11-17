'use client';

import { SortOption } from '@/types';
import { useFilterStore } from '@/store/useFilterStore';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: '最新上架' },
  { value: 'price-asc', label: '價格：低到高' },
  { value: 'price-desc', label: '價格：高到低' },
  { value: 'rating-desc', label: '評分最高' },
  { value: 'name-asc', label: '名稱：A-Z' },
];

export function ProductSort() {
  const { sortBy, setSortBy } = useFilterStore();

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="sort" className="text-sm font-medium text-gray-700">
        排序：
      </label>
      <select
        id="sort"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as SortOption)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
