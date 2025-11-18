import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Product Showcase - AI 智能電商',
    short_name: 'Product Showcase',
    description: '探索最新最優質的電子產品，享受 AI 驅動的智能購物體驗',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0ea5e9',
    orientation: 'portrait-primary',
    categories: ['shopping', 'lifestyle'],
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-256x256.png',
        sizes: '256x256',
        type: 'image/png',
      },
      {
        src: '/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    screenshots: [
      {
        src: '/screenshot-1.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
      },
      {
        src: '/screenshot-2.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
      },
    ],
    shortcuts: [
      {
        name: '購物車',
        short_name: '購物車',
        description: '查看購物車',
        url: '/cart',
        icons: [
          {
            src: '/icon-cart.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
      {
        name: '願望清單',
        short_name: '願望清單',
        description: '查看願望清單',
        url: '/wishlist',
        icons: [
          {
            src: '/icon-wishlist.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
    ],
  };
}
