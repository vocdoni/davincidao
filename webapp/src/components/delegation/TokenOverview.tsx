import { formatNumber, formatAddress } from '~/lib/utils'

interface CollectionInfo {
  collectionIndex: number
  collectionAddress: string
  tokenIds: string[]
}

interface TokenOverviewProps {
  totalTokens: number
  delegatedTokens: number
  availableTokens: number
  ownedTokensByCollection: Map<number, string[]>
  collectionAddresses: Map<number, string>
}

export const TokenOverview = ({
  totalTokens,
  delegatedTokens,
  availableTokens,
  ownedTokensByCollection,
  collectionAddresses
}: TokenOverviewProps) => {
  const collections: CollectionInfo[] = Array.from(ownedTokensByCollection.entries()).map(([collectionIndex, tokenIds]) => ({
    collectionIndex,
    collectionAddress: collectionAddresses.get(collectionIndex) || 'Unknown',
    tokenIds
  }))

  return (
    <div className="card overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold">Your NFT Tokens</h2>
            <p className="text-sm text-cyan-100">Overview of your holdings</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="group relative overflow-hidden text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-lg transition-all duration-200">
            <div className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {formatNumber(totalTokens)}
              </div>
              <div className="text-sm font-medium text-blue-700 mt-1 flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Total Owned
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 hover:shadow-lg transition-all duration-200">
            <div className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {formatNumber(delegatedTokens)}
              </div>
              <div className="text-sm font-medium text-green-700 mt-1 flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Currently Delegated
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200">
            <div className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent">
                {formatNumber(availableTokens)}
              </div>
              <div className="text-sm font-medium text-gray-700 mt-1 flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Available
              </div>
            </div>
          </div>
        </div>

        {collections.length > 0 && (
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Collections Breakdown
            </h3>
            <div className="space-y-2">
              {collections.map((collection) => (
                <div key={collection.collectionIndex} className="group flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-transparent hover:from-cyan-50 hover:to-blue-50 rounded-lg border border-gray-200 hover:border-cyan-300 transition-all duration-200">
                  <div>
                    <span className="font-medium text-gray-900">{formatAddress(collection.collectionAddress)}</span>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                      Collection {collection.collectionIndex}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-lg font-bold text-cyan-600">{collection.tokenIds.length}</div>
                      <div className="text-xs text-gray-500">
                        token{collection.tokenIds.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-cyan-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
