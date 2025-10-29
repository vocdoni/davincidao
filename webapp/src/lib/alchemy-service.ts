import { Alchemy, OwnedBaseNft } from 'alchemy-sdk'
import { ALCHEMY_CONFIG, getAlchemyNetwork } from './constants'
import { NFTInfo } from '~/types'

interface CacheEntry {
  data: NFTInfo[]
  timestamp: number
  blockNumber?: number
}

const CACHE_KEY_PREFIX = 'alchemy_nft_cache_'
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

/**
 * Alchemy NFT service for efficient NFT discovery with persistent localStorage cache
 */
export class AlchemyService {
  private alchemy: Alchemy | null = null
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
    contractAddresses: string[],
    forceRefresh = false
  ): Promise<NFTInfo[]> {
    if (!this.isInitialized()) {
      throw new Error('Alchemy service not initialized')
    }

    // Check cache first (unless force refresh)
    const cacheKey = this.getCacheKey(owner, contractAddresses)
    if (!forceRefresh) {
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return cached
      }
      console.log('No cache found, fetching from Alchemy...')
    } else {
      console.log(`Force refresh requested: bypassing cache for ${owner}`)
    }

    try {
      console.log(`Fetching NFTs from Alchemy API for ${owner}...`)

      let allNfts: OwnedBaseNft[] = []
      let pageKey: string | undefined = undefined
      let pageCount = 0
      let response

      // Fetch all pages
      do {
        response = await this.alchemy!.nft.getNftsForOwner(owner, {
          contractAddresses,
          omitMetadata: true, // Save API credits
          pageSize: 100,
          pageKey
        })

        allNfts = allNfts.concat(response.ownedNfts)
        pageKey = response.pageKey
        pageCount++

        console.log(`Fetched page ${pageCount}: ${response.ownedNfts.length} NFTs (total so far: ${allNfts.length})`)

        if (response.totalCount !== undefined) {
          console.log(`Total NFTs for owner: ${response.totalCount}`)
        }
      } while (pageKey)

      const nfts = this.transformAlchemyNFTs(allNfts, contractAddresses)

      // Cache the results
      this.setCache(cacheKey, nfts)

      console.log(`Found ${nfts.length} NFTs via Alchemy for ${owner} (fetched ${pageCount} pages)`)
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

      // Token ID is already in decimal format from Alchemy SDK
      const tokenId = nft.tokenId

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
   * Get data from localStorage cache if valid
   */
  private getFromCache(key: string): NFTInfo[] | null {
    try {
      const cacheKey = CACHE_KEY_PREFIX + key
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return null

      const entry: CacheEntry = JSON.parse(cached)
      const now = Date.now()

      // Check if cache is expired
      if (now - entry.timestamp > CACHE_TTL) {
        localStorage.removeItem(cacheKey)
        return null
      }

      console.log(`✓ Using cached Alchemy data (age: ${Math.round((now - entry.timestamp) / 1000 / 60)} minutes)`)
      return entry.data
    } catch (error) {
      console.warn('Failed to read from cache:', error)
      return null
    }
  }

  /**
   * Set data in localStorage cache
   */
  private setCache(key: string, data: NFTInfo[]): void {
    try {
      const cacheKey = CACHE_KEY_PREFIX + key
      const entry: CacheEntry = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(cacheKey, JSON.stringify(entry))
      console.log(`✓ Cached Alchemy data to localStorage`)
    } catch (error) {
      console.warn('Failed to write to cache:', error)
    }
  }

  /**
   * Clear all Alchemy cached data from localStorage
   */
  clearCache(): void {
    try {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key)
        }
      }
      console.log('✓ Cleared all Alchemy cache')
    } catch (error) {
      console.warn('Failed to clear cache:', error)
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    try {
      const keys = Object.keys(localStorage)
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_KEY_PREFIX))
      return {
        size: cacheKeys.length,
        keys: cacheKeys.map(k => k.replace(CACHE_KEY_PREFIX, ''))
      }
    } catch {
      return { size: 0, keys: [] }
    }
  }
}

// Export singleton instance
export const alchemyService = new AlchemyService()
