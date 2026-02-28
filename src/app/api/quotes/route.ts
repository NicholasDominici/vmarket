import { NextRequest, NextResponse } from 'next/server';
import { getQuotes } from '@/lib/yahoo';

export async function GET(request: NextRequest) {
  const symbols = request.nextUrl.searchParams.get('symbols');
  if (!symbols) return NextResponse.json({ error: 'symbols required' }, { status: 400 });
  const data = await getQuotes(symbols.split(','));
  return NextResponse.json(data);
}
