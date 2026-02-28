import { NextRequest, NextResponse } from 'next/server';

async function fetchGoogleNews(query: string) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) return [];
  const xml = await res.text();

  const items: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() || '';
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || '';
    const source = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() || '';
    items.push({
      title,
      link,
      publisher: source,
      providerPublishTime: pubDate ? Math.floor(new Date(pubDate).getTime() / 1000) : undefined,
    });
  }
  return items;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') || 'technology stocks';
  const news = await fetchGoogleNews(query);
  return NextResponse.json(news);
}
