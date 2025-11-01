import { useState, useEffect } from 'react'
import { DelegateInfo, TransactionPlan, OperationStatus } from '~/types/delegation'
import { formatAddress } from '~/lib/utils'
import { UI_CONFIG } from '~/lib/constants'

interface EnhancedPendingChangesProps {
  delegates: Map<string, DelegateInfo>
  onCalculatePlan: () => Promise<TransactionPlan>
  onExecuteOperation: (operationId: string) => Promise<void>
  isExecuting: boolean
}

export const EnhancedPendingChanges = ({
  delegates,
  onCalculatePlan,
  onExecuteOperation,
  isExecuting
}: EnhancedPendingChangesProps) => {
  const [plan, setPlan] = useState<TransactionPlan | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isTreeReconstructing, setIsTreeReconstructing] = useState(false)
  const [operationStatuses, setOperationStatuses] = useState<Map<string, OperationStatus>>(new Map())

  // Calculate plan when delegates change
  useEffect(() => {
    const calculatePlan = async () => {
      setIsCalculating(true)
      try {
        const newPlan = await onCalculatePlan()
        setPlan(newPlan)
        
        // Initialize operation statuses
        const statuses = new Map<string, OperationStatus>()
        newPlan.operations.forEach(op => {
          statuses.set(op.id, op.status)
        })
        setOperationStatuses(statuses)
      } catch (error) {
        console.error('Failed to calculate transaction plan:', error)
        setPlan(null)
      } finally {
        setIsCalculating(false)
      }
    }

    calculatePlan()
  }, [delegates, onCalculatePlan])

  // Get list of changes
  const changes = Array.from(delegates.values())
    .filter(delegate => delegate.currentCount !== delegate.pendingCount)

  // Handle individual operation execution
  const handleExecuteOperation = async (operationId: string) => {
    if (!plan) return

    const operation = plan.operations.find(op => op.id === operationId)
    if (!operation) return

    // Update status to executing
    setOperationStatuses(prev => new Map(prev.set(operationId, 'executing')))

    // Show tree reconstruction status if needed
    if (plan.requiresProofs) {
      setIsTreeReconstructing(true)
    }

    try {
      await onExecuteOperation(operationId)
      
      // Update status to completed
      setOperationStatuses(prev => new Map(prev.set(operationId, 'completed')))
    } catch (error) {
      console.error(`Failed to execute operation ${operationId}:`, error)
      
      // Update status to failed
      setOperationStatuses(prev => new Map(prev.set(operationId, 'failed')))
    } finally {
      setIsTreeReconstructing(false)
    }
  }

  // Check if an operation can be executed
  const canExecuteOperation = (operationIndex: number): boolean => {
    if (!plan || isExecuting) return false
    
    // Can only execute operations in order
    for (let i = 0; i < operationIndex; i++) {
      const prevOperation = plan.operations[i]
      const prevStatus = operationStatuses.get(prevOperation.id)
      if (prevStatus !== 'completed') {
        return false
      }
    }
    
    const currentOperation = plan.operations[operationIndex]
    const currentStatus = operationStatuses.get(currentOperation.id)
    return currentStatus === 'pending'
  }

  // Get status icon for operation
  const getStatusIcon = (status: OperationStatus) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-5 h-5 border border-gray-400 bg-white flex items-center justify-center text-xs font-mono">
            ⏳
          </div>
        )
      case 'executing':
        return (
          <div className="w-5 h-5 border border-black bg-white flex items-center justify-center">
            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )
      case 'completed':
        return (
          <div className="w-5 h-5 border border-black bg-white flex items-center justify-center text-xs font-mono terminal-accent">
            ✓
          </div>
        )
      case 'failed':
        return (
          <div className="w-5 h-5 border border-black bg-white flex items-center justify-center text-xs font-mono">
            ✗
          </div>
        )
    }
  }

  if (changes.length === 0) {
    return null
  }

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <span className="text-sm uppercase tracking-wider">[ PENDING CHANGES ({changes.length}) ]</span>
      </div>

      <div className="p-4">
        <div className="flex-1">
          
          <div className="space-y-2 mb-4">
            {changes.map((delegate) => {
              const changeAmount = delegate.pendingCount - delegate.currentCount
              const exceedsLimit = Math.abs(changeAmount) > UI_CONFIG.MAX_TOKENS_PER_TX

              return (
                <div key={delegate.address}>
                  <div className="text-xs font-mono text-gray-700">
                    <span className="font-medium">{formatAddress(delegate.address)}</span>
                    <span className="ml-2">
                      {delegate.currentCount} → {delegate.pendingCount} NFTs
                    </span>
                    <span className="ml-2 font-bold terminal-accent">
                      ({changeAmount > 0 ? '+' : ''}{changeAmount})
                    </span>
                  </div>
                  {exceedsLimit && (
                    <div className="mt-1 text-xs font-mono bg-gray-100 border border-black px-2 py-1">
                      ⚠️ Maximum {UI_CONFIG.MAX_TOKENS_PER_TX} tokens per transaction. This will fail due to gas limits.
                      Please reduce to {UI_CONFIG.MAX_TOKENS_PER_TX} or less.
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Tree Reconstruction Status */}
          {isTreeReconstructing && (
            <div className="mb-4 p-3 border border-black bg-gray-50">
              <div className="flex items-center gap-2 text-xs font-mono">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Reconstructing Merkle tree for proof generation...
              </div>
            </div>
          )}

          {/* Transaction Plan */}
          {isCalculating ? (
            <div className="text-xs font-mono text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Calculating transaction plan...
              </div>
            </div>
          ) : plan && plan.operations.length > 0 ? (
            <div>
              <h4 className="text-xs font-mono font-bold uppercase mb-3">
                Required Operations:
              </h4>
              <div className="space-y-3">
                {plan.operations.map((operation, index) => {
                  const status = operationStatuses.get(operation.id) || 'pending'
                  const canExecute = canExecuteOperation(index)
                  
                  return (
                    <div key={operation.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 border border-black flex items-center justify-center text-xs font-mono font-bold">
                          {index + 1}
                        </span>
                        {getStatusIcon(status)}
                      </div>

                      <div className="flex-1">
                        <div className="text-xs font-mono text-gray-700">
                          {operation.description}
                        </div>
                        {operation.txHash && (
                          <div className="text-xs text-gray-500 mt-1 font-mono">
                            TX: {operation.txHash.slice(0, 10)}...{operation.txHash.slice(-8)}
                          </div>
                        )}
                        {operation.error && (
                          <div className="text-xs text-gray-700 mt-1 font-mono">
                            Error: {operation.error}
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleExecuteOperation(operation.id)}
                          disabled={!canExecute || status === 'executing'}
                          className={`btn-${status === 'completed' ? 'minimal' : 'accent'} text-xs px-2 py-1`}
                        >
                          {status === 'executing' ? 'EXECUTING...' :
                           status === 'completed' ? 'COMPLETED' :
                           status === 'failed' ? 'RETRY' : 'EXECUTE'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {plan.requiresProofs && (
                <div className="mt-3 p-2 border border-gray-300 bg-gray-50 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Operations require Merkle proofs (tree will be reconstructed before each execution)
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs font-mono text-gray-600">
              No operations needed
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
