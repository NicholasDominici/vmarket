import { NextRequest, NextResponse } from 'next/server';
import { getHistory } from '@/lib/yahoo';

// Period config: how far back to look + what interval to use
const PERIOD_CONFIG: Record<string, { ms: number; interval: string }> = {
  '1m':  { ms: 7 * 86400000,      interval: '1m'  },  // 7 days of 1-min data (Yahoo limit)
  '5m':  { ms: 60 * 86400000,     interval: '5m'  },  // 60 days of 5-min
  '15m': { ms: 60 * 86400000,     interval: '15m' },
  '30m': { ms: 60 * 86400000,     interval: '30m' },
  '1h':  { ms: 730 * 86400000,    interval: '60m' },
  '1d':  { ms: 7 * 86400000,      interval: '5m'  },  // 1 day = 5min candles
  '5d':  { ms: 5 * 86400000,      interval: '15m' },
  '1w':  { ms: 7 * 86400000,      interval: '30m' },
  '1mo': { ms: 30 * 86400000,     interval: '1d'  },
  '3mo': { ms: 90 * 86400000,     interval: '1d'  },
  '6mo': { ms: 180 * 86400000,    interval: '1d'  },
  '1y':  { ms: 365 * 86400000,    interval: '1wk' },
  '5y':  { ms: 5 * 365 * 86400000, interval: '1mo' },
};

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol');
  const period = request.nextUrl.searchParams.get('period') || '6mo';
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 });

  const config = PERIOD_CONFIG[period] || { ms: 180 * 86400000, interval: '1d' };
  const period1 = new Date(Date.now() - config.ms);

  const data = await getHistory(symbol, period1.toISOString().split('T')[0], config.interval);
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const quotes = data.quotes.map((q: any) => ({
    date: q.date,
    open: q.open,
    high: q.high,
    low: q.low,
    close: q.close,
    volume: q.volume,
  }));
  return NextResponse.json({ symbol, quotes });
}
