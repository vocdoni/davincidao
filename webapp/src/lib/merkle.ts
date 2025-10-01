import { DavinciDaoContract } from './contract'
import { MerkleTreeNode, CensusData } from '~/types'
import { STORAGE_KEYS, UI_CONFIG } from './constants'
import { poseidon2 } from 'poseidon-lite'
import { LeanIMT } from '@zk-kit/lean-imt'

/**
 * Rate limit error detection and retry utility for merkle operations
 */
class MerkleRateLimitHandler {
  static isRateLimitError(error: unknown): boolean {
    const errorObj = error as { message?: string; code?: number; data?: { originalError?: { message?: string } } }
    const errorMessage = errorObj?.message?.toLowerCase() || ''
    const errorCode = errorObj?.code
    const errorData = errorObj?.data?.originalError?.message?.toLowerCase() || ''
    
    return (
      errorCode === -32005 || // Standard rate limit error code
      errorCode === 429 || // HTTP 429 Too Many Requests
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      errorMessage.includes('429') ||
      errorData.includes('rate limit') ||
      errorData.includes('too many requests')
    )
  }

  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 2000
  ): Promise<T> {
    let lastError: unknown
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        if (attempt === maxRetries) {
          throw error
        }
        
        if (this.isRateLimitError(error)) {
          const delay = baseDelay * Math.pow(2, attempt) // Exponential backoff
          console.warn(`Merkle operation rate limit detected (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          // If it's not a rate limit error, don't retry
          throw error
        }
      }
    }
    
    throw lastError
  }
}

/**
 * Enhanced cache data structure for merkle trees
 */
interface MerkleTreeCacheEntry {
  root: string
  nodes: MerkleTreeNode[]
  totalParticipants: number
  timestamp: number
  isComplete: boolean
  lastFetchedIndex: number
  checksum?: string
  metadata: {
    fetchStartTime: number
    fetchEndTime?: number
    fetchAttempts: number
    lastError?: string
    contractAddress?: string
  }
}

interface MerkleTreeCacheIndex {
  version: string
  trees: { [merkleRoot: string]: MerkleTreeCacheEntry }
  currentRoot?: string
  maxCacheSize: number
}

/**
 * Enhanced Merkle Tree Cache Manager
 */
export class MerkleTreeCacheManager {
  private static instance: MerkleTreeCacheManager
  private cacheIndex: MerkleTreeCacheIndex | null = null

  private constructor() {
    this.loadCacheIndex()
  }

  static getInstance(): MerkleTreeCacheManager {
    if (!MerkleTreeCacheManager.instance) {
      MerkleTreeCacheManager.instance = new MerkleTreeCacheManager()
    }
    return MerkleTreeCacheManager.instance
  }

  private loadCacheIndex(): void {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.MERKLE_CACHE_INDEX)
      if (cached) {
        this.cacheIndex = JSON.parse(cached)
        // Migrate old cache format if needed
        if (!this.cacheIndex?.version || this.cacheIndex.version !== '1.0') {
          this.migrateCacheFormat()
        }
      } else {
        this.initializeCacheIndex()
      }
    } catch (error) {
      console.warn('Failed to load cache index, initializing new one:', error)
      this.initializeCacheIndex()
    }
  }

  private initializeCacheIndex(): void {
    this.cacheIndex = {
      version: '1.0',
      trees: {},
      maxCacheSize: UI_CONFIG.MERKLE_CACHE.MAX_CACHED_TREES
    }
    this.saveCacheIndex()
  }

  private migrateCacheFormat(): void {
    console.log('Migrating cache format to v1.0')
    // Clear old format and start fresh
    this.clearAllCache()
    this.initializeCacheIndex()
  }

  private saveCacheIndex(): void {
    try {
      if (this.cacheIndex) {
        localStorage.setItem(STORAGE_KEYS.MERKLE_CACHE_INDEX, JSON.stringify(this.cacheIndex))
      }
    } catch (error) {
      console.warn('Failed to save cache index:', error)
    }
  }

  async getCachedTree(merkleRoot: string, contractAddress?: string): Promise<CensusData | null> {
    if (!this.cacheIndex) return null

    const entry = this.cacheIndex.trees[merkleRoot]
    if (!entry) return null

    // Check if cache is expired
    const now = Date.now()
    if (now - entry.timestamp > UI_CONFIG.MERKLE_CACHE.TREE_CACHE_DURATION) {
      console.log(`Cache expired for root ${merkleRoot}`)
      await this.removeCachedTree(merkleRoot)
      return null
    }

    // Check contract address if provided
    if (contractAddress && entry.metadata.contractAddress && 
        entry.metadata.contractAddress !== contractAddress) {
      console.log(`Contract address mismatch for root ${merkleRoot}`)
      return null
    }

    // Validate integrity if enabled
    if (UI_CONFIG.MERKLE_CACHE.INTEGRITY_CHECK_ENABLED && entry.checksum) {
      const calculatedChecksum = this.calculateChecksum(entry.nodes)
      if (calculatedChecksum !== entry.checksum) {
        console.warn(`Integrity check failed for root ${merkleRoot}`)
        await this.removeCachedTree(merkleRoot)
        return null
      }
    }

    console.log(`Cache hit for root ${merkleRoot} (${entry.nodes.length} nodes)`)
    
    return {
      root: entry.root,
      nodes: entry.nodes,
      totalParticipants: entry.totalParticipants
    }
  }

  async saveTree(data: CensusData, isComplete: boolean, contractAddress?: string): Promise<void> {
    if (!this.cacheIndex) return

    const now = Date.now()
    const checksum = UI_CONFIG.MERKLE_CACHE.INTEGRITY_CHECK_ENABLED 
      ? this.calculateChecksum(data.nodes) 
      : undefined

    const entry: MerkleTreeCacheEntry = {
      root: data.root,
      nodes: data.nodes,
      totalParticipants: data.totalParticipants,
      timestamp: now,
      isComplete,
      lastFetchedIndex: data.nodes.length,
      checksum,
      metadata: {
        fetchStartTime: now,
        fetchEndTime: isComplete ? now : undefined,
        fetchAttempts: 1,
        contractAddress
      }
    }

    // Check if we need to make space
    if (Object.keys(this.cacheIndex.trees).length >= this.cacheIndex.maxCacheSize) {
      await this.pruneOldTrees()
    }

    this.cacheIndex.trees[data.root] = entry
    this.cacheIndex.currentRoot = data.root
    this.saveCacheIndex()

    console.log(`Saved tree to cache: ${data.root} (${data.nodes.length} nodes, complete: ${isComplete})`)
  }

  async updateProgress(root: string, lastIndex: number, error?: string): Promise<void> {
    if (!this.cacheIndex) return

    const entry = this.cacheIndex.trees[root]
    if (!entry) return

    entry.lastFetchedIndex = lastIndex
    entry.timestamp = Date.now()
    
    if (error) {
      entry.metadata.lastError = error
      entry.metadata.fetchAttempts++
    }

    this.saveCacheIndex()
  }

  async markComplete(root: string): Promise<void> {
    if (!this.cacheIndex) return

    const entry = this.cacheIndex.trees[root]
    if (!entry) return

    entry.isComplete = true
    entry.metadata.fetchEndTime = Date.now()
    
    // Recalculate checksum for completed tree
    if (UI_CONFIG.MERKLE_CACHE.INTEGRITY_CHECK_ENABLED) {
      entry.checksum = this.calculateChecksum(entry.nodes)
    }

    this.saveCacheIndex()
    console.log(`Marked tree as complete: ${root}`)
  }

  async getPartialTree(root: string): Promise<{ nodes: MerkleTreeNode[], lastIndex: number } | null> {
    if (!this.cacheIndex) return null

    const entry = this.cacheIndex.trees[root]
    if (!entry || entry.isComplete) return null

    return {
      nodes: entry.nodes,
      lastIndex: entry.lastFetchedIndex
    }
  }

  async appendNodes(root: string, newNodes: MerkleTreeNode[]): Promise<void> {
    if (!this.cacheIndex) return

    const entry = this.cacheIndex.trees[root]
    if (!entry) return

    entry.nodes.push(...newNodes)
    entry.lastFetchedIndex = entry.nodes.length
    entry.timestamp = Date.now()
    entry.totalParticipants = entry.nodes.length

    this.saveCacheIndex()
  }

  private async pruneOldTrees(): Promise<void> {
    if (!this.cacheIndex) return

    const entries = Object.entries(this.cacheIndex.trees)
    
    // Sort by timestamp (oldest first)
    entries.sort(([, a], [, b]) => a.timestamp - b.timestamp)
    
    // Remove oldest entries to make space
    const toRemove = entries.slice(0, Math.max(1, entries.length - this.cacheIndex.maxCacheSize + 1))
    
    for (const [root] of toRemove) {
      delete this.cacheIndex.trees[root]
      console.log(`Pruned old tree from cache: ${root}`)
    }

    this.saveCacheIndex()
  }

  async removeCachedTree(root: string): Promise<void> {
    if (!this.cacheIndex) return

    delete this.cacheIndex.trees[root]
    
    if (this.cacheIndex.currentRoot === root) {
      delete this.cacheIndex.currentRoot
    }

    this.saveCacheIndex()
    console.log(`Removed tree from cache: ${root}`)
  }

  async clearAllCache(): Promise<void> {
    try {
      // Clear the index
      localStorage.removeItem(STORAGE_KEYS.MERKLE_CACHE_INDEX)
      
      // Clear any individual tree entries (legacy cleanup)
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith(STORAGE_KEYS.MERKLE_TREE_PREFIX) || 
            key.startsWith(STORAGE_KEYS.MERKLE_TEMP)) {
          localStorage.removeItem(key)
        }
      }
      
      this.initializeCacheIndex()
      console.log('Cleared all merkle tree cache')
    } catch (error) {
      console.warn('Failed to clear cache:', error)
    }
  }

  private calculateChecksum(nodes: MerkleTreeNode[]): string {
    // Simple checksum calculation - in production, use a proper hash function
    let checksum = 0
    for (const node of nodes) {
      checksum ^= this.simpleHash(node.address + node.leaf + node.weight.toString())
    }
    return checksum.toString(16)
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash
  }

  getCacheStats(): { totalTrees: number, totalNodes: number, oldestEntry: number, newestEntry: number } {
    if (!this.cacheIndex) {
      return { totalTrees: 0, totalNodes: 0, oldestEntry: 0, newestEntry: 0 }
    }

    const entries = Object.values(this.cacheIndex.trees)
    const totalTrees = entries.length
    const totalNodes = entries.reduce((sum, entry) => sum + entry.nodes.length, 0)
    const timestamps = entries.map(entry => entry.timestamp)
    
    return {
      totalTrees,
      totalNodes,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
    }
  }

  getCacheIndex(): MerkleTreeCacheIndex | null {
    return this.cacheIndex
  }
}

/**
 * Retry mechanism with exponential backoff
 */
export class RetryableOperation {
  static async execute<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number
      initialDelay?: number
      maxDelay?: number
      backoffFactor?: number
      onRetry?: (attempt: number, error: Error) => void
    } = {}
  ): Promise<T> {
    const {
      maxRetries = UI_CONFIG.MERKLE_CACHE.MAX_RETRIES,
      initialDelay = UI_CONFIG.MERKLE_CACHE.INITIAL_RETRY_DELAY,
      maxDelay = UI_CONFIG.MERKLE_CACHE.MAX_RETRY_DELAY,
      backoffFactor = UI_CONFIG.MERKLE_CACHE.BACKOFF_FACTOR,
      onRetry
    } = options

    let lastError: Error
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxRetries) {
          throw lastError
        }

        const delay = Math.min(initialDelay * Math.pow(backoffFactor, attempt), maxDelay)
        
        if (onRetry) {
          onRetry(attempt + 1, lastError)
        }
        
        console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, lastError.message)
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }
}

/**
 * Enhanced Merkle Tree Reconstructor with caching and resume capability
 */
export class MerkleTreeReconstructor {
  private contract: DavinciDaoContract
  private cacheManager: MerkleTreeCacheManager

  constructor(contract: DavinciDaoContract) {
    this.contract = contract
    this.cacheManager = MerkleTreeCacheManager.getInstance()
  }

  async reconstructTree(
    onProgress?: (current: number, total: number) => void
  ): Promise<CensusData> {
    const currentRoot = await this.contract.getCensusRoot()
    const rootStr = currentRoot.toString()
    
    console.log(`Starting tree reconstruction for root: ${rootStr}`)

    // Check cache first
    const cached = await this.cacheManager.getCachedTree(rootStr, this.contract.address)
    if (cached) {
      console.log(`Using cached complete tree for root: ${rootStr}`)
      if (onProgress) {
        onProgress(cached.nodes.length, cached.nodes.length)
      }
      return cached
    }

    // Check for partial data to resume
    const partial = await this.cacheManager.getPartialTree(rootStr)
    let startIndex = 0
    let existingNodes: MerkleTreeNode[] = []
    
    if (partial) {
      startIndex = partial.lastIndex
      existingNodes = partial.nodes
      console.log(`Resuming tree reconstruction from index ${startIndex} (${existingNodes.length} nodes cached)`)
    }

    // Start reconstruction
    const startTime = Date.now()
    
    try {
      const result = await this.reconstructTreeProgressive(
        rootStr,
        startIndex,
        existingNodes,
        onProgress
      )

      // Only mark as complete and save if we actually got a valid result
      if (result.nodes.length > 0 || result.totalParticipants === 0) {
        await this.cacheManager.markComplete(rootStr)
        
        const duration = Date.now() - startTime
        console.log(`Tree reconstruction completed in ${duration}ms: ${result.nodes.length} nodes`)
      } else {
        console.warn('Tree reconstruction returned invalid result, not caching')
        // Remove any partial cache entry for this failed reconstruction
        await this.cacheManager.removeCachedTree(rootStr)
      }
      
      return result
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Tree reconstruction failed for root ${rootStr}:`, errorMsg)
      
      // Remove any partial cache entry for this failed reconstruction
      await this.cacheManager.removeCachedTree(rootStr)
      
      // Don't update progress for failed reconstructions - just clean up
      throw error
    }
  }

  private async reconstructTreeProgressive(
    rootStr: string,
    startIndex: number,
    existingNodes: MerkleTreeNode[],
    onProgress?: (current: number, total: number) => void
  ): Promise<CensusData> {
    const nodes: MerkleTreeNode[] = [...existingNodes]
    
    // First, check if the tree is empty by trying to get the first account
    if (startIndex === 0) {
      try {
        const firstAddress = await this.contract.getAccountAt(0)
        
        // If we get a zero address, the tree is legitimately empty
        if (firstAddress === '0x0000000000000000000000000000000000000000') {
          console.log('Tree is empty - no accounts found')
          
          const censusData: CensusData = {
            root: rootStr,
            nodes: [],
            totalParticipants: 0,
          }
          
          // Cache the empty result only if it's legitimately empty
          await this.cacheManager.saveTree(censusData, true, this.contract.address)
          
          if (onProgress) {
            onProgress(1, 1) // Show completion
          }
          
          return censusData
        }
      } catch (error) {
        console.error('Failed to check if tree is empty - contract error:', error)
        
        // Don't cache failed contract calls as empty trees
        // Re-throw the error to be handled by the caller
        throw new Error(`Contract interaction failed during tree reconstruction: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Estimate total size if we don't have existing data
    let totalEstimate = existingNodes.length
    if (startIndex === 0) {
      try {
        totalEstimate = await this.estimateTreeSize()
      } catch (error) {
        console.error('Failed to estimate tree size - contract error:', error)
        throw new Error(`Contract interaction failed during tree size estimation: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } else {
      // For resumed operations, we need to re-estimate from current position
      try {
        totalEstimate = await this.estimateTreeSize(startIndex)
      } catch (error) {
        console.error('Failed to estimate tree size from index', startIndex, '- contract error:', error)
        throw new Error(`Contract interaction failed during tree size estimation: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (totalEstimate === 0 && startIndex === 0) {
      console.log('No valid accounts found during estimation - tree is legitimately empty')
      const censusData: CensusData = {
        root: rootStr,
        nodes: [],
        totalParticipants: 0,
      }
      
      await this.cacheManager.saveTree(censusData, true, this.contract.address)
      
      if (onProgress) {
        onProgress(1, 1)
      }
      
      return censusData
    }

    // If we have existing nodes but estimation failed, that's an error
    if (totalEstimate === 0 && startIndex > 0) {
      throw new Error('Tree size estimation failed for resumed operation - contract interaction error')
    }

    // Fetch remaining nodes in batches
    let currentIndex = startIndex
    const batchSize = UI_CONFIG.MERKLE_CACHE.BATCH_SIZE
    let hasAnyValidNodes = existingNodes.length > 0

    while (currentIndex < totalEstimate) {
      try {
        const batchNodes = await this.fetchBatchWithRetry(currentIndex, batchSize)
        
        if (batchNodes.length === 0) {
          break // No more nodes
        }

        hasAnyValidNodes = true
        nodes.push(...batchNodes)
        currentIndex += batchNodes.length

        // Save progress
        await this.cacheManager.appendNodes(rootStr, batchNodes)
        
        if (onProgress) {
          onProgress(currentIndex, totalEstimate)
        }

        // Save intermediate progress every few batches
        if (currentIndex % (batchSize * 5) === 0) {
          const intermediateData: CensusData = {
            root: rootStr,
            nodes: [...nodes],
            totalParticipants: nodes.length,
          }
          await this.cacheManager.saveTree(intermediateData, false, this.contract.address)
        }
      } catch (error) {
        console.error(`Failed to fetch batch starting at index ${currentIndex}:`, error)
        
        // If we haven't successfully fetched any nodes and this is the first batch,
        // this is likely a contract error, not an empty tree
        if (!hasAnyValidNodes && currentIndex === startIndex) {
          throw new Error(`Contract interaction failed during node fetching: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
        
        // If we have some nodes but later batches fail, we can still return partial results
        console.warn(`Partial tree reconstruction - stopping at index ${currentIndex} due to errors`)
        break
      }
    }

    // If we didn't get any valid nodes and this isn't a legitimate empty tree check,
    // then this is an error condition
    if (nodes.length === 0 && startIndex === 0 && !hasAnyValidNodes) {
      throw new Error('No valid nodes found - contract interaction failed')
    }

    // Final result
    const censusData: CensusData = {
      root: rootStr,
      nodes: nodes.sort((a, b) => a.index - b.index),
      totalParticipants: nodes.length,
    }

    // Only save if we have valid data or confirmed empty tree
    if (nodes.length > 0 || (startIndex === 0 && totalEstimate === 0)) {
      await this.cacheManager.saveTree(censusData, true, this.contract.address)
    }

    return censusData
  }

  private async fetchBatchWithRetry(startIndex: number, batchSize: number): Promise<MerkleTreeNode[]> {
    return RetryableOperation.execute(
      async () => {
        const batch: Promise<MerkleTreeNode | null>[] = []
        
        for (let i = 0; i < batchSize; i++) {
          batch.push(this.getNodeAt(startIndex + i))
        }

        const batchResults = await Promise.all(batch)
        return batchResults.filter((node): node is MerkleTreeNode => node !== null)
      },
      {
        onRetry: (attempt, error) => {
          console.warn(`Batch fetch retry ${attempt} for indices ${startIndex}-${startIndex + batchSize - 1}:`, error.message)
        }
      }
    )
  }

  private async estimateTreeSize(fromIndex: number = 0): Promise<number> {
    let totalEstimate = fromIndex
    let consecutiveFailures = 0
    const maxConsecutiveFailures = 10 // Stop after 10 consecutive failures

    while (consecutiveFailures < maxConsecutiveFailures) {
      try {
        const address = await this.contract.getAccountAt(totalEstimate)
        if (address === '0x0000000000000000000000000000000000000000') {
          consecutiveFailures++
        } else {
          consecutiveFailures = 0
        }
        totalEstimate++
      } catch {
        consecutiveFailures++
        if (consecutiveFailures >= maxConsecutiveFailures) {
          break
        }
        totalEstimate++
      }
    }

    // Adjust total estimate to exclude the consecutive failures
    return Math.max(fromIndex, totalEstimate - consecutiveFailures)
  }

  private async getNodeAt(index: number): Promise<MerkleTreeNode | null> {
    try {
      return await MerkleRateLimitHandler.executeWithRetry(async () => {
        const address = await this.contract.getAccountAt(index)
        
        if (address === '0x0000000000000000000000000000000000000000') {
          return null
        }

        const delegationInfo = await this.contract.getDelegations(address)
        
        return {
          index,
          address,
          weight: delegationInfo.weight,
          leaf: delegationInfo.leaf,
        }
      })
    } catch (error) {
      console.error(`Error getting node at index ${index}:`, error)
      return null
    }
  }

  // Legacy method for backward compatibility
  getCachedCensusData(): CensusData | null {
    // This method is kept for backward compatibility but now uses the new cache system
    const stats = this.cacheManager.getCacheStats()
    if (stats.totalTrees === 0) {
      return null
    }

    // Try to get the most recent complete tree
    const cacheIndex = this.cacheManager.getCacheIndex()
    if (!cacheIndex?.currentRoot) {
      return null
    }

    const entry = cacheIndex.trees[cacheIndex.currentRoot]
    if (!entry || !entry.isComplete) {
      return null
    }

    return {
      root: entry.root,
      nodes: entry.nodes,
      totalParticipants: entry.totalParticipants
    }
  }

  // Utility methods
  async clearCache(): Promise<void> {
    await this.cacheManager.clearAllCache()
  }

  getCacheStats() {
    return this.cacheManager.getCacheStats()
  }
}

/**
 * Generate merkle proofs for addresses using official LeanIMT library
 */
export function generateProofs(censusData: CensusData, addresses: string[]): { [address: string]: string[] } {
  console.log('=== Generating proofs ===')
  console.log('Census data nodes:', censusData.nodes.length)
  console.log('Addresses to generate proofs for:', addresses)
  
  // Create LeanIMT with Poseidon hash function
  const tree = new LeanIMT((a, b) => poseidon2([a, b]))
  
  // Insert all leaves in order
  for (const node of censusData.nodes) {
    tree.insert(BigInt(node.leaf))
  }
  
  const proofs: { [address: string]: string[] } = {}

  for (const address of addresses) {
    console.log(`Looking for address: ${address}`)
    
    // Debug: show all addresses in the tree
    const allAddresses = censusData.nodes.map(n => n.address.toLowerCase())
    console.log('All addresses in tree:', allAddresses)
    
    const node = censusData.nodes.find(n => n.address.toLowerCase() === address.toLowerCase())
    console.log(`Found node for ${address}:`, node)
    
    if (node) {
      const leafBigInt = BigInt(node.leaf)
      const leafIndex = tree.indexOf(leafBigInt)
      console.log(`Leaf index for ${address}: ${leafIndex}`)
      console.log(`Node leaf: ${node.leaf}`)
      
      if (leafIndex !== -1) {
        const proof = tree.generateProof(leafIndex)
        // Convert siblings from bigint to string
        const siblings = proof.siblings.map(s => s.toString())
        proofs[address] = siblings
        
        console.log(`Generated ${siblings.length} proof elements for ${address}:`, siblings)
      } else {
        console.error(`Leaf not found in tree for ${address}`)
      }
    } else {
      console.error(`Node not found in census data for ${address}`)
    }
  }

  console.log('Final proofs:', proofs)
  return proofs
}

/**
 * Pack address and weight into a leaf value (matches contract implementation)
 */
export function packLeaf(address: string, weight: number): string {
  // Convert address to uint160 and weight to uint88, then pack
  const addressBN = BigInt(address)
  const weightBN = BigInt(weight)
  
  // Pack: (address << 88) | weight
  const packed = (addressBN << 88n) | weightBN
  return packed.toString()
}
