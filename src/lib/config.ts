import { cookieStorage, createStorage, http } from 'wagmi'
import { defineChain } from 'viem'

// Get projectId from https://cloud.walletconnect.com
export const projectId = 'af6407627e12b9137d2e249a283638e5'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const taraxaMainnet = defineChain({
  id: 841,
  name: 'Taraxa Mainnet',
  network: 'taraxa',
  nativeCurrency: {
    decimals: 18,
    name: 'TARA',
    symbol: 'TARA',
  },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.taraxa.io/'] },
    public: { http: ['https://rpc.mainnet.taraxa.io/'] },
  },
  blockExplorers: {
    default: { name: 'Taraxa Explorer', url: 'https://explorer.mainnet.taraxa.io/' },
  },
})

export const networks = [taraxaMainnet]

export const config = {
  chains: networks,
  transports: {
    [taraxaMainnet.id]: http(),
  },
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
} 