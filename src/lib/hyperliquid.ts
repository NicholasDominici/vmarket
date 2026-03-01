const INFO_URL = '/api/hyperliquid';

export const COMMODITY_PERPS = ['PAXG', 'BTC', 'ETH', 'SOL', 'HYPE', 'AVAX'] as const;
export type CommodityPerp = (typeof COMMODITY_PERPS)[number];

export type AssetMeta = {
  name: string;
  szDecimals: number;
};

export type AssetCtx = {
  funding: string;
  openInterest: string;
  prevDayPx: string;
  dayNtlVlm: string;
  markPx: string;
};

export type CommodityData = {
  symbol: string;
  midPrice: number;
  markPrice: number;
  funding: number;
  openInterest: number;
  dayVolume: number;
  prevDayPx: number;
};

export type UserPosition = {
  coin: string;
  szi: string;
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  leverage: { type: string; value: number };
};

export type UserState = {
  marginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
    totalMarginUsed: string;
  };
  assetPositions: { position: UserPosition }[];
};

async function postInfo(body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(INFO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Hyperliquid API error: ${res.status}`);
  return res.json();
}

export async function getMeta(): Promise<{ universe: AssetMeta[] }> {
  return postInfo({ type: 'meta' }) as Promise<{ universe: AssetMeta[] }>;
}

export async function getAllMids(): Promise<Record<string, string>> {
  return postInfo({ type: 'allMids' }) as Promise<Record<string, string>>;
}

export async function getMetaAndAssetCtxs(): Promise<[{ universe: AssetMeta[] }, AssetCtx[]]> {
  return postInfo({ type: 'metaAndAssetCtxs' }) as Promise<[{ universe: AssetMeta[] }, AssetCtx[]]>;
}

export async function getUserState(user: string): Promise<UserState> {
  return postInfo({ type: 'clearinghouseState', user }) as Promise<UserState>;
}

export async function getL2Book(coin: string): Promise<{ levels: Array<Array<{ px: string; sz: string; n: number }>> }> {
  return postInfo({ type: 'l2Book', coin }) as Promise<{ levels: Array<Array<{ px: string; sz: string; n: number }>> }>;
}


// Spot tokens of interest (gold-related)
export const SPOT_TOKENS = [
  { name: 'GOLD', spotSymbol: '@115', label: 'HyperGold (HOLD)', fullName: 'HyperGold' },
  { name: 'XAUT', spotSymbol: '@182', label: 'Tether Gold (XAUT)', fullName: 'XAUT0' },
] as const;

export type SpotData = {
  name: string;
  label: string;
  midPrice: number;
};

export function getSpotData(mids: Record<string, string>): SpotData[] {
  return SPOT_TOKENS.map(t => ({
    name: t.name,
    label: t.label,
    midPrice: mids[t.spotSymbol] ? parseFloat(mids[t.spotSymbol]) : 0,
  }));
}

export function getCommodityData(
  meta: { universe: AssetMeta[] },
  assetCtxs: AssetCtx[],
  mids: Record<string, string>
): CommodityData[] {
  return COMMODITY_PERPS.map(symbol => {
    const idx = meta.universe.findIndex(a => a.name === symbol);
    const ctx = idx >= 0 ? assetCtxs[idx] : null;
    const mid = mids[symbol];

    return {
      symbol,
      midPrice: mid ? parseFloat(mid) : 0,
      markPrice: ctx ? parseFloat(ctx.markPx) : 0,
      funding: ctx ? parseFloat(ctx.funding) * 100 : 0,
      openInterest: ctx ? parseFloat(ctx.openInterest) : 0,
      dayVolume: ctx ? parseFloat(ctx.dayNtlVlm) : 0,
      prevDayPx: ctx ? parseFloat(ctx.prevDayPx) : 0,
    };
  });
}
