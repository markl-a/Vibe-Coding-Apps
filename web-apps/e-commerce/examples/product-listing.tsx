/**
 * Product Listing Component Example
 *
 * This example demonstrates:
 * - Product grid layout with responsive design
 * - Filtering by category, price range, and search
 * - Sorting options (price, name, rating)
 * - Pagination for large product lists
 * - State management using useState and useEffect
 * - Optimistic UI updates
 *
 * Usage in e-commerce apps: next-shop, nuxt-store, product-showcase, react-marketplace
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

// Type definitions
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  imageUrl: string;
  inStock: boolean;
}

interface FilterState {
  searchQuery: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  sortBy: 'price-asc' | 'price-desc' | 'name' | 'rating';
}

export default function ProductListing() {
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: 'all',
    minPrice: 0,
    maxPrice: 1000,
    sortBy: 'name',
  });

  const itemsPerPage = 12;

  // Simulate fetching products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call
        // const response = await fetch('/api/products');
        // const data = await response.json();

        // Mock data for demonstration
        const mockProducts: Product[] = Array.from({ length: 50 }, (_, i) => ({
          id: `product-${i + 1}`,
          name: `Product ${i + 1}`,
          description: `High-quality product with amazing features ${i + 1}`,
          price: Math.floor(Math.random() * 500) + 10,
          category: ['Electronics', 'Clothing', 'Home', 'Sports'][Math.floor(Math.random() * 4)],
          rating: Math.floor(Math.random() * 5) + 1,
          imageUrl: `/products/product-${i + 1}.jpg`,
          inStock: Math.random() > 0.2,
        }));

        setProducts(mockProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filtered and sorted products using useMemo for performance
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Apply search filter
    if (filters.searchQuery) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (filters.category !== 'all') {
      result = result.filter(product => product.category === filters.category);
    }

    // Apply price range filter
    result = result.filter(
      product => product.price >= filters.minPrice && product.price <= filters.maxPrice
    );

    // Apply sorting
    switch (filters.sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [products, filters]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handler functions
  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAddToCart = (product: Product) => {
    // In a real app, this would update cart state (e.g., Zustand, Redux, Context)
    console.log('Added to cart:', product);
    // Example: cartStore.addItem(product);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Products</h1>
        <p className="text-gray-600">Discover our curated collection of premium products</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search products..."
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Home">Home</option>
              <option value="Sports">Sports</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price: ${filters.minPrice} - ${filters.maxPrice}
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <span>Showing {filteredProducts.length} products</span>
          {filters.searchQuery && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
              Search: {filters.searchQuery}
            </span>
          )}
          {filters.category !== 'all' && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
              {filters.category}
            </span>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {paginatedProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            {/* Product Image */}
            <div className="relative h-48 bg-gray-200">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                Product Image
              </div>
              {!product.inStock && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                  Out of Stock
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>

              {/* Rating */}
              <div className="flex items-center mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < product.rating ? 'text-yellow-400' : 'text-gray-300'}>
                    ★
                  </span>
                ))}
                <span className="text-sm text-gray-600 ml-2">({product.rating})</span>
              </div>

              {/* Price and Category */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {product.category}
                </span>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={() => handleAddToCart(product)}
                disabled={!product.inStock}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  product.inStock
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No products found matching your criteria.</p>
          <button
            onClick={() => setFilters({
              searchQuery: '',
              category: 'all',
              minPrice: 0,
              maxPrice: 1000,
              sortBy: 'name',
            })}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'border hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
