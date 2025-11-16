<template>
  <footer class="bg-gray-900 text-white mt-auto">
    <div class="container mx-auto px-4 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- About -->
        <div>
          <h3 class="text-xl font-bold mb-4">Nuxt Store</h3>
          <p class="text-gray-400">
            提供最優質的商品與服務，打造最佳的購物體驗。
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="text-lg font-semibold mb-4">快速連結</h4>
          <ul class="space-y-2 text-gray-400">
            <li>
              <NuxtLink to="/products" class="hover:text-white transition-colors">
                商品列表
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/cart" class="hover:text-white transition-colors">
                購物車
              </NuxtLink>
            </li>
            <li>
              <a href="#" class="hover:text-white transition-colors">
                關於我們
              </a>
            </li>
          </ul>
        </div>

        <!-- Customer Service -->
        <div>
          <h4 class="text-lg font-semibold mb-4">客戶服務</h4>
          <ul class="space-y-2 text-gray-400">
            <li>
              <a href="#" class="hover:text-white transition-colors">
                配送資訊
              </a>
            </li>
            <li>
              <a href="#" class="hover:text-white transition-colors">
                退換貨政策
              </a>
            </li>
            <li>
              <a href="#" class="hover:text-white transition-colors">
                常見問題
              </a>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h4 class="text-lg font-semibold mb-4">聯絡我們</h4>
          <p class="text-gray-400 mb-4">
            📧 support@nuxtstore.com
          </p>
          <div class="flex space-x-4 text-2xl">
            <a href="#" class="hover:text-primary-400 transition-colors">📘</a>
            <a href="#" class="hover:text-primary-400 transition-colors">📷</a>
            <a href="#" class="hover:text-primary-400 transition-colors">🐦</a>
          </div>
        </div>
      </div>

      <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
        <p>&copy; 2025 Nuxt Store. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>
