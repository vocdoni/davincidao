import { Contract, BrowserProvider, JsonRpcProvider, Wallet } from 'ethers'
import { DAVINCI_DAO_ABI, ERC721_ABI, CONTRACT_CONFIG, ERROR_MESSAGES, UI_CONFIG, ERC721_INTERFACE_IDS } from './constants'
import { Collection, ProofInput, NFTInfo, DelegationInfo, CollectionStats, TokenMetadata } from '~/types'
import { alchemyService } from './alchemy-service'
import { getSubgraphClient, isSubgraphInitialized } from './subgraph-client'

/**
 * Rate limit error detection and retry utility
 */
class RateLimitHandler {
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
          console.warn(`Rate limit detected (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`)
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
 * Simplified DavinciDAO contract interaction class for ERC-721 only
 */
export class DavinciDaoContract {
  private contract: Contract
  private provider: BrowserProvider | JsonRpcProvider
  public readonly address: string
  private wallet?: { address: string } // For private key connections
  private privateKeyWallet?: Wallet // For private key wallet

  constructor(
    provider: BrowserProvider | JsonRpcProvider, 
    contractAddress?: string, 
    wallet?: { address: string } | Wallet
  ) {
    this.provider = provider
    this.address = contractAddress || CONTRACT_CONFIG.address
    
    // Validate contract address
    if (!this.address || this.address === '') {
      throw new Error('Contract address is required. Please set VITE_CONTRACT_ADDRESS in your .env file.')
    }
    
    if (!this.address.startsWith('0x') || this.address.length !== 42) {
      throw new Error(`Invalid contract address format: ${this.address}. Expected 42-character hex string starting with 0x.`)
    }
    
    // Handle different wallet types
    if (wallet) {
      if ('address' in wallet && typeof wallet.address === 'string') {
        // Simple wallet object
        this.wallet = wallet as { address: string }
      } else if ('getAddress' in wallet) {
        // Ethers Wallet object
        this.privateKeyWallet = wallet as Wallet
        this.wallet = { address: (wallet as Wallet).address }
      }
    }
    
    // For now, always use the provider. We'll get the signer when needed for transactions
    this.contract = new Contract(this.address, DAVINCI_DAO_ABI, provider)
  }


  /**
   * Get a contract instance with signer for transactions
   */
  private async getSignerContract(): Promise<Contract> {
    // If we have a private key wallet, use it directly
    if (this.privateKeyWallet) {
      return new Contract(this.address, DAVINCI_DAO_ABI, this.privateKeyWallet)
    }
    
    // If we have a browser provider, get the signer
    if (this.wallet && this.provider instanceof BrowserProvider) {
      const signer = await this.provider.getSigner()
      return new Contract(this.address, DAVINCI_DAO_ABI, signer)
    }
    
    throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
  }

  // ========= Contract Verification =========

  /**
   * Verify contract exists and has expected interface
   */
  async verifyContract(): Promise<{ exists: boolean; hasInterface: boolean; error?: string }> {
    try {
      const code = await this.provider.getCode(this.address)
      if (code === '0x') {
        return { exists: false, hasInterface: false, error: 'No contract deployed at this address' }
      }

      // Test basic functionality
      try {
        await this.contract.getCensusRoot.staticCall()
        return { exists: true, hasInterface: true }
      } catch (error: unknown) {
        const errorObj = error as { code?: string }
        if (errorObj.code === 'CALL_EXCEPTION') {
          return { 
            exists: true, 
            hasInterface: false, 
            error: 'Contract exists but does not implement DavinciDAO interface' 
          }
        }
        throw error
      }
    } catch (error: unknown) {
      const errorObj = error as { message?: string }
      return { 
        exists: false, 
        hasInterface: false, 
        error: `Verification failed: ${errorObj.message || 'Unknown error'}` 
      }
    }
  }

  /**
   * Debug contract deployment and collections
   */
  async debugContractDeployment(): Promise<void> {
    console.log('=== Contract Debug Information ===')
    console.log('Contract address:', this.address)
    
    try {
      const code = await this.provider.getCode(this.address)
      console.log('Contract has code:', code !== '0x')
      
      const censusRoot = await this.contract.getCensusRoot()
      console.log('Census root:', censusRoot.toString())
      
      const collectionCount = await this.getCollectionCount()
      console.log('Collection count:', collectionCount)
      
      for (let i = 0; i < collectionCount; i++) {
        try {
          const collectionResult = await this.contract.collections(i)
          console.log(`Collection ${i} result:`, collectionResult)
          
          // Check if the collection address has code (is a contract)
          const collectionCode = await this.provider.getCode(collectionResult)
          console.log(`Collection ${i} has code:`, collectionCode !== '0x')
          
          if (collectionCode !== '0x') {
            // Try to verify it's an ERC721
            const isERC721 = await this.isERC721(collectionResult)
            console.log(`Collection ${i} is ERC721:`, isERC721)
          }
        } catch (error) {
          console.error(`Failed to debug collection ${i}:`, error)
        }
      }
    } catch (error) {
      console.error('Contract debug failed:', error)
    }
    console.log('=== End Debug Information ===')
  }

  // ========= View Functions =========

  /**
   * Get current census root
   */
  async getCensusRoot(): Promise<bigint> {
    return await RateLimitHandler.executeWithRetry(async () => {
      try {
        const root = await this.contract.getCensusRoot()
        return root
      } catch (error: unknown) {
        // Handle the case where the tree is empty and returns 0x (empty bytes)
        const errorObj = error as { code?: string; value?: string }
        if (errorObj?.code === 'BAD_DATA' && errorObj?.value === '0x') {
          console.log('Census tree is empty, returning 0')
          return BigInt(0)
        }
        throw error
      }
    })
  }

  /**
   * Validate a census root and get the block number when it was set
   * Returns 0 if the root was never valid
   */
  async getRootBlockNumber(root: string | bigint): Promise<bigint> {
    return await RateLimitHandler.executeWithRetry(async () => {
      try {
        // Convert string to bigint if needed
        const rootBigInt = typeof root === 'string' ? BigInt(root) : root
        const blockNumber = await this.contract.getRootBlockNumber(rootBigInt)
        return blockNumber
      } catch (error) {
        console.error('Failed to get root block number:', error)
        throw error
      }
    })
  }

  /**
   * Get total number of collections (estimated by trying to access collections)
   */
  async getCollectionCount(): Promise<number> {
    try {
      console.log('🔍 Getting collection count...')
      console.log('📍 Contract address:', this.address)
      console.log('🌐 Provider:', this.provider.constructor.name)
      
      
      // Test: Try multiple diagnostic calls
      try {
        // First verify contract exists
        console.log('🧪 Testing contract existence...')
        const code = await this.provider.getCode(this.address)
        console.log('📝 Contract code length:', code.length)
        
        if (code === '0x') {
          console.log('❌ No contract deployed at this address!')
          return 0
        }
        
        // Test direct call with correct selector
        console.log('🧪 Testing direct call with correct selector...')
        const callData = '0xfdbda0ec' + '0'.repeat(64) // collections(0)
        const result = await this.provider.call({
          to: this.address,
          data: callData
        })
        console.log('✅ Direct call result:', result)
        
        // Check if result indicates no collection (empty or reverts)
        if (!result || result === '0x') {
          console.log('📋 Direct call returned empty - no collection at index 0')
        } else {
          console.log('🎉 Direct call succeeded! Contract has at least 1 collection')
          // Try to get the address from the result
          const decoded = result.slice(26) // Remove 0x and leading zeros  
          console.log('📍 Collection 0 address: 0x' + decoded)
        }
      } catch (directError: any) {
        console.log('❌ Direct call failed:', directError.message)
      }

      // Now try the regular ethers.js method
      console.log('🔄 Now trying ethers.js contract method...')
      let count = 0
      for (let i = 0; i < 10; i++) { // Reasonable limit to avoid infinite loops
        try {
          console.log(`📋 Checking collection ${i} via ethers.js...`)
          
          // Make the actual contract call
          const result = await this.contract.collections(i)
          console.log(`✅ Collection ${i} exists:`, result)
          console.log(`🔍 Collection ${i} type:`, typeof result)
          count++
        } catch (error: any) {
          console.log(`❌ Collection ${i} does not exist`)
          console.log(`🔍 Error details:`, {
            message: error?.message,
            code: error?.code,
            reason: error?.reason,
            data: error?.data
          })
          
          // Check if this is a revert (expected when no more collections)
          if (error?.code === 'CALL_EXCEPTION' || error?.message?.includes('execution reverted')) {
            console.log(`✋ Reached end of collections at index ${i}`)
            break
          } else {
            console.warn(`⚠️ Unexpected error for collection ${i}:`, error)
            break
          }
        }
      }
      console.log(`📊 Final collection count: ${count}`)
      return count
    } catch (error: unknown) {
      console.error('❌ Failed to get collection count:', error)
      return 0
    }
  }

  /**
   * Get all collections
   */
  async getAllCollections(): Promise<Collection[]> {
    try {
      console.log('🚀 Starting getAllCollections...')
      console.log('📍 Contract address:', this.address)
      console.log('🌐 Provider:', this.provider.constructor.name)
      
      const count = await this.getCollectionCount()
      console.log(`📋 Contract has ${count} collections`)
      const collections: Collection[] = []

      if (count === 0) {
        console.warn('⚠️ No collections found in contract')
        return collections
      }

      for (let i = 0; i < count; i++) {
        try {
          console.log(`🔍 Processing collection ${i}...`)
          const collectionResult = await this.contract.collections(i)
          console.log(`📝 Collection ${i} raw result:`, collectionResult)
          console.log(`🔍 Collection ${i} result type:`, typeof collectionResult)
          
          // Handle different return formats
          let tokenAddress: string
          if (typeof collectionResult === 'string') {
            // Direct address return (simplified contract)
            tokenAddress = collectionResult
            console.log(`✅ Collection ${i} direct address format: ${tokenAddress}`)
          } else if (collectionResult && collectionResult.token) {
            // Struct return (old contract format)
            tokenAddress = collectionResult.token
            console.log(`✅ Collection ${i} struct format: ${tokenAddress}`)
          } else if (collectionResult && typeof collectionResult === 'object' && collectionResult[0]) {
            // Array return format
            tokenAddress = collectionResult[0]
            console.log(`✅ Collection ${i} array format: ${tokenAddress}`)
          } else {
            console.warn(`⚠️ Collection ${i} has unexpected format:`, collectionResult)
            continue
          }

          if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
            console.warn(`⚠️ Collection ${i} has invalid token address: ${tokenAddress}`)
            continue
          }

          collections.push({
            token: tokenAddress,
            active: true, // Our current contract doesn't track active status
            totalDelegated: 0 // Our current contract doesn't track this
          })
        } catch (error) {
          // Skip invalid collection
          console.warn(`Failed to get collection ${i}:`, error)
        }
      }

      console.log(`Successfully loaded ${collections.length} valid collections`)
      return collections
    } catch (error: unknown) {
      console.error('Failed to get collections:', error)
      throw new Error(ERROR_MESSAGES.CONTRACT_ERROR)
    }
  }

  /**
   * Get collection by index
   */
  async getCollection(index: number): Promise<Collection> {
    try {
      const collection = await this.contract.collections(index)
      return {
        token: collection.token,
        active: true, // Our current contract doesn't track active status
        totalDelegated: 0 // Our current contract doesn't track this
      }
    } catch (error: unknown) {
      console.error(`Failed to get collection ${index}:`, error)
      throw new Error(ERROR_MESSAGES.INVALID_COLLECTION)
    }
  }

  /**
   * Get user's current weight and leaf
   */
  async getDelegations(address: string): Promise<DelegationInfo> {
    try {
      const [weight, leaf] = await RateLimitHandler.executeWithRetry(async () => {
        return await this.contract.getDelegations(address)
      })
      return {
        address,
        weight: Number(weight),
        leaf: leaf.toString()
      }
    } catch (error: unknown) {
      console.error('Failed to get delegations:', error)
      throw new Error(ERROR_MESSAGES.CONTRACT_ERROR)
    }
  }

  /**
   * Get user's weight
   */
  async getWeightOf(address: string): Promise<number> {
    try {
      const weight = await RateLimitHandler.executeWithRetry(async () => {
        return await this.contract.weightOf(address)
      })
      return Number(weight)
    } catch (error: unknown) {
      console.error('Failed to get weight:', error)
      return 0
    }
  }

  /**
   * Get account at specific tree index
   */
  async getAccountAt(index: number): Promise<string> {
    try {
      return await RateLimitHandler.executeWithRetry(async () => {
        return await this.contract.getAccountAt(index)
      })
    } catch {
      return '0x0000000000000000000000000000000000000000'
    }
  }

  // ========= ERC-721 Interactions =========

  /**
   * Check if contract supports ERC-721 interface
   */
  async isERC721(tokenAddress: string): Promise<boolean> {
    try {
      const tokenContract = new Contract(tokenAddress, ERC721_ABI, this.provider)
      return await tokenContract.supportsInterface(ERC721_INTERFACE_IDS.ERC721)
    } catch {
      return false
    }
  }

  /**
   * Get user's NFTs using Alchemy API
   * Both Alchemy and Subgraph are REQUIRED for DavinciDAO V2
   */
  async getUserNFTs(userAddress: string, forceRefresh = false): Promise<NFTInfo[]> {
    // Initialize Alchemy service if not already done
    if (!alchemyService.isInitialized()) {
      const network = await this.provider.getNetwork()
      const initialized = alchemyService.initialize(Number(network.chainId))
      if (!initialized) {
        throw new Error('Alchemy service failed to initialize. Check VITE_ALCHEMY_API_KEY.')
      }
    }

    // Verify subgraph is initialized
    if (!isSubgraphInitialized()) {
      throw new Error('Subgraph is not initialized. Check VITE_SUBGRAPH_ENDPOINT.')
    }

    console.log('Fetching user NFTs...')
    const collections = await this.getAllCollections()
    const allNFTs: NFTInfo[] = []

    for (let collectionIndex = 0; collectionIndex < collections.length; collectionIndex++) {
      const collection = collections[collectionIndex]

      // Validate collection token address
      if (!collection.token || collection.token === '0x0000000000000000000000000000000000000000') {
        console.warn(`Skipping collection ${collectionIndex}: invalid token address`)
        continue
      }

      console.log(`Discovering NFTs for collection ${collectionIndex} (${collection.token})`)

      // Fetch NFTs from Alchemy
      const nfts = await alchemyService.getNFTsForOwner(
        userAddress,
        [collection.token],
        forceRefresh
      )

      // Update collection index and add to results
      const updatedNfts = nfts.map(nft => ({ ...nft, collectionIndex }))

      if (updatedNfts.length > 0) {
        console.log(`✓ Found ${updatedNfts.length} NFTs for collection ${collectionIndex}`)

        // Get delegation status from subgraph
        await this.fillDelegationStatus(updatedNfts)

        allNFTs.push(...updatedNfts)
      } else {
        console.log(`No NFTs found for collection ${collectionIndex}`)
      }
    }

    console.log(`✓ Total NFTs discovered: ${allNFTs.length}`)
    return allNFTs
  }

  /**
   * Fill delegation status for NFTs using subgraph batch queries
   */
  private async fillDelegationStatus(nfts: NFTInfo[]): Promise<void> {
    console.log(`\n========== FILLING DELEGATION STATUS ==========`)
    console.log(`Processing ${nfts.length} NFTs...`)

    // Group NFTs by collection for efficient batch processing
    const nftsByCollection = new Map<number, NFTInfo[]>()
    for (const nft of nfts) {
      if (!nftsByCollection.has(nft.collectionIndex)) {
        nftsByCollection.set(nft.collectionIndex, [])
      }
      nftsByCollection.get(nft.collectionIndex)!.push(nft)
    }

    let subgraph
    try {
      subgraph = getSubgraphClient()
      console.log(`✓ Subgraph client initialized`)
    } catch (error) {
      console.error(`❌ CRITICAL: Subgraph client not initialized!`, error)
      console.error(`All NFTs will show as undelegated. Check VITE_SUBGRAPH_ENDPOINT.`)
      return
    }

    // Query subgraph for each collection
    for (const [collectionIndex, collectionNfts] of nftsByCollection) {
      try {
        const tokenIds = collectionNfts.map(nft => nft.tokenId)
        console.log(`\n--- Collection ${collectionIndex} ---`)
        console.log(`Querying subgraph for ${tokenIds.length} tokens`)
        console.log(`Token IDs:`, tokenIds.slice(0, 10), tokenIds.length > 10 ? `... and ${tokenIds.length - 10} more` : '')

        // Query subgraph first for efficiency
        const delegations = await subgraph.getTokenDelegations(collectionIndex, tokenIds)
        console.log(`📊 Subgraph returned ${delegations.length} delegation records`)

        if (delegations.length > 0) {
          console.log(`Sample delegations:`, delegations.slice(0, 3).map(d => ({
            tokenId: d.tokenId,
            delegate: d.delegate,
            isDelegated: d.isDelegated,
            owner: d.owner
          })))
          console.log(`ALL delegated token IDs from subgraph:`, delegations.filter(d => d.isDelegated).map(d => d.tokenId))
        }

        // ==================================================================================
        // CRITICAL: ALWAYS query blockchain for delegation status (SOURCE OF TRUTH)
        // ==================================================================================
        // The subgraph can lag behind by minutes/hours due to:
        // - Block indexing delays
        // - Missed events
        // - Network issues
        //
        // If we rely only on subgraph data, we'll try to delegate already-delegated tokens
        // and the contract will revert with AlreadyDelegated error.
        //
        // BLOCKCHAIN DATA IS THE ONLY RELIABLE SOURCE FOR MERKLE PROOF GENERATION
        // ==================================================================================
        console.log(`⚠️  Verifying delegation status from blockchain...`)
        try {
          const blockchainDelegates = await this.contract.getTokenDelegations(collectionIndex, tokenIds)
          console.log(`✓ Blockchain query complete for ${blockchainDelegates.length} tokens`)

          let blockchainDelegatedCount = 0
          const blockchainDelegatedTokens: string[] = []
          for (let i = 0; i < tokenIds.length; i++) {
            const delegate = blockchainDelegates[i]
            if (delegate && delegate !== '0x0000000000000000000000000000000000000000') {
              blockchainDelegatedCount++
              blockchainDelegatedTokens.push(tokenIds[i])
            }
          }

          console.log(`📊 Blockchain shows ${blockchainDelegatedCount} delegated tokens`)
          if (blockchainDelegatedCount > 0) {
            console.log(`Blockchain delegated token IDs:`, blockchainDelegatedTokens.slice(0, 20))
          }

          // Compare subgraph vs blockchain
          const subgraphDelegatedCount = delegations.filter(d => d.isDelegated).length
          if (subgraphDelegatedCount !== blockchainDelegatedCount) {
            console.warn(`⚠️  MISMATCH: Subgraph shows ${subgraphDelegatedCount} delegated, blockchain shows ${blockchainDelegatedCount}`)
            console.warn(`Using blockchain data as source of truth`)
          }

          // Update NFTs with blockchain delegation status (source of truth)
          let delegatedCount = 0
          const updatedTokens: string[] = []
          for (let i = 0; i < collectionNfts.length; i++) {
            const nft = collectionNfts[i]
            const tokenIndex = tokenIds.indexOf(nft.tokenId)
            if (tokenIndex !== -1) {
              const delegate = blockchainDelegates[tokenIndex]
              if (delegate && delegate !== '0x0000000000000000000000000000000000000000') {
                nft.delegatedTo = delegate
                delegatedCount++
                updatedTokens.push(nft.tokenId)
                if (updatedTokens.length <= 10) {
                  console.log(`  ✓ Token ${nft.tokenId} → delegated to ${delegate}`)
                }
              } else {
                nft.delegatedTo = undefined
              }
            }
          }

          console.log(`✓ Updated ${delegatedCount} NFTs with blockchain delegation data`)
        } catch (blockchainError) {
          console.error(`❌ Blockchain query failed, falling back to subgraph data:`, blockchainError)

          // Fallback to subgraph data if blockchain query fails
          if (delegations.length === 0) {
            console.warn(`⚠️ WARNING: Subgraph returned 0 delegations for collection ${collectionIndex}`)
            console.warn(`This means either:`)
            console.warn(`  1. No tokens are delegated yet`)
            console.warn(`  2. Subgraph is not synced`)
            console.warn(`  3. Subgraph query is failing`)
          }

          // Create a map for quick lookup
          const delegationMap = new Map(delegations.map(d => [d.tokenId, d]))
          console.log(`Created delegation map with ${delegationMap.size} entries (subgraph fallback)`)

          // Update NFTs with delegation status from subgraph
          let delegatedCount = 0
          let skippedCount = 0
          const updatedTokens: string[] = []
          for (const nft of collectionNfts) {
            const delegation = delegationMap.get(nft.tokenId)
            if (delegation) {
              if (delegation.isDelegated && delegation.delegate && delegation.delegate !== '0x0000000000000000000000000000000000000000') {
                nft.delegatedTo = delegation.delegate
                delegatedCount++
                updatedTokens.push(nft.tokenId)
                if (updatedTokens.length <= 10) {
                  console.log(`  ✓ Token ${nft.tokenId} → delegated to ${delegation.delegate} (subgraph)`)
                }
              } else {
                // Token has a delegation record but isDelegated=false or delegate is zero address
                nft.delegatedTo = undefined
                skippedCount++
              }
            } else {
              // No delegation record found
              nft.delegatedTo = undefined
            }
          }

          console.log(`Updated ${updatedTokens.length} tokens with delegation info (subgraph):`, updatedTokens.slice(0, 10))

          console.log(`✓ Updated delegation status for collection ${collectionIndex} (subgraph fallback):`)
          console.log(`  - ${delegatedCount} delegated`)
          console.log(`  - ${skippedCount} with delegation record but undelegated`)
          console.log(`  - ${collectionNfts.length - delegatedCount - skippedCount} no delegation record`)
        }
      } catch (error) {
        console.error(`❌ Error querying subgraph for collection ${collectionIndex}:`, error)
        console.error(`All NFTs in this collection will show as undelegated`)
        // Continue with other collections
      }
    }

    console.log(`========== DELEGATION STATUS COMPLETE ==========`)

    // Final verification: check that NFTs actually have delegatedTo populated
    const delegatedNfts = nfts.filter(n => n.delegatedTo && n.delegatedTo !== '0x0000000000000000000000000000000000000000')
    console.log(`🔍 Final verification: ${delegatedNfts.length} NFTs have delegatedTo field set`)
    if (delegatedNfts.length > 0) {
      console.log(`Sample:`, delegatedNfts.slice(0, 3).map(n => ({ tokenId: n.tokenId, delegatedTo: n.delegatedTo })))
    }
    console.log(`\n`)
  }

  /**
   * Get delegated token IDs for user (using getNFTids function)
   * NOTE: This queries the blockchain directly - it's the source of truth
   */
  async getDelegatedTokenIds(collectionIndex: number, candidateIds: string[]): Promise<string[]> {
    try {
      const result = await this.contract.getNFTids(collectionIndex, candidateIds)
      return result.map((id: bigint) => id.toString())
    } catch (error: unknown) {
      console.error('Failed to get delegated token IDs:', error)
      return []
    }
  }

  // ========= Collection Statistics =========

  /**
   * Get collection statistics
   */
  async getCollectionStats(collectionIndex: number, userAddress?: string): Promise<CollectionStats> {
    try {
      const collection = await this.getCollection(collectionIndex)
      const tokenContract = new Contract(collection.token, ERC721_ABI, this.provider)

      let totalSupply = 0
      let userTokens = 0
      let userDelegated = 0

      try {
        const supply = await tokenContract.totalSupply()
        totalSupply = Number(supply)
      } catch {
        // Total supply not available
      }

      if (userAddress) {
        try {
          const balance = await tokenContract.balanceOf(userAddress)
          userTokens = Number(balance)

          // Get user's delegated tokens (this is approximate)
          // We'd need to track all user tokens to be precise
          const weight = await this.getWeightOf(userAddress)
          userDelegated = weight // Simplified assumption
        } catch {
          // User stats not available
        }
      }

      return {
        collectionIndex,
        tokenAddress: collection.token,
        totalSupply,
        totalDelegated: collection.totalDelegated,
        userTokens,
        userDelegated
      }
    } catch (error: unknown) {
      console.error('Failed to get collection stats:', error)
      throw new Error(ERROR_MESSAGES.CONTRACT_ERROR)
    }
  }

  // ========= Delegation Functions =========

  /**
   * Delegate tokens to an address
   * @param to - Address to delegate to
   * @param collectionIndex - Collection index
   * @param tokenIds - Token IDs to delegate
   * @param proof - Merkle proof for the 'to' address (empty if new delegate)
   * @param fromProofs - Proofs for clearing inherited delegations (empty if no inherited delegations)
   */
  async delegate(
    to: string, 
    collectionIndex: number, 
    tokenIds: string[] | number[], 
    proof: string[] = [],
    fromProofs: ProofInput[] = []
  ): Promise<string> {
    try {
      const signerContract = await this.getSignerContract()
      // Convert tokenIds to numbers if they're strings
      const tokenIdsAsNumbers = tokenIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id)
      const tx = await signerContract.delegate(to, collectionIndex, tokenIdsAsNumbers, proof, fromProofs)
      return tx.hash
    } catch (error: unknown) {
      console.error('Delegation failed:', error)
      const errorObj = error as { message?: string; reason?: string }
      throw new Error(errorObj.reason || errorObj.message || ERROR_MESSAGES.TRANSACTION_FAILED)
    }
  }

  /**
   * Undelegate tokens
   */
  async undelegate(
    collectionIndex: number, 
    tokenIds: string[], 
    proofs: ProofInput[]
  ): Promise<string> {
    try {
      const signerContract = await this.getSignerContract()
      const tx = await signerContract.undelegate(collectionIndex, tokenIds, proofs)
      return tx.hash
    } catch (error: unknown) {
      console.error('Undelegation failed:', error)
      const errorObj = error as { message?: string; reason?: string }
      throw new Error(errorObj.reason || errorObj.message || ERROR_MESSAGES.TRANSACTION_FAILED)
    }
  }

  /**
   * Update delegation to new address
   */
  async updateDelegation(
    newDelegate: string,
    collectionIndex: number,
    tokenIds: string[],
    fromProofs: ProofInput[],
    toProof: bigint[] = []
  ): Promise<string> {
    try {
      const signerContract = await this.getSignerContract()
      const tx = await signerContract.updateDelegation(
        newDelegate, 
        collectionIndex, 
        tokenIds, 
        fromProofs, 
        toProof
      )
      return tx.hash
    } catch (error: unknown) {
      console.error('Delegation update failed:', error)
      const errorObj = error as { message?: string; reason?: string }
      throw new Error(errorObj.reason || errorObj.message || ERROR_MESSAGES.TRANSACTION_FAILED)
    }
  }

  // ========= Utility Functions =========

  /**
   * Get token metadata from URI
   */
  async getTokenMetadata(tokenURI: string): Promise<TokenMetadata | null> {
    try {
      // Handle IPFS URIs
      let url = tokenURI
      if (tokenURI.startsWith('ipfs://')) {
        url = `https://ipfs.io/ipfs/${tokenURI.slice(7)}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const metadata = await response.json()
      return metadata as TokenMetadata
    } catch (error: unknown) {
      console.warn('Failed to fetch token metadata:', error)
      return null
    }
  }

  /**
   * Batch token operations with progress callback
   */
  async batchTokenOperation<T>(
    tokens: string[],
    operation: (tokenBatch: string[]) => Promise<T[]>,
    onProgress?: (processed: number, total: number) => void
  ): Promise<T[]> {
    const results: T[] = []
    const batchSize = UI_CONFIG.MAX_BATCH_SIZE

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize)
      const batchResults = await operation(batch)
      results.push(...batchResults)

      if (onProgress) {
        onProgress(Math.min(i + batchSize, tokens.length), tokens.length)
      }
    }

    return results
  }
}
