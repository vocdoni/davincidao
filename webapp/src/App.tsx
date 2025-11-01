import { useState, useEffect, useMemo, useCallback } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { WalletButton } from '~/components/wallet/WalletButton'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { useWallet } from '~/hooks/useWallet'
import { DavinciDaoContract } from '~/lib/contract'
import { CONTRACT_CONFIG } from '~/lib/constants'
import { initSubgraphClient, getSubgraphClient } from '~/lib/subgraph-client'
import { DelegationManager } from '~/components/delegation/DelegationManager'
import { NFTInfo, Collection, CensusData, MerkleTreeNode } from '~/types'
import { CollectionAddress, CensusRoot, ContractAddress } from '~/components/common/AddressDisplay'
import { MintingCallToAction } from '~/components/common/MintingButton'
import { formatNumber } from '~/lib/utils'
import { createCensusReconstructor, unpackLeaf } from '~/lib/census'
import { TreeVisualizationModal } from '~/components/delegation/TreeVisualizationModal'
import { ValidateCensusRootModal } from '~/components/delegation/ValidateCensusRootModal'
import { DelegatorsModal } from '~/components/delegation/DelegatorsModal'
import { LoadingModal } from '~/components/common/LoadingModal'

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
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Tree visualization state
  const [showTreeVisualization, setShowTreeVisualization] = useState(false)
  const [showValidateCensusRoot, setShowValidateCensusRoot] = useState(false)
  const [treeData, setTreeData] = useState<CensusData | null>(null)
  const [isReconstructingTree, setIsReconstructingTree] = useState(false)

  // Collapsible sidebar sections
  const [showNetworkInfo, setShowNetworkInfo] = useState(false)
  const [showCollections, setShowCollections] = useState(false)
  const [showCensusTree, setShowCensusTree] = useState(false)
  const [showDelegators, setShowDelegators] = useState(false)

  // Delegators modal
  const [showDelegatorsModal, setShowDelegatorsModal] = useState(false)
  const [delegatorStats, setDelegatorStats] = useState<{ totalUnique: number; totalActive: number; totalWeight: number } | null>(null)

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
      const rootHex = '0x' + root.toString(16)
      setCensusRoot(rootHex)
      console.log('✓ Census root refreshed:', rootHex)

      // Trigger refresh for components that depend on global data
      setRefreshTrigger(prev => prev + 1)
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
      const rootHex = '0x' + root.toString(16)  // Convert BigInt to hex string
      setCensusRoot(rootHex)

      // Load user's voting weight from subgraph (V2: weights are no longer stored on-chain)
      try {
        const subgraph = getSubgraphClient()
        const weight = await subgraph.getAccountWeight(address)
        setUserWeight(weight)

        // Load global delegator stats
        const stats = await subgraph.getGlobalStats()
        if (stats) {
          setDelegatorStats({
            totalUnique: parseInt(stats.totalUniqueDelegators),
            totalActive: parseInt(stats.totalActiveDelegators),
            totalWeight: parseInt(stats.totalWeight)
          })
        }
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
      <header className="bg-black text-white border-b-2 border-black">
        <div className="container py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Left side - Logo and Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {import.meta.env.VITE_APP_AVATAR_URL && (
                <img
                  src={import.meta.env.VITE_APP_AVATAR_URL}
                  alt="Avatar"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded border border-white flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-xl font-mono font-bold uppercase tracking-wider truncate">
                  [ {import.meta.env.VITE_APP_TITLE || 'DAVINCIDAO'} ]
                </h1>
                {/* Contract address - hidden on mobile, compact on tablet */}
                <div className="hidden sm:block mt-1">
                  <ContractAddress address={CONTRACT_CONFIG.address} />
                </div>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => loadInitialData(true)}
                disabled={loading || !!contractError}
                className="btn-minimal text-xs whitespace-nowrap"
              >
                {loading ? 'LOADING...' : 'REFRESH'}
              </button>
              <WalletButton />
            </div>
          </div>

          {/* Contract address - mobile only, below title */}
          <div className="sm:hidden mt-2 text-xs">
            <span className="text-gray-400 font-mono mr-2">Contract:</span>
            <code className="bg-white border border-gray-300 px-2 py-1 text-xs font-mono text-black">
              {CONTRACT_CONFIG.address.slice(0, 6)}...{CONTRACT_CONFIG.address.slice(-4)}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(CONTRACT_CONFIG.address)
              }}
              className="ml-2 p-1 text-gray-400 hover:text-white transition-colors"
              title="Copy address"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Network Mismatch Alert */}
        {isWrongNetwork && (
          <div className="mb-6 p-4 border-2 border-black bg-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-mono font-bold mb-2">WARNING: WRONG NETWORK</h3>
                <div className="text-sm text-gray-700 mb-3">
                  Expected Chain ID: <span className="font-mono terminal-accent">{CONTRACT_CONFIG.chainId}</span>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await switchNetwork()
                    } catch (error) {
                      console.error('Failed to switch network:', error)
                      alert('Failed to switch network. Please switch manually in your wallet.')
                    }
                  }}
                  className="btn-accent text-xs"
                >
                  SWITCH NETWORK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contract Error Alert */}
        {contractError && (
          <div className="mb-6 p-4 border-2 border-black bg-white">
            <div className="flex-1">
              <h3 className="text-sm font-mono font-bold mb-2">ERROR: CONTRACT</h3>
              <div className="text-sm text-gray-700 mb-3">
                {contractError}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setContractError(null)
                    setHasLoadedOnce(false)
                    loadInitialData()
                  }}
                  disabled={loading}
                  className="btn-minimal text-xs"
                >
                  RETRY
                </button>
                <button
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
                  className="btn-minimal text-xs"
                >
                  DEBUG
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
          {/* Sidebar - Appears first on mobile, right on desktop */}
          <div className="order-1 lg:order-2 space-y-4">
            {/* Network Info - Collapsible */}
            <div className="card overflow-hidden">
              <button
                onClick={() => setShowNetworkInfo(!showNetworkInfo)}
                className="card-header w-full flex items-center justify-between hover:bg-gray-900 transition-colors"
              >
                <span className="text-sm uppercase tracking-wider">[ NETWORK ]</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showNetworkInfo ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showNetworkInfo && (
                <div className="p-4 border-t border-gray-200">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Chain ID</span>
                      <span className="font-mono font-medium">{CONTRACT_CONFIG.chainId}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Contract</span>
                      <ContractAddress address={CONTRACT_CONFIG.address} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Collections - Collapsible */}
            <div className="card overflow-hidden">
              <button
                onClick={() => setShowCollections(!showCollections)}
                className="card-header w-full flex items-center justify-between hover:bg-gray-900 transition-colors"
              >
                <span className="text-sm uppercase tracking-wider">[ NFT COLLECTIONS ({collections.length}) ]</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showCollections ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showCollections && (
                <div className="p-4 border-t border-gray-200">

                {collections.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-500">
                    {loading ? 'Loading...' : 'No collections'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {collections.map((collection, index) => (
                      <div key={index} className="border border-gray-200 hover:border-black p-3 transition-colors bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 border border-black flex items-center justify-center text-xs font-mono font-bold">
                              {index}
                            </div>
                            <div>
                              <div className="font-medium text-sm">Collection {index}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {collection.active ? (
                                  <span className="inline-flex items-center gap-1 terminal-accent">
                                    <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
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
                          <span className="px-2 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300">
                            ERC721
                          </span>
                        </div>
                        <div className="text-xs">
                          <CollectionAddress address={collection.token} />
                        </div>
                        {collection.totalDelegated > 0 && (
                          <div className="text-xs text-gray-600 flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                            <span className="font-mono terminal-accent">{collection.totalDelegated}</span> delegated
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                </div>
              )}
            </div>

            {/* Census Tree - Collapsible */}
            <div className="card overflow-hidden">
              <button
                onClick={() => setShowCensusTree(!showCensusTree)}
                className="card-header w-full flex items-center justify-between hover:bg-gray-900 transition-colors"
              >
                <span className="text-sm uppercase tracking-wider">[ CENSUS TREE ]</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showCensusTree ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showCensusTree && (
                <div className="p-4 border-t border-gray-200 space-y-4">
                  {/* Census Root */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Root</label>
                      <button
                        onClick={refreshCensusRoot}
                        disabled={isRefreshingCensusRoot || !contract || !!contractError}
                        className="p-1 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh census root"
                      >
                        <svg
                          className={`w-3.5 h-3.5 ${isRefreshingCensusRoot ? 'animate-spin' : ''}`}
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
                    <div className="p-2 bg-gray-50 border border-gray-200">
                      {contractError ? (
                        <span className="text-gray-500 text-xs">N/A</span>
                      ) : censusRoot === undefined || censusRoot === null || censusRoot === '' ? (
                        <span className="text-gray-500 text-xs">Loading...</span>
                      ) : censusRoot === '0' || BigInt(censusRoot) === BigInt(0) ? (
                        <span className="text-gray-500 font-mono text-xs">0x0</span>
                      ) : (
                        <CensusRoot root={censusRoot} />
                      )}
                    </div>
                  </div>

                  {/* Voting Weight */}
                  <div className="border-t border-gray-100 pt-4">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Weight</label>
                    <div className="text-center py-2">
                      <div className="text-3xl font-mono font-bold terminal-accent">
                        {formatNumber(userWeight || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <button
                      onClick={() => setShowTreeVisualization(true)}
                      disabled={!contract || !!contractError}
                      className="btn-minimal w-full text-xs"
                    >
                      VISUALIZE TREE
                    </button>
                    <button
                      onClick={() => setShowValidateCensusRoot(true)}
                      disabled={!contract || !!contractError}
                      className="btn-minimal w-full text-xs"
                    >
                      VALIDATE ROOT
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Participants - Collapsible */}
            <div className="card overflow-hidden">
              <button
                onClick={() => setShowDelegators(!showDelegators)}
                className="card-header w-full flex items-center justify-between hover:bg-gray-900 transition-colors"
              >
                <span className="text-sm uppercase tracking-wider">[ PARTICIPANTS ]</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showDelegators ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDelegators && (
                <div className="p-4 border-t border-gray-200 space-y-4">
                  {/* Stats Display */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 block">
                      Unique Addresses
                    </label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="text-center py-3 border border-gray-200 bg-gray-50">
                        <div className="text-2xl font-mono font-bold terminal-accent">
                          {delegatorStats?.totalUnique ?? '-'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Total Ever</div>
                      </div>
                      <div className="text-center py-3 border border-gray-200 bg-gray-50">
                        <div className="text-2xl font-mono font-bold">
                          {delegatorStats?.totalActive ?? '-'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Active Now</div>
                      </div>
                    </div>
                    <div className="text-center py-3 border border-gray-200 bg-gray-50">
                      <div className="text-2xl font-mono font-bold terminal-accent">
                        {delegatorStats?.totalWeight ?? '-'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">NFTs Delegated</div>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <div className="border-t border-gray-100 pt-4">
                    <button
                      onClick={() => setShowDelegatorsModal(true)}
                      disabled={!delegatorStats}
                      className="btn-accent w-full text-xs"
                    >
                      VIEW ALL PARTICIPANTS
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Appears second on mobile, left on desktop */}
          <div className="order-2 lg:order-1 lg:col-span-2 space-y-6">
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
              refreshTrigger={refreshTrigger}
            />
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

      {/* Delegators Modal */}
      <DelegatorsModal
        isOpen={showDelegatorsModal}
        onClose={() => setShowDelegatorsModal(false)}
      />

      {/* Loading Modal - Show during NFT discovery and refresh */}
      <LoadingModal
        isOpen={loading}
        message={!hasLoadedOnce ? "DISCOVERING YOUR NFTs..." : "REFRESHING DATA..."}
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
