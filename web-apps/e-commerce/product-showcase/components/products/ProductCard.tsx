'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Rating } from '@/components/ui/Rating';
import { Card } from '@/components/ui/Card';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const addToCart = useCartStore((state) => state.addItem);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.price)
    : 0;

  return (
    <Link href={`/product/${product.id}`}>
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
      >
        <Card padding="none" className="overflow-hidden group cursor-pointer h-full flex flex-col">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-gray-100">
            <Image
              src={imageError ? '/placeholder.png' : product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.isNew && <Badge variant="success">新品</Badge>}
              {discount > 0 && <Badge variant="danger">-{discount}%</Badge>}
              {!product.inStock && <Badge variant="secondary">缺貨</Badge>}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={handleToggleWishlist}
              className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
              aria-label={inWishlist ? '從願望清單移除' : '加入願望清單'}
            >
              <Heart
                className={`h-5 w-5 ${
                  inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'
                }`}
              />
            </button>

            {/* Quick View */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-center gap-2 text-white text-sm">
                <Eye className="h-4 w-4" />
                <span>快速查看</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col flex-1">
            {/* Category */}
            <p className="text-xs text-gray-500 mb-1">{product.category}</p>

            {/* Title */}
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="mb-3">
              <Rating rating={product.rating} size="sm" />
              <span className="text-xs text-gray-500 ml-2">
                ({product.reviewCount} 評價)
              </span>
            </div>

            {/* Price */}
            <div className="mb-3 mt-auto">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              variant="primary"
              size="sm"
              className="w-full"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {product.inStock ? '加入購物車' : '暫時缺貨'}
            </Button>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
