<template>
  <header class="bg-white shadow-md sticky top-0 z-50">
    <nav class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <NuxtLink to="/" class="text-2xl font-bold text-primary-600">
          Nuxt Store
        </NuxtLink>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-8">
          <NuxtLink to="/" class="hover:text-primary-600 transition-colors">
            首頁
          </NuxtLink>
          <NuxtLink to="/products" class="hover:text-primary-600 transition-colors">
            商品
          </NuxtLink>
          <NuxtLink to="/cart" class="relative hover:text-primary-600 transition-colors">
            <span class="text-2xl">🛒</span>
            <span
              v-if="cartStore.totalItems > 0"
              class="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            >
              {{ cartStore.totalItems }}
            </span>
          </NuxtLink>
        </div>

        <!-- Mobile Menu Button -->
        <button
          @click="isMenuOpen = !isMenuOpen"
          class="md:hidden p-2"
        >
          <span class="text-2xl">☰</span>
        </button>
      </div>

      <!-- Mobile Navigation -->
      <div v-if="isMenuOpen" class="md:hidden mt-4 space-y-3">
        <NuxtLink
          to="/"
          class="block py-2 hover:text-primary-600 transition-colors"
          @click="isMenuOpen = false"
        >
          首頁
        </NuxtLink>
        <NuxtLink
          to="/products"
          class="block py-2 hover:text-primary-600 transition-colors"
          @click="isMenuOpen = false"
        >
          商品
        </NuxtLink>
        <NuxtLink
          to="/cart"
          class="block py-2 hover:text-primary-600 transition-colors"
          @click="isMenuOpen = false"
        >
          購物車 ({{ cartStore.totalItems }})
        </NuxtLink>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'

const cartStore = useCartStore()
const isMenuOpen = ref(false)
</script>
