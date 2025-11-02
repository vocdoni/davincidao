/**
 * The Graph Subgraph Client for DavinciDAO V2
 *
 * This client queries The Graph to get account weights and delegation data
 * since V2 moved this state off-chain for gas optimization.
 */

interface SubgraphAccount {
  id: string
  address: string
  weight: string
  lastUpdatedAt: string
  lastUpdatedBlock: string
  firstInsertedBlock: string
  firstInsertedAt: string
  treeIndex: string
}

interface SubgraphTokenDelegation {
  id: string
  tokenId: string
  nftIndex: string
  delegate: string
  owner: string
  isDelegated: boolean
  delegatedAt: string
}

interface SubgraphGlobalStats {
  totalDelegations: string
  totalAccounts: string
  totalWeight: string
  totalUniqueDelegators: string
  totalActiveDelegators: string
  lastUpdatedAt: string
}

export interface SubgraphDelegator {
  id: string
  address: string
  totalDelegationsMade: string
  totalDelegationsEver: string
  firstDelegatedAt: string
  firstDelegatedBlock: string
  lastDelegatedAt: string
  lastDelegatedBlock: string
}

interface SubgraphCensusRoot {
  id: string
  root: string
  updater: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

interface SubgraphWeightChangeEvent {
  id: string
  account: {
    id: string
    address: string
  }
  previousWeight: string
  newWeight: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
  logIndex: string
}

interface SubgraphMeta {
  block: {
    number: number
    hash: string
    timestamp: number
  }
  deployment: string
  hasIndexingErrors: boolean
}

export class SubgraphClient {
  private endpoint: string

  constructor(endpoint: string) {
    this.endpoint = endpoint
  }

  /**
   * Query The Graph subgraph
   */
  private async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.errors) {
        throw new Error(result.errors[0].message)
      }

      return result.data
    } catch (error) {
      console.error('Subgraph query failed:', error)
      throw error
    }
  }

  /**
   * Get account weight for a specific address
   */
  async getAccountWeight(address: string): Promise<number> {
    const query = `
      query GetAccount($id: ID!) {
        account(id: $id) {
          id
          address
          weight
          lastUpdatedAt
        }
      }
    `

    const data = await this.query<{ account: SubgraphAccount | null }>(
      query,
      { id: address.toLowerCase() }
    )

    return data.account ? parseInt(data.account.weight) : 0
  }

  /**
   * Get all accounts with their weights
   * @param first - Number of accounts to fetch
   * @param skip - Number of accounts to skip
   * @param orderBy - Field to order by ('weight' for display, 'treeIndex' for tree reconstruction)
   */
  async getAllAccounts(
    first: number = 100,
    skip: number = 0,
    orderBy: 'weight' | 'treeIndex' = 'weight'
  ): Promise<SubgraphAccount[]> {
    const orderDirection = orderBy === 'weight' ? 'desc' : 'asc'

    const query = `
      query GetAccounts($first: Int!, $skip: Int!, $orderBy: Account_orderBy!, $orderDirection: OrderDirection!) {
        accounts(
          first: $first
          skip: $skip
          orderBy: $orderBy
          orderDirection: $orderDirection
          where: { weight_gt: "0" }
        ) {
          id
          address
          weight
          lastUpdatedAt
          lastUpdatedBlock
          firstInsertedBlock
          firstInsertedAt
          treeIndex
        }
      }
    `

    const data = await this.query<{ accounts: SubgraphAccount[] }>(
      query,
      { first, skip, orderBy, orderDirection }
    )

    // IMPORTANT: When ordering by treeIndex for tree reconstruction,
    // we must handle the fact that tree indices may have gaps (when accounts are removed).
    // LeanIMT removes leaves but doesn't re-index, so we need to sort by treeIndex
    // but the tree will be rebuilt with sequential indices 0, 1, 2, ...
    // This is correct because we're only including accounts with weight > 0.
    return data.accounts
  }

  /**
   * Get delegation info for specific tokens
   */
  async getTokenDelegations(
    nftIndex: number,
    tokenIds: string[]
  ): Promise<SubgraphTokenDelegation[]> {
    // Build array of delegation IDs: "${nftIndex}-${tokenId}"
    const delegationIds = tokenIds.map(tokenId => `${nftIndex}-${tokenId}`)

    const query = `
      query GetTokenDelegations($ids: [ID!]!) {
        tokenDelegations(where: { id_in: $ids }) {
          id
          tokenId
          nftIndex
          delegate
          owner
          isDelegated
          delegatedAt
        }
      }
    `

    const data = await this.query<{ tokenDelegations: SubgraphTokenDelegation[] }>(
      query,
      { ids: delegationIds }
    )

    return data.tokenDelegations
  }

  /**
   * Get all delegations for a specific delegate address
   */
  async getDelegationsForAddress(delegateAddress: string): Promise<SubgraphTokenDelegation[]> {
    const query = `
      query GetDelegationsForAddress($delegate: Bytes!) {
        tokenDelegations(
          where: {
            delegate: $delegate
            isDelegated: true
          }
        ) {
          id
          tokenId
          nftIndex
          delegate
          owner
          isDelegated
          delegatedAt
        }
      }
    `

    const data = await this.query<{ tokenDelegations: SubgraphTokenDelegation[] }>(
      query,
      { delegate: delegateAddress.toLowerCase() }
    )

    return data.tokenDelegations
  }

  /**
   * Get all delegations made by a specific owner address
   */
  async getDelegationsByOwner(ownerAddress: string): Promise<SubgraphTokenDelegation[]> {
    const query = `
      query GetDelegationsByOwner($owner: Bytes!) {
        tokenDelegations(
          where: {
            owner: $owner
            isDelegated: true
          }
        ) {
          id
          tokenId
          nftIndex
          delegate
          owner
          isDelegated
          delegatedAt
        }
      }
    `

    const data = await this.query<{ tokenDelegations: SubgraphTokenDelegation[] }>(
      query,
      { owner: ownerAddress.toLowerCase() }
    )

    return data.tokenDelegations
  }

  /**
   * Get global statistics
   */
  async getGlobalStats(): Promise<SubgraphGlobalStats | null> {
    const query = `
      query GetGlobalStats {
        globalStats(id: "global") {
          totalDelegations
          totalAccounts
          totalWeight
          totalUniqueDelegators
          totalActiveDelegators
          lastUpdatedAt
        }
      }
    `

    const data = await this.query<{ globalStats: SubgraphGlobalStats | null }>(query)
    return data.globalStats
  }

  /**
   * Get all delegators
   */
  async getAllDelegators(first: number = 100, skip: number = 0): Promise<SubgraphDelegator[]> {
    const query = `
      query GetDelegators($first: Int!, $skip: Int!) {
        delegators(
          first: $first
          skip: $skip
          orderBy: totalDelegationsEver
          orderDirection: desc
        ) {
          id
          address
          totalDelegationsMade
          totalDelegationsEver
          firstDelegatedAt
          firstDelegatedBlock
          lastDelegatedAt
          lastDelegatedBlock
        }
      }
    `

    const data = await this.query<{ delegators: SubgraphDelegator[] }>(
      query,
      { first, skip }
    )

    return data.delegators
  }

  /**
   * Get active delegators (those with active delegations)
   */
  async getActiveDelegators(first: number = 100, skip: number = 0): Promise<SubgraphDelegator[]> {
    const query = `
      query GetActiveDelegators($first: Int!, $skip: Int!) {
        delegators(
          first: $first
          skip: $skip
          orderBy: totalDelegationsMade
          orderDirection: desc
          where: { totalDelegationsMade_gt: "0" }
        ) {
          id
          address
          totalDelegationsMade
          totalDelegationsEver
          firstDelegatedAt
          firstDelegatedBlock
          lastDelegatedAt
          lastDelegatedBlock
        }
      }
    `

    const data = await this.query<{ delegators: SubgraphDelegator[] }>(
      query,
      { first, skip }
    )

    return data.delegators
  }

  /**
   * Get top delegates by weight
   */
  async getTopDelegates(limit: number = 10): Promise<SubgraphAccount[]> {
    const query = `
      query GetTopDelegates($first: Int!) {
        accounts(
          first: $first
          orderBy: weight
          orderDirection: desc
          where: { weight_gt: "0" }
        ) {
          id
          address
          weight
          lastUpdatedAt
        }
      }
    `

    const data = await this.query<{ accounts: SubgraphAccount[] }>(
      query,
      { first: limit }
    )

    return data.accounts
  }

  /**
   * Get subgraph metadata including current sync block
   */
  async getMeta(): Promise<SubgraphMeta | null> {
    const query = `
      query GetMeta {
        _meta {
          block {
            number
            hash
            timestamp
          }
          deployment
          hasIndexingErrors
        }
      }
    `

    try {
      const data = await this.query<{ _meta: SubgraphMeta }>(query)
      return data._meta
    } catch (error) {
      console.warn('Failed to get subgraph metadata:', error)
      return null
    }
  }

  /**
   * Get the latest census root entity from subgraph
   */
  async getLatestCensusRoot(): Promise<SubgraphCensusRoot | null> {
    const query = `
      query GetLatestCensusRoot {
        censusRoots(
          first: 1
          orderBy: blockNumber
          orderDirection: desc
        ) {
          id
          root
          updater
          blockNumber
          blockTimestamp
          transactionHash
        }
      }
    `

    const data = await this.query<{ censusRoots: SubgraphCensusRoot[] }>(query)
    return data.censusRoots.length > 0 ? data.censusRoots[0] : null
  }

  /**
   * Get a specific census root by root value
   */
  async getCensusRootByValue(rootValue: string): Promise<SubgraphCensusRoot | null> {
    const query = `
      query GetCensusRootByValue($root: BigInt!) {
        censusRoots(where: { root: $root }) {
          id
          root
          updater
          blockNumber
          blockTimestamp
          transactionHash
        }
      }
    `

    const data = await this.query<{ censusRoots: SubgraphCensusRoot[] }>(
      query,
      { root: rootValue }
    )
    return data.censusRoots.length > 0 ? data.censusRoots[0] : null
  }

  /**
   * Check if subgraph has synced past a specific block number
   */
  async hasSyncedPastBlock(blockNumber: number): Promise<boolean> {
    const meta = await this.getMeta()
    if (!meta) {
      console.warn('Could not get subgraph metadata to check sync status')
      return false
    }
    return meta.block.number >= blockNumber
  }

  /**
   * Get all weight change events in chronological order for tree reconstruction
   */
  async getAllWeightChangeEvents(first: number = 1000, skip: number = 0): Promise<SubgraphWeightChangeEvent[]> {
    const query = `
      query GetWeightChangeEvents($first: Int!, $skip: Int!) {
        weightChangeEvents(
          first: $first
          skip: $skip
          orderBy: blockNumber
          orderDirection: asc
        ) {
          id
          account {
            id
            address
          }
          previousWeight
          newWeight
          blockNumber
          blockTimestamp
          transactionHash
          logIndex
        }
      }
    `

    const data = await this.query<{ weightChangeEvents: SubgraphWeightChangeEvent[] }>(
      query,
      { first, skip }
    )

    return data.weightChangeEvents
  }

  /**
   * Check if subgraph is responsive
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getGlobalStats()
      return true
    } catch {
      return false
    }
  }
}

// Singleton instance
let subgraphClientInstance: SubgraphClient | null = null

/**
 * Initialize the subgraph client with endpoint
 */
export function initSubgraphClient(endpoint: string): SubgraphClient {
  subgraphClientInstance = new SubgraphClient(endpoint)
  return subgraphClientInstance
}

/**
 * Get the singleton subgraph client instance
 */
export function getSubgraphClient(): SubgraphClient {
  if (!subgraphClientInstance) {
    throw new Error('Subgraph client not initialized. Call initSubgraphClient() first.')
  }
  return subgraphClientInstance
}

/**
 * Check if subgraph client is initialized
 */
export function isSubgraphInitialized(): boolean {
  return subgraphClientInstance !== null
}
