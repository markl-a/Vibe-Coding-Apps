<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold mb-8">結帳</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Checkout Form -->
      <div class="lg:col-span-2">
        <form @submit.prevent="handleSubmit" class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-2xl font-bold mb-6">配送資訊</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label class="block text-sm font-medium mb-2">姓名 *</label>
              <input
                v-model="formData.name"
                type="text"
                required
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Email *</label>
              <input
                v-model="formData.email"
                type="email"
                required
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">電話 *</label>
              <input
                v-model="formData.phone"
                type="tel"
                required
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">郵遞區號 *</label>
              <input
                v-model="formData.zipCode"
                type="text"
                required
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium mb-2">城市 *</label>
              <input
                v-model="formData.city"
                type="text"
                required
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium mb-2">地址 *</label>
              <textarea
                v-model="formData.address"
                required
                rows="3"
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <h2 class="text-2xl font-bold mb-6">付款方式</h2>

          <div class="space-y-3 mb-6">
            <label class="flex items-center">
              <input
                v-model="formData.paymentMethod"
                type="radio"
                value="credit"
                class="mr-3"
              />
              信用卡
            </label>
            <label class="flex items-center">
              <input
                v-model="formData.paymentMethod"
                type="radio"
                value="bank"
                class="mr-3"
              />
              銀行轉帳
            </label>
            <label class="flex items-center">
              <input
                v-model="formData.paymentMethod"
                type="radio"
                value="cod"
                class="mr-3"
              />
              貨到付款
            </label>
          </div>

          <button
            type="submit"
            class="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            確認訂單
          </button>
        </form>
      </div>

      <!-- Order Summary -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow-md p-6 sticky top-4">
          <h2 class="text-2xl font-bold mb-6">訂單明細</h2>

          <div class="space-y-3 mb-6">
            <div
              v-for="item in cartStore.items"
              :key="item.id"
              class="flex justify-between text-sm"
            >
              <span>{{ item.name }} × {{ item.quantity }}</span>
              <span>NT$ {{ (item.price * item.quantity).toLocaleString() }}</span>
            </div>
          </div>

          <div class="border-t pt-3 space-y-2 mb-4">
            <div class="flex justify-between">
              <span class="text-gray-600">小計</span>
              <span>NT$ {{ cartStore.totalPrice.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">運費</span>
              <span>NT$ 100</span>
            </div>
            <div class="flex justify-between text-lg font-bold">
              <span>總計</span>
              <span class="text-primary-600">
                NT$ {{ (cartStore.totalPrice + 100).toLocaleString() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'

const cartStore = useCartStore()
const router = useRouter()

const formData = reactive({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  zipCode: '',
  paymentMethod: 'credit',
})

const handleSubmit = () => {
  alert('訂單已送出！感謝您的購買。')
  cartStore.clearCart()
  router.push('/')
}

// Redirect if cart is empty
onMounted(() => {
  if (cartStore.items.length === 0) {
    router.push('/cart')
  }
})
</script>
