export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stock: number;
  tags: string[];
  specifications: Specification[];
  reviews: Review[];
  createdAt: string;
  isFeatured?: boolean;
  isNew?: boolean;
}

export interface Specification {
  label: string;
  value: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface WishlistItem {
  product: Product;
  addedAt: string;
}

export interface FilterOptions {
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  rating?: number;
  inStockOnly: boolean;
  tags: string[];
}

export type SortOption =
  | 'price-asc'
  | 'price-desc'
  | 'rating-desc'
  | 'newest'
  | 'name-asc';

export interface CheckoutFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Shipping Address
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;

  // Payment Information
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;

  // Additional
  notes?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  shippingInfo: Partial<CheckoutFormData>;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}
