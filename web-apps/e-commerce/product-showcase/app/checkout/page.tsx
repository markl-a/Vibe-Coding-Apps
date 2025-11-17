'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { formatPrice } from '@/lib/utils';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Image from 'next/image';

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.getTotal());

  const shipping = total >= 1500 ? 0 : 100;
  const tax = Math.round(total * 0.05);
  const grandTotal = total + shipping + tax;

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items.length, router]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="container py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-8">
          <Link href="/cart" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回購物車
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">結帳</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <CheckoutForm />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Card>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  訂單摘要
                </h2>

                {/* Items */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {item.product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatPrice(item.product.price)} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">小計</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(total)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">運費</span>
                    <span className="font-medium text-gray-900">
                      {shipping === 0 ? '免運費' : formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">稅金</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(tax)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      總計
                    </span>
                    <span className="text-2xl font-bold text-primary-600">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Security */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg
                      className="h-5 w-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <span>安全加密付款</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
