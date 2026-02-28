'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

export function StockNews({ symbol }: { symbol: string }) {
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/news?q=${encodeURIComponent(symbol + ' stock')}`)
      .then(r => r.json())
      .then(items => setNews(items.slice(0, 8)))
      .catch(() => {});
  }, [symbol]);

  if (news.length === 0) return null;

  return (
    <div className="border border-border rounded-md bg-card p-4">
      <h2 className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Recent News</h2>
      <div className="space-y-3">
        {news.map((item: any, i: number) => (
          <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 group">
            <ExternalLink className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <div className="text-sm group-hover:text-foreground transition-colors glow-hover">{item.title}</div>
              {item.publisher && <div className="text-[11px] text-muted-foreground mt-0.5">{item.publisher}</div>}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
