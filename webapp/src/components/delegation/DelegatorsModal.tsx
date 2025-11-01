import { useState, useEffect, useCallback } from 'react'
import { getSubgraphClient, type SubgraphDelegator } from '~/lib/subgraph-client'
import { WalletAddress } from '~/components/common/AddressDisplay'

interface DelegatorsModalProps {
  isOpen: boolean
  onClose: () => void
}

const ITEMS_PER_PAGE = 20

export const DelegatorsModal = ({ isOpen, onClose }: DelegatorsModalProps) => {
  const [delegators, setDelegators] = useState<SubgraphDelegator[]>([])
  const [filteredDelegators, setFilteredDelegators] = useState<SubgraphDelegator[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalLoaded, setTotalLoaded] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [showActiveOnly, setShowActiveOnly] = useState(false)

  // Load delegators from subgraph
  const loadDelegators = useCallback(async (reset = false) => {
    setIsLoading(true)
    setError(null)

    try {
      const subgraph = getSubgraphClient()
      const skip = reset ? 0 : totalLoaded

      const delegatorData = showActiveOnly
        ? await subgraph.getActiveDelegators(100, skip)
        : await subgraph.getAllDelegators(100, skip)

      if (reset) {
        setDelegators(delegatorData)
        setTotalLoaded(delegatorData.length)
      } else {
        setDelegators(prev => [...prev, ...delegatorData])
        setTotalLoaded(prev => prev + delegatorData.length)
      }

      setHasMore(delegatorData.length === 100)
    } catch (err) {
      console.error('Failed to load delegators:', err)
      setError('Failed to load delegator data')
    } finally {
      setIsLoading(false)
    }
  }, [totalLoaded, showActiveOnly])

  // Load initial data when modal opens
  useEffect(() => {
    if (isOpen && delegators.length === 0) {
      loadDelegators(true)
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when filter changes
  useEffect(() => {
    if (isOpen) {
      setDelegators([])
      setTotalLoaded(0)
      setCurrentPage(1)
      loadDelegators(true)
    }
  }, [showActiveOnly]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter delegators based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDelegators(delegators)
      setCurrentPage(1)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = delegators.filter(delegator =>
      delegator.address.toLowerCase().includes(query)
    )
    setFilteredDelegators(filtered)
    setCurrentPage(1)
  }, [searchQuery, delegators])

  // Pagination
  const totalPages = Math.ceil(filteredDelegators.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentDelegators = filteredDelegators.slice(startIndex, endIndex)

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white border-2 border-black w-full max-w-4xl max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="card-header flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-mono font-bold uppercase tracking-wider">[ UNIQUE DELEGATORS ]</h3>
                <p className="text-gray-400 mt-1 text-xs normal-case tracking-normal">
                  Addresses that have delegated NFTs
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Bar and Filter */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by address..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-black bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-black font-mono text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowActiveOnly(!showActiveOnly)}
                className={`px-4 py-3 border text-sm whitespace-nowrap ${
                  showActiveOnly
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black hover:bg-black hover:text-white transition-colors'
                }`}
              >
                {showActiveOnly ? 'ACTIVE ONLY' : 'SHOW ALL'}
              </button>
            </div>
            <div className="text-sm text-gray-500">
              {filteredDelegators.length} delegator{filteredDelegators.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-black bg-white mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 mb-4 font-mono">{error}</p>
                <button
                  onClick={() => loadDelegators(true)}
                  className="btn-minimal text-xs"
                >
                  RETRY
                </button>
              </div>
            ) : isLoading && delegators.length === 0 ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-gray-100 border border-gray-200"></div>
                  </div>
                ))}
              </div>
            ) : filteredDelegators.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-black bg-white mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 font-mono">
                  {searchQuery ? `No delegators found matching "${searchQuery}"` : 'No delegators found'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentDelegators.map((delegator, index) => {
                  const globalRank = startIndex + index + 1
                  return (
                    <div
                      key={delegator.address}
                      className="border border-gray-200 hover:border-black p-4 transition-colors bg-white"
                    >
                      <div className="flex items-start gap-3">
                        {/* Rank */}
                        <div className="flex-shrink-0 w-10 h-10 border border-black flex items-center justify-center">
                          <span className="text-sm font-mono font-bold">#{globalRank}</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="mb-2">
                            <WalletAddress address={delegator.address} />
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-gray-500">Active Delegations:</span>
                              <span className="ml-1 font-mono font-bold terminal-accent">
                                {delegator.totalDelegationsMade}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Total Ever:</span>
                              <span className="ml-1 font-mono font-bold">
                                {delegator.totalDelegationsEver}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">First Delegated:</span>
                              <span className="ml-1 font-mono">
                                {formatDate(delegator.firstDelegatedAt)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Last Delegated:</span>
                              <span className="ml-1 font-mono">
                                {formatDate(delegator.lastDelegatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer with Pagination */}
          {filteredDelegators.length > 0 && (
            <div className="border-t border-gray-200 p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                  {hasMore && !searchQuery && (
                    <button
                      onClick={() => loadDelegators(false)}
                      disabled={isLoading}
                      className="ml-4 btn-minimal text-xs"
                    >
                      {isLoading ? 'LOADING...' : 'LOAD MORE'}
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn-minimal text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    PREVIOUS
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-minimal text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    NEXT
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
