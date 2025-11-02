/**
 * Collection represents an ERC-721 NFT collection in the DavinciDAO system
 */
export interface Collection {
  token: string          // ERC-721 contract address
  active: boolean       // Whether the collection is active for delegation
  totalDelegated: number // Total number of tokens delegated from this collection
}

/**
 * Proof input for Merkle tree operations
 */
export interface ProofInput {
  account: string
  siblings: bigint[]
}

/**
 * NFT information for UI display and interaction
 */
export interface NFTInfo {
  collectionIndex: number
  tokenId: string
  collectionAddress: string
  delegatedTo?: string
  owned: boolean
  tokenURI?: string        // Optional token metadata URI
  name?: string           // Optional token name
  image?: string          // Optional token image URL
}

/**
 * Delegation information for an account
 */
export interface DelegationInfo {
  address: string
  weight: number
  leaf: string
}

/**
 * Merkle tree node information
 */
export interface MerkleTreeNode {
  index: number
  address: string
  weight: number
  leaf: string
}

/**
 * Complete census data structure
 */
export interface CensusData {
  root: string
  nodes: MerkleTreeNode[]
  totalParticipants: number
  tree: any  // LeanIMT instance with correct structure (including empty slots)
}

/**
 * Wallet connection state
 */
export interface WalletState {
  isConnected: boolean
  address?: string
  chainId?: number
}

/**
 * Contract configuration
 */
export interface ContractConfig {
  address: string
  rpcUrl: string
  chainId: number
  blockExplorerUrl?: string
}

/**
 * Delegation transaction data
 */
export interface DelegationTransaction {
  to: string
  collectionIndex: number
  tokenIds: string[]
  proof: string[]
}

/**
 * Collection statistics for UI display
 */
export interface CollectionStats {
  collectionIndex: number
  tokenAddress: string
  totalSupply?: number
  totalDelegated: number
  userTokens: number
  userDelegated: number
}

/**
 * Token metadata (for display purposes)
 */
export interface TokenMetadata {
  name?: string
  description?: string
  image?: string
  external_url?: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
}