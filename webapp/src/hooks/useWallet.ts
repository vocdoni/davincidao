import { BrowserProvider, Wallet, JsonRpcProvider } from 'ethers'
import { useMemo, useState, useEffect } from 'react'
import { WalletState } from '~/types'
import { isWalletConnectAvailable } from '~/lib/appkit'
import { CONTRACT_CONFIG } from '~/lib/constants'

// Import AppKit hooks - will be no-ops if AppKit is not available
let useAppKitAccount: () => { isConnected: boolean; address?: string } = () => ({ isConnected: false })
let useAppKitProvider: (namespace: string) => { walletProvider?: unknown } = () => ({})
let useAppKitNetwork: () => { chainId?: string | number } = () => ({})

// Only import if AppKit is available
if (isWalletConnectAvailable) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const appKit = require('@reown/appkit/react')
    useAppKitAccount = appKit.useAppKitAccount
    useAppKitProvider = appKit.useAppKitProvider
    useAppKitNetwork = appKit.useAppKitNetwork
  } catch (error) {
    console.warn('Failed to load AppKit hooks:', error)
  }
}

export const useWallet = (): WalletState & {
  provider: BrowserProvider | null
  connect: () => void
  disconnect: () => void
  connectWithPrivateKey: (privateKey: string) => Promise<void>
  privateKeyWallet: Wallet | null
} => {
  // Fallback state for when AppKit is not available
  const [fallbackState, setFallbackState] = useState({
    isConnected: false,
    address: undefined as string | undefined,
    chainId: undefined as number | undefined,
    provider: null as BrowserProvider | null,
  })

  // Private key connection state
  const [privateKeyWallet, setPrivateKeyWallet] = useState<{
    wallet: Wallet
    provider: BrowserProvider
  } | null>(null)

  // Always call the hooks (they are safe no-ops if not available)
  const appKitAccount = useAppKitAccount()
  const appKitProviderData = useAppKitProvider('eip155')
  const appKitNetwork = useAppKitNetwork()

  // Check for injected wallet (MetaMask, etc.) when AppKit is not available
  useEffect(() => {
    if (!isWalletConnectAvailable && typeof window !== 'undefined' && window.ethereum) {
      const checkConnection = async () => {
        try {
          const accounts = await window.ethereum!.request({ method: 'eth_accounts' }) as string[]
          const chainId = await window.ethereum!.request({ method: 'eth_chainId' }) as string
          
          if (accounts.length > 0) {
            const provider = new BrowserProvider(window.ethereum as never)
            setFallbackState({
              isConnected: true,
              address: accounts[0],
              chainId: parseInt(chainId, 16),
              provider,
            })
          }
        } catch (error) {
          console.warn('Error checking injected wallet:', error)
        }
      }

      checkConnection()

      // Listen for account changes
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setFallbackState(prev => ({
            ...prev,
            isConnected: true,
            address: accounts[0],
          }))
        } else {
          setFallbackState(prev => ({
            ...prev,
            isConnected: false,
            address: undefined,
          }))
        }
      }

      // Listen for chain changes
      const handleChainChanged = (chainId: string) => {
        setFallbackState(prev => ({
          ...prev,
          chainId: parseInt(chainId, 16),
        }))
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum?.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const provider = useMemo(() => {
    // Priority: Private key wallet > AppKit > Fallback > Default read-only provider
    if (privateKeyWallet) {
      // For private key connections, return the JsonRpcProvider directly
      return privateKeyWallet.wallet.provider as BrowserProvider
    }
    
    if (isWalletConnectAvailable && appKitProviderData.walletProvider) {
      try {
        return new BrowserProvider(appKitProviderData.walletProvider as never)
      } catch (error) {
        console.warn('Error creating AppKit provider:', error)
        return null
      }
    }
    
    if (fallbackState.provider) {
      return fallbackState.provider
    }
    
    // Create a default read-only provider for contract queries when no wallet is connected
    try {
      return new JsonRpcProvider(CONTRACT_CONFIG.rpcUrl) as never
    } catch (error) {
      console.error('Failed to create default provider:', error)
      return null
    }
  }, [privateKeyWallet, appKitProviderData.walletProvider, fallbackState.provider])

  const connect = async () => {
    if (isWalletConnectAvailable) {
      // AppKit handles connection through its modal
      return
    }

    // Fallback: connect to injected wallet
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[]
        const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string
        const provider = new BrowserProvider(window.ethereum as never)
        
        setFallbackState({
          isConnected: true,
          address: accounts[0],
          chainId: parseInt(chainId, 16),
          provider,
        })
      } catch (error) {
        console.error('Error connecting to injected wallet:', error)
      }
    } else {
      alert('Please install MetaMask or another Web3 wallet')
    }
  }

  const connectWithPrivateKey = async (privateKey: string) => {
    try {
      // Clean the private key (remove 0x prefix if present)
      const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey
      
      // Validate private key format
      if (!/^[a-fA-F0-9]{64}$/.test(cleanKey)) {
        throw new Error('Invalid private key format')
      }

      // Create RPC provider
      const rpcProvider = new JsonRpcProvider(CONTRACT_CONFIG.rpcUrl)
      
      // Create wallet from private key
      const wallet = new Wallet('0x' + cleanKey, rpcProvider)
      
      // Test the connection by getting the address
      const address = await wallet.getAddress()
      console.log('Private key wallet address:', address)
      
      // Clear other connection states
      setFallbackState({
        isConnected: false,
        address: undefined,
        chainId: undefined,
        provider: null,
      })
      
      // For private key connections, we'll use the JsonRpcProvider directly
      // and pass the wallet to the contract constructor
      setPrivateKeyWallet({
        wallet,
        provider: rpcProvider as never,
      })
      
      console.log('Connected with private key:', address)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Private key connection failed:', error)
      throw new Error(`Failed to connect with private key: ${errorMessage}`)
    }
  }

  const disconnect = () => {
    // Clear all connection states
    setPrivateKeyWallet(null)
    
    if (!isWalletConnectAvailable) {
      setFallbackState({
        isConnected: false,
        address: undefined,
        chainId: undefined,
        provider: null,
      })
    }
  }

  // Determine final state based on connection priority
  const finalState = useMemo(() => {
    // Priority: Private key > AppKit > Fallback
    if (privateKeyWallet) {
      return {
        isConnected: true,
        address: privateKeyWallet.wallet.address,
        chainId: CONTRACT_CONFIG.chainId, // Use configured chain ID
      }
    }
    
    if (isWalletConnectAvailable && appKitAccount.isConnected) {
      return {
        isConnected: appKitAccount.isConnected,
        address: appKitAccount.address,
        chainId: typeof appKitNetwork.chainId === 'string' ? parseInt(appKitNetwork.chainId) : appKitNetwork.chainId,
      }
    }
    
    return {
      isConnected: fallbackState.isConnected,
      address: fallbackState.address,
      chainId: fallbackState.chainId,
    }
  }, [privateKeyWallet, appKitAccount.isConnected, appKitAccount.address, appKitNetwork.chainId, fallbackState])

  return {
    isConnected: finalState.isConnected,
    address: finalState.address,
    chainId: finalState.chainId,
    provider,
    connect,
    disconnect,
    connectWithPrivateKey,
    privateKeyWallet: privateKeyWallet?.wallet || null,
  }
}
