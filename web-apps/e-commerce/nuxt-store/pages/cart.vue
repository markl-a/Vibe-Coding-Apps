<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold mb-8">購物車</h1>

    <!-- Empty Cart -->
    <div v-if="cartStore.items.length === 0" class="text-center py-16">
      <div class="text-6xl mb-4">🛒</div>
      <h2 class="text-2xl font-bold mb-4">購物車是空的</h2>
      <p class="text-gray-600 mb-8">快去挑選喜歡的商品吧！</p>
      <NuxtLink
        to="/products"
        class="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
      >
        前往商品頁面
      </NuxtLink>
    </div>

    <!-- Cart Items -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2">
        <div class="bg-white rounded-lg shadow-md">
          <div
            v-for="item in cartStore.items"
            :key="item.id"
            class="flex items-center gap-4 p-6 border-b last:border-b-0"
          >
            <div class="flex-1">
              <h3 class="text-lg font-semibold mb-1">{{ item.name }}</h3>
              <p class="text-gray-600">NT$ {{ item.price.toLocaleString() }}</p>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="cartStore.updateQuantity(item.id, Math.max(1, item.quantity - 1))"
                class="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                -
              </button>
              <span class="w-12 text-center">{{ item.quantity }}</span>
              <button
                @click="cartStore.updateQuantity(item.id, item.quantity + 1)"
                class="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                +
              </button>
            </div>

            <div class="text-lg font-semibold w-32 text-right">
              NT$ {{ (item.price * item.quantity).toLocaleString() }}
            </div>

            <button
              @click="cartStore.removeItem(item.id)"
              class="text-red-600 hover:text-red-700 p-2"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow-md p-6 sticky top-4">
          <h2 class="text-2xl font-bold mb-6">訂單摘要</h2>

          <div class="space-y-3 mb-6">
            <div class="flex justify-between">
              <span class="text-gray-600">小計</span>
              <span>NT$ {{ cartStore.totalPrice.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">運費</span>
              <span>NT$ 100</span>
            </div>
            <div class="border-t pt-3 flex justify-between text-lg font-bold">
              <span>總計</span>
              <span class="text-primary-600">
                NT$ {{ (cartStore.totalPrice + 100).toLocaleString() }}
              </span>
            </div>
          </div>

          <NuxtLink
            to="/checkout"
            class="block w-full bg-primary-600 text-white text-center px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            前往結帳
          </NuxtLink>

          <NuxtLink
            to="/products"
            class="block w-full text-center mt-3 text-primary-600 hover:text-primary-700"
          >
            繼續購物
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'

const cartStore = useCartStore()
</script>
