import { generateRssFeed } from '@/lib/rss';

export async function GET() {
  const { rss } = generateRssFeed();

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=1200, stale-while-revalidate=600',
    },
  });
}
