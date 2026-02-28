'use client';

import Link from 'next/link';
import { formatPercent } from '@/lib/utils';

type QuoteItem = { symbol: string; data: Record<string, number> | null };

export function HeatMapGrid({ quotes }: { quotes: QuoteItem[] }) {
  const valid = quotes.filter(q => q.data);
  const sorted = [...valid].sort(
    (a, b) => Math.abs(b.data?.regularMarketChangePercent ?? 0) - Math.abs(a.data?.regularMarketChangePercent ?? 0)
  );

  return (
    <div className="border border-border rounded-md bg-card p-4">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-3">
        Market Heat Map
      </span>
      <div className="flex flex-wrap gap-1">
        {sorted.map(q => {
          const pct = q.data?.regularMarketChangePercent ?? 0;
          const intensity = Math.min(Math.abs(pct) / 4, 1);
          const bg = pct >= 0
            ? `rgba(62, 207, 142, ${0.08 + intensity * 0.45})`
            : `rgba(244, 91, 105, ${0.08 + intensity * 0.45})`;
          const size = Math.abs(pct) > 3 ? 'min-w-[85px] py-2.5' : 'min-w-[70px] py-1.5';
          return (
            <Link
              key={q.symbol}
              href={`/stock/${q.symbol}`}
              className={`border border-border/50 rounded-sm px-2 text-center transition-all hover:scale-105 hover:border-border ${size}`}
              style={{ background: bg }}
            >
              <div className="text-[10px] font-semibold truncate">{q.symbol}</div>
              <div className={`text-[10px] tabular-nums font-medium ${pct >= 0 ? 'text-data-positive' : 'text-data-negative'}`}>
                {formatPercent(pct)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
