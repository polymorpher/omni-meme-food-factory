import React, { useState, useRef } from 'react'
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Input,
  HStack,
  Container,
  FormControl,
  IconButton,
  Tooltip,
  useToast,
  Image as ChakraImage,
  Progress,
  Grid,
  GridItem,
  Textarea,
  Select,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react'
import { Image, Sparkles, ArrowRight } from 'lucide-react'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { chainOptions, type ChainOptionType } from './utils'
import { ConnectButton } from '@rainbow-me/rainbowkit'

const client = createPublicClient({
  chain: mainnet,
  transport: http()
})

interface MemeResponse {
  message: string
  url_path: string
}

interface RecipeResponse {
  message: string
  recipe: string
}

const Launch = (): React.JSX.Element => {
  const [prompt, setPrompt] = useState('')
  const [urlPath, setUrlPath] = useState('')
  const [recipe, setRecipe] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecipeLoading, setIsRecipeLoading] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const launchParamsRef = useRef<HTMLDivElement>(null)
  const memeRecipeRef = useRef<HTMLDivElement>(null)
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [maxSupply, setMaxSupply] = useState('1000000')
  const [priceMode, setPriceMode] = useState('Constant')
  const [constantA, setConstantA] = useState('1')
  const [constantB, setConstantB] = useState('0')
  const [constantC, setConstantC] = useState('0')
  const [selectedChain, setSelectedChain] = useState('ethereum')
  const toast = useToast()

  const generateRecipe = async (prompt: string): Promise<void> => {
    setIsRecipeLoading(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      if (!response.ok) {
        throw new Error('Failed to generate recipe')
      }

      const data: RecipeResponse = await response.json()
      setRecipe(data.recipe)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate recipe. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setIsRecipeLoading(false)
    }
  }

  const generateMeme = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    console.log('Submitted prompt:', prompt)
    setIsLoading(true)
    setUrlPath('')
    setRecipe('')

    try {
      const blockNumber = await client.getBlockNumber()
      console.log('Current block number:', blockNumber)

      // Generate meme
      const response = await fetch('http://127.0.0.1:8000/generate-and-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          size: '1024x1024',
          quality: 'standard',
          n: 1,
          response_format: 'url'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate meme')
      }

      const data: MemeResponse = await response.json()
      setUrlPath(data.url_path)

      setTimeout(() => {
        if (memeRecipeRef.current) {
          memeRecipeRef.current.scrollIntoView({ behavior: 'smooth' })
        } else {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
          })
        }
      }, 100)

      // Generate recipe
      await generateRecipe(prompt)

      toast({
        title: 'Meme and Recipe generated',
        description: 'Your meme and recipe are ready!',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate meme or recipe. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAutoGenerate = (): void => {
    const generatedPrompt = 'Sichuan Hotpot'
    setPrompt(generatedPrompt)
  }

  const handleButtonClick = (text: string): void => {
    setPrompt(text)
  }

  const handleRecipeChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setRecipe(e.target.value)
  }

  const showLaunchParams = (): void => {
    setIsLaunching(true)
    setTimeout(() => {
      if (launchParamsRef.current) {
        launchParamsRef.current.scrollIntoView({ behavior: 'smooth' })
      } else {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        })
      }
    }, 100)
  }

  const connectWallet = (e: React.FormEvent): void => {
    e.preventDefault()
    const simulatedAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
    setWalletAddress(simulatedAddress)
    setIsWalletConnected(true)
  }

  const handleLaunch = (e: React.FormEvent): void => {
    e.preventDefault()
    console.log('Launching with parameters:', {
      name,
      symbol,
      maxSupply,
      priceMode,
      constantA,
      constantB,
      constantC,
      chain: selectedChain
    })
    toast({
      title: 'Launch Initiated',
      description: `Your food meme coin is being launched on ${selectedChain}!`,
      status: 'success',
      duration: 3000,
      isClosable: true
    })
  }

  const ChainOption: React.FC<ChainOptionType> = ({ value, label, symbol }) => (
    <HStack spacing={2} align="center">
      <Text fontWeight="bold">{label}</Text>
      <Text color="gray.500" fontSize="sm"> {symbol}</Text>
    </HStack>
  )

  return (
    <Box
        display="flex"
        flexDirection="column"
        justifyContent="flex-start"
        alignItems="center"
        minHeight="100vh"
        bg="gray.50"
        color="gray.700"
        pt="5%"
      >
      <Container maxW="1200px" width="90%">
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
            I will provide some example prompts for generating food meme coins.
          </Text>
          <HStack spacing={4}>
            <Button
                    colorScheme="purple"
                    variant="outline"
                    borderRadius="full"
                    onClick={() => { handleButtonClick('Spaghetti alla Carbonara') }}
                  >
              Spaghetti alla Carbonara
            </Button>
            <Button
                    colorScheme="purple"
                    variant="outline"
                    borderRadius="full"
                    onClick={() => { handleButtonClick('Hainanese Chicken Rice') }}
                  >
              Hainanese Chicken Rice
            </Button>
          </HStack>
          <FormControl as="form" onSubmit={generateMeme}>
            <HStack>
              <Input
                      value={prompt}
                      onChange={(e) => { setPrompt(e.target.value) }}
                      placeholder="Enter your food prompt here"
                      borderRadius="full"
                      bg="white"
                    />
              <Tooltip label="auto-generate prompt">
                <IconButton
                        aria-label="Auto-generate prompt"
                        icon={<Sparkles size={20} />}
                        onClick={handleAutoGenerate}
                        borderRadius="full"
                        colorScheme="purple"
                      />
              </Tooltip>
              <Tooltip label="generate food meme and recipe">
                <IconButton
                        aria-label="Generate meme and recipe"
                        icon={<Image size={20} />}
                        type="submit"
                        borderRadius="full"
                        colorScheme="purple"
                      />
              </Tooltip>
            </HStack>
          </FormControl>
          {isLoading && (
          <Box w="100%">
            <Text mb={2}>Generating meme and recipe...</Text>
            <Progress size="xs" isIndeterminate colorScheme="purple" />
          </Box>
          )}
          {urlPath && recipe && (
          <Grid templateColumns="repeat(2, 1fr)" gap={6} w="100%" h="600px" ref={memeRecipeRef}>
            <GridItem h="100%">
              <Box bg="white" p={6} borderRadius="md" boxShadow="md" h="100%" display="flex" flexDirection="column">
                <Text fontSize="xl" fontWeight="bold" mb={4}>Generated Meme</Text>
                <Box flex="1" position="relative">
                  <ChakraImage
                        src={urlPath}
                        alt="Generated Meme"
                        objectFit="contain"
                        w="100%"
                        h="100%"
                        position="absolute"
                        top="0"
                        left="0"
                      />
                </Box>
              </Box>
            </GridItem>
            <GridItem h="100%">
              <Box bg="white" p={6} borderRadius="md" boxShadow="md" h="100%" display="flex" flexDirection="column">
                <HStack justifyContent="space-between" mb={4}>
                  <Text fontSize="xl" fontWeight="bold">Generated Recipe</Text>
                  <Tooltip label="Regenerate recipe">
                    <IconButton
                          aria-label="Regenerate recipe"
                          icon={<Sparkles size={20} />}
                          onClick={async () => { await generateRecipe(prompt) }}
                          isLoading={isRecipeLoading}
                          colorScheme="purple"
                        />
                  </Tooltip>
                </HStack>
                <Textarea
                      value={recipe}
                      onChange={handleRecipeChange}
                      flex="1"
                      resize="none"
                    />
                <Button
                      mt={4}
                      colorScheme="purple"
                      onClick={showLaunchParams}
                      leftIcon={<ArrowRight size={20} />}
                    >
                  Proceed to Launch
                </Button>
              </Box>
            </GridItem>
          </Grid>
          )}
          {isLaunching && (
          <Box w="100%" bg="white" p={6} borderRadius="md" boxShadow="md" ref={launchParamsRef}>
            <Heading size="md" mb={4}>Launch Parameters</Heading>
            <form onSubmit={handleLaunch}>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input value={name} onChange={(e) => { setName(e.target.value) }} placeholder="e.g. Spaghetti Coin" />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Symbol</FormLabel>
                  <Input value={symbol} onChange={(e) => { setSymbol(e.target.value) }} placeholder="e.g. SPGH" />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Max Supply</FormLabel>
                  <NumberInput min={1} max={18_466_744_073_709} value={maxSupply} onChange={(valueString) => { setMaxSupply(valueString) }}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Chain</FormLabel>
                  <Select
                        value={selectedChain}
                        onChange={(e) => { setSelectedChain(e.target.value) }}
                        sx={{
                          '& > option': {
                            background: 'white',
                            color: 'black',
                            padding: '10px'
                          }
                        }}
                      >
                    {chainOptions.map((chain) => (
                      <option key={chain.value} value={chain.value}>
                        <ChainOption {...chain} />
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Price Mode</FormLabel>
                  <Select value={priceMode} onChange={(e) => { setPriceMode(e.target.value) }}>
                    <option value="Constant">Constant</option>
                    <option value="Linear">Linear</option>
                    <option value="Quadratic">Quadratic</option>
                  </Select>
                </FormControl>
                {priceMode === 'Constant' && (
                <Text fontSize="md" as='u' color="black.500" mt={2} textAlign="center">
                  Formula: f(x) = c
                </Text>
                )}
                {priceMode === 'Linear' && (
                <Text fontSize="md" as='u' color="black.500" mt={2} textAlign="center">
                  Formula: f(x) = b * x + c
                </Text>
                )}
                {priceMode === 'Quadratic' && (
                <Text fontSize="md" as='u' color="black.500" mt={2} textAlign="center">
                  Formula: f(x) = a * x² + b * x + c
                </Text>
                )}
                {priceMode === 'Quadratic' && (
                <FormControl isRequired>
                  <FormLabel>Constant A</FormLabel>
                  <NumberInput value={constantA} onChange={(valueString) => { setConstantA(valueString) }}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                )}
                {(priceMode === 'Linear' || priceMode === 'Quadratic') && (
                <FormControl isRequired>
                  <FormLabel>Constant B</FormLabel>
                  <NumberInput value={constantB} onChange={(valueString) => { setConstantB(valueString) }}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                )}
                <FormControl isRequired>
                  <FormLabel>Constant C</FormLabel>
                  <NumberInput value={constantC} onChange={(valueString) => { setConstantC(valueString) }}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <HStack spacing={4} justify="space-between">
                  {/* <Button */}
                  {/*      colorScheme="purple" */}
                  {/*      onClick={connectWallet} */}
                  {/*      flex="1" */}
                  {/*    > */}
                  {/*  Connect Wallet */}
                  {/* </Button> */}
                  <ConnectButton/>
                  <Button
                        type="submit"
                        colorScheme="purple"
                        onClick={handleLaunch}
                        flex="1"
                        isDisabled={!isWalletConnected}
                      >
                    Launch Coin
                  </Button>
                </HStack>
                {isWalletConnected && (
                <Text fontSize="sm" color="green.500" textAlign="center">
                  Wallet Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </Text>
                )}
              </VStack>
            </form>
          </Box>
          )}
        </VStack>
      </Container>
      <Text fontSize="sm" color="gray.500" mt={8} mb={8} textAlign="center">
        AI sometimes generates inaccurate info, so double-check responses.{' '}
      </Text>
    </Box>
  )
}

export default Launch
