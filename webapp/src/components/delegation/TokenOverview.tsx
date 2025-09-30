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
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-4">Your NFT Tokens</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{formatNumber(totalTokens)}</div>
          <div className="text-sm text-blue-800">Total Owned</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{formatNumber(delegatedTokens)}</div>
          <div className="text-sm text-green-800">Currently Delegated</div>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{formatNumber(availableTokens)}</div>
          <div className="text-sm text-gray-800">Available to Delegate</div>
        </div>
      </div>

      {collections.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Collections Breakdown</h3>
          <div className="space-y-2">
            {collections.map((collection) => (
              <div key={collection.collectionIndex} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <div>
                  <span className="font-medium">{formatAddress(collection.collectionAddress)}</span>
                  <div className="text-xs text-gray-500">Collection {collection.collectionIndex}</div>
                </div>
                <div className="text-sm text-gray-600">
                  {collection.tokenIds.length} token{collection.tokenIds.length !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
