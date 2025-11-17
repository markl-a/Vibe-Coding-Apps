import { create } from 'zustand';
import { FilterOptions, SortOption } from '@/types';

interface FilterStore {
  filters: FilterOptions;
  sortBy: SortOption;
  searchQuery: string;
  setFilters: (filters: Partial<FilterOptions>) => void;
  setSortBy: (sortBy: SortOption) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

const initialFilters: FilterOptions = {
  categories: [],
  priceRange: {
    min: 0,
    max: 10000,
  },
  rating: undefined,
  inStockOnly: false,
  tags: [],
};

export const useFilterStore = create<FilterStore>()((set) => ({
  filters: initialFilters,
  sortBy: 'newest',
  searchQuery: '',

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  resetFilters: () => {
    set({
      filters: initialFilters,
      sortBy: 'newest',
      searchQuery: '',
    });
  },
}));
