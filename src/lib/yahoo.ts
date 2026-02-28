// Yahoo Finance via v8 chart endpoint (v7 quote endpoint is dead)

const BASE = 'https://query1.finance.yahoo.com';

const headers: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
};

export const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^DJI', name: 'DOW' },
  { symbol: '^RUT', name: 'Russell 2000' },
];

export const TECH_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX',
  'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'AVGO', 'QCOM',
  'UBER', 'SHOP', 'SQ', 'PLTR', 'SNOW',
];

export const SECTORS = [
  { symbol: 'XLK', name: 'Technology' },
  { symbol: 'XLF', name: 'Financials' },
  { symbol: 'XLE', name: 'Energy' },
  { symbol: 'XLV', name: 'Healthcare' },
  { symbol: 'XLY', name: 'Consumer Disc.' },
  { symbol: 'XLP', name: 'Consumer Staples' },
  { symbol: 'XLI', name: 'Industrials' },
  { symbol: 'XLB', name: 'Materials' },
  { symbol: 'XLC', name: 'Communication' },
  { symbol: 'XLRE', name: 'Real Estate' },
  { symbol: 'XLU', name: 'Utilities' },
];

export const MEGA_CAPS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'BRK-B',
  'JPM', 'V', 'UNH', 'JNJ', 'WMT', 'PG', 'MA', 'HD', 'BAC', 'COST', 'ABBV', 'KO',
];

export const CRYPTO_ADJACENT = ['COIN', 'MARA', 'MSTR', 'RIOT', 'BITF'];

export const COMMODITIES = [
  { symbol: 'GC=F', name: 'Gold' },
  { symbol: 'SI=F', name: 'Silver' },
  { symbol: 'CL=F', name: 'Oil' },
  { symbol: 'NG=F', name: 'Nat Gas' },
  { symbol: 'BTC-USD', name: 'Bitcoin' },
  { symbol: 'ETH-USD', name: 'Ethereum' },
];

export const MEME_WATCHLIST = ['GME', 'AMC', 'BBBY', 'PLTR', 'SOFI', 'RIVN', 'LCID'];

export const PORTFOLIO = ['HOOD'];

export function getAllTrackedSymbols(): string[] {
  const set = new Set<string>();
  INDICES.forEach(i => set.add(i.symbol));
  set.add('^VIX'); // For Fear & Greed gauge
  TECH_STOCKS.forEach(s => set.add(s));
  SECTORS.forEach(s => set.add(s.symbol));
  MEGA_CAPS.forEach(s => set.add(s));
  CRYPTO_ADJACENT.forEach(s => set.add(s));
  COMMODITIES.forEach(c => set.add(c.symbol));
  MEME_WATCHLIST.forEach(s => set.add(s));
  PORTFOLIO.forEach(s => set.add(s));
  return Array.from(set);
}

async function fetchJSON(url: string) {
  const res = await fetch(url, {
    headers,
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error(`Fetch failed: ${res.status} ${res.statusText} for ${url}`);
    return null;
  }
  return res.json();
}

export async function getQuote(symbol: string) {
  try {
    const data = await fetchJSON(
      `${BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`
    );
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? 0;
    const change = price - prevClose;
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;
    return {
      symbol: meta.symbol || symbol,
      shortName: meta.shortName || meta.longName || meta.symbol || symbol,
      regularMarketPrice: price,
      regularMarketChange: change,
      regularMarketChangePercent: changePercent,
      regularMarketVolume: meta.regularMarketVolume ?? 0,
      regularMarketDayHigh: meta.regularMarketDayHigh ?? 0,
      regularMarketDayLow: meta.regularMarketDayLow ?? 0,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? 0,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? 0,
      marketCap: 0,
    };
  } catch (e: any) {
    console.error(`Quote fetch failed for ${symbol}:`, e.message);
    return null;
  }
}

export async function getQuotes(symbols: string[]) {
  const results = await Promise.all(symbols.map(s => getQuote(s)));
  return symbols.map((sym, i) => ({
    symbol: sym,
    data: results[i],
  }));
}

export async function getHistory(symbol: string, period1: string, interval: string = '1d') {
  try {
    const p1 = Math.floor(new Date(period1).getTime() / 1000);
    const p2 = Math.floor(Date.now() / 1000);
    const data = await fetchJSON(
      `${BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${p1}&period2=${p2}&interval=${interval}`
    );
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    return {
      quotes: timestamps.map((t: number, i: number) => ({
        date: new Date(t * 1000).toISOString(),
        open: quotes.open?.[i],
        high: quotes.high?.[i],
        low: quotes.low?.[i],
        close: quotes.close?.[i],
        volume: quotes.volume?.[i],
      })),
    };
  } catch (e: any) {
    console.error(`History fetch failed for ${symbol}:`, e.message);
    return null;
  }
}
