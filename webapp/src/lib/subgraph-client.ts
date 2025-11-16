/**
 * The Graph Subgraph Client for Trustless Manifesto Census
 *
 * Simplified client for querying pledge data from The Graph
 */

import { GraphQLClient } from 'graphql-request'

// ========= Types =========

export interface Signer {
  id: string
  address: string
  pledgeTimestamp: string
  pledgeBlock: string
  transactionHash: string
  treeIndex: string
}

export interface CensusRoot {
  id: string
  root: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
  pledgeCount: string
}

export interface GlobalStats {
  id: string
  totalPledges: string
  lastPledgeAt: string
  lastPledgeBlock: string
  currentRoot: string
  nextTreeIndex: string
}

export interface PledgeEvent {
  id: string
  signer: Signer
  timestamp: string
  blockNumber: string
  transactionHash: string
  logIndex: string
}

// ========= GraphQL Queries =========

const GLOBAL_STATS_QUERY = `
  query GetGlobalStats {
    globalStats(id: "global") {
      id
      totalPledges
      lastPledgeAt
      lastPledgeBlock
      currentRoot
      nextTreeIndex
    }
  }
`

const SIGNER_QUERY = `
  query GetSigner($address: ID!) {
    signer(id: $address) {
      id
      address
      pledgeTimestamp
      pledgeBlock
      transactionHash
      treeIndex
    }
  }
`

const ALL_SIGNERS_QUERY = `
  query GetAllSigners($first: Int!, $skip: Int!, $orderBy: String, $orderDirection: String) {
    signers(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      address
      pledgeTimestamp
      pledgeBlock
      transactionHash
      treeIndex
    }
  }
`

const RECENT_PLEDGES_QUERY = `
  query GetRecentPledges($first: Int!) {
    pledgeEvents(first: $first, orderBy: blockNumber, orderDirection: desc) {
      id
      signer {
        id
        address
        pledgeTimestamp
        pledgeBlock
        transactionHash
        treeIndex
      }
      timestamp
      blockNumber
      transactionHash
      logIndex
    }
  }
`

const CENSUS_ROOTS_QUERY = `
  query GetCensusRoots($first: Int!) {
    censusRoots(first: $first, orderBy: blockNumber, orderDirection: desc) {
      id
      root
      blockNumber
      blockTimestamp
      transactionHash
      pledgeCount
    }
  }
`

// ========= Subgraph Client =========

let client: GraphQLClient | null = null

export function initSubgraphClient(endpoint: string): GraphQLClient {
  client = new GraphQLClient(endpoint, {
    headers: {}
  })
  return client
}

export function getSubgraphClient(): GraphQLClient {
  if (!client) {
    throw new Error('Subgraph client not initialized. Call initSubgraphClient() first.')
  }
  return client
}

// ========= Query Functions =========

/**
 * Get global statistics
 */
export async function getGlobalStats(): Promise<GlobalStats | null> {
  const client = getSubgraphClient()
  const data = await client.request<{ globalStats: GlobalStats | null }>(GLOBAL_STATS_QUERY)
  return data.globalStats || null
}

/**
 * Get signer by address
 */
export async function getSigner(address: string): Promise<Signer | null> {
  const client = getSubgraphClient()
  const addressLower = address.toLowerCase()
  const data = await client.request<{ signer: Signer | null }>(SIGNER_QUERY, { address: addressLower })
  return data.signer || null
}

/**
 * Check if an address has pledged
 */
export async function hasPledged(address: string): Promise<boolean> {
  const signer = await getSigner(address)
  return signer !== null
}

/**
 * Get all signers with pagination
 */
export async function getAllSigners(
  first: number = 100,
  skip: number = 0,
  orderBy: string = 'pledgeTimestamp',
  orderDirection: string = 'desc'
): Promise<Signer[]> {
  const client = getSubgraphClient()
  const data = await client.request<{ signers: Signer[] }>(ALL_SIGNERS_QUERY, {
    first,
    skip,
    orderBy,
    orderDirection
  })
  return data.signers || []
}

/**
 * Get recent pledge events
 */
export async function getRecentPledges(limit: number = 20): Promise<PledgeEvent[]> {
  const client = getSubgraphClient()
  const data = await client.request<{ pledgeEvents: PledgeEvent[] }>(RECENT_PLEDGES_QUERY, { first: limit })
  return data.pledgeEvents || []
}

/**
 * Get census root history
 */
export async function getCensusRoots(limit: number = 10): Promise<CensusRoot[]> {
  const client = getSubgraphClient()
  const data = await client.request<{ censusRoots: CensusRoot[] }>(CENSUS_ROOTS_QUERY, { first: limit })
  return data.censusRoots || []
}

/**
 * Get total pledge count from stats
 */
export async function getTotalPledges(): Promise<number> {
  const stats = await getGlobalStats()
  return stats ? parseInt(stats.totalPledges) : 0
}

/**
 * Get current census root from stats
 */
export async function getCurrentRoot(): Promise<string | null> {
  const stats = await getGlobalStats()
  return stats ? stats.currentRoot : null
}
