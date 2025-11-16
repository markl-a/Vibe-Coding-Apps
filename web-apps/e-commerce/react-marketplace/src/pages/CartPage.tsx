import { Link } from 'react-router-dom'
import { FiTrash2, FiShoppingCart } from 'react-icons/fi'
import { useCartStore } from '@/store/cartStore'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <FiShoppingCart className="w-24 h-24 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold mb-4">購物車是空的</h2>
        <p className="text-gray-600 mb-8">快去挑選喜歡的商品吧！</p>
        <Link
          to="/products"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
        >
          前往商品頁面
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">購物車</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-6 border-b last:border-b-0"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
                  <p className="text-gray-600">NT$ {item.price.toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                  >
                    +
                  </button>
                </div>

                <div className="text-lg font-semibold w-32 text-right">
                  NT$ {(item.price * item.quantity).toLocaleString()}
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-700 p-2"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-2xl font-bold mb-6">訂單摘要</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">小計</span>
                <span>NT$ {getTotalPrice().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">運費</span>
                <span>NT$ 100</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>總計</span>
                <span className="text-primary-600">
                  NT$ {(getTotalPrice() + 100).toLocaleString()}
                </span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="block w-full bg-primary-600 text-white text-center px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              前往結帳
            </Link>

            <Link
              to="/products"
              className="block w-full text-center mt-3 text-primary-600 hover:text-primary-700"
            >
              繼續購物
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
