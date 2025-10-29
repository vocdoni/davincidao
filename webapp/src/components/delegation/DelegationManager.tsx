import { useState, useEffect, useCallback } from 'react'
import { Button } from '~/components/common/Button'
import { DavinciDaoContract } from '~/lib/contract'
import { NFTInfo, CensusData } from '~/types'
import { useDelegation } from '~/hooks/useDelegation'
import { createCensusReconstructor, unpackLeaf } from '~/lib/census'
import { MerkleTreeNode } from '~/types'
import { formatNumber } from '~/lib/utils'
import { CensusRoot } from '~/components/common/AddressDisplay'
import { TokenOverview } from './TokenOverview'
import { DelegatesList } from './DelegatesList'
import { EnhancedPendingChanges } from './EnhancedPendingChanges'
import { AddDelegateModal } from './AddDelegateModal'
import { TreeVisualizationModal } from './TreeVisualizationModal'
import { ValidateCensusRootModal } from './ValidateCensusRootModal'

interface DelegationManagerProps {
  contract: DavinciDaoContract | null
  userNFTs: NFTInfo[]
  userAddress: string | undefined
  onDataRefresh?: () => void | Promise<void>
  onRefreshCensusRoot?: () => void | Promise<void>
  censusRoot?: string
  userWeight?: number
  loading?: boolean
  contractError?: string | null
}

export const DelegationManager = ({
  contract,
  userNFTs,
  userAddress,
  onDataRefresh,
  onRefreshCensusRoot,
  censusRoot: censusRootProp,
  userWeight,
  contractError
}: DelegationManagerProps) => {
  const [showAddDelegate, setShowAddDelegate] = useState(false)
  const [isExecuting] = useState(false)

  // Tree visualization state
  const [showTreeVisualization, setShowTreeVisualization] = useState(false)
  const [showValidateCensusRoot, setShowValidateCensusRoot] = useState(false)
  const [treeData, setTreeData] = useState<CensusData | null>(null)
  const [isReconstructingTree, setIsReconstructingTree] = useState(false)
  const [localCensusRoot, setLocalCensusRoot] = useState<string>('0')
  const [isRefreshingCensusRoot, setIsRefreshingCensusRoot] = useState(false)

  // Use prop or fallback to local state for census root
  const censusRoot = censusRootProp || localCensusRoot

  // Wrap onDataRefresh for transaction success
  const handleTransactionSuccess = useCallback(async () => {
    // Call the original refresh callback which will update census root
    if (onDataRefresh) {
      await onDataRefresh()
    }
  }, [onDataRefresh])

  // Refresh census root only from smart contract
  const refreshCensusRoot = useCallback(async () => {
    setIsRefreshingCensusRoot(true)
    try {
      if (onRefreshCensusRoot) {
        await onRefreshCensusRoot()
      }
    } catch (error) {
      console.error('Failed to refresh census root:', error)
    } finally {
      setIsRefreshingCensusRoot(false)
    }
  }, [onRefreshCensusRoot])

  const {
    delegationState,
    isLoading,
    error,
    initializeDelegationState,
    addDelegate,
    removeDelegate,
    updateDelegateCount,
    calculateTransactionPlan,
    executeOperation,
    resetPendingChanges,
    hasPendingChanges
  } = useDelegation(contract, userNFTs, userAddress, handleTransactionSuccess)

  // Initialize when NFTs change
  useEffect(() => {
    initializeDelegationState()
  }, [initializeDelegationState])

  const handleAddDelegate = (address: string) => {
    addDelegate(address)
    setShowAddDelegate(false)
  }

  // Tree reconstruction function with intelligent caching
  const handleReconstructTree = async () => {
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
      setLocalCensusRoot(censusData.root)

    } catch (error) {
      console.error('Failed to reconstruct tree:', error)
    } finally {
      setIsReconstructingTree(false)
    }
  }

  // Census root validation function
  const handleValidateCensusRoot = async (root: string): Promise<bigint> => {
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
  }

  if (userNFTs.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Delegate NFTs</h2>
        <p className="text-gray-600">
          No NFTs found from supported collections. You need to own NFTs to delegate voting power.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Token Overview */}
      <TokenOverview 
        totalTokens={delegationState.totalOwnedTokens}
        delegatedTokens={delegationState.totalDelegatedTokens}
        availableTokens={delegationState.totalOwnedTokens - delegationState.totalDelegatedTokens}
        ownedTokensByCollection={delegationState.ownedTokens}
        collectionAddresses={delegationState.collectionAddresses}
      />

      {/* Census Tree Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Census Tree</h3>
            <p className="text-sm text-gray-600">
              Current root and verification tools
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowValidateCensusRoot(true)}
              disabled={isLoading || isExecuting || !contract}
              variant="outline"
              size="sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Validate Root
            </Button>
            <Button
              onClick={() => setShowTreeVisualization(true)}
              disabled={isLoading || isExecuting}
              variant="outline"
              size="sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Visualize Tree
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Census Root */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Current Census Root</label>
              <button
                onClick={refreshCensusRoot}
                disabled={isRefreshingCensusRoot || !onRefreshCensusRoot || !!contractError}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh census root from contract"
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
            <div className="mt-1 p-3 bg-gray-50 rounded-md">
              {contractError ? (
                <span className="text-gray-500">Contract not available</span>
              ) : censusRoot && censusRoot !== '0' ? (
                <CensusRoot root={censusRoot} />
              ) : (
                <span className="text-gray-500">Loading...</span>
              )}
            </div>
          </div>

          {/* Voting Weight */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Your Voting Weight</label>
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(userWeight || 0)}
              </div>
            </div>
            {treeData && (
              <span className="text-sm text-green-600">
                {treeData.nodes.length} participants loaded
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Delegates List */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Delegates</h2>
          <Button
            size="sm"
            onClick={() => setShowAddDelegate(true)}
            disabled={isLoading || isExecuting}
          >
            Add Delegate
          </Button>
        </div>

        <DelegatesList
          delegates={delegationState.delegates}
          onUpdateCount={updateDelegateCount}
          onRemoveDelegate={removeDelegate}
          disabled={isLoading || isExecuting}
          userAddress={userAddress}
          availableTokens={delegationState.totalOwnedTokens - delegationState.totalDelegatedTokens}
        />
      </div>

      {/* Pending Changes */}
      {hasPendingChanges && (
        <EnhancedPendingChanges
          delegates={delegationState.delegates}
          onCalculatePlan={calculateTransactionPlan}
          onExecuteOperation={executeOperation}
          isExecuting={isExecuting}
        />
      )}

      {/* Action Buttons */}
      {hasPendingChanges && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={resetPendingChanges}
            disabled={isLoading || isExecuting}
          >
            Reset Changes
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Delegation Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Delegate Modal */}
      {showAddDelegate && (
        <AddDelegateModal
          onAdd={handleAddDelegate}
          onCancel={() => setShowAddDelegate(false)}
          existingDelegates={Array.from(delegationState.delegates.keys())}
        />
      )}

      {/* Tree Visualization Modal */}
      <TreeVisualizationModal
        isOpen={showTreeVisualization}
        onClose={() => setShowTreeVisualization(false)}
        treeNodes={treeData?.nodes || []}
        censusRoot={censusRoot}
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
