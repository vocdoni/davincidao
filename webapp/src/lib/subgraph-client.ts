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
   */
  async getAllAccounts(first: number = 100, skip: number = 0): Promise<SubgraphAccount[]> {
    const query = `
      query GetAccounts($first: Int!, $skip: Int!) {
        accounts(
          first: $first
          skip: $skip
          orderBy: weight
          orderDirection: desc
          where: { weight_gt: "0" }
        ) {
          id
          address
          weight
          lastUpdatedAt
          lastUpdatedBlock
          firstInsertedBlock
          firstInsertedAt
        }
      }
    `

    const data = await this.query<{ accounts: SubgraphAccount[] }>(
      query,
      { first, skip }
    )

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
