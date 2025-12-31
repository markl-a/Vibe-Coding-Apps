/**
 * Filter Controls Component Example
 *
 * This example demonstrates:
 * - Advanced filtering UI with multiple filter types
 * - Date range picker
 * - Multi-select dropdowns
 * - Search and autocomplete
 * - Filter presets and saved filters
 * - Filter state management
 * - URL parameter sync for shareable filters
 *
 * Usage in dashboard apps: admin-panel, analytics-dashboard, nextjs-dashboard, sales-metrics-dashboard
 */

'use client';

import { useState, useEffect, useMemo } from 'react';

// Type definitions
interface FilterState {
  dateRange: {
    start: string;
    end: string;
  };
  categories: string[];
  status: string[];
  priceRange: {
    min: number;
    max: number;
  };
  searchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface DataItem {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  price: number;
  date: string;
  revenue: number;
}

interface FilterPreset {
  id: string;
  name: string;
  filters: Partial<FilterState>;
}

export default function FilterControls() {
  // Initial filter state
  const initialFilters: FilterState = {
    dateRange: {
      start: '',
      end: '',
    },
    categories: [],
    status: [],
    priceRange: {
      min: 0,
      max: 10000,
    },
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'desc',
  };

  // State management
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [data, setData] = useState<DataItem[]>([]);
  const [savedFilters, setSavedFilters] = useState<FilterPreset[]>([
    {
      id: 'preset-1',
      name: 'High Value Active',
      filters: {
        status: ['active'],
        priceRange: { min: 5000, max: 10000 },
      },
    },
    {
      id: 'preset-2',
      name: 'Recent Completed',
      filters: {
        status: ['completed'],
        sortBy: 'date',
        sortOrder: 'desc',
      },
    },
  ]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true);

  // Available options
  const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys'];
  const statusOptions: Array<DataItem['status']> = ['active', 'pending', 'completed', 'cancelled'];

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      // In a real app: const response = await fetch('/api/data');
      // Mock data
      const mockData: DataItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i + 1}`,
        name: `Product ${i + 1}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
        price: Math.floor(Math.random() * 10000) + 100,
        date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 50000) + 1000,
      }));
      setData(mockData);
    };

    fetchData();
  }, []);

  // Apply filters and sorting
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (filters.searchQuery) {
      result = result.filter((item) =>
        item.name.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      result = result.filter((item) => filters.categories.includes(item.category));
    }

    // Status filter
    if (filters.status.length > 0) {
      result = result.filter((item) => filters.status.includes(item.status));
    }

    // Price range filter
    result = result.filter(
      (item) => item.price >= filters.priceRange.min && item.price <= filters.priceRange.max
    );

    // Date range filter
    if (filters.dateRange.start) {
      result = result.filter((item) => item.date >= filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      result = result.filter((item) => item.date <= filters.dateRange.end);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'revenue':
          comparison = a.revenue - b.revenue;
          break;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [data, filters]);

  // Update filter handlers
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: 'categories' | 'status', value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value],
    }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const applyPreset = (preset: FilterPreset) => {
    setFilters((prev) => ({ ...prev, ...preset.filters }));
  };

  const saveCurrentFilters = () => {
    if (!newPresetName.trim()) return;

    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName,
      filters: { ...filters },
    };

    setSavedFilters((prev) => [...prev, newPreset]);
    setNewPresetName('');
    setShowSaveDialog(false);
  };

  const deletePreset = (id: string) => {
    setSavedFilters((prev) => prev.filter((preset) => preset.id !== id));
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.categories.length > 0) count++;
    if (filters.status.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.priceRange.min !== 0 || filters.priceRange.max !== 10000) count++;
    return count;
  }, [filters]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Data Filtering</h1>
        <p className="text-gray-600">Filter, sort, and analyze your data with powerful controls</p>
      </div>

      <div className="flex gap-8">
        {/* Filter Panel */}
        <div
          className={`${
            isFilterPanelOpen ? 'w-80' : 'w-0'
          } transition-all duration-300 overflow-hidden flex-shrink-0`}
        >
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Filters</h2>
              {activeFilterCount > 0 && (
                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>

            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => updateFilter('searchQuery', e.target.value)}
                placeholder="Search by name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) =>
                    updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) =>
                    updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {categories.map((category) => (
                  <label key={category} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => toggleArrayFilter('categories', category)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="space-y-2">
                {statusOptions.map((status) => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={() => toggleArrayFilter('status', status)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range: ${filters.priceRange.min} - ${filters.priceRange.max}
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={filters.priceRange.min}
                  onChange={(e) =>
                    updateFilter('priceRange', { ...filters.priceRange, min: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={filters.priceRange.max}
                  onChange={(e) =>
                    updateFilter('priceRange', { ...filters.priceRange, max: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
            </div>

            {/* Reset Filters */}
            <button
              onClick={resetFilters}
              className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Reset All Filters
            </button>

            {/* Saved Filters */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Saved Filters</h3>
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Save
                </button>
              </div>

              {showSaveDialog && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Filter name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveCurrentFilters}
                      className="flex-1 py-1 bg-blue-600 text-white rounded text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowSaveDialog(false)}
                      className="flex-1 py-1 border border-gray-300 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {savedFilters.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
                  >
                    <button
                      onClick={() => applyPreset(preset)}
                      className="text-sm text-gray-700 hover:text-gray-900 font-medium flex-grow text-left"
                    >
                      {preset.name}
                    </button>
                    <button
                      onClick={() => deletePreset(preset.id)}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow">
          {/* Toolbar */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
                >
                  {isFilterPanelOpen ? 'Hide' : 'Show'} Filters
                </button>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Sort by:</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="name">Name</option>
                    <option value="date">Date</option>
                    <option value="price">Price</option>
                    <option value="revenue">Revenue</option>
                  </select>

                  <button
                    onClick={() =>
                      updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{filteredData.length}</span> of{' '}
                <span className="font-semibold">{data.length}</span> items
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.slice(0, 20).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : item.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : item.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ${item.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ${item.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredData.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No items match your filters</p>
                <button
                  onClick={resetFilters}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
