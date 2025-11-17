'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ArrowLeft } from 'lucide-react';
import { useWishlistStore } from '@/store/useWishlistStore';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Button } from '@/components/ui/Button';

export default function WishlistPage() {
  const items = useWishlistStore((state) => state.items);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);

  const products = items.map((item) => item.product);

  if (items.length === 0) {
    return (
      <div className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
            <Heart className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            願望清單是空的
          </h1>
          <p className="text-gray-600 mb-8">
            還沒有收藏任何商品，快去探索吧！
          </p>
          <Link href="/">
            <Button variant="primary" size="lg">
              <ArrowLeft className="h-5 w-5 mr-2" />
              探索產品
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">願望清單</h1>
            <p className="text-gray-600">
              共 {items.length} 項商品
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm('確定要清空願望清單嗎？')) {
                clearWishlist();
              }
            }}
          >
            清空願望清單
          </Button>
        </div>

        {/* Product Grid */}
        <ProductGrid products={products} />

        {/* Continue Shopping */}
        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline" size="lg">
              <ArrowLeft className="h-5 w-5 mr-2" />
              繼續探索
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
