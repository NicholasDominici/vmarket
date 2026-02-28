'use client';

import { useEffect, useState } from 'react';
import { TECH_STOCKS } from '@/lib/yahoo';
import { formatPercent, formatCurrency, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';

const FAANG_PLUS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX'];

type QuoteItem = { symbol: string; data: any };

export default function TechPage() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/quotes?symbols=${TECH_STOCKS.join(',')}`);
        if (!res.ok) throw new Error('Failed to fetch');
        setQuotes(await res.json());
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
        <span className="ml-2 text-sm text-muted-foreground">Loading tech stocks...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-sm text-data-negative">{error}</div>;
  }

  const valid = quotes.filter(q => q.data);
  const faang = valid.filter(q => FAANG_PLUS.includes(q.symbol));
  const sorted = [...valid].sort(
    (a, b) => (b.data?.regularMarketChangePercent ?? 0) - (a.data?.regularMarketChangePercent ?? 0)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-sm font-medium text-foreground/70 uppercase tracking-[0.12em]">
        Tech Sector
      </h1>

      {/* FAANG+ Grid */}
      <div>
        <h2 className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">FAANG+ & Mega Cap</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {faang.map(q => {
            const pct = q.data?.regularMarketChangePercent ?? 0;
            const isUp = pct >= 0;
            return (
              <Link key={q.symbol} href={`/stock/${q.symbol}`} className="border border-border rounded-md bg-card p-4 glow-interactive">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{q.symbol}</span>
                  {isUp ? <ArrowUpRight className="w-3.5 h-3.5 text-data-positive" /> : <ArrowDownRight className="w-3.5 h-3.5 text-data-negative" />}
                </div>
                <div className="text-sm font-semibold tabular-nums">{formatCurrency(q.data?.regularMarketPrice ?? 0)}</div>
                <div className={`text-sm font-medium tabular-nums mt-1 ${isUp ? 'text-data-positive' : 'text-data-negative'}`}>
                  {formatPercent(pct)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  MCap {formatNumber(q.data?.marketCap ?? 0)}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Heatmap */}
      <div>
        <h2 className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Sector Heatmap</h2>
        <div className="flex flex-wrap gap-1.5">
          {sorted.map(q => {
            const pct = q.data?.regularMarketChangePercent ?? 0;
            const intensity = Math.min(Math.abs(pct) / 5, 1);
            const bg = pct >= 0
              ? `rgba(62, 207, 142, ${0.1 + intensity * 0.4})`
              : `rgba(244, 91, 105, ${0.1 + intensity * 0.4})`;
            return (
              <Link key={q.symbol} href={`/stock/${q.symbol}`} className="border border-border rounded-sm px-3 py-2 text-center min-w-[80px] transition-all hover:scale-105" style={{ background: bg }}>
                <div className="text-[11px] font-semibold">{q.symbol}</div>
                <div className={`text-[11px] tabular-nums font-medium ${pct >= 0 ? 'text-data-positive' : 'text-data-negative'}`}>
                  {formatPercent(pct)}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Performance Table */}
      <div className="border border-border rounded-md bg-card p-4">
        <h2 className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Daily Performance</h2>
        <div className="space-y-1">
          {sorted.map(q => {
            const pct = q.data?.regularMarketChangePercent ?? 0;
            const isUp = pct >= 0;
            const barWidth = Math.min(Math.abs(pct) * 10, 100);
            return (
              <Link key={q.symbol} href={`/stock/${q.symbol}`} className="flex items-center gap-3 py-1 group">
                <span className="text-sm font-semibold w-12 shrink-0 glow-hover">{q.symbol}</span>
                <div className="flex-1 h-4 bg-secondary/50 rounded-sm overflow-hidden relative">
                  <div className={`h-full rounded-sm ${isUp ? 'bg-data-positive/30' : 'bg-data-negative/30'}`} style={{ width: `${barWidth}%` }} />
                </div>
                <span className={`text-[11px] font-medium tabular-nums w-16 text-right ${isUp ? 'text-data-positive' : 'text-data-negative'}`}>
                  {formatPercent(pct)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
