import { DelegateInfo } from '~/types/delegation'
import { DelegateCard } from './DelegateCard'

interface DelegatesListProps {
  delegates: Map<string, DelegateInfo>
  onUpdateCount: (address: string, newCount: number, collectionIndex: number) => void
  onRemoveDelegate: (address: string) => void
  disabled: boolean
  userAddress?: string
  availableTokens?: number // Add available tokens count
}

export const DelegatesList = ({
  delegates,
  onUpdateCount,
  onRemoveDelegate,
  disabled,
  userAddress,
  availableTokens = 0
}: DelegatesListProps) => {
  const delegateArray = Array.from(delegates.values())

  if (delegateArray.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="mb-2">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 9a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-sm">No delegates added yet</p>
        <p className="text-xs text-gray-400 mt-1">Click "Add Delegate" to start delegating your NFTs</p>
      </div>
    )
  }

  // Calculate available tokens for each delegate
  const calculateMaxAvailable = (delegate: DelegateInfo) => {
    // Available tokens = base available + tokens currently allocated to other delegates that could be moved
    let totalPendingToOthers = 0
    for (const [, otherDelegate] of delegates) {
      if (otherDelegate.address !== delegate.address) {
        const otherPendingIncrease = Math.max(0, otherDelegate.pendingCount - otherDelegate.currentCount)
        totalPendingToOthers += otherPendingIncrease
      }
    }
    
    return Math.max(0, availableTokens - totalPendingToOthers)
  }

  return (
    <div className="space-y-4">
      {delegateArray.map((delegate) => (
        <DelegateCard
          key={delegate.address}
          delegate={delegate}
          onUpdateCount={(newCount: number) => onUpdateCount(delegate.address, newCount, 0)} // Simplified to collection 0
          onRemove={() => onRemoveDelegate(delegate.address)}
          disabled={disabled}
          isUserAddress={userAddress?.toLowerCase() === delegate.address.toLowerCase()}
          maxAvailable={calculateMaxAvailable(delegate)}
        />
      ))}
    </div>
  )
}
