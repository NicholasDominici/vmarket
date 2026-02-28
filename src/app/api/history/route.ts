import { NextRequest, NextResponse } from 'next/server';
import { getHistory } from '@/lib/yahoo';

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol');
  const period = request.nextUrl.searchParams.get('period') || '6mo';
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 });

  const now = new Date();
  let period1: Date;
  switch (period) {
    case '1mo': period1 = new Date(now.getTime() - 30 * 86400000); break;
    case '3mo': period1 = new Date(now.getTime() - 90 * 86400000); break;
    case '1y': period1 = new Date(now.getTime() - 365 * 86400000); break;
    case '5y': period1 = new Date(now.getTime() - 5 * 365 * 86400000); break;
    default: period1 = new Date(now.getTime() - 180 * 86400000);
  }

  const data = await getHistory(symbol, period1.toISOString().split('T')[0]);
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
