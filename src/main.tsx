import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, Box, VStack, Heading, Text, Button, Input, HStack, Link, Container, FormControl, IconButton, Tooltip } from '@chakra-ui/react'
import { Image, Sparkles } from 'lucide-react'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http()
})

const App = (): React.JSX.Element => {
  const [prompt, setPrompt] = useState('')

  const handleInitialSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    console.log('Submitted prompt:', prompt)

    try {
      const blockNumber = await client.getBlockNumber()
      console.log('Current block number:', blockNumber)
    } catch (error) {
      console.error('Error fetching block number:', error)
    }
  }

  const handleAutoGenerate = (): void => {
    const generatedPrompt = 'Sichuan Hotpot'
    setPrompt(generatedPrompt)
  }

  const handleButtonClick = (text: string): void => {
    setPrompt(text)
  }

  return (
    <ChakraProvider>
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="flex-start"
        alignItems="center"
        minHeight="100vh"
        bg="white"
        color="gray.700"
        pt="10%"
      >
        <Container maxW="600px" width="80%">
          <VStack spacing={8} align="center">
            <Heading
              as="h1"
              fontSize="5xl"
              bgGradient="linear(to-r, #ff79c6, #bd93f9, #8be9fd)"
              bgClip="text"
              textAlign="center"
            >
              Hello, Yanhe!
            </Heading>
            <Text fontSize="md" color="gray.600" textAlign="center">
              I will provide some example prompt for generating food meme coin.
            </Text>
            <HStack spacing={4}>
              <Button
                colorScheme="gray"
                variant="outline"
                borderRadius="full"
                onClick={() => { handleButtonClick('Spaghetti alla Carbonara') }}
              >
                Spaghetti alla Carbonara
              </Button>
              <Button
                colorScheme="gray"
                variant="outline"
                borderRadius="full"
                onClick={() => { handleButtonClick('Hainanese Chicken Rice') }}
              >
                Hainanese Chicken Rice
              </Button>
            </HStack>
            <FormControl as="form" onSubmit={handleInitialSubmit}>
              <HStack>
                <Input
                  value={prompt}
                  onChange={
                    (e) => { setPrompt(e.target.value) }
                  }
                  placeholder="Enter your food prompt here"
                  borderRadius="full"
                />
                <Tooltip label="auto-generate prompt">
                  <IconButton
                    aria-label="Auto-generate prompt"
                    icon={<Sparkles size={20} />}
                    onClick={handleAutoGenerate}
                    borderRadius="full"
                  />
                </Tooltip>
                <Tooltip label="generate food meme">
                  <IconButton
                    aria-label="Generate meme"
                    icon={<Image size={20} />}
                    type="submit"
                    borderRadius="full"
                  />
                </Tooltip>
              </HStack>
            </FormControl>
          </VStack>
        </Container>
        <Text fontSize="sm" color="gray.500" mt={8} textAlign="center">
          AI sometimes generates inaccurate info, so double-check responses.{' '}
        </Text>
      </Box>
    </ChakraProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
