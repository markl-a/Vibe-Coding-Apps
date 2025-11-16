<template>
  <div class="container mx-auto px-4 py-20 max-w-5xl">
    <div class="text-center mb-16">
      <h1 class="text-4xl md:text-5xl font-bold mb-4">技術部落格</h1>
      <p class="text-xl text-gray-600 dark:text-gray-400">
        分享 Vue 與 Nuxt 的開發經驗與技術見解
      </p>
    </div>

    <div class="space-y-8">
      <article
        v-for="post in posts"
        :key="post.id"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-8"
      >
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 class="text-2xl font-bold mb-2 md:mb-0 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            {{ post.title }}
          </h2>
          <time class="text-sm text-gray-500 dark:text-gray-400">
            {{ post.date }}
          </time>
        </div>

        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ post.excerpt }}
        </p>

        <div class="flex flex-wrap gap-2">
          <span
            v-for="tag in post.tags"
            :key="tag"
            class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm rounded-full"
          >
            {{ tag }}
          </span>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '部落格 | Portfolio',
  meta: [
    { name: 'description', content: '閱讀我的技術文章與開發經驗分享' }
  ]
})

const posts = [
  {
    id: 1,
    title: 'Nuxt 3 完整指南：從入門到精通',
    excerpt: '深入探討 Nuxt 3 的核心特性，包括 Auto Imports、Server Routes 與部署優化。',
    date: '2025-11-16',
    tags: ['Nuxt 3', 'Vue', 'SSR'],
  },
  {
    id: 2,
    title: 'Vue 3 Composition API 最佳實踐',
    excerpt: '分享使用 Composition API 的實戰經驗，包括 composables 設計與狀態管理。',
    date: '2025-11-10',
    tags: ['Vue 3', 'Composition API', 'Best Practices'],
  },
  {
    id: 3,
    title: 'Pinia 狀態管理完整教學',
    excerpt: '從基礎到進階，學習如何使用 Pinia 打造可維護的狀態管理系統。',
    date: '2025-11-05',
    tags: ['Pinia', 'Vue 3', 'State Management'],
  },
  {
    id: 4,
    title: '使用 VueUse 提升開發效率',
    excerpt: '探索 VueUse 提供的實用 composables，讓 Vue 開發更加高效。',
    date: '2025-10-28',
    tags: ['VueUse', 'Vue 3', 'Composables'],
  },
]
</script>
