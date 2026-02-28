import { getQuote } from '@/lib/yahoo';
import { formatPercent, formatCurrency, formatNumber } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { StockChart } from '@/components/stock-chart';
import Link from 'next/link';
import { StockNews } from './news';

export const revalidate = 300;

type Props = { params: Promise<{ symbol: string }> };

export default async function StockPage({ params }: Props) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();
  const quote = await getQuote(upperSymbol);

  if (!quote) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-sm">Could not load data for {upperSymbol}</p>
        <Link href="/" className="text-sm text-foreground/50 hover:text-foreground mt-2 inline-block">
          ← Back to overview
        </Link>
      </div>
    );
  }

  const pct = quote.regularMarketChangePercent ?? 0;
  const isUp = pct >= 0;

  const stats = [
    { label: 'Volume', value: formatNumber(quote.regularMarketVolume ?? 0) },
    { label: '52W High', value: formatCurrency(quote.fiftyTwoWeekHigh ?? 0) },
    { label: '52W Low', value: formatCurrency(quote.fiftyTwoWeekLow ?? 0) },
    { label: 'Day High', value: formatCurrency(quote.regularMarketDayHigh ?? 0) },
    { label: 'Day Low', value: formatCurrency(quote.regularMarketDayLow ?? 0) },
  ];

  return (
    <div className="space-y-6">
      <Link href="/" className="text-[11px] text-muted-foreground hover:text-foreground uppercase tracking-wider">
        ← Overview
      </Link>

      <div className="flex items-baseline gap-4">
        <h1 className="text-xl font-semibold">{upperSymbol}</h1>
        <span className="text-sm text-muted-foreground">{quote.shortName}</span>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold tabular-nums">
          {formatCurrency(quote.regularMarketPrice ?? 0)}
        </span>
        <span className={`flex items-center gap-1 text-sm font-medium ${isUp ? 'text-data-positive' : 'text-data-negative'}`}>
          {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {formatPercent(pct)}
        </span>
      </div>

      <StockChart symbol={upperSymbol} />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.label} className="border border-border rounded-md bg-card p-3">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{s.label}</div>
            <div className="text-sm font-semibold tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      <StockNews symbol={upperSymbol} />
    </div>
  );
}
