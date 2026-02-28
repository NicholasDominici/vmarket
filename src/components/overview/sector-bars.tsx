'use client';

import { formatPercent } from '@/lib/utils';

type SectorQuote = { symbol: string; name: string; pct: number };

export function SectorBars({ sectors }: { sectors: SectorQuote[] }) {
  const sorted = [...sectors].sort((a, b) => b.pct - a.pct);
  const maxAbs = Math.max(...sorted.map(s => Math.abs(s.pct)), 1);

  return (
    <div className="border border-border rounded-md bg-card p-4">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-3">
        Sector Performance
      </span>
      <div className="space-y-1.5">
        {sorted.map(s => {
          const isUp = s.pct >= 0;
          const barWidth = Math.max((Math.abs(s.pct) / maxAbs) * 100, 2);
          return (
            <div key={s.symbol} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-24 shrink-0 truncate">{s.name}</span>
              <div className="flex-1 h-4 bg-secondary/30 rounded-sm overflow-hidden relative">
                <div
                  className={`h-full rounded-sm ${isUp ? 'bg-data-positive/40' : 'bg-data-negative/40'}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className={`text-[10px] font-medium tabular-nums w-14 text-right ${isUp ? 'text-data-positive' : 'text-data-negative'}`}>
                {formatPercent(s.pct)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
