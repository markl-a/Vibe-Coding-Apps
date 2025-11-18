import { MetadataRoute } from 'next';
import { mockProducts } from '@/lib/mockData';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://product-showcase.com';

  // Homepage
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/checkout`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/wishlist`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  // Add all products
  const productRoutes: MetadataRoute.Sitemap = mockProducts.map((product) => ({
    url: `${baseUrl}/product/${product.id}`,
    lastModified: product.createdAt ? new Date(product.createdAt) : new Date(),
    changeFrequency: 'daily' as const,
    priority: product.isFeatured ? 0.9 : 0.7,
  }));

  return [...routes, ...productRoutes];
}
