'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

export function MarketBreadthMeter({ advancing, declining, total }: { advancing: number; declining: number; total: number }) {
  const ratio = total > 0 ? advancing / total : 0.5;
  const pct = (ratio * 100).toFixed(0);
  const label = ratio > 0.65 ? 'Strong' : ratio > 0.5 ? 'Lean Bull' : ratio > 0.35 ? 'Lean Bear' : 'Weak';
  const color = ratio > 0.6 ? 'text-data-positive' : ratio > 0.4 ? 'text-data-warning' : 'text-data-negative';

  return (
    <div className="border border-border rounded-md bg-card p-4">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-2">
        Market Breadth
      </span>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-data-positive" />
          <span className="text-sm font-semibold text-data-positive tabular-nums">{advancing}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingDown className="w-3.5 h-3.5 text-data-negative" />
          <span className="text-sm font-semibold text-data-negative tabular-nums">{declining}</span>
        </div>
        <span className={`text-sm font-semibold ml-auto ${color}`}>{label}</span>
      </div>
      <div className="w-full h-2.5 bg-secondary rounded-sm overflow-hidden flex">
        <div
          className="h-full bg-data-positive rounded-l-sm transition-all"
          style={{ width: `${pct}%` }}
        />
        <div
          className="h-full bg-data-negative rounded-r-sm transition-all"
          style={{ width: `${100 - Number(pct)}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">{pct}% advancing</span>
        <span className="text-[10px] text-muted-foreground">{total} tracked</span>
      </div>
    </div>
  );
}
