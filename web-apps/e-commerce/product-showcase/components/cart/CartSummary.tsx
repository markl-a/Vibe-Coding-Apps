'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function CartSummary() {
  const total = useCartStore((state) => state.getTotal());
  const itemCount = useCartStore((state) => state.getItemCount());

  const shipping = total > 0 ? (total >= 1500 ? 0 : 100) : 0;
  const tax = Math.round(total * 0.05);
  const grandTotal = total + shipping + tax;

  return (
    <Card className="sticky top-20">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">訂單摘要</h2>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">商品總計 ({itemCount} 件)</span>
          <span className="font-medium text-gray-900">{formatPrice(total)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">運費</span>
          <span className="font-medium text-gray-900">
            {shipping === 0 ? '免運費' : formatPrice(shipping)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">稅金 (5%)</span>
          <span className="font-medium text-gray-900">{formatPrice(tax)}</span>
        </div>

        {total > 0 && total < 1500 && (
          <div className="text-xs text-primary-600 bg-primary-50 p-2 rounded">
            再購買 {formatPrice(1500 - total)} 即可享免運費
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4 mb-4">
        <div className="flex justify-between">
          <span className="text-lg font-semibold text-gray-900">總計</span>
          <span className="text-2xl font-bold text-primary-600">
            {formatPrice(grandTotal)}
          </span>
        </div>
      </div>

      <Link href="/checkout">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={total === 0}
        >
          前往結帳
        </Button>
      </Link>

      <Link href="/">
        <Button variant="outline" size="lg" className="w-full mt-3">
          繼續購物
        </Button>
      </Link>

      {/* Features */}
      <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
        <div className="flex items-start gap-3 text-sm text-gray-600">
          <svg
            className="h-5 w-5 text-green-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>滿 NT$1,500 享免運費</span>
        </div>
        <div className="flex items-start gap-3 text-sm text-gray-600">
          <svg
            className="h-5 w-5 text-green-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>7 天鑑賞期</span>
        </div>
        <div className="flex items-start gap-3 text-sm text-gray-600">
          <svg
            className="h-5 w-5 text-green-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>安全付款保障</span>
        </div>
      </div>
    </Card>
  );
}
