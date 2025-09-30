import { useState, useEffect, useMemo, useCallback } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { WalletButton } from '~/components/wallet/WalletButton'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { useWallet } from '~/hooks/useWallet'
import { DavinciDaoContract } from '~/lib/contract'
import { CONTRACT_CONFIG } from '~/lib/constants'
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
import { ContractAddress, CensusRoot, CollectionAddress } from '~/components/common/AddressDisplay'
import { MintingButton, MintingCallToAction } from '~/components/common/MintingButton'

// Initialize React Query
const queryClient = new QueryClient()

function DashboardContent() {
  const walletState = useWallet()
  const { isConnected, address, provider, privateKeyWallet } = walletState
  
  // Debug wallet state changes
  console.log('DashboardContent render:', {
    isConnected,
    address,
    provider: !!provider,
    providerType: provider?.constructor?.name,
    privateKeyWallet: !!privateKeyWallet
  })
  const [censusRoot, setCensusRoot] = useState<string>('')
  const [userWeight, setUserWeight] = useState<number>(0)
  const [userNFTs, setUserNFTs] = useState<NFTInfo[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(false)
  const [contractError, setContractError] = useState<string | null>(null)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  // Contract address management
  const [currentContractAddress, setCurrentContractAddress] = useState<string>(() => {
    // Initialize from URL or fallback to config
    const urlAddress = getContractAddressFromUrl()
    return urlAddress || CONTRACT_CONFIG.address
  })
  
  // Create contract instance with private key wallet if available
  const contract = useMemo(() => {
    console.log('Contract useMemo triggered:', { 
      provider: !!provider, 
      providerType: provider?.constructor?.name,
      currentContractAddress, 
      privateKeyWallet: !!privateKeyWallet,
      address,
      isConnected
    })
    if (!provider || !currentContractAddress) {
      console.log('Contract creation skipped - missing provider or address')
      return null
    }
    
    // Pass the correct wallet object to the contract for signing transactions
    let walletForContract: { address: string } | undefined
    if (privateKeyWallet) {
      // For private key connections, pass the Wallet object directly
      const contractInstance = new DavinciDaoContract(provider, currentContractAddress, privateKeyWallet)
      console.log('Contract instance created with private key wallet:', !!contractInstance)
      return contractInstance
    } else if (address) {
      // For browser wallet connections, pass a simple wallet object
      walletForContract = { address }
    }
    
    const contractInstance = new DavinciDaoContract(provider, currentContractAddress, walletForContract)
    console.log('Contract instance created:', !!contractInstance, 'with wallet:', !!walletForContract)
    return contractInstance
  }, [provider, currentContractAddress, privateKeyWallet, address, isConnected])

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

  const loadInitialData = useCallback(async () => {
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

      // Load user's NFTs (simplified for demo)
      const nfts = await contract.getUserNFTs(address)
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
    console.log('useEffect triggered:', { 
      contract: !!contract, 
      address, 
      hasLoadedOnce,
      provider: !!provider,
      privateKeyWallet: !!privateKeyWallet,
      currentContractAddress
    })
    if (contract && address && !hasLoadedOnce) {
      console.log('Calling loadInitialData...')
      loadInitialData()
    }
  }, [contract, address, hasLoadedOnce, loadInitialData, provider, privateKeyWallet, currentContractAddress])






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
              <Button onClick={loadInitialData} disabled={loading || !!contractError} size="sm" variant="outline">
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
          {/* Census Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Census Root Card */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Census Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Current Census Root</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    {contractError ? (
                      <span className="text-gray-500">Contract not available</span>
                    ) : censusRoot ? (
                      <CensusRoot root={censusRoot} />
                    ) : (
                      <span className="text-gray-500">Loading...</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Your Voting Weight</label>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(userWeight)}
                    </div>
                  </div>
                  <Button onClick={loadInitialData} disabled={loading || !!contractError}>
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </div>
            </div>


            {/* Show minting call-to-action if user has no NFTs */}
            {!contractError && hasLoadedOnce && userNFTs.length === 0 && (
              <MintingCallToAction />
            )}

            {/* New Delegation Manager */}
            <DelegationManager
              contract={contract}
              userNFTs={userNFTs}
              userAddress={address}
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
                  <span className="text-gray-600">Contract</span>
                  <div className="mt-1">
                    <ContractAddress address={CONTRACT_CONFIG.address} />
                  </div>
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
