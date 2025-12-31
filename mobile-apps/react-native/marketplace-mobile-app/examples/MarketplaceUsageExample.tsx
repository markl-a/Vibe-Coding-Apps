import React from 'react';
import { View, Text, Image } from 'react-native';

/**
 * React Native Marketplace App 使用範例
 *
 * 展示如何:
 * 1. 管理產品列表
 * 2. 購物車功能
 * 3. 搜尋和篩選
 * 4. 訂單管理
 */

// MARK: - 類型定義

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  description: string;
}

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

// MARK: - 測試數據

export const MarketplaceTestData = {
  // 產品數據
  products: [
    {
      id: '1',
      name: 'iPhone 15 Pro Max',
      price: 1199,
      category: '電子產品',
      image: 'https://via.placeholder.com/300',
      rating: 4.8,
      reviews: 1234,
      inStock: true,
      description: '最新 iPhone 旗艦機型',
    },
    {
      id: '2',
      name: 'MacBook Pro 16"',
      price: 2499,
      category: '電腦',
      image: 'https://via.placeholder.com/300',
      rating: 4.9,
      reviews: 856,
      inStock: true,
      description: '專業級筆記型電腦',
    },
    {
      id: '3',
      name: 'AirPods Pro 2',
      price: 249,
      category: '音訊',
      image: 'https://via.placeholder.com/300',
      rating: 4.7,
      reviews: 2341,
      inStock: true,
      description: '主動降噪真無線耳機',
    },
    {
      id: '4',
      name: 'iPad Air',
      price: 599,
      category: '平板',
      image: 'https://via.placeholder.com/300',
      rating: 4.6,
      reviews: 567,
      inStock: false,
      description: '輕薄強大的平板電腦',
    },
  ],

  // 購物車數據
  cartItems: [
    { productId: '1', quantity: 1, price: 1199 },
    { productId: '3', quantity: 2, price: 249 },
  ],

  // 分類
  categories: [
    { id: '1', name: '電子產品', icon: '📱' },
    { id: '2', name: '電腦', icon: '💻' },
    { id: '3', name: '音訊', icon: '🎧' },
    { id: '4', name: '配件', icon: '⌚' },
  ],
};

// MARK: - 產品卡片組件

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    rating: number;
    inStock: boolean;
  };
  onPress?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  return (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
      <View style={{ aspectRatio: 1, backgroundColor: '#f3f4f6', borderRadius: 8 }} />

      <Text
        style={{
          fontSize: 16,
          fontWeight: '600',
          marginTop: 8,
          marginBottom: 4,
        }}
        numberOfLines={2}>
        {product.name}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ color: '#fbbf24' }}>⭐</Text>
        <Text style={{ fontSize: 14, color: '#666', marginLeft: 4 }}>
          {product.rating}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#22c55e' }}>
          ${product.price}
        </Text>

        <Text
          style={{
            fontSize: 12,
            color: product.inStock ? '#22c55e' : '#ef4444',
            fontWeight: '500',
          }}>
          {product.inStock ? '有貨' : '缺貨'}
        </Text>
      </View>
    </View>
  );
};

// MARK: - 購物車工具

export const CartUtils = {
  // 計算購物車總額
  calculateTotal: (items: Array<{ quantity: number; price: number }>) => {
    return items.reduce((total, item) => total + item.quantity * item.price, 0);
  },

  // 計算商品數量
  getItemCount: (items: Array<{ quantity: number }>) => {
    return items.reduce((count, item) => count + item.quantity, 0);
  },

  // 添加到購物車
  addToCart: (cart: CartItem[], productId: string, price: number): CartItem[] => {
    const existing = cart.find(item => item.productId === productId);
    if (existing) {
      return cart.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    }
    return [...cart, { productId, quantity: 1, price }];
  },

  // 從購物車移除
  removeFromCart: (cart: CartItem[], productId: string): CartItem[] => {
    return cart.filter(item => item.productId !== productId);
  },
};

// MARK: - 搜尋和篩選

export const SearchUtils = {
  // 搜尋產品
  searchProducts: (products: Product[], query: string): Product[] => {
    return products.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase())
    );
  },

  // 按分類篩選
  filterByCategory: (products: Product[], category: string): Product[] => {
    return products.filter(p => p.category === category);
  },

  // 按價格範圍篩選
  filterByPrice: (products: Product[], min: number, max: number): Product[] => {
    return products.filter(p => p.price >= min && p.price <= max);
  },

  // 按評分篩選
  filterByRating: (products: Product[], minRating: number): Product[] => {
    return products.filter(p => p.rating >= minRating);
  },

  // 排序
  sortProducts: (products: Product[], sortBy: 'price' | 'rating' | 'name', order: 'asc' | 'desc' = 'asc'): Product[] => {
    return [...products].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return order === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  },
};

/*
 💡 使用方式:

 1. 顯示產品列表:
 ```tsx
 import { MarketplaceTestData, ProductCard } from './examples/MarketplaceUsageExample';

 const ProductList = () => {
   return (
     <FlatList
       data={MarketplaceTestData.products}
       renderItem={({ item }) => (
         <ProductCard product={item} onPress={() => {}} />
       )}
     />
   );
 };
 ```

 2. 購物車功能:
 ```tsx
 const [cart, setCart] = useState(MarketplaceTestData.cartItems);

 const total = CartUtils.calculateTotal(cart);
 const itemCount = CartUtils.getItemCount(cart);

 const addItem = (productId: string, price: number) => {
   setCart(CartUtils.addToCart(cart, productId, price));
 };
 ```

 3. 搜尋和篩選:
 ```tsx
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedCategory, setSelectedCategory] = useState('');

 const filteredProducts = SearchUtils.searchProducts(
   SearchUtils.filterByCategory(products, selectedCategory),
   searchQuery
 );
 ```

 4. 排序產品:
 ```tsx
 const sortedProducts = SearchUtils.sortProducts(
   products,
   'price',
   'asc'
 );
 ```
 */

export default { MarketplaceTestData, ProductCard, CartUtils, SearchUtils };
