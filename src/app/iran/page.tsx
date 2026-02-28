'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { formatPercent, formatCurrency } from '@/lib/utils';
import {
  AlertTriangle, TrendingUp, TrendingDown, Loader2, RefreshCw,
  Ship, Plane, Shield, Flame, DollarSign, Clock
} from 'lucide-react';
import { MiniSparkline } from '@/components/overview/mini-sparkline';
import Link from 'next/link';

type QuoteItem = { symbol: string; data: Record<string, number> | null };
type SparklineData = { symbol: string; closes: number[] };
type NewsItem = {
  title: string;
  link: string;
  publisher: string;
  providerPublishTime?: number;
};

const REFRESH_INTERVAL_QUOTES = 60; // 60 seconds
const REFRESH_INTERVAL_NEWS = 300; // 5 minutes

// Iran crisis tickers organized by category
const OIL_ENERGY = ['CL=F', 'BZ=F', 'NG=F', 'XLE', 'USO', 'XOP', 'OXY', 'CVX', 'XOM', 'COP', 'SLB', 'HAL'];
const DEFENSE = ['LMT', 'RTX', 'NOC', 'GD', 'BA', 'LHX', 'ITA'];
const SAFE_HAVENS = ['GC=F', 'SI=F', 'GLD', 'SLV', 'TLT', 'UUP'];
const BROAD_MARKET = ['^GSPC', '^IXIC', '^DJI', '^VIX'];
const SHIPPING = ['ZIM', 'GOGL', 'INSW', 'FRO', 'STNG', 'EURN'];
const AIRLINES = ['DAL', 'UAL', 'AAL', 'LUV', 'JBLU'];

const ALL_SYMBOLS = [...OIL_ENERGY, ...DEFENSE, ...SAFE_HAVENS, ...BROAD_MARKET, ...SHIPPING, ...AIRLINES];

// Nicholas's positions
const POSITIONS = [
  { symbol: 'USO', invested: 200, status: 'active' },
  { symbol: 'RTX', invested: 100, status: 'planned' },
];

// Conflict timeline events
const TIMELINE = [
  { date: 'Feb 28', time: '06:00 ET', event: 'US & Israel launch "Operation Epic Fury" — strikes on Tehran, Isfahan, Shiraz' },
  { date: 'Feb 28', time: '06:30 ET', event: 'Israel sends 200 fighter jets, hits ~500 targets across Iran' },
  { date: 'Feb 28', time: '08:15 ET', event: 'Iran retaliates with "Truthful Promise 4" — ~1,200 missiles/drones at Israel, US bases' },
  { date: 'Feb 28', time: '09:00 ET', event: 'IRGC closes Strait of Hormuz to commercial shipping' },
  { date: 'Feb 28', time: '10:00 ET', event: 'Maersk, CMA CGM, Hapag-Lloyd suspend Hormuz transit' },
  { date: 'Feb 28', time: '11:30 ET', event: '201 killed in Iran, 747 injured. 1 killed in UAE from debris' },
  { date: 'Feb 28', time: '12:00 ET', event: 'Iran internet at 4% — near total blackout' },
  { date: 'Feb 28', time: '13:00 ET', event: 'UN Security Council emergency session called' },
  { date: 'Feb 28', time: '16:00 ET', event: 'Markets close: Dow -1.13%, S&P -0.52%, Nasdaq -0.97%' },
  { date: 'Feb 28', time: '17:00 ET', event: 'After-hours: Dow futures -622 pts on war escalation fears' },
];

export default function IranPage() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [sparklines, setSparklines] = useState<SparklineData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [quotesCountdown, setQuotesCountdown] = useState(REFRESH_INTERVAL_QUOTES);
  const [newsCountdown, setNewsCountdown] = useState(REFRESH_INTERVAL_NEWS);
  const [refreshing, setRefreshing] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const fetchQuotes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);

      // Batch into chunks of 30
      const chunks: string[][] = [];
      for (let i = 0; i < ALL_SYMBOLS.length; i += 30) {
        chunks.push(ALL_SYMBOLS.slice(i, i + 30));
      }

      const results = await Promise.all(
        chunks.map(chunk => fetch(`/api/quotes?symbols=${chunk.join(',')}`))
      );

      const allQuotes: QuoteItem[] = [];
      for (const res of results) {
        if (res.ok) {
          const data: QuoteItem[] = await res.json();
          allQuotes.push(...data);
        }
      }
      setQuotes(allQuotes);

      // Fetch sparklines for key tickers
      try {
        const sparkRes = await fetch(`/api/sparkline?symbols=${[...OIL_ENERGY.slice(0, 6), ...DEFENSE.slice(0, 6)].join(',')}`);
        if (sparkRes.ok) {
          setSparklines(await sparkRes.json());
        }
      } catch {
        // Sparklines are non-critical
      }

      setLastUpdated(new Date());
      setQuotesCountdown(REFRESH_INTERVAL_QUOTES);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      if (!isRefresh) setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchNews = useCallback(async () => {
    try {
      const queries = [
        'Iran war strikes',
        'Strait of Hormuz',
        'oil prices Iran',
        'defense stocks war'
      ];

      const results = await Promise.all(
        queries.map(q => fetch(`/api/news?q=${encodeURIComponent(q)}`))
      );

      const allNews: NewsItem[] = [];
      for (const res of results) {
        if (res.ok) {
          const data: NewsItem[] = await res.json();
          allNews.push(...data);
        }
      }

      // Deduplicate by title
      const seen = new Set<string>();
      const uniqueNews = allNews.filter(item => {
        if (seen.has(item.title)) return false;
        seen.add(item.title);
        return true;
      });

      // Sort by publish time (newest first)
      uniqueNews.sort((a, b) => (b.providerPublishTime || 0) - (a.providerPublishTime || 0));

      setNews(uniqueNews.slice(0, 20));
      setNewsCountdown(REFRESH_INTERVAL_NEWS);
    } catch (e) {
      console.error('Failed to fetch news:', e);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchQuotes();
    fetchNews();
  }, [fetchQuotes, fetchNews]);

  // Auto-refresh countdown
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setQuotesCountdown(prev => {
        if (prev <= 1) {
          fetchQuotes(true);
          return REFRESH_INTERVAL_QUOTES;
        }
        return prev - 1;
      });

      setNewsCountdown(prev => {
        if (prev <= 1) {
          fetchNews();
          return REFRESH_INTERVAL_NEWS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [fetchQuotes, fetchNews]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading crisis monitor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-sm text-data-negative">{error}</div>
    );
  }

  // Helper to get quote data
  const getQuote = (symbol: string) => quotes.find(q => q.symbol === symbol)?.data;
  const getSpark = (symbol: string) => sparklines.find(s => s.symbol === symbol);

  // Key metrics
  const oilPrice = getQuote('CL=F');
  const brentPrice = getQuote('BZ=F');
  const goldPrice = getQuote('GC=F');
  const vixPrice = getQuote('^VIX');

  // Calculate P&L for positions
  const positionsWithPL = POSITIONS.map(pos => {
    const quote = getQuote(pos.symbol);
    if (!quote || pos.status === 'planned') {
      return { ...pos, currentValue: null, pl: null, plPct: null };
    }
    // Rough estimate: assume entry at current price - (change * invested/price)
    const price = quote.regularMarketPrice || 0;
    const changePct = quote.regularMarketChangePercent || 0;
    const currentValue = pos.invested * (1 + changePct / 100);
    const pl = currentValue - pos.invested;
    const plPct = changePct;
    return { ...pos, currentValue, pl, plPct };
  });

  const sparklineMap = new Map(sparklines.map(s => [s.symbol, s]));

  // Time ago helper
  const timeAgo = (timestamp?: number) => {
    if (!timestamp) return '';
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Crisis Status Banner */}
      <div className="border-2 border-data-negative rounded-md bg-data-negative/10 p-4">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-5 h-5 text-data-negative animate-pulse" />
          <h1 className="text-lg font-semibold text-data-negative uppercase tracking-[0.12em]">
            ACTIVE CONFLICT — Strait of Hormuz DISRUPTED
          </h1>
        </div>
        <div className="text-sm text-muted-foreground">
          US & Israel launch strikes on Iran. IRGC closes Hormuz. Markets volatile.
        </div>
        {lastUpdated && (
          <div className="text-[10px] text-muted-foreground/50 mt-2">
            Last updated {lastUpdated.toLocaleTimeString()} · Next refresh in {quotesCountdown}s
          </div>
        )}
      </div>

      {/* Auto-refresh control */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => {
            setQuotesCountdown(REFRESH_INTERVAL_QUOTES);
            setNewsCountdown(REFRESH_INTERVAL_NEWS);
            fetchQuotes(true);
            fetchNews();
          }}
          className="p-1.5 rounded-md hover:bg-secondary/50 transition-colors"
          title="Refresh now"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
        </button>
        <div className="text-[10px] text-muted-foreground tabular-nums">
          Quotes: {quotesCountdown}s | News: {newsCountdown}s
        </div>
      </div>

      {/* Key Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border border-border rounded-md bg-card p-4 glow-interactive">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">WTI Crude Oil</span>
            <Flame className="w-3.5 h-3.5 text-data-warning" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums">
            {oilPrice ? formatCurrency(oilPrice.regularMarketPrice || 0) : '—'}
          </div>
          {oilPrice && (
            <div className={`text-sm font-medium tabular-nums mt-1 ${(oilPrice.regularMarketChangePercent || 0) >= 0 ? 'text-data-positive' : 'text-data-negative'}`}>
              {formatPercent(oilPrice.regularMarketChangePercent || 0)}
            </div>
          )}
        </div>

        <div className="border border-border rounded-md bg-card p-4 glow-interactive">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Brent Crude</span>
            <Flame className="w-3.5 h-3.5 text-data-warning" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums">
            {brentPrice ? formatCurrency(brentPrice.regularMarketPrice || 0) : '—'}
          </div>
          {brentPrice && (
            <div className={`text-sm font-medium tabular-nums mt-1 ${(brentPrice.regularMarketChangePercent || 0) >= 0 ? 'text-data-positive' : 'text-data-negative'}`}>
              {formatPercent(brentPrice.regularMarketChangePercent || 0)}
            </div>
          )}
        </div>

        <div className="border border-border rounded-md bg-card p-4 glow-interactive">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Gold (Safe Haven)</span>
            <DollarSign className="w-3.5 h-3.5 text-data-warning" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums">
            {goldPrice ? formatCurrency(goldPrice.regularMarketPrice || 0) : '—'}
          </div>
          {goldPrice && (
            <div className={`text-sm font-medium tabular-nums mt-1 ${(goldPrice.regularMarketChangePercent || 0) >= 0 ? 'text-data-positive' : 'text-data-negative'}`}>
              {formatPercent(goldPrice.regularMarketChangePercent || 0)}
            </div>
          )}
        </div>

        <div className="border border-border rounded-md bg-card p-4 glow-interactive">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">VIX (Fear Index)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-data-negative" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums">
            {vixPrice ? (vixPrice.regularMarketPrice || 0).toFixed(2) : '—'}
          </div>
          {vixPrice && (
            <div className={`text-sm font-medium tabular-nums mt-1 ${(vixPrice.regularMarketChangePercent || 0) >= 0 ? 'text-data-positive' : 'text-data-negative'}`}>
              {formatPercent(vixPrice.regularMarketChangePercent || 0)}
            </div>
          )}
        </div>
      </div>

      {/* Hormuz Status */}
      <div className="border border-data-negative rounded-md bg-card p-3">
        <div className="flex items-center gap-2">
          <Ship className="w-4 h-4 text-data-negative" />
          <span className="text-sm font-semibold text-data-negative uppercase tracking-wider">
            Strait of Hormuz Status: CLOSED
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            IRGC restrictions in effect
          </span>
        </div>
      </div>

      {/* Two-column layout: Tickers Grid + News Feed */}
      <div className="grid lg:grid-cols-[1fr_400px] gap-4">
        {/* Key Tickers Grid */}
        <div className="space-y-4">
          {/* Oil & Energy */}
          <div className="border border-border rounded-md bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-3.5 h-3.5 text-data-warning" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Oil & Energy</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {OIL_ENERGY.map(symbol => {
                const q = getQuote(symbol);
                if (!q) return null;
                const pct = q.regularMarketChangePercent ?? 0;
                const isUp = pct >= 0;
                const spark = getSpark(symbol);
                return (
                  <Link
                    key={symbol}
                    href={`/stock/${symbol}`}
                    className="border border-border/50 rounded-md p-2.5 glow-interactive"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold">{symbol}</span>
                      {spark && <MiniSparkline data={spark} />}
                    </div>
                    <div className="text-sm font-semibold tabular-nums">{formatCurrency(q.regularMarketPrice ?? 0)}</div>
                    <div className={`text-[11px] font-medium tabular-nums ${isUp ? 'text-data-positive' : 'text-data-negative'}`}>
                      {formatPercent(pct)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Defense */}
          <div className="border border-border rounded-md bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Defense</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {DEFENSE.map(symbol => {
                const q = getQuote(symbol);
                if (!q) return null;
                const pct = q.regularMarketChangePercent ?? 0;
                const isUp = pct >= 0;
                const spark = getSpark(symbol);
                return (
                  <Link
                    key={symbol}
                    href={`/stock/${symbol}`}
                    className="border border-border/50 rounded-md p-2.5 glow-interactive"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold">{symbol}</span>
                      {spark && <MiniSparkline data={spark} />}
                    </div>
                    <div className="text-sm font-semibold tabular-nums">{formatCurrency(q.regularMarketPrice ?? 0)}</div>
                    <div className={`text-[11px] font-medium tabular-nums ${isUp ? 'text-data-positive' : 'text-data-negative'}`}>
                      {formatPercent(pct)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Safe Havens */}
          <div className="border border-border rounded-md bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-3.5 h-3.5 text-data-warning" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Safe Havens</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {SAFE_HAVENS.map(symbol => {
                const q = getQuote(symbol);
                if (!q) return null;
                const pct = q.regularMarketChangePercent ?? 0;
                const isUp = pct >= 0;
                return (
                  <Link
                    key={symbol}
                    href={`/stock/${symbol}`}
                    className="border border-border/50 rounded-md p-2.5 glow-interactive"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold">{symbol}</span>
                    </div>
                    <div className="text-sm font-semibold tabular-nums">{formatCurrency(q.regularMarketPrice ?? 0)}</div>
                    <div className={`text-[11px] font-medium tabular-nums ${isUp ? 'text-data-positive' : 'text-data-negative'}`}>
                      {formatPercent(pct)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Shipping/Logistics */}
          <div className="border border-border rounded-md bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Ship className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Shipping (Hormuz Impact)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {SHIPPING.map(symbol => {
                const q = getQuote(symbol);
                if (!q) return null;
                const pct = q.regularMarketChangePercent ?? 0;
                const isUp = pct >= 0;
                return (
                  <Link
                    key={symbol}
                    href={`/stock/${symbol}`}
                    className="border border-border/50 rounded-md p-2.5 glow-interactive"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold">{symbol}</span>
                    </div>
                    <div className="text-sm font-semibold tabular-nums">{formatCurrency(q.regularMarketPrice ?? 0)}</div>
                    <div className={`text-[11px] font-medium tabular-nums ${isUp ? 'text-data-positive' : 'text-data-negative'}`}>
                      {formatPercent(pct)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Airlines (Losers from Oil Spike) */}
          <div className="border border-border rounded-md bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Plane className="w-3.5 h-3.5 text-data-negative" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Airlines (Oil Spike Impact)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {AIRLINES.map(symbol => {
                const q = getQuote(symbol);
                if (!q) return null;
                const pct = q.regularMarketChangePercent ?? 0;
                const isUp = pct >= 0;
                return (
                  <Link
                    key={symbol}
                    href={`/stock/${symbol}`}
                    className="border border-border/50 rounded-md p-2.5 glow-interactive"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold">{symbol}</span>
                    </div>
                    <div className="text-sm font-semibold tabular-nums">{formatCurrency(q.regularMarketPrice ?? 0)}</div>
                    <div className={`text-[11px] font-medium tabular-nums ${isUp ? 'text-data-positive' : 'text-data-negative'}`}>
                      {formatPercent(pct)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Broad Market Context */}
          <div className="border border-border rounded-md bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Broad Market</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BROAD_MARKET.map(symbol => {
                const q = getQuote(symbol);
                if (!q) return null;
                const pct = q.regularMarketChangePercent ?? 0;
                const isUp = pct >= 0;
                return (
                  <div
                    key={symbol}
                    className="border border-border/50 rounded-md p-2.5"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold">{symbol}</span>
                    </div>
                    <div className="text-sm font-semibold tabular-nums">{symbol === '^VIX' ? (q.regularMarketPrice ?? 0).toFixed(2) : formatCurrency(q.regularMarketPrice ?? 0)}</div>
                    <div className={`text-[11px] font-medium tabular-nums ${isUp ? 'text-data-positive' : 'text-data-negative'}`}>
                      {formatPercent(pct)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right sidebar: News + Timeline + Positions */}
        <div className="space-y-4">
          {/* Nicholas's Positions */}
          <div className="border border-border rounded-md bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-3.5 h-3.5 text-data-positive" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Nicholas's Positions</span>
            </div>
            <div className="space-y-3">
              {positionsWithPL.map(pos => {
                const quote = getQuote(pos.symbol);
                return (
                  <div key={pos.symbol} className="border border-border/50 rounded-md p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">{pos.symbol}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${pos.status === 'active' ? 'bg-data-positive/20 text-data-positive' : 'bg-data-warning/20 text-data-warning'}`}>
                        {pos.status === 'active' ? 'Active' : 'Planned'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Invested: {formatCurrency(pos.invested)}
                    </div>
                    {quote && pos.currentValue !== null && (
                      <>
                        <div className="text-sm font-semibold tabular-nums">
                          Current: {formatCurrency(pos.currentValue)}
                        </div>
                        <div className={`text-xs font-medium tabular-nums ${(pos.plPct ?? 0) >= 0 ? 'text-data-positive' : 'text-data-negative'}`}>
                          P&L: {formatCurrency(pos.pl ?? 0)} ({formatPercent(pos.plPct ?? 0)})
                        </div>
                      </>
                    )}
                    {pos.status === 'planned' && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Buying Monday at market open
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live News Feed */}
          <div className="border border-border rounded-md bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-data-negative" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Live News</span>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
              {news.length === 0 && (
                <div className="text-xs text-muted-foreground">Loading news...</div>
              )}
              {news.slice(0, 10).map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border-b border-border/30 pb-2 last:border-b-0 glow-hover"
                >
                  <div className="text-xs font-medium mb-1 leading-snug">{item.title}</div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{item.publisher}</span>
                    <span>•</span>
                    <span>{timeAgo(item.providerPublishTime)}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Conflict Timeline */}
          <div className="border border-border rounded-md bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Conflict Timeline</span>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
              {TIMELINE.map((event, i) => (
                <div key={i} className="border-l-2 border-data-negative/30 pl-3 pb-2">
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                    {event.date} {event.time}
                  </div>
                  <div className="text-xs leading-snug">{event.event}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
