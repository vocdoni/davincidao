import { useState, useEffect, useCallback } from 'react'
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
        <div className="card-header flex items-center justify-between">
          <span className="text-sm uppercase tracking-wider">🗳️ [ YOUR DELEGATIONS ]</span>
          <button
            onClick={() => setShowAddDelegate(true)}
            disabled={isLoading || isExecuting}
            className="text-white border border-white hover:bg-gray-900 px-2 py-1 transition-colors text-xs disabled:opacity-50"
          >
            + ADD
          </button>
        </div>

        <div className="p-4">
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
          <button
            onClick={resetPendingChanges}
            disabled={isLoading || isExecuting}
            className="btn-minimal text-xs"
          >
            RESET CHANGES
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 border-2 border-black bg-white">
          <div className="space-y-3">
            <div className="text-sm font-mono whitespace-pre-wrap">
              {error.startsWith('SYNC_REQUIRED:') ? (
                <>
                  <span className="font-bold">⏳ SYNCING:</span> {error.replace('SYNC_REQUIRED:', '')}
                </>
              ) : (
                <>
                  <span className="font-bold">ERROR:</span> {error}
                </>
              )}
            </div>
            {error.startsWith('SYNC_REQUIRED:') && (
              <button
                onClick={async () => {
                  try {
                    const plan = await calculateTransactionPlan()
                    if (plan.operations.length > 0) {
                      await executeOperation(plan.operations[0].id)
                    }
                  } catch (err) {
                    console.error('Retry failed:', err)
                  }
                }}
                disabled={isLoading}
                className="btn-minimal w-full text-xs"
              >
                {isLoading ? 'RETRYING...' : 'RETRY'}
              </button>
            )}
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
