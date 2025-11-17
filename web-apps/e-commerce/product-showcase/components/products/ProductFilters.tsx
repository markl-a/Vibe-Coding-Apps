'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { useFilterStore } from '@/store/useFilterStore';
import { categories, tags, priceRanges } from '@/lib/mockData';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function ProductFilters() {
  const { filters, setFilters, resetFilters } = useFilterStore();
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    rating: true,
    tags: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCategoryChange = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    setFilters({ categories: newCategories });
  };

  const handleTagChange = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    setFilters({ tags: newTags });
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setFilters({ priceRange: { min, max } });
  };

  const handleRatingChange = (rating: number) => {
    setFilters({ rating: filters.rating === rating ? undefined : rating });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.tags.length > 0 ||
    filters.rating !== undefined ||
    filters.priceRange.min > 0 ||
    filters.priceRange.max < 10000000;

  return (
    <Card className="sticky top-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">篩選條件</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="h-4 w-4 mr-1" />
            清除
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Categories */}
        <div className="border-b border-gray-200 pb-4">
          <button
            onClick={() => toggleSection('category')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
          >
            <span>分類</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expandedSections.category ? 'rotate-180' : ''
              }`}
            />
          </button>
          <AnimatePresence>
            {expandedSections.category && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {categories.filter(c => c !== '全部').map((category) => (
                  <label key={category} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => handleCategoryChange(category)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Price Range */}
        <div className="border-b border-gray-200 pb-4">
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
          >
            <span>價格範圍</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expandedSections.price ? 'rotate-180' : ''
              }`}
            />
          </button>
          <AnimatePresence>
            {expandedSections.price && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {priceRanges.map((range) => (
                  <label key={range.label} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      checked={
                        filters.priceRange.min === range.min &&
                        filters.priceRange.max === range.max
                      }
                      onChange={() => handlePriceRangeChange(range.min, range.max)}
                      className="w-4 h-4 text-primary-600 focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{range.label}</span>
                  </label>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Rating */}
        <div className="border-b border-gray-200 pb-4">
          <button
            onClick={() => toggleSection('rating')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
          >
            <span>評分</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expandedSections.rating ? 'rotate-180' : ''
              }`}
            />
          </button>
          <AnimatePresence>
            {expandedSections.rating && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <label key={rating} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      checked={filters.rating === rating}
                      onChange={() => handleRatingChange(rating)}
                      className="w-4 h-4 text-primary-600 focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {rating} 星以上
                    </span>
                  </label>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tags */}
        <div>
          <button
            onClick={() => toggleSection('tags')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
          >
            <span>標籤</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expandedSections.tags ? 'rotate-180' : ''
              }`}
            />
          </button>
          <AnimatePresence>
            {expandedSections.tags && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex flex-wrap gap-2 overflow-hidden"
              >
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagChange(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filters.tags.includes(tag)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stock Filter */}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => setFilters({ inStockOnly: e.target.checked })}
            className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700">僅顯示有貨商品</span>
        </label>
      </div>
    </Card>
  );
}
