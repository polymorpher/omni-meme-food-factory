import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  useToast,
  Container,
  Grid,
  GridItem,
  Image as ChakraImage,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Textarea,
  Flex
} from '@chakra-ui/react'
import { Star, User } from 'lucide-react'
import { updatedChainOptions } from './utils'

interface AddressResponse {
  url_path: string
  recipe: string
  name: string
}

interface ChainBalance {
  chain: string
  balance: string
}

interface Review {
  userAddress: string
  text: string
}

const Mint = (): React.JSX.Element => {
  const { address } = useParams()
  const [addressInfo, setAddressInfo] = useState<AddressResponse>()
  const [amount, setAmount] = useState('')
  const [selectedChain, setSelectedChain] = useState('')
  const [fromChain, setFromChain] = useState('')
  const [toChain, setToChain] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [balances, setBalances] = useState<ChainBalance[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const toast = useToast()

  const handleMint = (e: React.FormEvent): void => {
    e.preventDefault()
    toast({
      title: 'Minting Initiated',
      description: `Minting ${amount} tokens on ${selectedChain}...`,
      status: 'info',
      duration: 3000,
      isClosable: true
    })
  }

  const handleTransfer = (e: React.FormEvent): void => {
    e.preventDefault()
    toast({
      title: 'Transfer Initiated',
      description: `Transferring ${transferAmount} from ${fromChain} to ${toChain}...`,
      status: 'info',
      duration: 3000,
      isClosable: true
    })
  }

  const getAddressInfo = useCallback(async (addressParam: string): Promise<void> => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/${addressParam}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to get address info')
      }

      const data: AddressResponse = await response.json()
      setAddressInfo(data)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Failed to get address info.',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }, [toast])

  useEffect(() => {
    if (address) {
      void getAddressInfo(address)
    }
    // Mock data for balances and reviews
    setBalances([
      { chain: 'Bitcoin', balance: '0.5 BTC' },
      { chain: 'Ethereum', balance: '2 ETH' },
      { chain: 'Polygon', balance: '88 MATIC' },
      { chain: 'Harmony', balance: '1000 ONE' }
    ])
    setReviews([
      { userAddress: '0x1234...5678', text: 'Great service!' },
      { userAddress: '0xabcd...efgh', text: 'Fast and efficient.' }
    ])
  }, [address, getAddressInfo])

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
        <VStack spacing={8} align="stretch">
          {addressInfo && (
            <>
              <Grid templateColumns="repeat(2, 1fr)" gap={6} w="100%">
                <GridItem>
                  <Box bg="white" p={6} borderRadius="md" boxShadow="md">
                    <Text fontSize="xl" fontWeight="bold" mb={2}>Name</Text>
                    <Text>{addressInfo.name}</Text>
                  </Box>
                </GridItem>
                <GridItem>
                  <Box bg="white" p={6} borderRadius="md" boxShadow="md">
                    <Text fontSize="xl" fontWeight="bold" mb={2}>Address</Text>
                    <Text>{address}</Text>
                  </Box>
                </GridItem>
              </Grid>

              <Grid templateColumns="repeat(3, 1fr)" gap={6} w="100%" h="400px">
                <GridItem h="100%">
                  <Box bg="white" p={6} borderRadius="md" boxShadow="md" h="100%" display="flex" flexDirection="column">
                    <Text fontSize="xl" fontWeight="bold" mb={4}>Generated Meme</Text>
                    <Box flex="1" position="relative">
                      <ChakraImage
                        src={addressInfo.url_path}
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
                    <Text fontSize="xl" fontWeight="bold" mb={4}>Generated Recipe</Text>
                    <Box flex="1" overflowY="auto">
                      <Textarea
                        value={addressInfo.recipe}
                        readOnly
                        resize="none"
                        h="100%"
                        border="none"
                        _focus={{ boxShadow: 'none' }}
                      />
                    </Box>
                  </Box>
                </GridItem>
                <GridItem h="100%">
                  <Box bg="white" p={6} borderRadius="md" boxShadow="md" h="100%" display="flex" flexDirection="column">
                    <Text fontSize="xl" fontWeight="bold" mb={4}>Supported Chains</Text>
                    <Box flex="1" overflowY="auto">
                      {[
                        { value: 'masterchain', label: 'MasterChain', symbol: 'MAS' },
                        { value: 'polygon', label: 'Polygon', symbol: 'MATIC' },
                        { value: 'harmony', label: 'Harmony', symbol: 'ONE' }].map((chain) => (
                          <Text key={chain.value} mb={2}>
                            {chain.label} ({chain.symbol})
                          </Text>
                      ))}
                    </Box>
                  </Box>
                </GridItem>
              </Grid>
            </>
          )}

          <Box bg="white" p={6} borderRadius="md" boxShadow="md">
            <form onSubmit={handleMint}>
              <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Chain</FormLabel>
                    <Select
                      value={selectedChain}
                      onChange={(e) => { setSelectedChain(e.target.value) }}
                      placeholder="Select chain"
                    >
                      {updatedChainOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({option.symbol})
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Amount to Mint</FormLabel>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => { setAmount(e.target.value) }}
                      placeholder="Enter amount to mint"
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl>
                    <FormLabel>&nbsp;</FormLabel>
                    <Button
                      colorScheme="purple"
                      type="submit"
                      width="100%"
                      isDisabled={!selectedChain || !amount}
                    >
                      Mint Tokens
                    </Button>
                  </FormControl>
                </GridItem>
              </Grid>
            </form>
          </Box>

          <Grid templateColumns="repeat(2, 1fr)" gap={6}>
            <GridItem>
              <Box bg="white" p={6} borderRadius="md" boxShadow="md" h="100%">
                <Heading as="h3" size="md" mb={4}>Balances</Heading>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Chain</Th>
                      <Th>Balance</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {balances.map((balance, index) => (
                      <Tr key={index}>
                        <Td>{balance.chain}</Td>
                        <Td>{balance.balance}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </GridItem>
            <GridItem>
              <Box bg="white" p={6} borderRadius="md" boxShadow="md">
                <form onSubmit={handleTransfer}>
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>From Chain</FormLabel>
                      <Select
                        value={fromChain}
                        onChange={(e) => {
                          setFromChain(e.target.value)
                          if (e.target.value === toChain) {
                            setToChain('')
                          }
                        }}
                        placeholder="Select source chain"
                      >
                        {updatedChainOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label} ({option.symbol})
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>To Chain</FormLabel>
                      <Select
                        value={toChain}
                        onChange={(e) => {
                          setToChain(e.target.value)
                          if (e.target.value === fromChain) {
                            setFromChain('')
                          }
                        }}
                        placeholder="Select destination chain"
                      >
                        {updatedChainOptions
                          .filter(option => option.value !== fromChain)
                          .map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label} ({option.symbol})
                            </option>
                          ))}
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Amount to Transfer</FormLabel>
                      <Input
                        type="number"
                        value={transferAmount}
                        onChange={(e) => { setTransferAmount(e.target.value) }}
                        placeholder="Enter amount to transfer"
                      />
                    </FormControl>

                    <Button
                      mt={4}
                      colorScheme="purple"
                      type="submit"
                      width="100%"
                      isDisabled={!fromChain || !toChain || fromChain === toChain}
                    >
                      Transfer Tokens
                    </Button>
                  </VStack>
                </form>
              </Box>
            </GridItem>
          </Grid>

          <Heading as="h2" size="lg" textAlign="center" mt={8}>
            User Reviews
          </Heading>
          <Box bg="white" p={6} borderRadius="lg" boxShadow="lg" minHeight="200px">
            <Grid templateColumns="repeat(auto-fit, minmax(280px, 1fr))" gap={6}>
              {reviews.map((review, index) => (
                <GridItem key={index}>
                  <Box
                    p={4}
                    borderRadius="md"
                    boxShadow="md"
                    bg="gray.50"
                    _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                  >
                    <Flex alignItems="center" mb={3}>
                      <Box bg="gray.200" p={2} borderRadius="full" mr={2}>
                        <User size={20} color="#4A5568" />
                      </Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.600">
                        {review.userAddress.slice(0, 6)}...{review.userAddress.slice(-4)}
                      </Text>
                    </Flex>
                    <Text fontSize="md" color="gray.700" mb={3}>
                      {review.text}
                    </Text>
                    <Flex alignItems="center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          fill={i < 4 ? '#F6E05E' : 'none'}
                          color={i < 4 ? '#F6E05E' : '#CBD5E0'}
                        />
                      ))}
                      <Text ml={2} fontSize="sm" color="gray.500">4.0</Text>
                    </Flex>
                  </Box>
                </GridItem>
              ))}
            </Grid>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

export default Mint
