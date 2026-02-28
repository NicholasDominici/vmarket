'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { INDICES, TECH_STOCKS, SECTORS, MEGA_CAPS, CRYPTO_ADJACENT, COMMODITIES, MEME_WATCHLIST, PORTFOLIO, getAllTrackedSymbols } from '@/lib/yahoo';
import { formatPercent, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownRight,
  Loader2, RefreshCw,
} from 'lucide-react';

import { HeatMapGrid } from '@/components/overview/heat-map-grid';
import { SectorBars } from '@/components/overview/sector-bars';
import { MiniSparkline } from '@/components/overview/mini-sparkline';
import { MarketBreadthMeter } from '@/components/overview/market-breadth';
import { CommodityCryptoStrip } from '@/components/overview/commodity-strip';
import { FearGreedGauge } from '@/components/overview/fear-greed-gauge';
import { MemeWatchlist } from '@/components/overview/meme-watchlist';
import { MarketCalendar } from '@/components/overview/market-calendar';
import { QuickSearch } from '@/components/overview/quick-search';
import { UnusualVolume } from '@/components/overview/unusual-volume';
import { CorrelationMatrix } from '@/components/overview/correlation-matrix';

type QuoteItem = { symbol: string; data: Record<string, number> | null };
type SparklineData = { symbol: string; closes: number[] };

const REFRESH_INTERVAL = 60;

export default function HomePage() {
  const [indexQuotes, setIndexQuotes] = useState<QuoteItem[]>([]);
  const [allQuotes, setAllQuotes] = useState<QuoteItem[]>([]);
  const [sparklines, setSparklines] = useState<SparklineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [refreshing, setRefreshing] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);

      const allSymbols = getAllTrackedSymbols();
      const idxSymbols = INDICES.map(i => i.symbol);

      // Batch into chunks of 30 to avoid overly long URLs
      const chunks: string[][] = [];
      for (let i = 0; i < allSymbols.length; i += 30) {
        chunks.push(allSymbols.slice(i, i + 30));
      }

      const [idxRes, ...chunkResults] = await Promise.all([
        fetch(`/api/quotes?symbols=${idxSymbols.join(',')}`),
        ...chunks.map(chunk => fetch(`/api/quotes?symbols=${chunk.join(',')}`)),
      ]);

      if (!idxRes.ok) throw new Error('Failed to fetch quotes');
      const idxData: QuoteItem[] = await idxRes.json();
      setIndexQuotes(idxData);

      const allResults: QuoteItem[] = [];
      for (const res of chunkResults) {
        if (res.ok) {
          const data: QuoteItem[] = await res.json();
          allResults.push(...data);
        }
      }
      setAllQuotes(allResults);

      // Fetch sparklines for mega caps
      try {
        const sparkRes = await fetch(`/api/sparkline?symbols=${MEGA_CAPS.slice(0, 20).join(',')}`);
        if (sparkRes.ok) {
          setSparklines(await sparkRes.json());
        }
      } catch {
        // Sparklines are non-critical
      }

      setLastUpdated(new Date());
      setCountdown(REFRESH_INTERVAL);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      if (!isRefresh) setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh countdown
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchData(true);
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading market data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-sm text-data-negative">{error}</div>
    );
  }

  // Derived data
  const validAll = allQuotes.filter(q => q.data);
  const advancing = validAll.filter(q => (q.data?.regularMarketChangePercent ?? 0) > 0).length;
  const declining = validAll.filter(q => (q.data?.regularMarketChangePercent ?? 0) < 0).length;
  const totalTracked = validAll.length;

  // Sentiment
  const sentimentRatio = totalTracked > 0 ? advancing / totalTracked : 0.5;
  const sentimentLabel = sentimentRatio > 0.65 ? 'Bullish' : sentimentRatio > 0.45 ? 'Neutral' : 'Bearish';
  const sentimentColor = sentimentRatio > 0.65 ? 'text-data-positive' : sentimentRatio > 0.45 ? 'text-data-warning' : 'text-data-negative';

  // Top movers (from all stocks)
  const sorted = [...validAll].sort((a, b) =>
    Math.abs(b.data?.regularMarketChangePercent ?? 0) - Math.abs(a.data?.regularMarketChangePercent ?? 0)
  );
  const gainers = sorted.filter(q => (q.data?.regularMarketChangePercent ?? 0) > 0).slice(0, 5);
  const losers = sorted.filter(q => (q.data?.regularMarketChangePercent ?? 0) < 0).slice(0, 5);

  // Sector data
  const sectorData = SECTORS.map(s => {
    const q = allQuotes.find(q => q.symbol === s.symbol);
    return { symbol: s.symbol, name: s.name, pct: q?.data?.regularMarketChangePercent ?? 0 };
  });

  // Commodity data
  const commodityData = COMMODITIES.map(c => {
    const q = allQuotes.find(q => q.symbol === c.symbol);
    return {
      symbol: c.symbol,
      name: c.name,
      price: q?.data?.regularMarketPrice ?? 0,
      pct: q?.data?.regularMarketChangePercent ?? 0,
    };
  });

  // Meme quotes
  const memeQuotes = MEME_WATCHLIST.map(s => {
    const q = allQuotes.find(q => q.symbol === s);
    return { symbol: s, data: q?.data ?? null };
  });

  // Mega cap quotes for sparklines
  const megaQuotes = MEGA_CAPS.map(s => {
    const q = allQuotes.find(q => q.symbol === s);
    return { symbol: s, data: q?.data ?? null };
  }).filter(q => q.data);

  // Fear & Greed composite score
  const avgChangeMag = validAll.length > 0
    ? validAll.reduce((sum, q) => sum + Math.abs(q.data?.regularMarketChangePercent ?? 0), 0) / validAll.length
    : 0;
  const vixQuote = allQuotes.find(q => q.symbol === '^VIX');
  const vixValue = vixQuote?.data?.regularMarketPrice ?? 20;
  const bullPct = sentimentRatio * 100;
  const volatilityScore = Math.max(0, 100 - vixValue * 3);
  const magnitudeScore = Math.min(100, avgChangeMag * 30);
  const fearGreedScore = (bullPct * 0.5) + (volatilityScore * 0.3) + (magnitudeScore * 0.2);

  // Index correlation data
  const indexCorrelationData = INDICES.map((idx, i) => ({
    symbol: idx.symbol,
    name: idx.name,
    pct: indexQuotes[i]?.data?.regularMarketChangePercent ?? 0,
  }));

  // Average volumes (use a rough heuristic: 2x daily volume)
  const avgVolumes: Record<string, number> = {};
  validAll.forEach(q => {
    // Rough average: assume current volume is roughly average on normal days
    // Flag if any stock has volume much higher than typical
    avgVolumes[q.symbol] = (q.data?.regularMarketVolume ?? 0) * 0.5;
  });

  // Sparkline lookup
  const sparklineMap = new Map(sparklines.map(s => [s.symbol, s]));

  return (
    <div className="space-y-4">
      {/* Header Row: Title + Search + Auto-refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium text-foreground/70 uppercase tracking-[0.12em]">
            Daily Overview
          </h1>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <span className={`text-sm font-semibold ${sentimentColor}`}>
              {sentimentLabel}
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({advancing}/{totalTracked} up)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <QuickSearch />
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { setCountdown(REFRESH_INTERVAL); fetchData(true); }}
              className="p-1.5 rounded-md hover:bg-secondary/50 transition-colors"
              title="Refresh now"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
              {countdown}s
            </div>
          </div>
        </div>
      </div>

      {/* Last updated */}
      {lastUpdated && (
        <div className="text-[10px] text-muted-foreground/50">
          Updated {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Index Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {INDICES.map((idx, i) => {
          const q = indexQuotes[i]?.data;
          if (!q) return null;
          const pct = q.regularMarketChangePercent ?? 0;
          const isUp = pct >= 0;
          return (
            <div key={idx.symbol} className="border border-border rounded-md bg-card p-4 glow-interactive">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{idx.name}</span>
                {isUp ? <ArrowUpRight className="w-3.5 h-3.5 text-data-positive" /> : <ArrowDownRight className="w-3.5 h-3.5 text-data-negative" />}
              </div>
              <div className="text-xl sm:text-2xl font-semibold tabular-nums">{formatCurrency(q.regularMarketPrice ?? 0)}</div>
              <div className={`text-sm font-medium tabular-nums mt-1 ${isUp ? 'text-data-positive' : 'text-data-negative'}`}>
                {formatPercent(pct)} · {isUp ? '+' : ''}{(q.regularMarketChange ?? 0).toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Commodities & Crypto Strip */}
      <CommodityCryptoStrip items={commodityData} />

      {/* Heat Map - Centerpiece */}
      <HeatMapGrid quotes={allQuotes} />

      {/* Two-column: Sector Bars + Gauges */}
      <div className="grid md:grid-cols-2 gap-3">
        <SectorBars sectors={sectorData} />
        <div className="grid grid-cols-2 gap-3">
          <FearGreedGauge score={fearGreedScore} />
          <MarketCalendar />
        </div>
      </div>

      {/* Market Breadth */}
      <MarketBreadthMeter advancing={advancing} declining={declining} total={totalTracked} />

      {/* Mega Cap Cards with Sparklines */}
      <div className="border border-border rounded-md bg-card p-4">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-3">
          Mega Caps
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {megaQuotes.slice(0, 20).map(q => {
            const pct = q.data?.regularMarketChangePercent ?? 0;
            const isUp = pct >= 0;
            const spark = sparklineMap.get(q.symbol);
            return (
              <Link
                key={q.symbol}
                href={`/stock/${q.symbol}`}
                className="border border-border/50 rounded-md p-2.5 glow-interactive"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold">{q.symbol}</span>
                  {spark && <MiniSparkline data={spark} />}
                </div>
                <div className="text-sm font-semibold tabular-nums">{formatCurrency(q.data?.regularMarketPrice ?? 0)}</div>
                <div className={`text-[11px] font-medium tabular-nums ${isUp ? 'text-data-positive' : 'text-data-negative'}`}>
                  {formatPercent(pct)}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Three-column: Gainers + Losers + Meme */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className="border border-border rounded-md bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-data-positive" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Top Gainers</span>
          </div>
          <div className="space-y-2">
            {gainers.map(q => (
              <Link key={q.symbol} href={`/stock/${q.symbol}`} className="flex items-center justify-between py-1 glow-hover">
                <div>
                  <span className="text-sm font-semibold">{q.symbol}</span>
                  <span className="text-[11px] text-muted-foreground ml-2">{formatCurrency(q.data?.regularMarketPrice ?? 0)}</span>
                </div>
                <span className="text-sm font-medium text-data-positive tabular-nums glow-positive">
                  {formatPercent(q.data?.regularMarketChangePercent ?? 0)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="border border-border rounded-md bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-3.5 h-3.5 text-data-negative" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Top Losers</span>
          </div>
          <div className="space-y-2">
            {losers.map(q => (
              <Link key={q.symbol} href={`/stock/${q.symbol}`} className="flex items-center justify-between py-1 glow-hover">
                <div>
                  <span className="text-sm font-semibold">{q.symbol}</span>
                  <span className="text-[11px] text-muted-foreground ml-2">{formatCurrency(q.data?.regularMarketPrice ?? 0)}</span>
                </div>
                <span className="text-sm font-medium text-data-negative tabular-nums glow-negative">
                  {formatPercent(q.data?.regularMarketChangePercent ?? 0)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <MemeWatchlist quotes={memeQuotes} />
      </div>

      {/* Bottom row: Unusual Volume + Correlation */}
      <div className="grid md:grid-cols-2 gap-3">
        <UnusualVolume quotes={allQuotes} avgVolumes={avgVolumes} />
        <CorrelationMatrix indices={indexCorrelationData} />
      </div>
    </div>
  );
}
