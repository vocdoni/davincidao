import { useState, useEffect } from 'react'
import { Button } from '~/components/common/Button'
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

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 0: return 'from-yellow-400 to-yellow-600' // Gold
      case 1: return 'from-gray-300 to-gray-500' // Silver
      case 2: return 'from-orange-400 to-orange-600' // Bronze
      default: return 'from-blue-400 to-blue-600'
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0: return '🥇'
      case 1: return '🥈'
      case 2: return '🥉'
      default: return '🏅'
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
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold">Current Delegates</h2>
              <p className="text-sm text-purple-100">
                Top weighted addresses
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <Button size="sm" onClick={loadTopDelegates}>
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-100 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : topDelegates.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">No delegates found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topDelegates.map((delegate, index) => {
                const isAdded = isDelegateAdded(delegate.address)
                return (
                  <div
                    key={delegate.address}
                    className="border border-gray-200 hover:border-purple-300 rounded-xl p-4 transition-all duration-200 hover:shadow-lg bg-gradient-to-r from-white to-gray-50 hover:from-purple-50 hover:to-white"
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Badge */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${getRankColor(index)} flex items-center justify-center text-white font-bold shadow-md`}>
                        <span className="text-xl">{getRankIcon(index)}</span>
                      </div>

                      {/* Delegate Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <WalletAddress address={delegate.address} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Rank #{index + 1}</span>
                          <span className="text-xs text-gray-300">•</span>
                          <span className="text-xs text-gray-500">
                            Weight: <span className="font-semibold text-purple-600">{delegate.weight}</span>
                          </span>
                        </div>
                      </div>

                      {/* Weight Display */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                          {delegate.weight}
                        </div>
                      </div>

                      {/* Delegate Button */}
                      {onAddDelegate && (
                        <div className="flex-shrink-0">
                          {isAdded ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-sm font-medium">Added</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddDelegate(delegate.address)}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center gap-2 group"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <span className="text-sm font-medium">Delegate</span>
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
            <div className="mt-6 pt-6 border-t border-gray-100">
              <Button
                onClick={() => setShowAllDelegatesModal(true)}
                variant="outline"
                className="w-full group"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                View All Delegates
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
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
