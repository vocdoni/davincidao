import { useState, useEffect, useCallback } from 'react'
import { getSubgraphClient } from '~/lib/subgraph-client'
import { CONTRACT_CONFIG } from '~/lib/constants'

interface Delegate {
  address: string
  weight: number
  lastUpdatedAt: string
}

interface AllDelegatesModalProps {
  isOpen: boolean
  onClose: () => void
  onAddDelegate?: (address: string) => void
  existingDelegates?: string[]
}

const ITEMS_PER_PAGE = 20

export const AllDelegatesModal = ({ isOpen, onClose, onAddDelegate, existingDelegates = [] }: AllDelegatesModalProps) => {
  const [delegates, setDelegates] = useState<Delegate[]>([])
  const [filteredDelegates, setFilteredDelegates] = useState<Delegate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalLoaded, setTotalLoaded] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Load delegates from subgraph
  const loadDelegates = useCallback(async (reset = false) => {
    setIsLoading(true)
    setError(null)

    try {
      const subgraph = getSubgraphClient()
      const skip = reset ? 0 : totalLoaded
      const accounts = await subgraph.getAllAccounts(100, skip)

      const newDelegates = accounts.map(acc => ({
        address: acc.address,
        weight: parseInt(acc.weight),
        lastUpdatedAt: acc.lastUpdatedAt
      }))

      if (reset) {
        setDelegates(newDelegates)
        setTotalLoaded(newDelegates.length)
      } else {
        setDelegates(prev => [...prev, ...newDelegates])
        setTotalLoaded(prev => prev + newDelegates.length)
      }

      setHasMore(accounts.length === 100)
    } catch (err) {
      console.error('Failed to load delegates:', err)
      setError('Failed to load delegate data')
    } finally {
      setIsLoading(false)
    }
  }, [totalLoaded])

  // Load initial data when modal opens
  useEffect(() => {
    if (isOpen && delegates.length === 0) {
      loadDelegates(true)
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter delegates based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDelegates(delegates)
      setCurrentPage(1)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = delegates.filter(delegate =>
      delegate.address.toLowerCase().includes(query)
    )
    setFilteredDelegates(filtered)
    setCurrentPage(1)
  }, [searchQuery, delegates])

  // Pagination
  const totalPages = Math.ceil(filteredDelegates.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentDelegates = filteredDelegates.slice(startIndex, endIndex)

  const getExplorerUrl = (address: string) => {
    return `${CONTRACT_CONFIG.blockExplorerUrl}/address/${address}`
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 10)}...${address.slice(-8)}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
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
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-t-2xl text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">All Delegates</h3>
                <p className="text-purple-100 mt-1">
                  Browse all addresses with voting weight
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="relative">
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
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            <div className="mt-2 text-sm text-gray-500">
              {filteredDelegates.length} delegate{filteredDelegates.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => loadDelegates(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : isLoading && delegates.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-100 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredDelegates.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-gray-600">
                  {searchQuery ? `No delegates found matching "${searchQuery}"` : 'No delegates found'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentDelegates.map((delegate, index) => {
                  const globalRank = startIndex + index + 1
                  const isAdded = isDelegateAdded(delegate.address)
                  return (
                    <div
                      key={delegate.address}
                      className="border border-gray-200 hover:border-purple-300 rounded-lg p-4 transition-all duration-200 hover:shadow-md bg-white"
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="flex-shrink-0 w-12 text-center">
                          <div className="text-lg font-bold text-gray-400">
                            #{globalRank}
                          </div>
                        </div>

                        {/* Address */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium text-gray-900">
                              {formatAddress(delegate.address)}
                            </span>
                            <button
                              onClick={() => copyToClipboard(delegate.address)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Copy address"
                            >
                              <svg className="w-4 h-4 text-gray-400 hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <a
                              href={getExplorerUrl(delegate.address)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="View in explorer"
                            >
                              <svg className="w-4 h-4 text-gray-400 hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Last updated: {new Date(parseInt(delegate.lastUpdatedAt) * 1000).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Weight */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-sm text-gray-500">Weight</div>
                          <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            {delegate.weight}
                          </div>
                        </div>

                        {/* Delegate Button */}
                        {onAddDelegate && (
                          <div className="flex-shrink-0">
                            {isAdded ? (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-xs font-medium">Added</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddDelegate(delegate.address)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span className="text-xs font-medium">Delegate</span>
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

            {/* Load More Button */}
            {!isLoading && !error && hasMore && !searchQuery && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => loadDelegates(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  Load More
                </button>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {!isLoading && !error && filteredDelegates.length > 0 && totalPages > 1 && (
            <div className="border-t border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredDelegates.length)} of {filteredDelegates.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="px-4 py-2 text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
