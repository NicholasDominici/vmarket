'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, darkTheme, connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  rainbowWallet,
  coinbaseWallet,
  rabbyWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { arbitrum } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, type ReactNode } from 'react';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [metaMaskWallet, rabbyWallet, coinbaseWallet, rainbowWallet, walletConnectWallet],
    },
  ],
  {
    appName: 'vMarket',
    projectId: '4e8e6bca-cdf3-46ef-abb2-02d008aa0c6b', // Not used for injected wallets
  }
);

const config = createConfig({
  connectors,
  chains: [arbitrum],
  transports: {
    [arbitrum.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function ClientProviders({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {mounted ? (
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: '#3ecf8e',
              accentColorForeground: '#0a0a0a',
              borderRadius: 'small',
              fontStack: 'system',
            })}
          >
            {children}
          </RainbowKitProvider>
        ) : (
          children
        )}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
