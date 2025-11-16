<template>
  <footer class="bg-gray-900 text-white py-12 mt-20">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <!-- About -->
        <div>
          <h3 class="text-xl font-bold mb-4">Portfolio</h3>
          <p class="text-gray-400">
            全端工程師，專注於使用 Vue 與 Nuxt 打造現代化網頁應用。
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="text-xl font-bold mb-4">快速連結</h3>
          <ul class="space-y-2">
            <li v-for="link in links" :key="link.href">
              <NuxtLink
                :to="link.href"
                class="text-gray-400 hover:text-primary-400 transition-colors"
              >
                {{ link.name }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Social -->
        <div>
          <h3 class="text-xl font-bold mb-4">社群連結</h3>
          <div class="flex space-x-4">
            <a
              v-for="social in socials"
              :key="social.name"
              :href="social.href"
              target="_blank"
              rel="noopener noreferrer"
              class="text-gray-400 hover:text-primary-400 transition-colors"
            >
              <Icon :name="social.icon" class="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>

      <div class="border-t border-gray-800 pt-8 text-center text-gray-400">
        <p>&copy; {{ currentYear }} Portfolio. All rights reserved.</p>
        <p class="mt-2">Built with Nuxt 3 + Vue 3 + Tailwind CSS</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()

const links = [
  { name: '作品集', href: '/projects' },
  { name: '部落格', href: '/blog' },
  { name: '關於我', href: '/about' },
  { name: '聯絡我', href: '/contact' },
]

const socials = [
  { name: 'GitHub', icon: 'mdi:github', href: 'https://github.com' },
  { name: 'LinkedIn', icon: 'mdi:linkedin', href: 'https://linkedin.com' },
  { name: 'Twitter', icon: 'mdi:twitter', href: 'https://twitter.com' },
]
</script>
