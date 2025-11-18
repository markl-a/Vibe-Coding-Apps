import { Product } from '@/types';
import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://product-showcase.com';
const SITE_NAME = 'Product Showcase - AI 智能電商';

/**
 * Generate SEO-optimized metadata for product pages
 */
export function generateProductMetadata(product: Product): Metadata {
  const title = `${product.name} | ${SITE_NAME}`;
  const description = product.description || `購買 ${product.name}，${product.category} 類別的優質產品。NT$ ${product.price.toLocaleString()}`;

  const keywords = [
    product.name,
    product.category,
    ...( product.tags || []),
    '電子產品',
    '3C 產品',
    '線上購物',
    'AI 推薦',
  ];

  const images = product.images.map(img => ({
    url: img,
    alt: product.name,
  }));

  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'Product Showcase' }],
    creator: 'Product Showcase',
    publisher: 'Product Showcase',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/product/${product.id}`,
      siteName: SITE_NAME,
      images,
      locale: 'zh_TW',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.images,
      creator: '@productshowcase',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: `${SITE_URL}/product/${product.id}`,
    },
  };
}

/**
 * Generate SEO-optimized metadata for category/listing pages
 */
export function generateCategoryMetadata(
  category?: string,
  page: number = 1
): Metadata {
  const categoryText = category ? `${category} 分類` : '所有商品';
  const title = `${categoryText} ${page > 1 ? `- 第 ${page} 頁` : ''} | ${SITE_NAME}`;
  const description = `瀏覽我們精選的${categoryText}，享受 AI 智能推薦與 24/7 客服支援。`;

  return {
    title,
    description,
    keywords: [
      categoryText,
      '電子產品',
      '3C 商品',
      '線上購物',
      'AI 推薦',
      '智能購物',
    ].join(', '),
    openGraph: {
      title,
      description,
      url: category ? `${SITE_URL}?category=${category}` : SITE_URL,
      siteName: SITE_NAME,
      locale: 'zh_TW',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: category ? `${SITE_URL}?category=${category}` : SITE_URL,
    },
  };
}

/**
 * Generate SEO-optimized metadata for the homepage
 */
export function generateHomeMetadata(): Metadata {
  const title = 'Product Showcase - AI 智能電商 | 精選電子產品購物網';
  const description = '探索最新最優質的電子產品，享受 AI 驅動的智能購物體驗。24/7 AI 客服、智能推薦、個性化服務，讓購物更簡單。';

  return {
    title,
    description,
    keywords: '電子產品,3C,購物,電商,AI購物,智能推薦,客服機器人,深色模式',
    authors: [{ name: 'Product Showcase' }],
    creator: 'Product Showcase',
    publisher: 'Product Showcase',
    applicationName: 'Product Showcase',
    referrer: 'origin-when-cross-origin',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      title,
      description,
      url: SITE_URL,
      siteName: SITE_NAME,
      locale: 'zh_TW',
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'Product Showcase',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@productshowcase',
      images: [`${SITE_URL}/og-image.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
    alternates: {
      canonical: SITE_URL,
      languages: {
        'zh-TW': SITE_URL,
        'en-US': `${SITE_URL}/en`,
      },
    },
  };
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

/**
 * Generate sitemap entry for a product
 */
export function generateProductSitemapEntry(product: Product) {
  return {
    url: `${SITE_URL}/product/${product.id}`,
    lastModified: product.createdAt || new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: product.isFeatured ? 0.9 : 0.7,
  };
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(): string {
  return `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Disallow admin and API routes
Disallow: /api/
Disallow: /admin/

# Sitemap
Sitemap: ${SITE_URL}/sitemap.xml
`;
}
