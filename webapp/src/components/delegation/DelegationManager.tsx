import { useState, useEffect } from 'react'
import { Button } from '~/components/common/Button'
import { DavinciDaoContract } from '~/lib/contract'
import { NFTInfo, CensusData } from '~/types'
import { useDelegation } from '~/hooks/useDelegation'
import { MerkleTreeReconstructor } from '~/lib/merkle'
import { TokenOverview } from './TokenOverview'
import { DelegatesList } from './DelegatesList'
import { EnhancedPendingChanges } from './EnhancedPendingChanges'
import { AddDelegateModal } from './AddDelegateModal'
import { TreeVisualizationModal } from './TreeVisualizationModal'

interface DelegationManagerProps {
  contract: DavinciDaoContract | null
  userNFTs: NFTInfo[]
  userAddress: string | undefined
}

export const DelegationManager = ({ 
  contract, 
  userNFTs, 
  userAddress
}: DelegationManagerProps) => {
  const [showAddDelegate, setShowAddDelegate] = useState(false)
  const [isExecuting] = useState(false)
  
  // Tree visualization state
  const [showTreeVisualization, setShowTreeVisualization] = useState(false)
  const [treeData, setTreeData] = useState<CensusData | null>(null)
  const [isReconstructingTree, setIsReconstructingTree] = useState(false)
  const [censusRoot, setCensusRoot] = useState<string>('0')

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
  } = useDelegation(contract, userNFTs, userAddress)

  // Initialize when NFTs change
  useEffect(() => {
    initializeDelegationState()
  }, [initializeDelegationState])

  const handleAddDelegate = (address: string) => {
    addDelegate(address)
    setShowAddDelegate(false)
  }

  // Load current census root on component mount
  useEffect(() => {
    const loadCensusRoot = async () => {
      if (contract) {
        try {
          const root = await contract.getCensusRoot()
          setCensusRoot(root.toString())
        } catch (error) {
          console.error('Failed to load census root:', error)
        }
      }
    }
    loadCensusRoot()
  }, [contract])

  // Tree reconstruction function with intelligent caching
  const handleReconstructTree = async () => {
    if (!contract) {
      console.error('Contract not available')
      return
    }

    setIsReconstructingTree(true)
    try {
      const reconstructor = new MerkleTreeReconstructor(contract)
      
      // Get current census root
      const currentRoot = await contract.getCensusRoot()
      const currentRootStr = currentRoot.toString()
      
      // Check if we have cached data for this root
      const cachedData = reconstructor.getCachedCensusData()
      
      if (cachedData && cachedData.root === currentRootStr) {
        console.log('Using cached tree data for root:', currentRootStr)
        setTreeData(cachedData)
        setCensusRoot(cachedData.root)
        return
      }
      
      console.log('Census root changed or no cache, reconstructing tree...')
      console.log('Previous root:', treeData?.root || 'none')
      console.log('Current root:', currentRootStr)
      
      // Reconstruct tree with progress callback
      const censusData = await reconstructor.reconstructTree((current, total) => {
        console.log(`Reconstructing tree: ${current}/${total}`)
      })
      
      // Update state with tree data
      setTreeData(censusData)
      setCensusRoot(censusData.root)
      
      console.log(`Tree reconstructed with ${censusData.nodes.length} nodes`)
      console.log('Census root:', censusData.root)
      
    } catch (error) {
      console.error('Failed to reconstruct tree:', error)
    } finally {
      setIsReconstructingTree(false)
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

      {/* Census Tree Visualization - Moved before delegates */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Census Tree</h3>
            <p className="text-sm text-gray-600">
              View the current Merkle tree structure with all delegated weights
            </p>
          </div>
          <Button
            onClick={() => setShowTreeVisualization(true)}
            disabled={isLoading || isExecuting}
            variant="outline"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Visualize Tree
          </Button>
        </div>
        
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>Current Root: <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{censusRoot}</code></span>
            {treeData && (
              <span className="text-green-600">
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
    </div>
  )
}
