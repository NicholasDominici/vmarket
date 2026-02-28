import { NextResponse } from 'next/server';

const GAMMA_BASE = 'https://gamma-api.polymarket.com';
const CACHE_TTL_MS = 60 * 1000;

export interface PolymarketItem {
  question: string;
  yesPrice: number;
  noPrice: number;
  volume: string;
  liquidity: string;
  endDate: string;
  url: string;
}

let cached: { data: PolymarketItem[]; ts: number } | null = null;

// Known Iran-related event slugs on Polymarket
const IRAN_EVENT_SLUGS = [
  'usisrael-strikes-iran-on',
  'will-iran-close-the-strait-of-hormuz-by-2027',
  'iran-x-israelus-conflict-ends-by',
];

async function fetchEventBySlug(slug: string): Promise<PolymarketItem[]> {
  const items: PolymarketItem[] = [];
  try {
    const res = await fetch(`${GAMMA_BASE}/events?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!res.ok) return items;
    const events = await res.json();
    
    for (const event of events) {
      if (!event.markets) continue;
      for (const m of event.markets) {
        try {
          const prices: string[] = JSON.parse(m.outcomePrices || '[]');
          const yesPrice = parseFloat(prices[0] || '0');
          const noPrice = parseFloat(prices[1] || '0');
          if (yesPrice === 0 && noPrice === 0) continue;
          // Skip closed/resolved markets
          if (m.closed) continue;
          
          items.push({
            question: m.question || event.title,
            yesPrice,
            noPrice,
            volume: m.volume || '0',
            liquidity: m.liquidity || '0',
            endDate: m.endDate || event.endDate || '',
            url: `https://polymarket.com/event/${event.slug}`,
          });
        } catch {}
      }
    }
  } catch {}
  return items;
}

export async function GET() {
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  const allResults = await Promise.all(IRAN_EVENT_SLUGS.map(fetchEventBySlug));
  const flat = allResults.flat();

  // Deduplicate by question
  const seen = new Set<string>();
  const unique = flat.filter(item => {
    const key = item.question.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by volume descending
  unique.sort((a, b) => parseFloat(String(b.volume)) - parseFloat(String(a.volume)));

  cached = { data: unique, ts: Date.now() };
  return NextResponse.json(unique);
}
