import { NextRequest, NextResponse } from 'next/server';
import { getHistory } from '@/lib/yahoo';

export async function GET(request: NextRequest) {
  const symbols = request.nextUrl.searchParams.get('symbols');
  if (!symbols) return NextResponse.json({ error: 'symbols required' }, { status: 400 });

  const list = symbols.split(',').slice(0, 30);
  const period1 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const results = await Promise.all(
    list.map(async (symbol) => {
      const data = await getHistory(symbol.trim(), period1, '1d');
      const closes = (data?.quotes || [])
        .map((q: { close?: number }) => q.close)
        .filter((c: number | undefined): c is number => c != null);
      return { symbol: symbol.trim(), closes };
    })
  );

  return NextResponse.json(results);
}
