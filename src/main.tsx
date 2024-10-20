import '@rainbow-me/rainbowkit/styles.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import Launch from './launch'
import Mint from './mint'

import {
  getDefaultConfig,
  RainbowKitProvider
} from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import {
  polygon,
  base
} from 'wagmi/chains'
import {
  QueryClientProvider,
  QueryClient
} from '@tanstack/react-query'
import { defineChain } from 'viem'

const harmony = defineChain({
  id: 1_666_600_000,
  name: 'Harmony One',
  nativeCurrency: {
    name: 'Harmony',
    symbol: 'ONE',
    decimals: 18
  },
  rpcUrls: { default: { http: ['https://api.harmony.one/'] } },
  blockExplorers: {
    default: {
      name: 'Harmony Explorer',
      url: 'https://explorer.harmony.one'
    }
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 24185753
    }
  }
})

const config = getDefaultConfig({
  appName: 'Omni Meme Food Factory',
  projectId: '3da27d3586709ecd7e2ddd7c15ab8d12',
  chains: [harmony, polygon, base]
})

const queryClient = new QueryClient()

const App = (): React.JSX.Element => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ChakraProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Launch />} />
                <Route path="/:address" element={<Mint />} />
              </Routes>
            </Router>
          </ChakraProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
