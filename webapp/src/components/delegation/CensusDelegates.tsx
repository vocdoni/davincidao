import { useState, useEffect } from 'react'
import { getSubgraphClient } from '~/lib/subgraph-client'
import { AllDelegatesModal } from './AllDelegatesModal'
import { WalletAddress } from '~/components/common/AddressDisplay'

interface Delegate {
  address: string
  weight: number
  lastUpdatedAt: string
}

interface CensusDelegatesProps {
  onAddDelegate?: (address: string) => void
  existingDelegates?: string[]
  refreshTrigger?: number // Increment this to trigger a refresh
}

export const CensusDelegates = ({ onAddDelegate, existingDelegates = [], refreshTrigger }: CensusDelegatesProps) => {
  const [topDelegates, setTopDelegates] = useState<Delegate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllDelegatesModal, setShowAllDelegatesModal] = useState(false)

  useEffect(() => {
    loadTopDelegates()
  }, [refreshTrigger])

  const loadTopDelegates = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const subgraph = getSubgraphClient()
      const accounts = await subgraph.getTopDelegates(5)

      setTopDelegates(
        accounts.map(acc => ({
          address: acc.address,
          weight: parseInt(acc.weight),
          lastUpdatedAt: acc.lastUpdatedAt
        }))
      )
    } catch (err) {
      console.error('Failed to load top delegates:', err)
      setError('Failed to load delegate data')
    } finally {
      setIsLoading(false)
    }
  }

  const isDelegateAdded = (address: string) => {
    return existingDelegates.some(
      existing => existing.toLowerCase() === address.toLowerCase()
    )
  }

  const handleAddDelegate = (address: string) => {
    if (onAddDelegate && !isDelegateAdded(address)) {
      onAddDelegate(address)
    }
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="card-header">
          <span className="text-sm uppercase tracking-wider">🏆 [ TOP DELEGATES ]</span>
        </div>

        <div className="p-4">
          {error ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button onClick={loadTopDelegates} className="btn-minimal text-xs">
                RETRY
              </button>
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-14 bg-gray-100 border border-gray-200"></div>
                </div>
              ))}
            </div>
          ) : topDelegates.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500">
              No delegates
            </div>
          ) : (
            <div className="space-y-2">
              {topDelegates.map((delegate, index) => {
                const isAdded = isDelegateAdded(delegate.address)
                return (
                  <div
                    key={delegate.address}
                    className="border border-gray-200 hover:border-black p-3 transition-colors bg-white"
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-8 h-8 border border-black flex items-center justify-center">
                        <span className="text-sm font-mono font-bold">#{index + 1}</span>
                      </div>

                      {/* Delegate Info */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-1">
                          <WalletAddress address={delegate.address} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            Weight: <span className="font-mono terminal-accent">{delegate.weight}</span>
                          </span>
                        </div>
                      </div>

                      {/* Delegate Button */}
                      {onAddDelegate && (
                        <div className="flex-shrink-0">
                          {isAdded ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-300 text-xs">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              ADDED
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddDelegate(delegate.address)}
                              className="btn-accent text-xs px-2 py-1"
                            >
                              ADD
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* See All Button */}
          {!isLoading && !error && topDelegates.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowAllDelegatesModal(true)}
                className="btn-minimal w-full text-xs"
              >
                VIEW ALL
              </button>
            </div>
          )}
        </div>
      </div>

      {/* All Delegates Modal */}
      <AllDelegatesModal
        isOpen={showAllDelegatesModal}
        onClose={() => setShowAllDelegatesModal(false)}
        onAddDelegate={onAddDelegate}
        existingDelegates={existingDelegates}
      />
    </>
  )
}
