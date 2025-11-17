'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useFilterStore } from '@/store/useFilterStore';

export function ProductSearch() {
  const { searchQuery, setSearchQuery } = useFilterStore();
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="搜尋產品..."
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {localQuery && (
          <button
            onClick={() => setLocalQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="清除搜尋"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
