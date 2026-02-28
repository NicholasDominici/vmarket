'use client';

import { useState, useEffect, type ReactNode } from 'react';

function RainbowProviders({ children }: { children: ReactNode }) {
  // Only import RainbowKit on client side
  const [Provider, setProvider] = useState<React.ComponentType<{ children: ReactNode }> | null>(null);

  useEffect(() => {
    async function load() {
      const [rk, wagmiMod, chains, rq] = await Promise.all([
        import('@rainbow-me/rainbowkit'),
        import('wagmi'),
        import('wagmi/chains'),
        import('@tanstack/react-query'),
      ]);
      // CSS imported in providers.tsx

      const config = rk.getDefaultConfig({
        appName: 'vMarket',
        projectId: 'placeholder',
        chains: [chains.arbitrum],
        ssr: false,
      });

      const queryClient = new rq.QueryClient();

      const Wrapper = ({ children: c }: { children: ReactNode }) => (
        <wagmiMod.WagmiProvider config={config}>
          <rq.QueryClientProvider client={queryClient}>
            <rk.RainbowKitProvider
              theme={rk.darkTheme({
                accentColor: '#3ecf8e',
                accentColorForeground: '#0a0a0a',
                borderRadius: 'small',
                fontStack: 'system',
              })}
            >
              {c}
            </rk.RainbowKitProvider>
          </rq.QueryClientProvider>
        </wagmiMod.WagmiProvider>
      );
      Wrapper.displayName = 'WagmiWrapper';
      setProvider(() => Wrapper);
    }
    load();
  }, []);

  if (!Provider) return <>{children}</>;
  return <Provider>{children}</Provider>;
}

export function ClientProviders({ children }: { children: ReactNode }) {
  return <RainbowProviders>{children}</RainbowProviders>;
}
