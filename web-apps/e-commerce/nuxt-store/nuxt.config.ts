// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/ui'
  ],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Nuxt Store - 線上商店',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '使用 Nuxt 3 打造的現代化線上商店' }
      ],
    }
  },

  compatibilityDate: '2025-01-01'
})
