import { useState, useEffect } from 'react'
import { Button } from '~/components/common/Button'
import { MerkleTreeCacheManager } from '~/lib/merkle'

interface CacheStatsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CacheStatsModal = ({ isOpen, onClose }: CacheStatsModalProps) => {
  const [stats, setStats] = useState({
    totalTrees: 0,
    totalNodes: 0,
    oldestEntry: 0,
    newestEntry: 0
  })
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadStats()
    }
  }, [isOpen])

  const loadStats = () => {
    const cacheManager = MerkleTreeCacheManager.getInstance()
    const currentStats = cacheManager.getCacheStats()
    setStats(currentStats)
  }

  const handleClearCache = async () => {
    setIsClearing(true)
    try {
      const cacheManager = MerkleTreeCacheManager.getInstance()
      await cacheManager.clearAllCache()
      loadStats() // Refresh stats
      console.log('Cache cleared successfully')
    } catch (error) {
      console.error('Failed to clear cache:', error)
    } finally {
      setIsClearing(false)
    }
  }

  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return 'N/A'
    return new Date(timestamp).toLocaleString()
  }

  const formatFileSize = (nodes: number) => {
    const estimatedBytes = nodes * 32
    if (estimatedBytes < 1024) return `${estimatedBytes} B`
    if (estimatedBytes < 1024 * 1024) return `${(estimatedBytes / 1024).toFixed(1)} KB`
    return `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Merkle Tree Cache Statistics</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Cache Overview */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900 mb-3">Cache Overview</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Cached Trees:</span>
                  <div className="font-medium">{stats.totalTrees}</div>
                </div>
                <div>
                  <span className="text-gray-600">Total Nodes:</span>
                  <div className="font-medium">{stats.totalNodes.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Estimated Size:</span>
                  <div className="font-medium">{formatFileSize(stats.totalNodes)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Storage Used:</span>
                  <div className="font-medium">localStorage</div>
                </div>
              </div>
            </div>

            {/* Cache Timeline */}
            {stats.totalTrees > 0 && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 mb-3">Cache Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Oldest Entry:</span>
                    <div className="font-medium">{formatDate(stats.oldestEntry)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Newest Entry:</span>
                    <div className="font-medium">{formatDate(stats.newestEntry)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {stats.totalTrees === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">No cached trees yet</p>
                <p className="text-gray-500 text-xs mt-1">
                  Trees will be cached automatically when reconstructed
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
            
            <div className="flex gap-2">
              {stats.totalTrees > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCache}
                  disabled={isClearing}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {isClearing ? 'Clearing...' : 'Clear Cache'}
                </Button>
              )}
              <Button size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
