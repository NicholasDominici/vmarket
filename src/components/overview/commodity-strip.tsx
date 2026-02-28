'use client';

import { formatCurrency, formatPercent } from '@/lib/utils';

type CommodityItem = {
  symbol: string;
  name: string;
  price: number;
  pct: number;
};

export function CommodityCryptoStrip({ items }: { items: CommodityItem[] }) {
  return (
    <div className="border border-border rounded-md bg-card p-3">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-2">
        Commodities & Crypto
      </span>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {items.map(item => {
          const isUp = item.pct >= 0;
          return (
            <div
              key={item.symbol}
              className="flex-shrink-0 border border-border/50 rounded-sm px-3 py-2 min-w-[120px] glow-interactive"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground uppercase">{item.name}</span>
              </div>
              <div className="text-sm font-semibold tabular-nums">{formatCurrency(item.price)}</div>
              <div className={`text-[11px] font-medium tabular-nums ${isUp ? 'text-data-positive' : 'text-data-negative'}`}>
                {formatPercent(item.pct)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
