import { NextResponse } from 'next/server';

const GAMMA_BASE = 'https://gamma-api.polymarket.com';
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

interface GammaMarket {
  question: string;
  outcomePrices: string;
  outcomes: string;
  volume: number;
  liquidity: number;
  endDate: string;
  conditionId: string;
  slug: string;
  active: boolean;
  closed: boolean;
}

interface GammaEvent {
  title: string;
  slug: string;
  markets: GammaMarket[];
}

export interface PolymarketItem {
  question: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity: number;
  endDate: string;
  url: string;
}

let cached: { data: PolymarketItem[]; ts: number } | null = null;

function parseMarket(m: GammaMarket): PolymarketItem | null {
  try {
    const prices: string[] = JSON.parse(m.outcomePrices || '[]');
    const yesPrice = parseFloat(prices[0] || '0');
    const noPrice = parseFloat(prices[1] || '0');

    if (yesPrice === 0 && noPrice === 0) return null;

    return {
      question: m.question,
      yesPrice,
      noPrice,
      volume: m.volume || 0,
      liquidity: m.liquidity || 0,
      endDate: m.endDate || '',
      url: `https://polymarket.com/event/${m.slug || m.conditionId}`,
    };
  } catch {
    return null;
  }
}

async function fetchTagMarkets(tag: string): Promise<PolymarketItem[]> {
  const items: PolymarketItem[] = [];

  // Try events endpoint first (grouped markets)
  try {
    const eventsRes = await fetch(
      `${GAMMA_BASE}/events?tag=${encodeURIComponent(tag)}&closed=false&limit=10`,
      { cache: 'no-store' }
    );
    if (eventsRes.ok) {
      const events: GammaEvent[] = await eventsRes.json();
      for (const event of events) {
        if (event.markets) {
          for (const m of event.markets) {
            const parsed = parseMarket(m);
            if (parsed) {
              // Use event slug for better URL
              parsed.url = `https://polymarket.com/event/${event.slug || m.slug || m.conditionId}`;
              items.push(parsed);
            }
          }
        }
      }
    }
  } catch {
    // Fall through to markets endpoint
  }

  // Also try markets endpoint directly
  try {
    const marketsRes = await fetch(
      `${GAMMA_BASE}/markets?tag=${encodeURIComponent(tag)}&closed=false&limit=20`,
      { cache: 'no-store' }
    );
    if (marketsRes.ok) {
      const markets: GammaMarket[] = await marketsRes.json();
      for (const m of markets) {
        const parsed = parseMarket(m);
        if (parsed) items.push(parsed);
      }
    }
  } catch {
    // Non-critical
  }

  return items;
}

export async function GET() {
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  const tags = ['iran', 'hormuz', 'oil-price', 'ceasefire'];
  const allResults = await Promise.all(tags.map(fetchTagMarkets));
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
  unique.sort((a, b) => b.volume - a.volume);

  cached = { data: unique, ts: Date.now() };
  return NextResponse.json(unique);
}
