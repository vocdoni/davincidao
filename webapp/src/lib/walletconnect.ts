import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet, sepolia, base, arbitrum, optimism, polygon } from '@reown/appkit/networks'

// Get project ID from environment variables
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID'

// Create the AppKit instance
export const appKit = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [mainnet, sepolia, base, arbitrum, optimism, polygon],
  metadata: {
    name: 'DAVINCI Manifesto',
    description: 'Sign the DAVINCI Manifesto and join the decentralized governance movement',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://davinci.vote',
    icons: ['/davinci-logo.svg']
  },
  projectId,
  features: {
    analytics: false,
    email: false,
    socials: []
  }
})
