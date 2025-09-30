import { Alchemy, OwnedBaseNft } from 'alchemy-sdk'
import { ALCHEMY_CONFIG, getAlchemyNetwork } from './constants'
import { NFTInfo } from '~/types'

interface CacheEntry {
  data: NFTInfo[]
  timestamp: number
  blockNumber?: number
}

/**
 * Alchemy NFT service for efficient NFT discovery
 */
export class AlchemyService {
  private alchemy: Alchemy | null = null
  private cache: Map<string, CacheEntry> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private initialized = false

  /**
   * Initialize Alchemy service with chain ID
   */
  initialize(chainId: number): boolean {
    if (!ALCHEMY_CONFIG.enabled) {
      console.warn('Alchemy API key not provided - NFT discovery will be limited')
      return false
    }

    const network = getAlchemyNetwork(chainId)
    if (!network) {
      console.warn(`Unsupported network for Alchemy: ${chainId}`)
      return false
    }

    try {
      this.alchemy = new Alchemy({
        apiKey: ALCHEMY_CONFIG.apiKey,
        network: network
      })
      this.initialized = true
      console.log(`Alchemy service initialized for network: ${network}`)
      return true
    } catch (error) {
      console.error('Failed to initialize Alchemy service:', error)
      return false
    }
  }

  /**
   * Check if service is initialized and ready
   */
  isInitialized(): boolean {
    return this.initialized && this.alchemy !== null
  }

  /**
   * Get NFTs for owner filtered by specific contract addresses
   */
  async getNFTsForOwner(
    owner: string, 
    contractAddresses: string[]
  ): Promise<NFTInfo[]> {
    if (!this.isInitialized()) {
      throw new Error('Alchemy service not initialized')
    }

    // Check cache first
    const cacheKey = this.getCacheKey(owner, contractAddresses)
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      console.log(`Using cached NFT data for ${owner}`)
      return cached
    }

    try {
      console.log(`Fetching NFTs from Alchemy for ${owner}`)
      
      const response = await this.alchemy!.nft.getNftsForOwner(owner, {
        contractAddresses,
        omitMetadata: true, // Save API credits
        pageSize: 100
      })

      const nfts = this.transformAlchemyNFTs(response.ownedNfts, contractAddresses)
      
      // Cache the results
      this.setCache(cacheKey, nfts)
      
      console.log(`Found ${nfts.length} NFTs via Alchemy for ${owner}`)
      return nfts

    } catch (error) {
      console.error('Alchemy NFT fetch failed:', error)
      throw new Error(`Failed to fetch NFTs from Alchemy: ${error}`)
    }
  }

  /**
   * Transform Alchemy NFT response to our NFTInfo format
   */
  private transformAlchemyNFTs(
    ownedNfts: OwnedBaseNft[], 
    contractAddresses: string[]
  ): NFTInfo[] {
    const nfts: NFTInfo[] = []

    for (const nft of ownedNfts) {
      // Find collection index based on contract address
      const collectionIndex = contractAddresses.findIndex(
        addr => addr.toLowerCase() === nft.contractAddress.toLowerCase()
      )

      if (collectionIndex === -1) continue // Skip if not in our collections

      // Convert hex token ID to decimal string
      const tokenId = parseInt(nft.tokenId, 16).toString()

      nfts.push({
        collectionIndex,
        tokenId,
        collectionAddress: nft.contractAddress,
        delegatedTo: undefined, // Will be filled by contract interaction
        owned: true,
        tokenURI: undefined, // OwnedBaseNft doesn't have tokenUri
        name: `Token #${tokenId}` // OwnedBaseNft doesn't have title
      })
    }

    return nfts
  }

  /**
   * Generate cache key for owner and contracts
   */
  private getCacheKey(owner: string, contracts: string[]): string {
    const sortedContracts = contracts.slice().sort()
    return `${owner.toLowerCase()}-${sortedContracts.join(',').toLowerCase()}`
  }

  /**
   * Get data from cache if valid
   */
  private getFromCache(key: string): NFTInfo[] | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: NFTInfo[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })

    // Clean up old cache entries periodically
    if (this.cache.size > 100) {
      this.cleanupCache()
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Export singleton instance
export const alchemyService = new AlchemyService()
