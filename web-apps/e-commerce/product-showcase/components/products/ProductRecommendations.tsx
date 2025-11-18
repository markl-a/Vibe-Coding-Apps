'use client';

import { Product } from '@/types';
import ProductCard from './ProductCard';
import { Sparkles, TrendingUp, ShoppingBag, Zap } from 'lucide-react';

interface ProductRecommendationsProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  type?: 'ai' | 'similar' | 'trending' | 'bundle';
}

const iconMap = {
  ai: Sparkles,
  similar: ShoppingBag,
  trending: TrendingUp,
  bundle: Zap,
};

const defaultTitles = {
  ai: 'AI 為你推薦',
  similar: '相似商品',
  trending: '熱門商品',
  bundle: '經常一起購買',
};

const defaultSubtitles = {
  ai: '基於你的瀏覽記錄和偏好智能推薦',
  similar: '與此商品相似的其他選擇',
  trending: '最受歡迎的熱賣商品',
  bundle: '其他顧客也購買了這些商品',
};

export default function ProductRecommendations({
  products,
  title,
  subtitle,
  type = 'ai',
}: ProductRecommendationsProps) {
  if (!products || products.length === 0) {
    return null;
  }

  const Icon = iconMap[type];
  const displayTitle = title || defaultTitles[type];
  const displaySubtitle = subtitle || defaultSubtitles[type];

  return (
    <section className="py-12 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {displayTitle}
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {displaySubtitle}
          </p>
        </div>

        {/* AI Badge */}
        {type === 'ai' && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md border border-purple-200 dark:border-purple-800">
              <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                AI 智能推薦系統
              </span>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="transform transition-all duration-300 hover:scale-105"
              style={{
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
              }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* View More Button */}
        {products.length >= 4 && (
          <div className="text-center mt-8">
            <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl">
              查看更多推薦
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
