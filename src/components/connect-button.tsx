'use client';

import { useState, useEffect } from 'react';

export function ConnectButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="h-7 px-3 text-[11px] font-medium rounded-md border border-border text-muted-foreground uppercase tracking-wider opacity-50" disabled>
        Connect
      </button>
    );
  }

  return <ConnectButtonInner />;
}

function ConnectButtonInner() {
  // Dynamic import to avoid SSR issues
  const { ConnectButton: RainbowConnectButton } = require('@rainbow-me/rainbowkit');

  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }: any) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: { opacity: 0, pointerEvents: 'none' as const, userSelect: 'none' as const },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="h-7 px-3 text-[11px] font-medium rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all uppercase tracking-wider"
                  >
                    Connect
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="h-7 px-3 text-[11px] font-medium rounded-md border border-data-negative text-data-negative uppercase tracking-wider"
                  >
                    Wrong Network
                  </button>
                );
              }

              return (
                <button
                  onClick={openAccountModal}
                  className="h-7 px-3 text-[11px] font-medium rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all tabular-nums"
                >
                  {account.displayName}
                </button>
              );
            })()}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}
