<template>
  <div class="container mx-auto px-4 py-20 max-w-5xl">
    <div class="text-center mb-16">
      <h1 class="text-4xl md:text-5xl font-bold mb-4">聯絡我</h1>
      <p class="text-xl text-gray-600 dark:text-gray-400">
        有任何問題或合作機會嗎？歡迎與我聯繫！
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <!-- Contact Form -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
        <h2 class="text-2xl font-bold mb-6">發送訊息</h2>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="name" class="block text-sm font-medium mb-2">
              姓名
            </label>
            <input
              v-model="formData.name"
              type="text"
              id="name"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="您的姓名"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              v-model="formData.email"
              type="email"
              id="email"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label for="subject" class="block text-sm font-medium mb-2">
              主旨
            </label>
            <input
              v-model="formData.subject"
              type="text"
              id="subject"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="訊息主旨"
            />
          </div>

          <div>
            <label for="message" class="block text-sm font-medium mb-2">
              訊息內容
            </label>
            <textarea
              v-model="formData.message"
              id="message"
              required
              rows="6"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              placeholder="請輸入您的訊息..."
            />
          </div>

          <button
            type="submit"
            :disabled="status === 'sending'"
            class="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {{ status === 'sending' ? '發送中...' : '發送訊息' }}
          </button>

          <div
            v-if="status === 'success'"
            class="p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg"
          >
            訊息已成功發送！我會盡快回覆您。
          </div>
        </form>
      </div>

      <!-- Contact Info -->
      <div class="space-y-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 class="text-2xl font-bold mb-6">聯絡資訊</h2>
          <div class="flex items-center gap-4">
            <Icon name="heroicons:envelope" class="text-2xl text-primary-600 dark:text-primary-400" />
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <a
                href="mailto:your.email@example.com"
                class="text-lg hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                your.email@example.com
              </a>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 class="text-2xl font-bold mb-6">社群媒體</h2>
          <div class="space-y-4">
            <a
              v-for="social in socials"
              :key="social.name"
              :href="social.href"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Icon :name="social.icon" class="text-2xl" />
              <span>{{ social.name }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

useHead({
  title: '聯絡我 | Portfolio',
  meta: [
    { name: 'description', content: '透過表單或社群媒體與我聯繫' }
  ]
})

const formData = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})

const status = ref<'idle' | 'sending' | 'success' | 'error'>('idle')

const socials = [
  { name: 'GitHub', icon: 'mdi:github', href: 'https://github.com' },
  { name: 'LinkedIn', icon: 'mdi:linkedin', href: 'https://linkedin.com' },
  { name: 'Twitter', icon: 'mdi:twitter', href: 'https://twitter.com' },
]

const handleSubmit = () => {
  status.value = 'sending'

  // 模擬發送表單
  setTimeout(() => {
    status.value = 'success'
    Object.assign(formData, { name: '', email: '', subject: '', message: '' })
    setTimeout(() => {
      status.value = 'idle'
    }, 3000)
  }, 1500)
}
</script>
