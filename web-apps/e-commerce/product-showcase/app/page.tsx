'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFilterStore } from '@/store/useFilterStore';
import { mockProducts } from '@/lib/mockData';
import { Product } from '@/types';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductSort } from '@/components/products/ProductSort';
import { ProductSearch } from '@/components/products/ProductSearch';

export default function HomePage() {
  const { filters, sortBy, searchQuery } = useFilterStore();

  const filteredAndSortedProducts = useMemo(() => {
    let products = [...mockProducts];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      products = products.filter((p) =>
        filters.categories.includes(p.category)
      );
    }

    // Apply price range filter
    products = products.filter(
      (p) =>
        p.price >= filters.priceRange.min &&
        p.price <= filters.priceRange.max
    );

    // Apply rating filter
    if (filters.rating) {
      products = products.filter((p) => p.rating >= filters.rating!);
    }

    // Apply tags filter
    if (filters.tags.length > 0) {
      products = products.filter((p) =>
        filters.tags.some((tag) => p.tags.includes(tag))
      );
    }

    // Apply stock filter
    if (filters.inStockOnly) {
      products = products.filter((p) => p.inStock);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'rating-desc':
        products.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        products.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'name-asc':
        products.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));
        break;
    }

    return products;
  }, [filters, sortBy, searchQuery]);

  return (
    <div className="container py-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          精選電子產品
        </h1>
        <p className="text-lg text-gray-600">
          探索最新最優質的電子產品，享受最佳的購物體驗
        </p>
      </motion.div>

      {/* Search Bar */}
      <div className="mb-6">
        <ProductSearch />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <ProductFilters />
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              顯示 {filteredAndSortedProducts.length} 項產品
            </p>
            <ProductSort />
          </div>

          {/* Product Grid */}
          <ProductGrid products={filteredAndSortedProducts} />
        </div>
      </div>
    </div>
  );
}
