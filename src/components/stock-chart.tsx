'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PERIODS = ['1mo', '3mo', '6mo', '1y'] as const;

export function StockChart({ symbol }: { symbol: string }) {
  const [period, setPeriod] = useState<string>('6mo');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/history?symbol=${symbol}&period=${period}`)
      .then(r => r.json())
      .then(d => {
        setData(
          (d.quotes || []).map((q: any) => ({
            date: new Date(q.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            close: q.close,
          }))
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [symbol, period]);

  const isUp = data.length > 1 && (data[data.length - 1]?.close ?? 0) >= (data[0]?.close ?? 0);
  const color = isUp ? '#3ecf8e' : '#f45b69';

  return (
    <div className="border border-border rounded-md bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Price History</span>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2 py-0.5 text-[10px] rounded-sm uppercase tracking-wider transition-colors ${
                period === p
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="h-[300px] flex items-center justify-center text-xs text-muted-foreground">
          Loading...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#6e7681' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['auto', 'auto']}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#6e7681' }}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              width={60}
            />
            <Tooltip
              contentStyle={{
                background: 'oklch(0.12 0 0)',
                border: '1px solid oklch(1 0 0 / 6%)',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'Geist Mono, monospace',
              }}
              labelStyle={{ color: '#6e7681' }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Close']}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#gradient-${symbol})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
