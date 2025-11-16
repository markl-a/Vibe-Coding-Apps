<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
    <div class="p-6">
      <h3 class="text-xl font-bold mb-2">{{ project.title }}</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        {{ project.description }}
      </p>

      <div class="flex flex-wrap gap-2 mb-4">
        <span
          v-for="tag in project.tags"
          :key="tag"
          class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm rounded-full"
        >
          {{ tag }}
        </span>
      </div>

      <div class="flex gap-4">
        <a
          :href="project.github"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <Icon name="mdi:github" class="w-5 h-5" />
          原始碼
        </a>
        <a
          :href="project.demo"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <Icon name="heroicons:arrow-top-right-on-square" class="w-5 h-5" />
          展示
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  project: {
    id: number
    title: string
    description: string
    tags: string[]
    github: string
    demo: string
  }
}>()
</script>
