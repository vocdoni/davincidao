import { useState, useEffect } from 'react'
import { DelegateInfo, TransactionPlan } from '~/types/delegation'
import { formatAddress } from '~/lib/utils'

interface PendingChangesProps {
  delegates: Map<string, DelegateInfo>
  onCalculatePlan: () => Promise<TransactionPlan>
}

export const PendingChanges = ({
  delegates,
  onCalculatePlan
}: PendingChangesProps) => {
  const [plan, setPlan] = useState<TransactionPlan | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  // Calculate plan when delegates change
  useEffect(() => {
    const calculatePlan = async () => {
      setIsCalculating(true)
      try {
        const newPlan = await onCalculatePlan()
        setPlan(newPlan)
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

  if (changes.length === 0) {
    return null
  }

  return (
    <div className="card p-6 border-orange-200 bg-orange-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-medium text-orange-800 mb-3">
            Pending Changes ({changes.length})
          </h3>
          
          <div className="space-y-2 mb-4">
            {changes.map((delegate) => {
              const changeAmount = delegate.pendingCount - delegate.currentCount
              return (
                <div key={delegate.address} className="text-sm text-orange-700">
                  <span className="font-medium">{formatAddress(delegate.address)}</span>
                  <span className="ml-2">
                    {delegate.currentCount} → {delegate.pendingCount} NFTs
                  </span>
                  <span className={`ml-2 font-medium ${changeAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({changeAmount > 0 ? '+' : ''}{changeAmount})
                  </span>
                </div>
              )
            })}
          </div>

          {/* Transaction Plan */}
          {isCalculating ? (
            <div className="text-sm text-orange-600">
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
              <h4 className="text-sm font-medium text-orange-800 mb-2">
                Required Operations:
              </h4>
              <div className="space-y-1">
                {plan.operations.map((operation, index) => (
                  <div key={index} className="text-sm text-orange-700 flex items-center gap-2">
                    <span className="w-4 h-4 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    {operation.description}
                  </div>
                ))}
              </div>
              
              {plan.requiresProofs && (
                <div className="mt-3 p-2 bg-orange-100 rounded text-sm text-orange-700">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Some operations require Merkle proofs (tree reconstruction needed)
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-orange-600">
              No operations needed
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
