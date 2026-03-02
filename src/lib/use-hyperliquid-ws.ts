'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { COMMODITY_PERPS } from './hyperliquid';

const WS_URL = 'wss://api.hyperliquid.xyz/ws';

type LivePrices = Record<string, number>;

export function useHyperliquidWs() {
  const [prices, setPrices] = useState<LivePrices>({});
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({
        method: 'subscribe',
        subscription: { type: 'allMids' },
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.channel === 'allMids' && msg.data?.mids) {
          const mids = msg.data.mids;
          const updated: LivePrices = {};
          for (const sym of COMMODITY_PERPS) {
            if (mids[sym]) {
              updated[sym] = parseFloat(mids[sym]);
            }
          }
          // Also grab spot tokens
          if (mids['@115']) updated['@115'] = parseFloat(mids['@115']);
          if (mids['@182']) updated['@182'] = parseFloat(mids['@182']);
          
          setPrices(prev => ({ ...prev, ...updated }));
        }
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);
      // Reconnect after 2s
      reconnectRef.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { prices, connected };
}
