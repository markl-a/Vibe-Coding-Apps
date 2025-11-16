<template>
  <div class="container mx-auto px-4 py-20 max-w-4xl">
    <div class="text-center mb-16">
      <h1 class="text-4xl md:text-5xl font-bold mb-4">關於我</h1>
      <p class="text-xl text-gray-600 dark:text-gray-400">
        Vue & Nuxt 專業開發者
      </p>
    </div>

    <!-- Introduction -->
    <section class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
      <h2 class="text-2xl font-bold mb-4">自我介紹</h2>
      <div class="space-y-4 text-gray-700 dark:text-gray-300">
        <p>
          你好！我是一位專注於 Vue 生態系的前端工程師，擅長使用 Nuxt 3 打造高效能的網頁應用。
        </p>
        <p>
          我熱愛 Vue 的響應式設計理念與組合式 API，相信優質的程式碼應該是簡潔、可維護且高效能的。
        </p>
        <p>
          除了開發工作，我也積極參與開源社群，分享技術文章，並且持續學習新技術。
        </p>
      </div>
    </section>

    <!-- Skills -->
    <section class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
      <h2 class="text-2xl font-bold mb-6">技能專長</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="skill in skills" :key="skill.name">
          <div class="flex items-center justify-between mb-2">
            <span class="font-semibold">{{ skill.name }}</span>
            <span class="text-sm text-gray-500">{{ skill.level }}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="bg-primary-600 h-2 rounded-full transition-all duration-500"
              :style="{ width: `${skill.level}%` }"
            ></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Experience -->
    <section class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h2 class="text-2xl font-bold mb-6">工作經歷</h2>
      <div class="space-y-6">
        <div
          v-for="(exp, index) in experiences"
          :key="index"
          class="border-l-4 border-primary-600 pl-6 pb-6 last:pb-0"
        >
          <div class="flex flex-col md:flex-row md:justify-between md:items-start mb-2">
            <div>
              <h3 class="text-xl font-bold">{{ exp.title }}</h3>
              <p class="text-primary-600 dark:text-primary-400 font-medium">
                {{ exp.company }}
              </p>
            </div>
            <span class="text-gray-500 dark:text-gray-400 text-sm mt-2 md:mt-0">
              {{ exp.period }}
            </span>
          </div>
          <p class="text-gray-600 dark:text-gray-400">{{ exp.description }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '關於我 | Portfolio',
  meta: [
    { name: 'description', content: '了解更多關於我的背景與技能' }
  ]
})

const skills = [
  { name: 'Vue 3', level: 95 },
  { name: 'Nuxt 3', level: 90 },
  { name: 'TypeScript', level: 85 },
  { name: 'Tailwind CSS', level: 92 },
  { name: 'Pinia', level: 88 },
  { name: 'Vite', level: 85 },
]

const experiences = [
  {
    title: 'Vue 前端工程師',
    company: '科技公司 A',
    period: '2023 - 現在',
    description: '負責使用 Nuxt 3 開發企業級應用，帶領前端團隊進行技術選型與架構設計。',
  },
  {
    title: '前端工程師',
    company: '新創公司 B',
    period: '2021 - 2023',
    description: '使用 Vue 3 開發 SaaS 產品，參與從零到一的產品開發流程。',
  },
  {
    title: '實習工程師',
    company: '軟體公司 C',
    period: '2020 - 2021',
    description: '學習 Vue 生態系，參與前端開發與維護工作。',
  },
]
</script>
