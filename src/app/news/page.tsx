'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Clock, Loader2 } from 'lucide-react';

export default function NewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [techRes, marketRes] = await Promise.all([
          fetch('/api/news?q=technology+stocks+FAANG+AI'),
          fetch('/api/news?q=stock+market+today'),
        ]);
        const tech = await techRes.json();
        const market = await marketRes.json();
        const seen = new Set<string>();
        const all = [...tech, ...market].filter((item: any) => {
          if (seen.has(item.title)) return false;
          seen.add(item.title);
          return true;
        });
        setNews(all);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading news...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-sm font-medium text-foreground/70 uppercase tracking-[0.12em]">
        Market News
      </h1>

      <div className="space-y-2">
        {news.map((item: any, i: number) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-border rounded-md bg-card p-4 glow-interactive"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-relaxed">
                  {item.title}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  {item.publisher && <span className="text-[11px] text-muted-foreground">{item.publisher}</span>}
                  {item.providerPublishTime && (
                    <>
                      <span className="text-[11px] text-muted-foreground">·</span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(item.providerPublishTime * 1000).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 mt-1" />
            </div>
          </a>
        ))}
        {news.length === 0 && (
          <div className="text-center py-20 text-sm text-muted-foreground">
            No news available at the moment.
          </div>
        )}
      </div>
    </div>
  );
}
