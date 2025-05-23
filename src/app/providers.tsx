/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiConfig, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';
import { config } from '@/lib/config';

const { connectors } = getDefaultWallets({
  appName: 'FOMOGOD',
  projectId: config.projectId,
});

const wagmiConfig = createConfig({
  connectors,
  ...config
} as any);

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
} 