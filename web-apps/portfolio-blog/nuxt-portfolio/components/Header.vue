<template>
  <header class="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm">
    <nav class="container mx-auto px-4 py-4">
      <div class="flex justify-between items-center">
        <NuxtLink to="/" class="text-2xl font-bold text-primary-600">
          Portfolio
        </NuxtLink>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex space-x-8">
          <NuxtLink
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            {{ item.name }}
          </NuxtLink>
        </div>

        <!-- Mobile Menu Button -->
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden text-gray-700 dark:text-gray-300"
        >
          <Icon :name="mobileMenuOpen ? 'heroicons:x-mark' : 'heroicons:bars-3'" class="w-6 h-6" />
        </button>
      </div>

      <!-- Mobile Navigation -->
      <div v-if="mobileMenuOpen" class="md:hidden mt-4 pb-4">
        <NuxtLink
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          class="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          @click="mobileMenuOpen = false"
        >
          {{ item.name }}
        </NuxtLink>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const navigation = [
  { name: '首頁', href: '/' },
  { name: '作品集', href: '/projects' },
  { name: '部落格', href: '/blog' },
  { name: '關於我', href: '/about' },
  { name: '聯絡', href: '/contact' },
]

const mobileMenuOpen = ref(false)
</script>
