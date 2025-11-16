<template>
  <div>
    <!-- Hero Section -->
    <section class="container mx-auto px-4 py-20 md:py-32">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
          你好，我是開發者
        </h1>
        <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
          全端工程師 | Vue & Nuxt 專家
        </p>
        <p class="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-12">
          熱衷於使用 Vue 生態系打造高品質的網頁應用，擅長前端架構設計與效能優化。
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink
            to="/projects"
            class="inline-flex items-center justify-center px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            查看作品集
            <Icon name="heroicons:arrow-right" class="ml-2 w-5 h-5" />
          </NuxtLink>
          <NuxtLink
            to="/blog"
            class="inline-flex items-center justify-center px-8 py-3 border-2 border-primary-600 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors font-medium"
          >
            閱讀文章
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Skills Section -->
    <section class="bg-white dark:bg-gray-800 py-20">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">
          核心技能
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <SkillCard
            title="前端開發"
            :skills="['Vue 3', 'Nuxt 3', 'TypeScript', 'Tailwind CSS']"
          />
          <SkillCard
            title="狀態管理"
            :skills="['Pinia', 'Vuex', 'Composables', 'VueUse']"
          />
          <SkillCard
            title="工具鏈"
            :skills="['Vite', 'Vitest', 'ESLint', 'Prettier']"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '首頁 | Portfolio',
  meta: [
    { name: 'description', content: '歡迎來到我的個人作品集網站' }
  ]
})
</script>
