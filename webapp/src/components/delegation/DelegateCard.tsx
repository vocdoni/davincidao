import { useState, useEffect } from 'react'
import { DelegateInfo } from '~/types/delegation'
import { WalletAddress } from '~/components/common/AddressDisplay'

interface DelegateCardProps {
  delegate: DelegateInfo
  onUpdateCount: (newCount: number) => void
  onRemove: () => void
  disabled: boolean
  isUserAddress?: boolean
  maxAvailable?: number // Add max available tokens
}

export const DelegateCard = ({
  delegate,
  onUpdateCount,
  onRemove,
  disabled,
  isUserAddress = false,
  maxAvailable = 0
}: DelegateCardProps) => {
  const [inputValue, setInputValue] = useState(delegate.pendingCount.toString())

  // Sync input value when delegate.pendingCount changes
  useEffect(() => {
    setInputValue(delegate.pendingCount.toString())
  }, [delegate.pendingCount])

  // Calculate maximum tokens this delegate can have
  const effectiveMaxAvailable = maxAvailable + delegate.currentCount
  const canIncrement = delegate.pendingCount < effectiveMaxAvailable
  const canDecrement = delegate.pendingCount > 0

  const handleInputChange = (value: string) => {
    setInputValue(value)
    const numValue = Math.max(0, Math.min(parseInt(value) || 0, effectiveMaxAvailable))
    onUpdateCount(numValue)
  }

  const handleIncrement = () => {
    if (!canIncrement) return
    const newCount = delegate.pendingCount + 1
    setInputValue(newCount.toString())
    onUpdateCount(newCount)
  }

  const handleDecrement = () => {
    if (!canDecrement) return
    const newCount = Math.max(0, delegate.pendingCount - 1)
    setInputValue(newCount.toString())
    onUpdateCount(newCount)
  }

  const hasChanges = delegate.currentCount !== delegate.pendingCount
  const changeAmount = delegate.pendingCount - delegate.currentCount

  const cardClassName = `p-4 border ${
    hasChanges
      ? 'border-black bg-gray-50'
      : 'border-gray-200 bg-white'
  } transition-colors`

  return (
    <div className={cardClassName}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div>
              <div className="font-medium text-gray-900 flex items-center gap-2">
                <WalletAddress address={delegate.address} />
                {isUserAddress && <span className="text-xs text-gray-500 font-mono">(You)</span>}
              </div>
              <div className="text-xs text-gray-500 font-mono mt-1">
                Current: {delegate.currentCount} NFT{delegate.currentCount !== 1 ? 's' : ''}
                {hasChanges && (
                  <span className={`ml-2 font-bold terminal-accent`}>
                    ({changeAmount > 0 ? '+' : ''}{changeAmount})
                  </span>
                )}
                <span className="ml-2 text-gray-400">
                  (Max: {effectiveMaxAvailable})
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Token Count Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDecrement}
              disabled={disabled || delegate.pendingCount <= 0}
              className="w-8 h-8 border border-black bg-white text-black hover:bg-black hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>

            <input
              type="number"
              min="0"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={disabled}
              className="w-16 px-2 py-1 text-center border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black font-mono text-sm"
            />

            <button
              onClick={handleIncrement}
              disabled={disabled || !canIncrement}
              className="w-8 h-8 border border-black bg-white text-black hover:bg-black hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              title={!canIncrement ? `Maximum ${effectiveMaxAvailable} tokens available` : ''}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>

          {/* Remove Button */}
          <button
            onClick={onRemove}
            disabled={disabled}
            className="w-8 h-8 border border-black bg-white text-black hover:bg-black hover:text-white disabled:opacity-30 transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Change Indicator */}
      {hasChanges && (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <div className="text-xs font-mono">
            {changeAmount > 0 ? (
              <span className="terminal-accent">
                ↗ Will delegate {changeAmount} more NFT{changeAmount !== 1 ? 's' : ''} to this address
              </span>
            ) : (
              <span className="text-gray-600">
                ↙ Will remove {Math.abs(changeAmount)} NFT{Math.abs(changeAmount) !== 1 ? 's' : ''} from this address
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
