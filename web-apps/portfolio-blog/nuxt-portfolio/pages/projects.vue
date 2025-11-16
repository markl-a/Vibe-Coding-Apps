<template>
  <div class="container mx-auto px-4 py-20">
    <div class="text-center mb-16">
      <h1 class="text-4xl md:text-5xl font-bold mb-4">作品集</h1>
      <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        使用 Vue 與 Nuxt 打造的專案作品
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
      <ProjectCard
        v-for="project in projects"
        :key="project.id"
        :project="project"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '作品集 | Portfolio',
  meta: [
    { name: 'description', content: '查看我的專案作品集' }
  ]
})

const projects = [
  {
    id: 1,
    title: 'Vue 電商平台',
    description: '使用 Nuxt 3 打造的全功能電商網站，包含購物車、結帳與訂單管理。',
    tags: ['Nuxt 3', 'Vue 3', 'Pinia', 'Tailwind CSS'],
    github: 'https://github.com',
    demo: 'https://example.com',
  },
  {
    id: 2,
    title: '即時聊天應用',
    description: '基於 WebSocket 的即時通訊應用，支援群組聊天與檔案傳輸。',
    tags: ['Vue 3', 'Socket.io', 'Express', 'MongoDB'],
    github: 'https://github.com',
    demo: 'https://example.com',
  },
  {
    id: 3,
    title: '專案管理工具',
    description: '團隊協作平台，包含看板、甘特圖與任務追蹤功能。',
    tags: ['Nuxt 3', 'TypeScript', 'Supabase'],
    github: 'https://github.com',
    demo: 'https://example.com',
  },
  {
    id: 4,
    title: 'CMS 內容管理',
    description: '無頭 CMS 系統，支援多語言與版本控制。',
    tags: ['Nuxt 3', 'Nuxt Content', 'Markdown'],
    github: 'https://github.com',
    demo: 'https://example.com',
  },
  {
    id: 5,
    title: '數據視覺化儀表板',
    description: '企業級數據分析平台，提供豐富的圖表與報表功能。',
    tags: ['Vue 3', 'Chart.js', 'D3.js'],
    github: 'https://github.com',
    demo: 'https://example.com',
  },
  {
    id: 6,
    title: '健身追蹤 App',
    description: '記錄運動數據、設定目標與追蹤進度的健身應用。',
    tags: ['Nuxt 3', 'PWA', 'IndexedDB'],
    github: 'https://github.com',
    demo: 'https://example.com',
  },
]
</script>
