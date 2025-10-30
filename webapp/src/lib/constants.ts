import { ContractConfig } from '~/types'
import { Network } from 'alchemy-sdk'

// Contract configuration from environment variables
export const CONTRACT_CONFIG: ContractConfig = {
  address: import.meta.env.VITE_CONTRACT_ADDRESS || '',
  rpcUrl: import.meta.env.VITE_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo',
  chainId: parseInt(import.meta.env.VITE_CHAIN_ID || '11155111'),
  blockExplorerUrl: import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://sepolia.etherscan.io',
}

// V2 Configuration (gas-optimized contract with The Graph - V2 ONLY)
export const V2_CONFIG = {
  subgraphEndpoint: import.meta.env.VITE_SUBGRAPH_ENDPOINT || 'https://api.studio.thegraph.com/query/1704875/YOUR_PROJECT/v0.0.0',
} as const

// Alchemy network configuration mapping
export const ALCHEMY_NETWORKS: Record<number, Network> = {
  1: Network.ETH_MAINNET,
  11155111: Network.ETH_SEPOLIA,
  8453: Network.BASE_MAINNET,
  84532: Network.BASE_SEPOLIA,
  137: Network.MATIC_MAINNET,
  42161: Network.ARB_MAINNET,
  421614: Network.ARB_SEPOLIA,
  10: Network.OPT_MAINNET,
  11155420: Network.OPT_SEPOLIA,
} as const

// Alchemy configuration from environment
export const ALCHEMY_CONFIG = {
  apiKey: import.meta.env.VITE_ALCHEMY_API_KEY || '',
  network: import.meta.env.VITE_ALCHEMY_NETWORK || '', // optional override
  enabled: !!import.meta.env.VITE_ALCHEMY_API_KEY
} as const

// Get Alchemy network based on chain ID or override
export function getAlchemyNetwork(chainId: number): Network | null {
  if (ALCHEMY_CONFIG.network) {
    // Try to find the network by name if override is provided
    const networkValues = Object.values(Network)
    const foundNetwork = networkValues.find(net => net === ALCHEMY_CONFIG.network)
    if (foundNetwork) return foundNetwork
  }
  return ALCHEMY_NETWORKS[chainId] || null
}

// DavinciDAO Census Contract ABI (Proof-based Lean-IMT implementation - V2)
export const DAVINCI_DAO_ABI = [
  // View functions
  'function getCensusRoot() external view returns (uint256)',
  'function getRootBlockNumber(uint256 root) external view returns (uint256)',
  'function censusRoot() external view returns (uint256)',
  'function tokenDelegate(bytes32 key) external view returns (address)',
  'function collections(uint256 index) external view returns (address token)',
  'function getTokenDelegations(uint256 nftIndex, uint256[] calldata tokenIds) external view returns (address[] memory)',
  'function getAccountAt(uint256 index) external view returns (address)',
  'function indexAccount(uint256 index) external view returns (address)',
  'function computeLeafWithWeight(address account, uint88 weight) external pure returns (uint256)',

  // Mutating functions (REQUIRES MERKLE PROOFS!)
  'function delegate(address to, uint256 nftIndex, uint256[] calldata ids, uint88 currentWeightOfTo, uint256[] calldata toProof, tuple(address account, uint88 currentWeight, uint256[] siblings)[] calldata fromProofs) external',
  'function undelegate(uint256 nftIndex, uint256[] calldata ids, tuple(address account, uint88 currentWeight, uint256[] siblings)[] calldata proofs) external',
  'function updateDelegation(address newDelegate, uint256 nftIndex, uint256[] calldata ids, uint88 currentWeightOfTo, tuple(address account, uint88 currentWeight, uint256[] siblings)[] calldata fromProofs, uint256[] calldata toProof) external',
  'function updateCensusRoot(uint256 newRoot) external', // Owner only

  // Events
  'event Delegated(address indexed owner, address indexed to, uint256 indexed nftIndex, uint256 tokenId)',
  'event Undelegated(address indexed owner, address indexed from, uint256 indexed nftIndex, uint256 tokenId)',
  'event WeightChanged(address indexed account, uint88 previousWeight, uint88 newWeight)',
  'event CensusRootUpdated(uint256 indexed newRoot, uint256 blockNumber)',
  'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
] as const

// ERC-721 ABI (comprehensive for NFT interactions)
export const ERC721_ABI = [
  // Core functions
  'function ownerOf(uint256 tokenId) external view returns (address owner)',
  'function balanceOf(address owner) external view returns (uint256 balance)',
  'function name() external view returns (string memory)',
  'function symbol() external view returns (string memory)',
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  
  // Enumeration (if supported)
  'function totalSupply() external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)',
  'function tokenByIndex(uint256 index) external view returns (uint256 tokenId)',
  
  // Interface detection
  'function supportsInterface(bytes4 interfaceId) external view returns (bool)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
] as const

// Network configurations
export const SUPPORTED_NETWORKS = {
  1: {
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    blockExplorerUrl: 'https://etherscan.io',
  },
  11155111: {
    name: 'Sepolia Testnet',
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
  },
  137: {
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/demo',
    blockExplorerUrl: 'https://polygonscan.com',
  },
  8453: {
    name: 'Base Mainnet',
    rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/demo',
    blockExplorerUrl: 'https://basescan.org',
  },
  42161: {
    name: 'Arbitrum One',
    rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/demo',
    blockExplorerUrl: 'https://arbiscan.io',
  },
  10: {
    name: 'Optimism',
    rpcUrl: 'https://opt-mainnet.g.alchemy.com/v2/demo',
    blockExplorerUrl: 'https://optimistic.etherscan.io',
  },
} as const

// Local storage keys
export const STORAGE_KEYS = {
  CENSUS_CACHE: 'davinci-census-cache',
  MERKLE_TREE: 'davinci-merkle-tree',
  MERKLE_CACHE_INDEX: 'davinci-merkle-index',
  MERKLE_TREE_PREFIX: 'davinci-merkle-tree-',
  MERKLE_METADATA: 'davinci-merkle-metadata',
  MERKLE_TEMP: 'davinci-merkle-temp-',
  USER_PREFERENCES: 'davinci-user-preferences',
  COLLECTION_METADATA: 'davinci-collection-metadata',
} as const

// UI Configuration
export const UI_CONFIG = {
  MAX_BATCH_SIZE: 50, // Maximum NFTs to process in one batch
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
  POLLING_INTERVAL: 30 * 1000, // 30 seconds
  TREE_RECONSTRUCTION_BATCH_SIZE: 100, // Batch size for tree reconstruction
  MAX_TOKENS_PER_TX: 50, // Maximum tokens to delegate/undelegate per transaction (gas limit safety)
  RECOMMENDED_BATCH_SIZE: 20, // Recommended batch size for optimal gas usage
  TOKEN_METADATA_CACHE_DURATION: 60 * 60 * 1000, // 1 hour for token metadata
  
  // Enhanced Merkle Tree Caching Configuration
  MERKLE_CACHE: {
    MAX_CACHED_TREES: 10, // Maximum number of trees to keep in cache
    TREE_CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours for tree data
    BATCH_SIZE: 50, // Nodes to fetch per batch
    MAX_RETRIES: 3, // Maximum retry attempts
    INITIAL_RETRY_DELAY: 1000, // Initial retry delay in ms
    MAX_RETRY_DELAY: 10000, // Maximum retry delay in ms
    BACKOFF_FACTOR: 2, // Exponential backoff multiplier
    COMPRESSION_ENABLED: true, // Enable data compression
    INTEGRITY_CHECK_ENABLED: true, // Enable checksum validation
    AUTO_CLEANUP_ENABLED: true, // Enable automatic cache cleanup
  }
} as const

// ERC-721 Interface IDs for detection
export const ERC721_INTERFACE_IDS = {
  ERC721: '0x80ac58cd',
  ERC721_METADATA: '0x5b5e139f',
  ERC721_ENUMERABLE: '0x780e9d63',
} as const

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Wallet not connected',
  INVALID_COLLECTION: 'Invalid collection',
  NOT_TOKEN_OWNER: 'You do not own this token',
  ALREADY_DELEGATED: 'Token already delegated',
  NOT_DELEGATED: 'Token not delegated',
  INSUFFICIENT_TOKENS: 'Insufficient tokens to delegate',
  TRANSACTION_FAILED: 'Transaction failed',
  NETWORK_ERROR: 'Network error occurred',
  CONTRACT_ERROR: 'Contract interaction failed',
} as const
