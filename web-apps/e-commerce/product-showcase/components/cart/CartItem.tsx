'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus } from 'lucide-react';
import { CartItem as CartItemType } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();

  const handleIncrement = () => {
    if (item.quantity < item.product.stock) {
      updateQuantity(item.product.id, item.quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.product.id, item.quantity - 1);
    }
  };

  const subtotal = item.product.price * item.quantity;

  return (
    <div className="flex gap-4 py-4 border-b border-gray-200">
      {/* Product Image */}
      <Link href={`/product/${item.product.id}`} className="flex-shrink-0">
        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={item.product.images[0]}
            alt={item.product.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/product/${item.product.id}`}
          className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2"
        >
          {item.product.name}
        </Link>
        <p className="text-sm text-gray-500 mt-1">{item.product.category}</p>

        {/* Mobile Price */}
        <div className="mt-2 sm:hidden">
          <p className="text-lg font-semibold text-gray-900">
            {formatPrice(subtotal)}
          </p>
          <p className="text-sm text-gray-500">
            {formatPrice(item.product.price)} × {item.quantity}
          </p>
        </div>

        {/* Quantity Controls (Mobile) */}
        <div className="flex items-center gap-3 mt-3 sm:hidden">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={handleDecrement}
              disabled={item.quantity <= 1}
              className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="減少數量"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
              {item.quantity}
            </span>
            <button
              onClick={handleIncrement}
              disabled={item.quantity >= item.product.stock}
              className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="增加數量"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => removeItem(item.product.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            aria-label="移除商品"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Desktop Controls */}
      <div className="hidden sm:flex items-center gap-8">
        {/* Quantity */}
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button
            onClick={handleDecrement}
            disabled={item.quantity <= 1}
            className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="減少數量"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
            {item.quantity}
          </span>
          <button
            onClick={handleIncrement}
            disabled={item.quantity >= item.product.stock}
            className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="增加數量"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Price */}
        <div className="min-w-[8rem] text-right">
          <p className="text-lg font-semibold text-gray-900">
            {formatPrice(subtotal)}
          </p>
          <p className="text-sm text-gray-500">
            {formatPrice(item.product.price)} × {item.quantity}
          </p>
        </div>

        {/* Remove */}
        <button
          onClick={() => removeItem(item.product.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          aria-label="移除商品"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
