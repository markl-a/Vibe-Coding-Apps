<template>
  <div class="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
    <h3 class="text-xl font-semibold mb-4 text-primary-600 dark:text-primary-400">
      {{ title }}
    </h3>
    <ul class="space-y-2">
      <li
        v-for="skill in skills"
        :key="skill"
        class="text-gray-700 dark:text-gray-300 flex items-center"
      >
        <span class="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
        {{ skill }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  skills: string[]
}>()
</script>
