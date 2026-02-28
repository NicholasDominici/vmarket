import { NextRequest, NextResponse } from 'next/server';
import { getQuote } from '@/lib/yahoo';

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol');
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 });
  const data = await getQuote(symbol);
  return NextResponse.json(data);
}
