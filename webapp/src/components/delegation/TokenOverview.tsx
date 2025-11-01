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
      <div className="card-header">
        <span className="text-sm uppercase tracking-wider">[ YOUR TOKENS ]</span>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-4 border border-gray-200 hover:border-black transition-colors">
            <div className="text-2xl font-mono font-bold">
              {formatNumber(totalTokens)}
            </div>
            <div className="text-xs text-gray-600 mt-1 uppercase tracking-wide">
              Total
            </div>
          </div>

          <div className="text-center p-4 border border-gray-200 hover:border-black transition-colors">
            <div className="text-2xl font-mono font-bold terminal-accent">
              {formatNumber(delegatedTokens)}
            </div>
            <div className="text-xs text-gray-600 mt-1 uppercase tracking-wide">
              Delegated
            </div>
          </div>

          <div className="text-center p-4 border border-gray-200 hover:border-black transition-colors">
            <div className="text-2xl font-mono font-bold">
              {formatNumber(availableTokens)}
            </div>
            <div className="text-xs text-gray-600 mt-1 uppercase tracking-wide">
              Available
            </div>
          </div>
        </div>

        {collections.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Collections</h3>
            <div className="space-y-2">
              {collections.map((collection) => (
                <div key={collection.collectionIndex} className="flex justify-between items-center p-3 border border-gray-200 hover:border-black transition-colors">
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-xs">{formatAddress(collection.collectionAddress)}</span>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Collection {collection.collectionIndex}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-mono font-bold terminal-accent">{collection.tokenIds.length}</div>
                    <div className="text-xs text-gray-500">
                      token{collection.tokenIds.length !== 1 ? 's' : ''}
                    </div>
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
