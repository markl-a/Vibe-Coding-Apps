'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { Button } from '@/components/ui/Button';

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  if (items.length === 0) {
    return (
      <div className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
            <ShoppingBag className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            購物車是空的
          </h1>
          <p className="text-gray-600 mb-8">
            還沒有添加任何商品，快去選購吧！
          </p>
          <Link href="/">
            <Button variant="primary" size="lg">
              <ArrowLeft className="h-5 w-5 mr-2" />
              開始購物
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">購物車</h1>
            <p className="text-gray-600">
              共 {items.length} 項商品
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm('確定要清空購物車嗎？')) {
                clearCart();
              }
            }}
          >
            清空購物車
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="space-y-0">
                {items.map((item) => (
                  <CartItem key={item.product.id} item={item} />
                ))}
              </div>
            </div>

            {/* Continue Shopping */}
            <Link href="/" className="inline-block mt-6">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                繼續購物
              </Button>
            </Link>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
