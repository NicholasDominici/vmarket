'use client';

import Link from 'next/link';
import { formatPercent, formatCurrency } from '@/lib/utils';
import { Flame } from 'lucide-react';

type QuoteItem = { symbol: string; data: Record<string, number> | null };

export function MemeWatchlist({ quotes }: { quotes: QuoteItem[] }) {
  const valid = quotes.filter(q => q.data);

  return (
    <div className="border border-border rounded-md bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-3.5 h-3.5 text-data-warning" />
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Meme Stocks</span>
      </div>
      <div className="space-y-1.5">
        {valid.map(q => {
          const pct = q.data?.regularMarketChangePercent ?? 0;
          const isUp = pct >= 0;
          return (
            <Link
              key={q.symbol}
              href={`/stock/${q.symbol}`}
              className="flex items-center justify-between py-0.5 glow-hover"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold w-10">{q.symbol}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {formatCurrency(q.data?.regularMarketPrice ?? 0)}
                </span>
              </div>
              <span className={`text-[11px] font-medium tabular-nums ${isUp ? 'text-data-positive' : 'text-data-negative'}`}>
                {formatPercent(pct)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
