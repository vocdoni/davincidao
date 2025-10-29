import { useState, useEffect, useMemo, useCallback } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { WalletButton } from '~/components/wallet/WalletButton'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { useWallet } from '~/hooks/useWallet'
import { DavinciDaoContract } from '~/lib/contract'
import { CONTRACT_CONFIG } from '~/lib/constants'
import { initSubgraphClient } from '~/lib/subgraph-client'
import { formatNumber } from '~/lib/utils'
import { Button } from '~/components/common/Button'
import { ContractAddressInput } from '~/components/common/ContractAddressInput'
import { DelegationManager } from '~/components/delegation/DelegationManager'
import { NFTInfo, Collection } from '~/types'
import { 
  getContractAddressFromUrl, 
  onUrlChange, 
  updateUrlWithContractAddress
} from '~/lib/url'
import { ContractAddress, CollectionAddress } from '~/components/common/AddressDisplay'
import { MintingButton, MintingCallToAction } from '~/components/common/MintingButton'

// Initialize React Query
const queryClient = new QueryClient()

function DashboardContent() {
  const walletState = useWallet()
  const { isConnected, address, provider, privateKeyWallet, isWrongNetwork, switchNetwork } = walletState

  const [censusRoot, setCensusRoot] = useState<string>('')
  const [userWeight, setUserWeight] = useState<number>(0)
  const [userNFTs, setUserNFTs] = useState<NFTInfo[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(false)
  const [contractError, setContractError] = useState<string | null>(null)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  // Contract address management
  const [currentContractAddress, setCurrentContractAddress] = useState<string>(() => {
    const urlAddress = getContractAddressFromUrl()
    return urlAddress || CONTRACT_CONFIG.address
  })

  // Create contract instance with wallet support
  const contract = useMemo(() => {
    if (!provider || !currentContractAddress) {
      return null
    }

    // Use private key wallet if available, otherwise use browser wallet
    if (privateKeyWallet) {
      return new DavinciDaoContract(provider, currentContractAddress, privateKeyWallet)
    } else if (address) {
      return new DavinciDaoContract(provider, currentContractAddress, { address })
    }

    return null
  }, [provider, currentContractAddress, privateKeyWallet, address])

  // Initialize required services on app startup
  useEffect(() => {
    console.log('=== DavinciDAO V2 Initialization ===')

    // Check Alchemy API key
    const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY
    if (!alchemyKey) {
      console.error('❌ CRITICAL: VITE_ALCHEMY_API_KEY not configured')
      console.error('DavinciDAO V2 requires Alchemy API for NFT discovery')
      console.error('Please add VITE_ALCHEMY_API_KEY to your .env file')
      setContractError('Missing VITE_ALCHEMY_API_KEY in configuration. Cannot discover NFTs.')
      return
    }
    console.log('✓ Alchemy API key configured')

    // Check Subgraph endpoint
    const subgraphEndpoint = import.meta.env.VITE_SUBGRAPH_ENDPOINT
    if (!subgraphEndpoint) {
      console.error('❌ CRITICAL: VITE_SUBGRAPH_ENDPOINT not configured')
      console.error('DavinciDAO V2 requires The Graph subgraph for delegation data')
      console.error('Please add VITE_SUBGRAPH_ENDPOINT to your .env file')
      setContractError('Missing VITE_SUBGRAPH_ENDPOINT in configuration. Cannot query delegation data.')
      return
    }

    // Initialize subgraph client
    try {
      initSubgraphClient(subgraphEndpoint)
      console.log('✓ Subgraph client initialized:', subgraphEndpoint)
    } catch (error) {
      console.error('❌ Failed to initialize subgraph client:', error)
      setContractError('Failed to initialize subgraph client. Please check VITE_SUBGRAPH_ENDPOINT.')
      return
    }

    console.log('✓ All required services initialized')
  }, [])

  // Handle URL changes (browser back/forward)
  useEffect(() => {
    const cleanup = onUrlChange((urlAddress) => {
      const newAddress = urlAddress || CONTRACT_CONFIG.address
      if (newAddress !== currentContractAddress) {
        setCurrentContractAddress(newAddress)
        // Reset state when contract changes
        setHasLoadedOnce(false)
        setContractError(null)
        setCensusRoot('')
        setUserWeight(0)
        setUserNFTs([])
        setCollections([])
      }
    })
    
    return cleanup
  }, [currentContractAddress])

  // Update URL when contract address changes
  useEffect(() => {
    const urlAddress = getContractAddressFromUrl()
    if (currentContractAddress && currentContractAddress !== CONTRACT_CONFIG.address && urlAddress !== currentContractAddress) {
      updateUrlWithContractAddress(currentContractAddress)
    }
  }, [currentContractAddress])

  // Refresh only the census root from the contract
  const refreshCensusRoot = useCallback(async () => {
    if (!contract) return

    console.log('Refreshing census root from contract...')
    const root = await contract.getCensusRoot()
    setCensusRoot(root.toString())
    console.log('✓ Census root refreshed:', root.toString())
  }, [contract])

  const loadInitialData = useCallback(async (forceRefresh = false) => {
    if (!contract || !address) return

    setLoading(true)
    setContractError(null)

    try {
      // Check if contract exists by trying a simple call first
      const root = await contract.getCensusRoot()
      setCensusRoot(root.toString())

      // Load user's voting weight
      const weight = await contract.getWeightOf(address)
      setUserWeight(weight)

      // Load collections information
      const collectionsData = await contract.getAllCollections()
      setCollections(collectionsData)

      // Load user's NFTs (with optional force refresh to bypass Alchemy cache)
      const nfts = await contract.getUserNFTs(address, forceRefresh)
      setUserNFTs(nfts)

      setHasLoadedOnce(true)
    } catch (error: unknown) {
      console.error('Error loading initial data:', error)
      
      const errorObj = error as { code?: string; data?: unknown; message?: string }
      
      // Set user-friendly error message
      if (errorObj.code === 'CALL_EXCEPTION') {
        if (errorObj.data === null || errorObj.data === '0x') {
          setContractError(`No contract deployed at address ${currentContractAddress}. Please verify the contract address and ensure it's deployed on the current network.`)
        } else {
          setContractError('Contract call failed. Please check if the contract is deployed and accessible.')
        }
      } else if (errorObj.message?.includes('No contract deployed at address')) {
        setContractError(errorObj.message)
      } else {
        setContractError(`Failed to load contract data: ${errorObj.message || 'Unknown error'}`)
      }
    } finally {
      setLoading(false)
    }
  }, [contract, address, currentContractAddress])

  // Load initial data when wallet connects (only once per connection)
  useEffect(() => {
    if (contract && address && !hasLoadedOnce) {
      loadInitialData()
    }
  }, [contract, address, hasLoadedOnce, loadInitialData])


  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            DavinciDAO Census Manager
          </h1>
          <p className="text-gray-600 mb-8">
            Connect your wallet to manage NFT delegations for voting
          </p>
          <WalletButton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                DavinciDAO Census Manager
              </h1>
              <div className="text-sm text-gray-600">
                <ContractAddress address={currentContractAddress} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MintingButton size="sm" variant="outline" />
              <Button
                onClick={() => loadInitialData(true)}
                disabled={loading || !!contractError}
                size="sm"
                variant="outline"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Network Mismatch Alert */}
        {isWrongNetwork && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">Wrong Network</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You're connected to the wrong network. This app is configured for Chain ID {CONTRACT_CONFIG.chainId}.
                    Please switch to the correct network to continue.
                  </p>
                </div>
                <div className="mt-4">
                  <Button 
                    size="sm" 
                    onClick={async () => {
                      try {
                        await switchNetwork()
                      } catch (error) {
                        console.error('Failed to switch network:', error)
                        alert('Failed to switch network. Please switch manually in your wallet.')
                      }
                    }}
                  >
                    Switch Network
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contract Error Alert */}
        {contractError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Contract Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{contractError}</p>
                </div>
                <div className="mt-4">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setContractError(null)
                        setHasLoadedOnce(false)
                        loadInitialData()
                      }}
                      disabled={loading}
                    >
                      Retry
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={async () => {
                        if (contract) {
                          try {
                            const info = await contract.verifyContract()
                            console.log('Contract Debug Info:', info)
                            alert(`Debug Info:\n\nAddress: ${contract.address}\nExists: ${info.exists}\nHas Interface: ${info.hasInterface}\n${info.error ? `Error: ${info.error}` : ''}`)
                          } catch (error) {
                            console.error('Failed to get contract info:', error)
                            alert('Failed to get debug info. Check console for details.')
                          }
                        }
                      }}
                      disabled={loading}
                    >
                      Debug Info
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Show minting call-to-action if user has no NFTs */}
            {!contractError && hasLoadedOnce && userNFTs.length === 0 && (
              <MintingCallToAction />
            )}

            {/* New Delegation Manager */}
            <DelegationManager
              contract={contract}
              userNFTs={userNFTs}
              userAddress={address}
              onDataRefresh={loadInitialData}
              onRefreshCensusRoot={refreshCensusRoot}
              censusRoot={censusRoot}
              userWeight={userWeight}
              loading={loading}
              contractError={contractError}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contract Address Input */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Contract Configuration</h3>
              <ContractAddressInput
                currentAddress={currentContractAddress}
                onAddressChange={(newAddress) => {
                  setCurrentContractAddress(newAddress)
                  // Reset state when contract changes
                  setHasLoadedOnce(false)
                  setContractError(null)
                  setCensusRoot('')
                  setUserWeight(0)
                  setUserNFTs([])
                  setCollections([])
                }}
              />
            </div>

            {/* Quick Stats */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Your NFTs</span>
                  <span className="font-medium">{userNFTs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delegated NFTs</span>
                  <span className="font-medium">
                    {userNFTs.filter(nft => nft.delegatedTo).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Voting Weight</span>
                  <span className="font-medium">{formatNumber(userWeight)}</span>
                </div>
              </div>
            </div>

            {/* Collections Info */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Collections</h3>
              {collections.length === 0 ? (
                <p className="text-sm text-gray-600">
                  {loading ? 'Loading collections...' : 'No collections configured'}
                </p>
              ) : (
                <div className="space-y-4">
                  {collections.map((collection, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Collection {index}</span>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          ERC721
                        </span>
                      </div>
                      <div className="mb-2">
                        <CollectionAddress address={collection.token} />
                      </div>
                      <div className="text-xs text-gray-600">
                        <div>Status: {collection.active ? 'Active' : 'Inactive'}</div>
                        <div>Total Delegated: {collection.totalDelegated}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Network Info */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Network</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Chain ID</span>
                  <span className="font-medium">{CONTRACT_CONFIG.chainId}</span>
                </div>
                <div>
                  <ContractAddress address={CONTRACT_CONFIG.address} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <DashboardContent />
        <Toaster position="bottom-right" />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
