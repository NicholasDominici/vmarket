'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
// Safe wrapper - useAccount only works when WagmiProvider is mounted (client-side)
function useSafeAccount() {
  try {
    const wagmi = require('wagmi');
    return wagmi.useSafeAccount();
  } catch {
    return { address: undefined, isConnected: false };
  }
}
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  getMetaAndAssetCtxs,
  getAllMids,
  getUserState,
  getCommodityData,
  COMMODITY_PERPS,
  type CommodityData,
  type UserState,
  type AssetMeta,
  type AssetCtx,
} from '@/lib/hyperliquid';
import {
  Loader2, RefreshCw, TrendingUp, TrendingDown,
  Flame, Gem, Droplets, Zap, Wallet, AlertTriangle,
} from 'lucide-react';

const REFRESH_INTERVAL = 15;

const COMMODITY_ICONS: Record<string, typeof Flame> = {
  '@GOLD': Gem,
  '@SILVER': Gem,
  '@OIL': Droplets,
  '@GAS': Zap,
};

const COMMODITY_LABELS: Record<string, string> = {
  '@GOLD': 'Gold',
  '@SILVER': 'Silver',
  '@OIL': 'Crude Oil',
  '@GAS': 'Natural Gas',
};

const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 50];

type TradePanel = {
  symbol: string;
  side: 'long' | 'short';
  size: string;
  leverage: number;
  orderType: 'market' | 'limit';
  limitPrice: string;
};

export default function TradePage() {
  const { address, isConnected } = useSafeAccount();
  const [commodities, setCommodities] = useState<CommodityData[]>([]);
  const [userState, setUserState] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [toast, setToast] = useState('');
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [trades, setTrades] = useState<Record<string, TradePanel>>({});
  const countdownRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const getTradeState = (symbol: string): TradePanel => {
    return trades[symbol] ?? {
      symbol,
      side: 'long',
      size: '',
      leverage: 10,
      orderType: 'market',
      limitPrice: '',
    };
  };

  const updateTrade = (symbol: string, update: Partial<TradePanel>) => {
    setTrades(prev => ({
      ...prev,
      [symbol]: { ...getTradeState(symbol), ...update },
    }));
  };

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);

      const [metaAndCtxs, mids] = await Promise.all([
        getMetaAndAssetCtxs(),
        getAllMids(),
      ]);

      const [meta, assetCtxs] = metaAndCtxs;
      const data = getCommodityData(meta, assetCtxs, mids);
      setCommodities(data);
      setLastUpdated(new Date());
      setCountdown(REFRESH_INTERVAL);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      if (!isRefresh) setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchUserState = useCallback(async () => {
    if (!address) return;
    try {
      const state = await getUserState(address);
      setUserState(state);
    } catch {
      // User state is non-critical
    }
  }, [address]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch user state when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchUserState();
    } else {
      setUserState(null);
    }
  }, [isConnected, address, fetchUserState]);

  // Auto-refresh countdown
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchData(true);
          if (isConnected && address) fetchUserState();
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [fetchData, fetchUserState, isConnected, address]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleTrade = (symbol: string) => {
    const trade = getTradeState(symbol);
    const sizeNum = parseFloat(trade.size);
    if (!sizeNum || sizeNum <= 0) {
      setToast('Enter a valid size');
      return;
    }
    setToast(`🚧 Trade execution coming soon — ${trade.side === 'long' ? 'Buy Long' : 'Sell Short'} ${trade.size} ${symbol} @ ${trade.leverage}x`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading Hyperliquid data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-sm text-data-negative">{error}</div>
    );
  }

  // Commodity positions from user state
  const commodityPositions = userState?.assetPositions?.filter(
    ap => COMMODITY_PERPS.includes(ap.position.coin as typeof COMMODITY_PERPS[number])
  ) ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium text-foreground/70 uppercase tracking-[0.12em]">
            Commodity Perps
          </h1>
          <span className="text-[10px] text-muted-foreground px-2 py-0.5 border border-border rounded-sm">
            HYPERLIQUID DEX
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setCountdown(REFRESH_INTERVAL); fetchData(true); }}
            className="p-1.5 rounded-md hover:bg-secondary/50 transition-colors"
            title="Refresh now"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
            {countdown}s
          </div>
        </div>
      </div>

      {lastUpdated && (
        <div className="text-[10px] text-muted-foreground/50">
          Updated {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Wallet Info */}
      {isConnected && userState && (
        <div className="border border-border rounded-md bg-card p-4 glow-interactive">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-3.5 h-3.5 text-data-positive" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Account</span>
            <span className="text-[10px] text-muted-foreground ml-auto font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">Account Value</div>
              <div className="text-sm font-semibold tabular-nums">
                {formatCurrency(parseFloat(userState.marginSummary.accountValue))}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">USDC Balance</div>
              <div className="text-sm font-semibold tabular-nums">
                {formatCurrency(parseFloat(userState.marginSummary.totalRawUsd))}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">Total Position</div>
              <div className="text-sm font-semibold tabular-nums">
                {formatCurrency(parseFloat(userState.marginSummary.totalNtlPos))}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">Margin Used</div>
              <div className="text-sm font-semibold tabular-nums">
                {formatCurrency(parseFloat(userState.marginSummary.totalMarginUsed))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Open Commodity Positions */}
      {isConnected && commodityPositions.length > 0 && (
        <div className="border border-border rounded-md bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-data-positive" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Open Positions</span>
          </div>
          <div className="space-y-2">
            {commodityPositions.map(ap => {
              const pos = ap.position;
              const pnl = parseFloat(pos.unrealizedPnl);
              const isProfit = pnl >= 0;
              return (
                <div key={pos.coin} className="flex items-center justify-between border border-border/50 rounded-md p-3">
                  <div>
                    <span className="text-sm font-semibold">{pos.coin}</span>
                    <span className={`ml-2 text-[11px] ${parseFloat(pos.szi) > 0 ? 'text-data-positive' : 'text-data-negative'}`}>
                      {parseFloat(pos.szi) > 0 ? 'LONG' : 'SHORT'}
                    </span>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Size: {pos.szi} · Entry: {formatCurrency(parseFloat(pos.entryPx))} · {pos.leverage.value}x
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold tabular-nums ${isProfit ? 'text-data-positive' : 'text-data-negative'}`}>
                      {isProfit ? '+' : ''}{formatCurrency(pnl)}
                    </div>
                    <div className={`text-[11px] tabular-nums ${isProfit ? 'text-data-positive' : 'text-data-negative'}`}>
                      {parseFloat(pos.returnOnEquity) >= 0 ? '+' : ''}{(parseFloat(pos.returnOnEquity) * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Commodity Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {commodities.map(c => {
          const Icon = COMMODITY_ICONS[c.symbol] ?? Flame;
          const label = COMMODITY_LABELS[c.symbol] ?? c.symbol;
          const change24h = c.prevDayPx > 0
            ? ((c.midPrice - c.prevDayPx) / c.prevDayPx) * 100
            : 0;
          const isUp = change24h >= 0;
          const isExpanded = activePanel === c.symbol;
          const trade = getTradeState(c.symbol);

          return (
            <div key={c.symbol} className="border border-border rounded-md bg-card glow-interactive">
              {/* Price Card */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-data-warning" />
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</span>
                    <span className="text-[10px] text-muted-foreground/60">{c.symbol}</span>
                  </div>
                  {isUp
                    ? <TrendingUp className="w-3.5 h-3.5 text-data-positive" />
                    : <TrendingDown className="w-3.5 h-3.5 text-data-negative" />
                  }
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Mid Price</div>
                    <div className="text-lg font-semibold tabular-nums">
                      {formatCurrency(c.midPrice)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Mark Price</div>
                    <div className="text-lg font-semibold tabular-nums">
                      {formatCurrency(c.markPrice)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">24h Change</div>
                    <div className={`text-sm font-medium tabular-nums ${isUp ? 'text-data-positive' : 'text-data-negative'}`}>
                      {isUp ? '+' : ''}{change24h.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">24h Volume</div>
                    <div className="text-sm font-semibold tabular-nums">
                      ${formatNumber(c.dayVolume)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Funding Rate</div>
                    <div className={`text-sm font-medium tabular-nums ${c.funding >= 0 ? 'text-data-positive' : 'text-data-negative'}`}>
                      {c.funding >= 0 ? '+' : ''}{c.funding.toFixed(4)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Open Interest</div>
                    <div className="text-sm font-semibold tabular-nums">
                      ${formatNumber(c.openInterest)}
                    </div>
                  </div>
                </div>

                {/* Trade Toggle */}
                <button
                  onClick={() => setActivePanel(isExpanded ? null : c.symbol)}
                  className="mt-3 w-full text-center text-[11px] text-muted-foreground hover:text-foreground uppercase tracking-wider py-1.5 border border-border/50 rounded-sm transition-colors hover:bg-secondary/30"
                >
                  {isExpanded ? 'Close Trading Panel' : 'Open Trading Panel'}
                </button>
              </div>

              {/* Trading Panel */}
              {isExpanded && (
                <div className="border-t border-border p-4 space-y-3">
                  {!isConnected && (
                    <div className="flex items-center gap-2 text-[11px] text-data-warning">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Connect wallet to trade
                    </div>
                  )}

                  {/* Side Toggle */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateTrade(c.symbol, { side: 'long' })}
                      className={`py-2 text-sm font-medium rounded-md transition-all ${
                        trade.side === 'long'
                          ? 'bg-data-positive/20 text-data-positive border border-data-positive/30'
                          : 'border border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Buy Long
                    </button>
                    <button
                      onClick={() => updateTrade(c.symbol, { side: 'short' })}
                      className={`py-2 text-sm font-medium rounded-md transition-all ${
                        trade.side === 'short'
                          ? 'bg-data-negative/20 text-data-negative border border-data-negative/30'
                          : 'border border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Sell Short
                    </button>
                  </div>

                  {/* Order Type */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateTrade(c.symbol, { orderType: 'market' })}
                      className={`py-1.5 text-[11px] font-medium rounded-sm transition-all uppercase tracking-wider ${
                        trade.orderType === 'market'
                          ? 'bg-secondary text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Market
                    </button>
                    <button
                      onClick={() => updateTrade(c.symbol, { orderType: 'limit' })}
                      className={`py-1.5 text-[11px] font-medium rounded-sm transition-all uppercase tracking-wider ${
                        trade.orderType === 'limit'
                          ? 'bg-secondary text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Limit
                    </button>
                  </div>

                  {/* Size Input */}
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase block mb-1">Size (USD)</label>
                    <input
                      type="number"
                      value={trade.size}
                      onChange={e => updateTrade(c.symbol, { size: e.target.value })}
                      placeholder="0.00"
                      className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm tabular-nums placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow]"
                    />
                  </div>

                  {/* Limit Price (conditional) */}
                  {trade.orderType === 'limit' && (
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase block mb-1">Limit Price</label>
                      <input
                        type="number"
                        value={trade.limitPrice}
                        onChange={e => updateTrade(c.symbol, { limitPrice: e.target.value })}
                        placeholder={c.midPrice.toFixed(2)}
                        className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm tabular-nums placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow]"
                      />
                    </div>
                  )}

                  {/* Leverage Selector */}
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase block mb-1">
                      Leverage: {trade.leverage}x
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {LEVERAGE_OPTIONS.map(lev => (
                        <button
                          key={lev}
                          onClick={() => updateTrade(c.symbol, { leverage: lev })}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-sm transition-all ${
                            trade.leverage === lev
                              ? 'bg-secondary text-foreground'
                              : 'border border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
                          }`}
                        >
                          {lev}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  {trade.size && parseFloat(trade.size) > 0 && (
                    <div className="border border-border/50 rounded-md p-2.5 text-[11px] text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Notional</span>
                        <span className="tabular-nums">{formatCurrency(parseFloat(trade.size))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Margin Required</span>
                        <span className="tabular-nums">{formatCurrency(parseFloat(trade.size) / trade.leverage)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Leverage</span>
                        <span className="tabular-nums">{trade.leverage}x</span>
                      </div>
                    </div>
                  )}

                  {/* Execute Button */}
                  <button
                    onClick={() => handleTrade(c.symbol)}
                    className={`w-full py-2.5 text-sm font-semibold rounded-md transition-all ${
                      trade.side === 'long'
                        ? 'bg-data-positive/20 text-data-positive border border-data-positive/30 hover:bg-data-positive/30'
                        : 'bg-data-negative/20 text-data-negative border border-data-negative/30 hover:bg-data-negative/30'
                    }`}
                  >
                    {trade.side === 'long' ? 'Buy Long' : 'Sell Short'} {label}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Not Connected Prompt */}
      {!isConnected && (
        <div className="border border-border rounded-md bg-card p-6 text-center">
          <Wallet className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
          <div className="text-sm text-muted-foreground">
            Connect your wallet to view balances and trade
          </div>
          <div className="text-[10px] text-muted-foreground/50 mt-1">
            Use the connect button in the header
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-card border border-border rounded-md px-4 py-3 shadow-lg text-sm max-w-sm animate-in slide-in-from-bottom-2 fade-in z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
