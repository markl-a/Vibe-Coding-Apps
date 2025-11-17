import { NextRequest, NextResponse } from 'next/server';
import { searchPosts } from '@/lib/mdx';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const results = searchPosts(query);

  return NextResponse.json({ results, count: results.length });
}
