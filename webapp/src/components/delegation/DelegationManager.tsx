import { useState, useEffect, useCallback } from 'react'
import { Button } from '~/components/common/Button'
import { DavinciDaoContract } from '~/lib/contract'
import { NFTInfo } from '~/types'
import { useDelegation } from '~/hooks/useDelegation'
import { TokenOverview } from './TokenOverview'
import { DelegatesList } from './DelegatesList'
import { EnhancedPendingChanges } from './EnhancedPendingChanges'
import { AddDelegateModal } from './AddDelegateModal'
import { CensusDelegates } from './CensusDelegates'

interface DelegationManagerProps {
  contract: DavinciDaoContract | null
  userNFTs: NFTInfo[]
  userAddress: string | undefined
  onDataRefresh?: () => void | Promise<void>
  loading?: boolean
  refreshTrigger?: number // Trigger for global refresh
}

export const DelegationManager = ({
  contract,
  userNFTs,
  userAddress,
  onDataRefresh,
  refreshTrigger
}: DelegationManagerProps) => {
  const [showAddDelegate, setShowAddDelegate] = useState(false)
  const [isExecuting] = useState(false)

  // Wrap onDataRefresh for transaction success
  const handleTransactionSuccess = useCallback(async () => {
    // Call the original refresh callback which will update census root
    if (onDataRefresh) {
      await onDataRefresh()
    }
  }, [onDataRefresh])

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

      {/* Census Delegates - Global Statistics */}
      <CensusDelegates
        onAddDelegate={addDelegate}
        existingDelegates={Array.from(delegationState.delegates.keys())}
        refreshTrigger={refreshTrigger}
      />

      {/* Delegates List */}
      <div className="card overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold">Manage Your Delegations</h2>
                <p className="text-sm text-green-100">
                  Assign your voting power to delegates
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddDelegate(true)}
              disabled={isLoading || isExecuting}
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Delegate
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <DelegatesList
            delegates={delegationState.delegates}
            onUpdateCount={updateDelegateCount}
            onRemoveDelegate={removeDelegate}
            disabled={isLoading || isExecuting}
            userAddress={userAddress}
            availableTokens={delegationState.totalOwnedTokens - delegationState.totalDelegatedTokens}
          />
        </div>
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
    </div>
  )
}
