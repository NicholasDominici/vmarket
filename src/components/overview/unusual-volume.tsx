'use client';

import Link from 'next/link';
import { formatNumber, formatPercent } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

type QuoteItem = { symbol: string; data: Record<string, number> | null };

export function UnusualVolume({ quotes, avgVolumes }: { quotes: QuoteItem[]; avgVolumes: Record<string, number> }) {
  const unusual = quotes
    .filter(q => {
      if (!q.data) return false;
      const vol = q.data.regularMarketVolume ?? 0;
      const avg = avgVolumes[q.symbol] ?? 0;
      return avg > 0 && vol > avg * 2;
    })
    .map(q => ({
      symbol: q.symbol,
      volume: q.data?.regularMarketVolume ?? 0,
      avg: avgVolumes[q.symbol] ?? 0,
      ratio: (q.data?.regularMarketVolume ?? 0) / (avgVolumes[q.symbol] || 1),
      pct: q.data?.regularMarketChangePercent ?? 0,
    }))
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 8);

  if (unusual.length === 0) return null;

  return (
    <div className="border border-border rounded-md bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-3.5 h-3.5 text-data-warning" />
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Unusual Volume</span>
      </div>
      <div className="space-y-1.5">
        {unusual.map(u => {
          const isUp = u.pct >= 0;
          return (
            <Link
              key={u.symbol}
              href={`/stock/${u.symbol}`}
              className="flex items-center justify-between py-0.5 glow-hover"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-data-warning opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-data-warning" />
                </span>
                <span className="text-sm font-semibold">{u.symbol}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {formatNumber(u.volume)} ({u.ratio.toFixed(1)}x avg)
                </span>
                <span className={`text-[11px] font-medium tabular-nums w-14 text-right ${isUp ? 'text-data-positive' : 'text-data-negative'}`}>
                  {formatPercent(u.pct)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
