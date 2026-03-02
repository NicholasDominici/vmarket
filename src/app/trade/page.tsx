'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
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
  getSpotData,
  type SpotData,
} from '@/lib/hyperliquid';
import {
  Loader2, RefreshCw, TrendingUp, TrendingDown,
  Flame, Gem, Droplets, Zap, Wallet, AlertTriangle,
} from 'lucide-react';

const REFRESH_INTERVAL = 15;

const COMMODITY_ICONS: Record<string, typeof Flame> = {
  'PAXG': Gem,
  'BTC': Flame,
  'ETH': Droplets,
  'SOL': Zap,
  'HYPE': TrendingUp,
  'AVAX': Flame,
};

const COMMODITY_LABELS: Record<string, string> = {
  'PAXG': 'Gold (PAXG)',
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'SOL': 'Solana',
  'HYPE': 'Hyperliquid',
  'AVAX': 'Avalanche',
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
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [commodities, setCommodities] = useState<CommodityData[]>([]);

  const [userState, setUserState] = useState<UserState | null>(null);
  const [spotData, setSpotData] = useState<SpotData[]>([]);
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
      setSpotData(getSpotData(mids));
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
            Perpetuals
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

      {/* Live Prices (24/7 via Hyperliquid) */}
      <div className="border border-border rounded-md bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-3.5 h-3.5 text-data-warning" />
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
            Live Prices — 24/7
          </span>
          <span className="text-[9px] text-data-positive px-1.5 py-0.5 border border-data-positive/30 rounded-sm ml-auto">
            LIVE
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {commodities.map((c) => {
            const Icon = COMMODITY_ICONS[c.symbol] || Flame;
            const label = COMMODITY_LABELS[c.symbol] || c.symbol;
            const price = c.markPrice || c.midPrice;
            const changePct = c.prevDayPx && c.prevDayPx > 0
              ? ((price - c.prevDayPx) / c.prevDayPx) * 100
              : 0;
            const isUp = changePct >= 0;
            const isExpanded = activePanel === c.symbol;
            const trade = getTradeState(c.symbol);
            return (
              <div key={c.symbol} className="border border-border/50 rounded-md glow-interactive">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-data-warning" />
                      <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
                      <span className="text-[9px] text-muted-foreground/50">{c.symbol}</span>
                    </div>
                    {isUp
                      ? <TrendingUp className="w-3 h-3 text-data-positive" />
                      : <TrendingDown className="w-3 h-3 text-data-negative" />}
                  </div>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-xl font-semibold tabular-nums">
                      {formatCurrency(price)}
                    </span>
                    <span className={`text-xs font-medium tabular-nums ${isUp ? 'text-data-positive' : 'text-data-negative'}`}>
                      {isUp ? '+' : ''}{changePct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[9px] text-muted-foreground/60">
                    <span>Vol: ${formatNumber(c.dayVolume)}</span>
                    <span>OI: ${formatNumber(c.openInterest)}</span>
                    <span>Fund: {c.funding >= 0 ? '+' : ''}{c.funding.toFixed(4)}%</span>
                  </div>
                  <button
                    onClick={() => setActivePanel(isExpanded ? null : c.symbol)}
                    className="mt-2 w-full text-center text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-wider py-1 border border-border/50 rounded-sm transition-colors hover:bg-secondary/30"
                  >
                    {isExpanded ? 'Close' : 'Trade'}
                  </button>
                </div>
                {isExpanded && (
                  <div className="border-t border-border p-3 space-y-2">
                    {!isConnected ? (
                      <button
                        onClick={() => openConnectModal?.()}
                        className="w-full py-2 text-xs font-medium rounded-md bg-purple-500 text-white hover:bg-purple-600 transition-all uppercase tracking-wider"
                      >
                        Connect Wallet to Trade
                      </button>
                    ) : (
                      <>
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateTrade(c.symbol, { side: 'long' })}
                            className={`flex-1 py-1.5 text-[10px] font-medium rounded-sm uppercase tracking-wider transition-colors ${
                              trade.side === 'long'
                                ? 'bg-data-positive text-white'
                                : 'border border-border text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Long
                          </button>
                          <button
                            onClick={() => updateTrade(c.symbol, { side: 'short' })}
                            className={`flex-1 py-1.5 text-[10px] font-medium rounded-sm uppercase tracking-wider transition-colors ${
                              trade.side === 'short'
                                ? 'bg-data-negative text-white'
                                : 'border border-border text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Short
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Size (USD)"
                            value={trade.size}
                            onChange={e => updateTrade(c.symbol, { size: e.target.value })}
                            className="flex-1 h-7 px-2 text-xs bg-secondary/30 border border-border rounded-sm tabular-nums"
                          />
                          <select
                            value={trade.leverage}
                            onChange={e => updateTrade(c.symbol, { leverage: parseInt(e.target.value) })}
                            className="h-7 px-2 text-xs bg-secondary/30 border border-border rounded-sm"
                          >
                            {[1,2,3,5,10,20,50].map(l => (
                              <option key={l} value={l}>{l}x</option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => handleTrade(c.symbol)}
                          className={`w-full py-2 text-xs font-medium rounded-sm uppercase tracking-wider transition-colors ${
                            trade.side === 'long'
                              ? 'bg-data-positive hover:bg-data-positive/80 text-white'
                              : 'bg-data-negative hover:bg-data-negative/80 text-white'
                          }`}
                        >
                          {trade.side === 'long' ? 'Buy Long' : 'Sell Short'} {c.symbol}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {commodities.length === 0 && (
            <div className="col-span-full text-xs text-muted-foreground">Loading prices...</div>
          )}
        </div>
      </div>

      {/* Spot Gold Tokens (24/7) */}
      {spotData.length > 0 && (
        <div className="border border-border rounded-md bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gem className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
              Spot Gold — Hyperliquid
            </span>
            <a
              href="https://app.hyperliquid.xyz/trade/xyz:GOLD"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-purple-400 hover:text-purple-300 ml-auto"
            >
              Trade on Hyperliquid →
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {spotData.map((s) => (
              <div key={s.name} className="border border-border/50 rounded-md p-3 glow-interactive">
                <div className="flex items-center gap-1.5 mb-1">
                  <Gem className="w-3 h-3 text-yellow-400" />
                  <span className="text-[10px] text-muted-foreground uppercase">{s.label}</span>
                </div>
                <div className="text-lg font-semibold tabular-nums">
                  ${s.midPrice < 1
                    ? s.midPrice.toFixed(6)
                    : s.midPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              </div>
            ))}
            {/* Also show PAXG perp for comparison */}
            {commodities.filter(c => c.symbol === 'PAXG').map(c => (
              <div key="paxg-ref" className="border border-border/50 rounded-md p-3 glow-interactive">
                <div className="flex items-center gap-1.5 mb-1">
                  <Gem className="w-3 h-3 text-yellow-400" />
                  <span className="text-[10px] text-muted-foreground uppercase">PAXG Perp</span>
                </div>
                <div className="text-lg font-semibold tabular-nums">
                  ${c.markPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <div className="text-[9px] text-muted-foreground/50 mt-1">Reference: physical gold</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connect Wallet Banner */}
      {!isConnected && (
        <div className="border-2 border-purple-500/30 rounded-md bg-purple-500/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-sm font-medium">Connect your wallet to start trading</div>
              <div className="text-xs text-muted-foreground">Trade perpetual futures on Hyperliquid DEX — BTC, ETH, SOL, Gold (PAXG) and more</div>
            </div>
          </div>
          <button
            onClick={() => openConnectModal?.()}
            className="h-8 px-4 text-xs font-medium rounded-md bg-purple-500 text-white hover:bg-purple-600 transition-all uppercase tracking-wider shrink-0"
          >
            Connect Wallet
          </button>
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-card border border-border rounded-md px-4 py-3 shadow-lg text-sm max-w-sm animate-in slide-in-from-bottom-2 fade-in z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
