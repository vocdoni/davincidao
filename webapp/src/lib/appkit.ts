import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { sepolia, mainnet, polygon } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'
import { CONTRACT_CONFIG } from './constants'

// Get projectId from environment (optional)
const projectId = import.meta.env.WALLETCONNECT_PROJECT_ID

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

  // Determine networks based on chain ID
  const getNetworks = () => {
    const networks = []
    if (CONTRACT_CONFIG.chainId === 1) {
      networks.push(mainnet, sepolia)
    } else if (CONTRACT_CONFIG.chainId === 137) {
      networks.push(polygon, sepolia)  
    } else {
      networks.push(sepolia) // Default to sepolia
    }
    return networks as [typeof mainnet, ...typeof networks]
  }

  // Create AppKit modal
  appKit = createAppKit({
    adapters: [ethersAdapter],
    networks: getNetworks(),
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
