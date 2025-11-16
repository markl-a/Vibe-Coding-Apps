<template>
  <div>
    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
      <div class="container mx-auto px-4">
        <div class="text-center max-w-3xl mx-auto">
          <h1 class="text-5xl font-bold mb-6">
            歡迎來到 Nuxt Store
          </h1>
          <p class="text-xl mb-8">
            探索精選商品，享受無縫購物體驗
          </p>
          <NuxtLink
            to="/products"
            class="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            開始購物
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-16 bg-white">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">
          為什麼選擇我們
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div
            v-for="(feature, index) in features"
            :key="index"
            class="text-center p-6 rounded-lg bg-gray-50 hover:shadow-lg transition-shadow"
          >
            <div class="text-primary-600 text-4xl mb-4">{{ feature.icon }}</div>
            <h3 class="text-xl font-semibold mb-2">{{ feature.title }}</h3>
            <p class="text-gray-600">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories Section -->
    <section class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">熱門分類</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <NuxtLink
            v-for="category in categories"
            :key="category.name"
            :to="`/products?category=${category.name}`"
            class="bg-white p-6 rounded-lg text-center hover:shadow-lg transition-shadow"
          >
            <div class="text-4xl mb-3">{{ category.icon }}</div>
            <h3 class="font-semibold">{{ category.name }}</h3>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 bg-white">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-6">準備開始購物了嗎？</h2>
        <p class="text-xl text-gray-600 mb-8">
          瀏覽我們的商品目錄，找到您喜歡的商品
        </p>
        <NuxtLink
          to="/products"
          class="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          查看所有商品
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const features = [
  {
    icon: '🛍️',
    title: '精選商品',
    description: '嚴選優質商品，確保最佳品質',
  },
  {
    icon: '🚚',
    title: '快速配送',
    description: '24小時內出貨，快速送達',
  },
  {
    icon: '🛡️',
    title: '安全保障',
    description: '30天無條件退換貨保證',
  },
  {
    icon: '💳',
    title: '多元付款',
    description: '支援信用卡、轉帳等多種付款方式',
  },
]

const categories = [
  { name: '電子產品', icon: '📱' },
  { name: '服飾配件', icon: '👕' },
  { name: '生活用品', icon: '🏠' },
  { name: '運動健身', icon: '⚽' },
]
</script>
