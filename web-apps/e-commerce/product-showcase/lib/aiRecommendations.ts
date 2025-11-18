import { Product } from '@/types';

/**
 * AI-powered Product Recommendation Engine
 * Uses collaborative filtering and content-based filtering algorithms
 */

interface RecommendationScore {
  productId: string;
  score: number;
}

/**
 * Calculate similarity between two products based on their attributes
 */
function calculateSimilarity(product1: Product, product2: Product): number {
  let score = 0;

  // Category match (40% weight)
  if (product1.category === product2.category) {
    score += 0.4;
  }

  // Price similarity (20% weight)
  const priceDiff = Math.abs(product1.price - product2.price);
  const avgPrice = (product1.price + product2.price) / 2;
  const priceSimilarity = 1 - Math.min(priceDiff / avgPrice, 1);
  score += priceSimilarity * 0.2;

  // Tag overlap (30% weight)
  if (product1.tags && product2.tags) {
    const tags1 = new Set(product1.tags);
    const tags2 = new Set(product2.tags);
    const intersection = new Set([...tags1].filter(x => tags2.has(x)));
    const union = new Set([...tags1, ...tags2]);
    const jaccardSimilarity = intersection.size / union.size;
    score += jaccardSimilarity * 0.3;
  }

  // Rating similarity (10% weight)
  if (product1.rating && product2.rating) {
    const ratingDiff = Math.abs(product1.rating - product2.rating);
    const ratingSimilarity = 1 - (ratingDiff / 5);
    score += ratingSimilarity * 0.1;
  }

  return score;
}

/**
 * Get content-based recommendations
 * Recommends products similar to the given product
 */
export function getContentBasedRecommendations(
  product: Product,
  allProducts: Product[],
  limit: number = 4
): Product[] {
  const scores: RecommendationScore[] = allProducts
    .filter(p => p.id !== product.id)
    .map(p => ({
      productId: p.id,
      score: calculateSimilarity(product, p)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scores
    .map(s => allProducts.find(p => p.id === s.productId))
    .filter((p): p is Product => p !== undefined);
}

/**
 * Get collaborative filtering recommendations
 * Based on "users who viewed this also viewed"
 */
export function getCollaborativeRecommendations(
  product: Product,
  allProducts: Product[],
  userHistory: string[] = [],
  limit: number = 4
): Product[] {
  // Simulate collaborative filtering using category and tags
  const categoryProducts = allProducts.filter(
    p => p.id !== product.id && p.category === product.category
  );

  const tagProducts = allProducts.filter(
    p => p.id !== product.id &&
    p.tags?.some(tag => product.tags?.includes(tag))
  );

  // Combine and deduplicate
  const combinedIds = new Set([
    ...categoryProducts.map(p => p.id),
    ...tagProducts.map(p => p.id)
  ]);

  const recommendations = Array.from(combinedIds)
    .map(id => allProducts.find(p => p.id === id))
    .filter((p): p is Product => p !== undefined)
    .filter(p => !userHistory.includes(p.id))
    .sort((a, b) => (b.rating || 0) * (b.reviewCount || 0) - (a.rating || 0) * (a.reviewCount || 0))
    .slice(0, limit);

  return recommendations;
}

/**
 * Get trending products based on ratings and reviews
 */
export function getTrendingProducts(
  allProducts: Product[],
  limit: number = 6
): Product[] {
  return allProducts
    .filter(p => p.rating && p.reviewCount)
    .map(p => ({
      product: p,
      trendScore: (p.rating || 0) * Math.log10((p.reviewCount || 0) + 1)
    }))
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, limit)
    .map(item => item.product);
}

/**
 * Get personalized recommendations based on user behavior
 */
export function getPersonalizedRecommendations(
  allProducts: Product[],
  viewedProducts: Product[],
  cartItems: Product[],
  wishlistItems: Product[],
  limit: number = 8
): Product[] {
  const viewedIds = new Set(viewedProducts.map(p => p.id));
  const cartIds = new Set(cartItems.map(p => p.id));
  const wishlistIds = new Set(wishlistItems.map(p => p.id));

  // Combine all user interactions
  const userProducts = [...viewedProducts, ...cartItems, ...wishlistItems];

  // Get recommendations for each product user interacted with
  const allRecommendations: { product: Product; score: number }[] = [];

  userProducts.forEach(userProduct => {
    const recommendations = getContentBasedRecommendations(userProduct, allProducts, 3);
    recommendations.forEach((rec, index) => {
      // Higher score for products from cart/wishlist
      const baseScore = 1 / (index + 1);
      const multiplier = cartIds.has(userProduct.id) ? 2 :
                        wishlistIds.has(userProduct.id) ? 1.5 : 1;

      const existingRec = allRecommendations.find(r => r.product.id === rec.id);
      if (existingRec) {
        existingRec.score += baseScore * multiplier;
      } else {
        allRecommendations.push({ product: rec, score: baseScore * multiplier });
      }
    });
  });

  // Filter out products user already interacted with
  return allRecommendations
    .filter(r => !viewedIds.has(r.product.id) &&
                 !cartIds.has(r.product.id) &&
                 !wishlistIds.has(r.product.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => r.product);
}

/**
 * Get "Frequently Bought Together" recommendations
 */
export function getFrequentlyBoughtTogether(
  product: Product,
  allProducts: Product[],
  limit: number = 3
): Product[] {
  // Find complementary products (different category but related)
  const complementaryCategories = getComplementaryCategories(product.category);

  return allProducts
    .filter(p =>
      p.id !== product.id &&
      complementaryCategories.includes(p.category)
    )
    .filter(p => {
      // Price range should be reasonable (not too expensive compared to main product)
      return p.price <= product.price * 0.5;
    })
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, limit);
}

/**
 * Helper function to get complementary product categories
 */
function getComplementaryCategories(category: string): string[] {
  const complementaryMap: Record<string, string[]> = {
    '智慧型手機': ['穿戴裝置', '音訊設備', '電腦周邊'],
    '筆記型電腦': ['電腦周邊', '辦公家具'],
    '音訊設備': ['智慧型手機', '穿戴裝置'],
    '相機': ['電腦周邊', '筆記型電腦'],
    '遊戲主機': ['電視', '音訊設備'],
    '電視': ['遊戲主機', '音訊設備'],
    '穿戴裝置': ['智慧型手機', '音訊設備'],
    '電腦周邊': ['筆記型電腦', '辦公家具'],
    '無人機': ['相機', '電腦周邊'],
  };

  return complementaryMap[category] || [];
}

/**
 * Get smart search recommendations based on query
 */
export function getSearchRecommendations(
  query: string,
  allProducts: Product[],
  limit: number = 10
): Product[] {
  const lowerQuery = query.toLowerCase();

  return allProducts
    .map(product => {
      let score = 0;

      // Name match (highest priority)
      if (product.name.toLowerCase().includes(lowerQuery)) {
        score += 10;
      }

      // Category match
      if (product.category.toLowerCase().includes(lowerQuery)) {
        score += 5;
      }

      // Description match
      if (product.description?.toLowerCase().includes(lowerQuery)) {
        score += 3;
      }

      // Tags match
      if (product.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        score += 7;
      }

      // Boost score for popular products
      if (product.isFeatured) score += 2;
      if (product.isNew) score += 1;

      return { product, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.product);
}

/**
 * Get price-based smart recommendations
 * Suggests products in similar price range
 */
export function getPriceBasedRecommendations(
  pricePoint: number,
  allProducts: Product[],
  categoryFilter?: string,
  limit: number = 6
): Product[] {
  const tolerance = 0.3; // 30% price tolerance
  const minPrice = pricePoint * (1 - tolerance);
  const maxPrice = pricePoint * (1 + tolerance);

  return allProducts
    .filter(p => {
      const inPriceRange = p.price >= minPrice && p.price <= maxPrice;
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      return inPriceRange && matchesCategory;
    })
    .sort((a, b) => {
      // Prefer products closer to the price point
      const aDiff = Math.abs(a.price - pricePoint);
      const bDiff = Math.abs(b.price - pricePoint);
      return aDiff - bDiff;
    })
    .slice(0, limit);
}
