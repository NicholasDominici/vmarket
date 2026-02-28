import { NextRequest, NextResponse } from 'next/server';

const HYPERLIQUID_INFO = 'https://api.hyperliquid.xyz/info';
const CACHE_TTL_MS = 10_000; // 10 seconds

type CacheEntry = { data: unknown; ts: number };
const cache = new Map<string, CacheEntry>();

function getCacheKey(body: Record<string, unknown>): string {
  return JSON.stringify(body);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = body?.type;

    if (!type) {
      return NextResponse.json({ error: 'type required' }, { status: 400 });
    }

    // Cache allMids and meta responses for 10s
    const cacheable = type === 'allMids' || type === 'meta' || type === 'metaAndAssetCtxs';
    const key = getCacheKey(body);

    if (cacheable) {
      const entry = cache.get(key);
      if (entry && Date.now() - entry.ts < CACHE_TTL_MS) {
        return NextResponse.json(entry.data);
      }
    }

    const res = await fetch(HYPERLIQUID_INFO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Hyperliquid API returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    if (cacheable) {
      cache.set(key, { data, ts: Date.now() });
    }

    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
