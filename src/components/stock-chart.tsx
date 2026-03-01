'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PERIODS = [
  { key: '1d', label: '1D' },
  { key: '5d', label: '5D' },
  { key: '1mo', label: '1M' },
  { key: '3mo', label: '3M' },
  { key: '6mo', label: '6M' },
  { key: '1y', label: '1Y' },
  { key: '5y', label: '5Y' },
] as const;

const INTRADAY_PERIODS = [
  { key: '1m', label: '1m' },
  { key: '5m', label: '5m' },
  { key: '15m', label: '15m' },
  { key: '30m', label: '30m' },
  { key: '1h', label: '1H' },
] as const;

function formatDateForPeriod(dateStr: string, period: string): string {
  const d = new Date(dateStr);
  if (['1m', '5m', '15m', '30m', '1h', '1d', '5d'].includes(period)) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (['1w', '1mo'].includes(period)) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (period === '3mo' || period === '6mo') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function StockChart({ symbol }: { symbol: string }) {
  const [period, setPeriod] = useState<string>('6mo');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIntraday, setShowIntraday] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/history?symbol=${symbol}&period=${period}`)
      .then(r => r.json())
      .then(d => {
        setData(
          (d.quotes || []).map((q: any) => ({
            date: formatDateForPeriod(q.date, period),
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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Price History</span>
        <div className="flex gap-1 flex-wrap">
          {/* Intraday toggle */}
          <button
            onClick={() => setShowIntraday(!showIntraday)}
            className={`px-2 py-0.5 text-[10px] rounded-sm uppercase tracking-wider transition-colors ${
              showIntraday ? 'bg-purple-500/20 text-purple-400' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Intraday
          </button>
          <div className="w-px bg-border mx-1" />
          {showIntraday && INTRADAY_PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-2 py-0.5 text-[10px] rounded-sm uppercase tracking-wider transition-colors ${
                period === p.key
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-2 py-0.5 text-[10px] rounded-sm uppercase tracking-wider transition-colors ${
                period === p.key
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
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
              tickFormatter={(v: number) => `$${v.toFixed(v >= 100 ? 0 : 2)}`}
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
