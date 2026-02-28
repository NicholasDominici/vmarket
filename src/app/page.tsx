'use client';

import { useEffect, useState } from 'react';
import { INDICES, TECH_STOCKS } from '@/lib/yahoo';
import { formatPercent, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';

type QuoteItem = { symbol: string; data: any };

export default function HomePage() {
  const [indexQuotes, setIndexQuotes] = useState<QuoteItem[]>([]);
  const [techQuotes, setTechQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [idxRes, techRes] = await Promise.all([
          fetch(`/api/quotes?symbols=${INDICES.map(i => i.symbol).join(',')}`),
          fetch(`/api/quotes?symbols=${TECH_STOCKS.join(',')}`),
        ]);
        if (!idxRes.ok || !techRes.ok) throw new Error('Failed to fetch quotes');
        setIndexQuotes(await idxRes.json());
        setTechQuotes(await techRes.json());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

  const validTech = techQuotes.filter(q => q.data);
  const positive = validTech.filter(q => (q.data?.regularMarketChangePercent ?? 0) > 0).length;
  const sentimentRatio = validTech.length > 0 ? positive / validTech.length : 0.5;
  const sentimentLabel = sentimentRatio > 0.65 ? 'Bullish' : sentimentRatio > 0.45 ? 'Neutral' : 'Bearish';
  const sentimentColor = sentimentRatio > 0.65 ? 'text-data-positive' : sentimentRatio > 0.45 ? 'text-data-warning' : 'text-data-negative';

  const sorted = [...validTech].sort((a, b) =>
    Math.abs(b.data?.regularMarketChangePercent ?? 0) - Math.abs(a.data?.regularMarketChangePercent ?? 0)
  );
  const gainers = sorted.filter(q => (q.data?.regularMarketChangePercent ?? 0) > 0).slice(0, 5);
  const losers = sorted.filter(q => (q.data?.regularMarketChangePercent ?? 0) < 0).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-medium text-foreground/70 uppercase tracking-[0.12em]">
          Daily Overview
        </h1>
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          <span className={`text-sm font-semibold ${sentimentColor}`}>
            {sentimentLabel}
          </span>
          <span className="text-[11px] text-muted-foreground">
            ({positive}/{validTech.length} up)
          </span>
        </div>
      </div>

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

      {/* Sentiment Bar */}
      <div className="border border-border rounded-md bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Tech Sector Sentiment</span>
          <span className={`text-sm font-semibold ${sentimentColor}`}>{(sentimentRatio * 100).toFixed(0)}% bullish</span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-sm overflow-hidden">
          <div className="h-full bg-data-positive rounded-sm transition-all" style={{ width: `${sentimentRatio * 100}%` }} />
        </div>
      </div>

      {/* Top Movers */}
      <div className="grid md:grid-cols-2 gap-3">
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
      </div>
    </div>
  );
}
