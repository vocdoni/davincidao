import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { sepolia, mainnet, polygon, base, arbitrum, optimism } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'
import { CONTRACT_CONFIG, SUPPORTED_NETWORKS } from './constants'

// Get projectId from environment (optional)
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

// Only create AppKit if WalletConnect project ID is provided
let appKit: ReturnType<typeof createAppKit> | null = null

if (projectId) {
  // Metadata for the app
  const metadata = {
    name: 'DavinciDAO Census Manager',
    description: 'Manage NFT delegations for DavinciDAO voting',
    url: window.location.origin,
    icons: ['/favicon.ico'],
  }

  // Create Ethers Adapter
  const ethersAdapter = new EthersAdapter()

  // Map of known networks by chain ID
  const knownNetworks: Record<number, any> = {
    1: mainnet,
    11155111: sepolia,
    137: polygon,
    8453: base,
    42161: arbitrum,
    10: optimism,
  }

  // Get the configured network, creating a custom one if needed
  const getConfiguredNetwork = () => {
    const chainId = CONTRACT_CONFIG.chainId
    
    // If we have a known network definition, use it
    if (knownNetworks[chainId]) {
      return knownNetworks[chainId]
    }
    
    // Otherwise, create a custom network definition
    const networkInfo = SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS]
    const networkName = networkInfo?.name || `Chain ${chainId}`
    
    return {
      id: chainId,
      name: networkName,
      network: networkName.toLowerCase().replace(/\s+/g, '-'),
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [CONTRACT_CONFIG.rpcUrl],
        },
        public: {
          http: [CONTRACT_CONFIG.rpcUrl],
        },
      },
      blockExplorers: {
        default: {
          name: 'Explorer',
          url: CONTRACT_CONFIG.blockExplorerUrl,
        },
      },
    }
  }

  // Create AppKit modal with ONLY the configured network
  // This forces users to connect to the correct network
  appKit = createAppKit({
    adapters: [ethersAdapter],
    networks: [getConfiguredNetwork()],
    defaultNetwork: getConfiguredNetwork(),
    projectId,
    metadata,
    features: {
      analytics: false,
      socials: [],
      email: false,
    },
    themeMode: 'light',
    themeVariables: {
      '--w3m-accent': '#3b82f6',
      '--w3m-border-radius-master': '8px',
    },
  })
} else {
  console.log('WalletConnect not configured. Only injected wallets (MetaMask, etc.) will be available.')
}

export { appKit }
export const isWalletConnectAvailable = !!projectId
