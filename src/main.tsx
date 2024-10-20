import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, Box, VStack, Heading, Text } from '@chakra-ui/react'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http()
})

const App = (): React.JSX.Element => {
  const [blockNumber, setBlockNumber] = useState<bigint | null>(null)

  return (
    <ChakraProvider>
      <Box p={8}>
        <VStack spacing={4} align="stretch">
          <Heading>Ethereum Block Explorer</Heading>
          <Text>Current Block Number: {blockNumber ? blockNumber.toString() : 'Loading...'}</Text>
        </VStack>
      </Box>
    </ChakraProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
