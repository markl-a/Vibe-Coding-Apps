'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star, Package, Truck, Shield } from 'lucide-react';
import { mockProducts } from '@/lib/mockData';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { formatPrice, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { Card } from '@/components/ui/Card';
import { ImageGallery } from '@/components/products/ImageGallery';
import { useState } from 'react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  const product = mockProducts.find((p) => p.id === params.id);

  const addToCart = useCartStore((state) => state.addItem);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">找不到產品</h1>
        <Button onClick={() => router.push('/')}>返回首頁</Button>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    alert(`已將 ${quantity} 件商品加入購物車`);
  };

  const handleToggleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <div className="container py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div>
            <ImageGallery images={product.images} productName={product.name} />
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-start gap-3 mb-3">
              <Badge variant="secondary">{product.category}</Badge>
              {product.isNew && <Badge variant="success">新品</Badge>}
              {product.isFeatured && <Badge variant="primary">精選</Badge>}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-6">
              <Rating rating={product.rating} size="lg" />
              <span className="text-gray-600">
                ({product.reviewCount} 則評價)
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-primary-600">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-2xl text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              {product.originalPrice && (
                <p className="text-green-600 font-medium">
                  節省{' '}
                  {formatPrice(product.originalPrice - product.price)}
                </p>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.inStock ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Package className="h-5 w-5" />
                  <span className="font-medium">
                    庫存充足（剩餘 {product.stock} 件）
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <Package className="h-5 w-5" />
                  <span className="font-medium">暫時缺貨</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                產品描述
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            {product.inStock && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  數量
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="text-lg font-medium min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mb-8">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                加入購物車
              </Button>
              <Button
                variant={inWishlist ? 'danger' : 'outline'}
                size="lg"
                onClick={handleToggleWishlist}
              >
                <Heart
                  className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`}
                />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Truck className="h-6 w-6 text-primary-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">快速配送</p>
                  <p className="text-sm text-gray-600">3-5 個工作天</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-primary-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">品質保證</p>
                  <p className="text-sm text-gray-600">原廠保固</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="h-6 w-6 text-primary-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">7 天鑑賞期</p>
                  <p className="text-sm text-gray-600">無條件退換貨</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        {product.specifications.length > 0 && (
          <Card className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">產品規格</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.specifications.map((spec, index) => (
                <div
                  key={index}
                  className="flex py-3 border-b border-gray-200 last:border-0"
                >
                  <dt className="font-medium text-gray-900 w-32 flex-shrink-0">
                    {spec.label}
                  </dt>
                  <dd className="text-gray-600">{spec.value}</dd>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Reviews */}
        {product.reviews.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">顧客評價</h2>
              <div className="flex items-center gap-2">
                <Rating rating={product.rating} size="lg" />
                <span className="text-gray-600">
                  ({product.reviewCount} 則評價)
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {product.reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {review.userName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {review.userName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(review.date)}
                        </p>
                      </div>
                    </div>
                    <Rating rating={review.rating} size="sm" showNumber={false} />
                  </div>
                  <p className="text-gray-600 mb-2">{review.comment}</p>
                  <button className="text-sm text-gray-500 hover:text-gray-700">
                    👍 有幫助 ({review.helpful})
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
