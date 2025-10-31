import { useState, useEffect, useMemo, useCallback } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { WalletButton } from '~/components/wallet/WalletButton'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { useWallet } from '~/hooks/useWallet'
import { DavinciDaoContract } from '~/lib/contract'
import { CONTRACT_CONFIG } from '~/lib/constants'
import { initSubgraphClient, getSubgraphClient } from '~/lib/subgraph-client'
import { Button } from '~/components/common/Button'
import { DelegationManager } from '~/components/delegation/DelegationManager'
import { NFTInfo, Collection, CensusData, MerkleTreeNode } from '~/types'
import { CollectionAddress, CensusRoot, ContractAddress } from '~/components/common/AddressDisplay'
import { MintingButton, MintingCallToAction } from '~/components/common/MintingButton'
import { formatNumber } from '~/lib/utils'
import { createCensusReconstructor, unpackLeaf } from '~/lib/census'
import { TreeVisualizationModal } from '~/components/delegation/TreeVisualizationModal'
import { ValidateCensusRootModal } from '~/components/delegation/ValidateCensusRootModal'

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
  const [isRefreshingCensusRoot, setIsRefreshingCensusRoot] = useState(false)

  // Tree visualization state
  const [showTreeVisualization, setShowTreeVisualization] = useState(false)
  const [showValidateCensusRoot, setShowValidateCensusRoot] = useState(false)
  const [treeData, setTreeData] = useState<CensusData | null>(null)
  const [isReconstructingTree, setIsReconstructingTree] = useState(false)

  // Create contract instance with wallet support
  const contract = useMemo(() => {
    if (!provider) {
      return null
    }

    // Use private key wallet if available, otherwise use browser wallet
    if (privateKeyWallet) {
      return new DavinciDaoContract(provider, CONTRACT_CONFIG.address, privateKeyWallet)
    } else if (address) {
      return new DavinciDaoContract(provider, CONTRACT_CONFIG.address, { address })
    }

    return null
  }, [provider, privateKeyWallet, address])

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

  // Refresh only the census root from the contract
  const refreshCensusRoot = useCallback(async () => {
    if (!contract) return

    setIsRefreshingCensusRoot(true)
    try {
      console.log('Refreshing census root from contract...')
      const root = await contract.getCensusRoot()
      setCensusRoot(root.toString())
      console.log('✓ Census root refreshed:', root.toString())
    } catch (error) {
      console.error('Failed to refresh census root:', error)
    } finally {
      setIsRefreshingCensusRoot(false)
    }
  }, [contract])

  // Tree reconstruction function with intelligent caching
  const handleReconstructTree = useCallback(async () => {
    if (!contract) {
      console.error('Contract not available')
      return
    }

    setIsReconstructingTree(true)
    try {
      const subgraphEndpoint = import.meta.env.VITE_SUBGRAPH_ENDPOINT

      if (!subgraphEndpoint) {
        throw new Error('Subgraph endpoint not configured')
      }

      // Create census reconstructor using The Graph
      const reconstructor = createCensusReconstructor(subgraphEndpoint)

      // Build tree from subgraph data
      const tree = await reconstructor.buildTree()

      // Transform to UI format
      const nodes: MerkleTreeNode[] = []
      let index = 0
      for (const [address, packedLeaf] of tree.leaves.entries()) {
        const { weight } = unpackLeaf(packedLeaf)
        nodes.push({
          index,
          address,
          weight: Number(weight),
          leaf: '0x' + packedLeaf.toString(16)
        })
        index++
      }

      const censusData: CensusData = {
        root: '0x' + tree.root.toString(16),
        nodes,
        totalParticipants: tree.size
      }

      // Update state with tree data
      setTreeData(censusData)

    } catch (error) {
      console.error('Failed to reconstruct tree:', error)
    } finally {
      setIsReconstructingTree(false)
    }
  }, [contract])

  // Census root validation function
  const handleValidateCensusRoot = useCallback(async (root: string): Promise<bigint> => {
    if (!contract) {
      throw new Error('Contract not available')
    }

    try {
      const blockNumber = await contract.getRootBlockNumber(root)
      return blockNumber
    } catch (error) {
      console.error('Failed to validate census root:', error)
      throw error
    }
  }, [contract])

  const loadInitialData = useCallback(async (forceRefresh = false) => {
    if (!contract || !address) return

    setLoading(true)
    setContractError(null)

    try {
      // Check if contract exists by trying a simple call first
      const root = await contract.getCensusRoot()
      setCensusRoot(root.toString())

      // Load user's voting weight from subgraph (V2: weights are no longer stored on-chain)
      try {
        const subgraph = getSubgraphClient()
        const weight = await subgraph.getAccountWeight(address)
        setUserWeight(weight)
      } catch (error) {
        console.warn('Could not get weight from subgraph, defaulting to 0:', error)
        setUserWeight(0)
      }

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
          setContractError(`No contract deployed at address ${CONTRACT_CONFIG.address}. Please verify the contract is deployed on the current network.`)
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
  }, [contract, address])

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
              <div className="mt-1">
                <ContractAddress address={CONTRACT_CONFIG.address} />
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
              loading={loading}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Collections & Network Info - Combined Card */}
            <div className="card overflow-hidden">
              {/* Network Header */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Network</h3>
                    <p className="text-sm text-blue-100">Chain ID {CONTRACT_CONFIG.chainId}</p>
                  </div>
                </div>
              </div>

              {/* Collections Section */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h4 className="font-semibold text-gray-900">NFT Collections</h4>
                  <span className="ml-auto text-sm text-gray-500">{collections.length} total</span>
                </div>

                {collections.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">
                      {loading ? 'Loading collections...' : 'No collections configured'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {collections.map((collection, index) => (
                      <div key={index} className="group relative border border-gray-200 hover:border-blue-300 rounded-lg p-4 transition-all duration-200 hover:shadow-md bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                              {index}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">Collection {index}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {collection.active ? (
                                  <span className="inline-flex items-center gap-1 text-green-600">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-gray-400">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                    Inactive
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            ERC721
                          </span>
                        </div>
                        <div className="mb-2">
                          <CollectionAddress address={collection.token} />
                        </div>
                        {collection.totalDelegated > 0 && (
                          <div className="text-xs text-gray-600 flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="font-medium">{collection.totalDelegated}</span> delegated
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Census Tree Card */}
            <div className="card overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Census Tree</h3>
                    <p className="text-sm text-purple-100">Merkle root</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Census Root */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      Current Root
                    </label>
                    <button
                      onClick={refreshCensusRoot}
                      disabled={isRefreshingCensusRoot || !contract || !!contractError}
                      className="p-1.5 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh census root"
                    >
                      <svg
                        className={`w-4 h-4 ${isRefreshingCensusRoot ? 'animate-spin' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                    {contractError ? (
                      <span className="text-gray-500 text-sm">Contract not available</span>
                    ) : censusRoot === undefined || censusRoot === null || censusRoot === '' ? (
                      <span className="text-gray-500 text-sm">Loading...</span>
                    ) : censusRoot === '0' || BigInt(censusRoot) === BigInt(0) ? (
                      <span className="text-gray-500 font-mono text-sm">0x0 (Empty)</span>
                    ) : (
                      <CensusRoot root={censusRoot} />
                    )}
                  </div>
                </div>

                {/* Voting Weight */}
                <div className="border-t border-gray-100 pt-4">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Your Voting Weight
                  </label>
                  <div className="text-center">
                    <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {formatNumber(userWeight || 0)}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowTreeVisualization(true)}
                    disabled={!contract || !!contractError}
                    className="w-full"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Visualize Merkle Tree
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowValidateCensusRoot(true)}
                    disabled={!contract || !!contractError}
                    className="w-full"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Validate Root
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Tree Visualization Modal */}
      <TreeVisualizationModal
        isOpen={showTreeVisualization}
        onClose={() => setShowTreeVisualization(false)}
        treeNodes={treeData?.nodes || []}
        censusRoot={censusRoot || '0'}
        isLoading={isReconstructingTree}
        onReconstructTree={handleReconstructTree}
      />

      {/* Validate Census Root Modal */}
      <ValidateCensusRootModal
        isOpen={showValidateCensusRoot}
        onClose={() => setShowValidateCensusRoot(false)}
        onValidate={handleValidateCensusRoot}
      />
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
