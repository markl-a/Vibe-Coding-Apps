/**
 * Shopping Cart Component Example
 *
 * This example demonstrates:
 * - Cart state management with quantity updates
 * - Item addition, removal, and modification
 * - Real-time price calculations (subtotal, tax, shipping, total)
 * - Discount/promo code application
 * - Local storage persistence
 * - Optimistic UI updates
 *
 * Usage in e-commerce apps: next-shop, nuxt-store, product-showcase, react-marketplace
 */

'use client';

import { useState, useEffect, useMemo } from 'react';

// Type definitions
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  variant?: string;
  size?: string;
}

interface PromoCode {
  code: string;
  discount: number; // percentage
  isValid: boolean;
}

export default function ShoppingCart() {
  // State management
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Constants
  const TAX_RATE = 0.08; // 8% tax
  const FREE_SHIPPING_THRESHOLD = 100;
  const SHIPPING_COST = 10;

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('shopping-cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('shopping-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Calculate totals using useMemo for performance
  const calculations = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = appliedPromo ? (subtotal * appliedPromo.discount) / 100 : 0;
    const discountedSubtotal = subtotal - discount;
    const shipping = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const tax = discountedSubtotal * TAX_RATE;
    const total = discountedSubtotal + tax + shipping;

    return {
      subtotal,
      discount,
      discountedSubtotal,
      shipping,
      tax,
      total,
    };
  }, [cartItems, appliedPromo]);

  // Handler functions
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setCartItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      setCartItems([]);
      setAppliedPromo(null);
    }
  };

  const applyPromoCode = () => {
    // Simulate promo code validation
    const validCodes: Record<string, number> = {
      'SAVE10': 10,
      'SAVE20': 20,
      'WELCOME': 15,
    };

    const discount = validCodes[promoCode.toUpperCase()];
    if (discount) {
      setAppliedPromo({
        code: promoCode.toUpperCase(),
        discount,
        isValid: true,
      });
      alert(`Promo code applied! You saved ${discount}%`);
    } else {
      alert('Invalid promo code');
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      // Simulate checkout API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real app, this would call your checkout API
      // const response = await fetch('/api/checkout', {
      //   method: 'POST',
      //   body: JSON.stringify({ items: cartItems, total: calculations.total }),
      // });

      alert('Order placed successfully!');
      setCartItems([]);
      setAppliedPromo(null);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Demo function to add sample items (remove in production)
  const addSampleItems = () => {
    const sampleItems: CartItem[] = [
      {
        id: '1',
        name: 'Premium Wireless Headphones',
        price: 199.99,
        quantity: 1,
        imageUrl: '/products/headphones.jpg',
        variant: 'Black',
      },
      {
        id: '2',
        name: 'Smart Watch Pro',
        price: 299.99,
        quantity: 2,
        imageUrl: '/products/watch.jpg',
        variant: 'Silver',
        size: '42mm',
      },
    ];
    setCartItems(sampleItems);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          // Empty Cart State
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to get started!</p>
            <div className="space-x-4">
              <a
                href="/products"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continue Shopping
              </a>
              <button
                onClick={addSampleItems}
                className="inline-block px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Add Sample Items (Demo)
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md p-6 flex items-center gap-4"
                >
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400 text-xs">Image</span>
                  </div>

                  {/* Product Details */}
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    {item.variant && (
                      <p className="text-sm text-gray-600">Variant: {item.variant}</p>
                    )}
                    {item.size && (
                      <p className="text-sm text-gray-600">Size: {item.size}</p>
                    )}
                    <p className="text-lg font-bold text-gray-900 mt-2">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-700 p-2"
                    title="Remove item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

                {/* Promo Code */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promo Code
                  </label>
                  {appliedPromo ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                      <span className="text-green-700 font-medium">{appliedPromo.code}</span>
                      <button
                        onClick={removePromoCode}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter code"
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={applyPromoCode}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Try: SAVE10, SAVE20, or WELCOME
                  </p>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 py-4 border-t border-b border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>${calculations.subtotal.toFixed(2)}</span>
                  </div>

                  {appliedPromo && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedPromo.discount}%)</span>
                      <span>-${calculations.discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>
                      {calculations.shipping === 0 ? (
                        <span className="text-green-600 font-medium">FREE</span>
                      ) : (
                        `$${calculations.shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  {calculations.discountedSubtotal < FREE_SHIPPING_THRESHOLD && (
                    <p className="text-xs text-gray-500">
                      Add ${(FREE_SHIPPING_THRESHOLD - calculations.discountedSubtotal).toFixed(2)} more for free shipping
                    </p>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
                    <span>${calculations.tax.toFixed(2)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between text-xl font-bold text-gray-900 mt-4 mb-6">
                  <span>Total</span>
                  <span>${calculations.total.toFixed(2)}</span>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isCheckingOut ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </span>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </button>

                {/* Security Badge */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    🔒 Secure checkout powered by Stripe
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
