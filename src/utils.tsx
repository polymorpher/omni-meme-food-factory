export interface ChainOptionType {
  value: string
  label: string
  symbol: string
}

export const chainOptions: ChainOptionType[] = [
  { value: 'bitcoin', label: 'Bitcoin', symbol: 'BTC' },
  { value: 'ethereum', label: 'Ethereum', symbol: 'ETH' },
  { value: 'polygon', label: 'Polygon', symbol: 'MATIC' },
  { value: 'harmony', label: 'Harmony', symbol: 'ONE' },
  { value: 'arbitrum', label: 'Arbitrum', symbol: 'ARB' },
  { value: 'base', label: 'Base', symbol: 'BASE' },
  { value: 'solana', label: 'Solana', symbol: 'SOL' },
  { value: 'avalanche', label: 'Avalanche', symbol: 'AVAX' }
]

export const updatedChainOptions: ChainOptionType[] = [
  { value: 'masterchain', label: 'MasterChain', symbol: 'MAS' },
  { value: 'bitcoin', label: 'Bitcoin', symbol: 'BTC' },
  { value: 'ethereum', label: 'Ethereum', symbol: 'ETH' },
  { value: 'polygon', label: 'Polygon', symbol: 'MATIC' },
  { value: 'harmony', label: 'Harmony', symbol: 'ONE' },
  { value: 'arbitrum', label: 'Arbitrum', symbol: 'ARB' },
  { value: 'base', label: 'Base', symbol: 'BASE' },
  { value: 'solana', label: 'Solana', symbol: 'SOL' },
  { value: 'avalanche', label: 'Avalanche', symbol: 'AVAX' }
]
