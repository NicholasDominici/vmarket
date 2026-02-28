'use client';

import { useState, useEffect } from 'react';
import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';

export function ConnectButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className="h-7 px-3 text-[11px] font-medium rounded-md border border-border text-muted-foreground uppercase tracking-wider opacity-50" disabled>
        Connect
      </button>
    );
  }

  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted: rMounted,
      }) => {
        const ready = rMounted;
        const connected = ready && account && chain;

        return (
          <div {...(!ready && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none' as const, userSelect: 'none' as const } })}>
            {!connected ? (
              <button onClick={openConnectModal} className="h-7 px-3 text-[11px] font-medium rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all uppercase tracking-wider">
                Connect
              </button>
            ) : chain.unsupported ? (
              <button onClick={openChainModal} className="h-7 px-3 text-[11px] font-medium rounded-md border border-data-negative text-data-negative uppercase tracking-wider">
                Wrong Network
              </button>
            ) : (
              <button onClick={openAccountModal} className="h-7 px-3 text-[11px] font-medium rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all tabular-nums">
                {account.displayName}
              </button>
            )}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}
