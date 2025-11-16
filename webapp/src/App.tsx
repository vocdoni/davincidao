import { useState, useEffect } from 'react'
import { BrowserProvider, JsonRpcProvider } from 'ethers'
import { toast, Toaster } from 'sonner'
import { ManifestoContract } from '~/lib/manifesto-contract'
import { initSubgraphClient, getSigner } from '~/lib/subgraph-client'
import { ManifestoDisplay } from '~/components/manifesto/ManifestoDisplay'
import { SignatureButton } from '~/components/manifesto/SignatureButton'
import { AddressChecker } from '~/components/manifesto/AddressChecker'
import type { ManifestoMetadata, PledgeStatus } from '~/types'

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'
const SUBGRAPH_ENDPOINT = import.meta.env.VITE_SUBGRAPH_ENDPOINT || ''
const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '11155111')

function App() {
  const [account, setAccount] = useState<string | null>(null)
  const [contract, setContract] = useState<ManifestoContract | null>(null)
  const [metadata, setMetadata] = useState<ManifestoMetadata | null>(null)
  const [pledgeStatus, setPledgeStatus] = useState<PledgeStatus | null>(null)
  const [totalPledges, setTotalPledges] = useState<number>(0)
  const [censusRoot, setCensusRoot] = useState<string>('0')
  const [loadingContract, setLoadingContract] = useState(false)
  const [pledging, setPledging] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  // Initialize subgraph on mount (optional, only for tree index data)
  useEffect(() => {
    if (SUBGRAPH_ENDPOINT) {
      initSubgraphClient(SUBGRAPH_ENDPOINT)
    }
    // Always load census data from contract (includes pledge count)
    loadCensusData()
  }, [])

  // Periodic updates for census data (every 15 seconds)
  // Note: We get pledge count directly from contract, no GraphQL needed
  useEffect(() => {
    const interval = setInterval(() => {
      loadCensusData()
    }, 15000) // 15 seconds

    return () => clearInterval(interval)
  }, [])

  // Load manifesto metadata on mount (read-only, no wallet needed)
  useEffect(() => {
    const loadManifestoMetadata = async () => {
      // Check localStorage cache first
      const cacheKey = `manifesto_metadata_${CONTRACT_ADDRESS}`
      const cachedData = localStorage.getItem(cacheKey)

      if (cachedData) {
        try {
          const cached = JSON.parse(cachedData)
          console.log('✅ Loaded metadata from cache')
          setMetadata(cached)
          setInitialLoading(false)
          return // Use cached data, no RPC call needed
        } catch {
          console.warn('Failed to parse cached metadata, will fetch from RPC')
          localStorage.removeItem(cacheKey)
        }
      }

      // Multiple RPC endpoints for fallback
      const rpcEndpoints: Record<number, string[]> = {
        1: [
          'https://eth.llamarpc.com',
          'https://ethereum-rpc.publicnode.com',
          'https://rpc.mevblocker.io',
          'https://0xrpc.io/eth',
          'https://eth1.lava.build',
          'https://eth.blockrazor.xyz',
          'https://eth-mainnet.public.blastapi.io'
        ],
        11155111: ['https://ethereum-sepolia-rpc.publicnode.com'],
        8453: [
          'https://base.llamarpc.com',
          'https://base-rpc.publicnode.com',
          'https://base.drpc.org',
          'https://mainnet.base.org',
          'https://base-mainnet.public.blastapi.io',
          'https://1rpc.io/base',
          'https://base-mainnet.gateway.tatum.io'
        ],
        42161: ['https://arb1.arbitrum.io/rpc'],
        10: ['https://mainnet.optimism.io'],
        137: ['https://polygon-rpc.com']
      }

      const rpcs = rpcEndpoints[CHAIN_ID] || ['https://eth.llamarpc.com']

      for (let i = 0; i < rpcs.length; i++) {
        const rpcUrl = rpcs[i]
        try {
          console.log(`Attempt ${i + 1}/${rpcs.length}: Loading manifesto from ${rpcUrl}`)

          const provider = new JsonRpcProvider(rpcUrl)
          const readOnlyContract = new ManifestoContract(provider, CONTRACT_ADDRESS)

          const meta = await readOnlyContract.getMetadata()
          console.log('✅ Metadata loaded successfully from', rpcUrl)

          // Cache the metadata in localStorage
          localStorage.setItem(cacheKey, JSON.stringify(meta))

          setMetadata(meta)
          setInitialLoading(false)
          return // Success - exit the loop
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          console.error(`❌ RPC ${rpcUrl} failed:`, errorMsg)

          // If this is the last RPC, show error to user
          if (i === rpcs.length - 1) {
            console.error('All RPC endpoints failed. Error details:', error)
            toast.error(
              <div>
                <p className="font-semibold">Failed to load manifesto</p>
                <p className="text-xs mt-1">All RPC endpoints failed. Please try again later.</p>
                <p className="text-xs text-gray-600 mt-1 font-mono">{errorMsg.substring(0, 100)}</p>
              </div>,
              { duration: 10000 }
            )
            setInitialLoading(false) // Stop loading even on error
          }
          // Continue to next RPC
        }
      }
    }

    loadManifestoMetadata()
  }, [])

  // Listen for network/account changes
  useEffect(() => {
    if (!window.ethereum) return

    const handleChainChanged = (...args: unknown[]) => {
      const chainIdHex = args[0] as string
      const newChainId = parseInt(chainIdHex, 16)
      if (newChainId !== CHAIN_ID) {
        toast.warning(`Network changed. Please reconnect to use chain ID ${CHAIN_ID}`)
        // Reset state
        setAccount(null)
        setContract(null)
        setPledgeStatus(null)
      } else {
        toast.success('Network switched! Please reconnect your wallet.')
        // User switched to correct network, encourage reconnect
        setAccount(null)
        setContract(null)
        setPledgeStatus(null)
      }
    }

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[]
      if (accounts.length === 0) {
        toast.info('Wallet disconnected')
        setAccount(null)
        setContract(null)
        setPledgeStatus(null)
      } else if (account && accounts[0].toLowerCase() !== account.toLowerCase()) {
        toast.info('Account changed. Please reconnect.')
        setAccount(null)
        setContract(null)
        setPledgeStatus(null)
      }
    }

    window.ethereum?.on('chainChanged', handleChainChanged)
    window.ethereum?.on('accountsChanged', handleAccountsChanged)

    return () => {
      window.ethereum?.removeListener('chainChanged', handleChainChanged)
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
    }
  }, [account])

  // Load census data from contract (includes pledge count)
  const loadCensusData = async () => {
    const rpcEndpoints: Record<number, string[]> = {
      1: [
        'https://eth.llamarpc.com',
        'https://ethereum-rpc.publicnode.com',
        'https://rpc.mevblocker.io',
        'https://0xrpc.io/eth',
        'https://eth1.lava.build',
        'https://eth.blockrazor.xyz',
        'https://eth-mainnet.public.blastapi.io'
      ],
      11155111: ['https://ethereum-sepolia-rpc.publicnode.com'],
      8453: [
        'https://base.llamarpc.com',
        'https://base-rpc.publicnode.com',
        'https://base.drpc.org',
        'https://mainnet.base.org',
        'https://base-mainnet.public.blastapi.io',
        'https://1rpc.io/base',
        'https://base-mainnet.gateway.tatum.io'
      ],
      42161: ['https://arb1.arbitrum.io/rpc'],
      10: ['https://mainnet.optimism.io'],
      137: ['https://polygon-rpc.com']
    }

    const rpcs = rpcEndpoints[CHAIN_ID] || ['https://eth.llamarpc.com']

    for (const rpcUrl of rpcs) {
      try {
        const provider = new JsonRpcProvider(rpcUrl)
        const readOnlyContract = new ManifestoContract(provider, CONTRACT_ADDRESS)
        const info = await readOnlyContract.getCensusInfo()

        // Update state with contract data
        setCensusRoot(info.root)
        setTotalPledges(info.totalPledges)

        console.log('✅ Census data loaded from contract:', rpcUrl, `(${info.totalPledges} pledges)`)
        return // Success
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error(`❌ Census data from ${rpcUrl} failed:`, errorMsg)
        // Continue to next RPC
      }
    }

    // All RPCs failed
    console.error('Failed to load census data from all RPCs')
    toast.error('Failed to load census data. Please refresh the page.')
  }

  // Resolve ENS name to address
  const handleResolveENS = async (ensName: string): Promise<string | null> => {
    // ENS is only available on Mainnet, always use Mainnet for resolution
    const mainnetRpcs = [
      'https://eth.llamarpc.com',
      'https://ethereum-rpc.publicnode.com',
      'https://rpc.mevblocker.io',
      'https://0xrpc.io/eth',
      'https://eth1.lava.build',
      'https://eth.blockrazor.xyz',
      'https://eth-mainnet.public.blastapi.io'
    ]

    for (const rpcUrl of mainnetRpcs) {
      try {
        const provider = new JsonRpcProvider(rpcUrl)
        const resolved = await provider.resolveName(ensName)
        if (resolved) {
          console.log('✅ ENS resolved from', rpcUrl)
          return resolved
        }
      } catch (error) {
        console.error(`❌ ENS resolution from ${rpcUrl} failed:`, error)
        // Continue to next RPC
      }
    }

    console.error('Failed to resolve ENS from all RPCs')
    return null
  }

  // Check address pledge status
  const handleCheckAddress = async (address: string) => {
    // Use connected contract if available
    if (contract) {
      try {
        const status = await contract.getPledgeStatus(address)

        // Get tree index from subgraph if available
        let treeIndex: number | undefined
        if (SUBGRAPH_ENDPOINT && status.hasPledged) {
          try {
            const signerData = await getSigner(address)
            if (signerData) {
              treeIndex = parseInt(signerData.treeIndex)
            }
          } catch {
            console.log('Subgraph not available for tree index')
          }
        }

        return {
          hasPledged: status.hasPledged,
          timestamp: status.timestamp,
          blockNumber: status.blockNumber,
          treeIndex
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('Error checking with connected wallet:', errorMsg)
        // Fall through to RPC fallback
      }
    }

    // Fallback to read-only RPCs
    const rpcEndpoints: Record<number, string[]> = {
      1: [
        'https://eth.llamarpc.com',
        'https://ethereum-rpc.publicnode.com',
        'https://rpc.mevblocker.io',
        'https://0xrpc.io/eth',
        'https://eth1.lava.build',
        'https://eth.blockrazor.xyz',
        'https://eth-mainnet.public.blastapi.io'
      ],
      11155111: ['https://ethereum-sepolia-rpc.publicnode.com'],
      8453: [
        'https://base.llamarpc.com',
        'https://base-rpc.publicnode.com',
        'https://base.drpc.org',
        'https://mainnet.base.org',
        'https://base-mainnet.public.blastapi.io',
        'https://1rpc.io/base',
        'https://base-mainnet.gateway.tatum.io'
      ],
      42161: ['https://arb1.arbitrum.io/rpc'],
      10: ['https://mainnet.optimism.io'],
      137: ['https://polygon-rpc.com']
    }

    const rpcs = rpcEndpoints[CHAIN_ID] || ['https://eth.llamarpc.com']

    for (const rpcUrl of rpcs) {
      try {
        const provider = new JsonRpcProvider(rpcUrl)
        const pledgeContract = new ManifestoContract(provider, CONTRACT_ADDRESS)
        const status = await pledgeContract.getPledgeStatus(address)

        // Get tree index from subgraph if available
        let treeIndex: number | undefined
        if (SUBGRAPH_ENDPOINT && status.hasPledged) {
          try {
            const signerData = await getSigner(address)
            if (signerData) {
              treeIndex = parseInt(signerData.treeIndex)
            }
          } catch {
            console.log('Subgraph not available for tree index')
          }
        }

        console.log('✅ Address check successful from', rpcUrl)
        return {
          hasPledged: status.hasPledged,
          timestamp: status.timestamp,
          blockNumber: status.blockNumber,
          treeIndex
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error(`❌ Address check from ${rpcUrl} failed:`, errorMsg)
        // Continue to next RPC
      }
    }

    // All RPCs failed
    const error = new Error('Failed to check address pledge status from all RPC endpoints')
    console.error(error.message)
    toast.error('Failed to check address. Please try again.')
    throw error
  }

  // Helper to add network to wallet
  const addNetworkToWallet = async (chainId: number) => {
    interface NetworkConfig {
      chainId: string
      chainName: string
      nativeCurrency: { name: string; symbol: string; decimals: number }
      rpcUrls: string[]
      blockExplorerUrls: string[]
    }

    const networkConfigs: Record<number, NetworkConfig> = {
      11155111: { // Sepolia
        chainId: '0xaa36a7',
        chainName: 'Sepolia Testnet',
        nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://sepolia.infura.io/v3/'],
        blockExplorerUrls: ['https://sepolia.etherscan.io']
      },
      1: { // Mainnet
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: [
          'https://eth.llamarpc.com',
          'https://ethereum-rpc.publicnode.com',
          'https://rpc.mevblocker.io',
          'https://0xrpc.io/eth',
          'https://eth1.lava.build',
          'https://eth.blockrazor.xyz',
          'https://eth-mainnet.public.blastapi.io'
        ],
        blockExplorerUrls: ['https://etherscan.io']
      },
      8453: { // Base
        chainId: '0x2105',
        chainName: 'Base',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: [
          'https://base.llamarpc.com',
          'https://base-rpc.publicnode.com',
          'https://base.drpc.org',
          'https://mainnet.base.org',
          'https://base-mainnet.public.blastapi.io',
          'https://1rpc.io/base',
          'https://base-mainnet.gateway.tatum.io'
        ],
        blockExplorerUrls: ['https://basescan.org']
      },
      42161: { // Arbitrum One
        chainId: '0xa4b1',
        chainName: 'Arbitrum One',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://arb1.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://arbiscan.io']
      },
      10: { // Optimism
        chainId: '0xa',
        chainName: 'Optimism',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.optimism.io'],
        blockExplorerUrls: ['https://optimistic.etherscan.io']
      },
      137: { // Polygon
        chainId: '0x89',
        chainName: 'Polygon',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://polygon-rpc.com'],
        blockExplorerUrls: ['https://polygonscan.com']
      }
    }

    const config = networkConfigs[chainId]
    if (!config) {
      throw new Error(`Network configuration for chain ID ${chainId} not found`)
    }

    if (!window.ethereum) {
      throw new Error('No Ethereum provider found')
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [config],
    })
  }

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask or another Web3 wallet')
      return
    }

    setLoadingContract(true)
    try {
      const provider = new BrowserProvider(window.ethereum)

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' })

      const network = await provider.getNetwork()
      if (Number(network.chainId) !== CHAIN_ID) {
        // Automatically request network switch
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
          })
          toast.success(`Switched to chain ID ${CHAIN_ID}`)
          // Refresh provider after network switch
          const newProvider = new BrowserProvider(window.ethereum)
          const newSigner = await newProvider.getSigner()
          const address = await newSigner.getAddress()

          setAccount(address)

          // Initialize contract with new provider
          const contractInstance = new ManifestoContract(newProvider, CONTRACT_ADDRESS, newSigner)
          setContract(contractInstance)

          // Load contract metadata
          const meta = await contractInstance.getMetadata()
          setMetadata(meta)

          // Load pledge status
          const status = await contractInstance.getPledgeStatus(address)
          setPledgeStatus(status)

          toast.success('Wallet connected')
          setLoadingContract(false)
          return
        } catch (switchError) {
          // Network switch failed or was rejected
          const errorCode = switchError && typeof switchError === 'object' && 'code' in switchError ? switchError.code : null
          if (errorCode === 4902) {
            // Chain not added to wallet, try to add it
            try {
              await addNetworkToWallet(CHAIN_ID)
              toast.info('Network added! Please try connecting again.')
            } catch {
              toast.error(`Please manually add chain ID ${CHAIN_ID} to your wallet`)
            }
          } else {
            toast.error(`Please switch to chain ID ${CHAIN_ID} in your wallet`)
          }
          setLoadingContract(false)
          return
        }
      }

      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      setAccount(address)

      // Initialize contract
      const contractInstance = new ManifestoContract(provider, CONTRACT_ADDRESS, signer)
      setContract(contractInstance)

      // Load contract metadata
      const meta = await contractInstance.getMetadata()
      setMetadata(meta)

      // Load pledge status
      const status = await contractInstance.getPledgeStatus(address)
      setPledgeStatus(status)

      toast.success('Wallet connected')
    } catch (error) {
      console.error('Error connecting wallet:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to connect wallet'
      toast.error(errorMsg)
    } finally {
      setLoadingContract(false)
    }
  }

  // Sign the manifesto
  const handleSign = async () => {
    if (!contract || !account) {
      toast.error('Please connect your wallet first')
      return
    }

    setPledging(true)
    try {
      toast.info('Confirm the transaction in your wallet...')

      const txHash = await contract.pledge()

      toast.success(
        <div>
          <p className="font-semibold">Manifesto signed!</p>
          <p className="text-sm">Tx: {txHash.slice(0, 10)}...</p>
        </div>
      )

      // Reload status
      const status = await contract.getPledgeStatus(account)
      setPledgeStatus(status)

      // Reload census data after a delay (wait for blockchain to confirm)
      setTimeout(() => {
        loadCensusData()
      }, 5000)
    } catch (error) {
      console.error('Error signing:', error)

      const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : null
      const errorMsg = error instanceof Error ? error.message : 'Failed to sign manifesto'

      if (errorCode === 'ACTION_REJECTED') {
        toast.error('Transaction rejected')
      } else if (errorMsg.includes('AlreadyPledged')) {
        toast.error('You have already signed the manifesto')
      } else {
        toast.error(errorMsg)
      }
    } finally {
      setPledging(false)
    }
  }

  // Show loader until manifesto is loaded
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#dbc2a5] flex items-center justify-center">
        <div className="text-center">
          {/* DAVINCI Logo */}
          <div className="mb-8 flex justify-center">
            <img src="/davinci-logo.svg" alt="DAVINCI" className="w-24 h-24 animate-pulse" />
          </div>

          {/* Loading Spinner */}
          <div className="mb-6">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-[#D4C4AC] rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#7A6746] border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>

          {/* Loading Text */}
          <h2 className="text-2xl font-medium text-gray-900 mb-2" style={{ lineHeight: '1.1em' }}>
            Loading Manifesto...
          </h2>
          <p className="text-sm text-gray-700 font-normal" style={{ lineHeight: '1.1em' }}>
            Connecting to {(() => {
              const networks: Record<number, string> = {
                1: 'Ethereum Mainnet',
                11155111: 'Sepolia Testnet',
                8453: 'Base',
                42161: 'Arbitrum One',
                10: 'Optimism',
                137: 'Polygon'
              }
              return networks[CHAIN_ID] || `Chain ${CHAIN_ID}`
            })()}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#1a1410]' : 'bg-[#dbc2a5]'}`}>
      <Toaster position="top-right" />

      {/* Header */}
      <header className={`border-b transition-colors duration-300 ${darkMode ? 'bg-[#1a1410] border-[#3a3530]' : 'bg-[#dbc2a5] border-[#D4C4AC]'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo and Title */}
            <a href="https://davinci.vote" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src="/davinci-logo.svg" alt="DAVINCI" className="w-8 h-8" />
              <span className={`text-sm font-medium uppercase tracking-wider ${darkMode ? 'text-[#dbc2a5]' : 'text-gray-900'}`}>DAVINCI</span>
            </a>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-[#3a3530]' : 'hover:bg-[#D4C4AC]/30'}`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="w-5 h-5 text-[#dbc2a5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Sign Button */}
              <button
                onClick={() => {
                  const signCard = document.getElementById('sign-card')
                  if (signCard) {
                    signCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                }}
                className="px-8 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 active:scale-95 transition-all text-sm font-semibold shadow-lg hover:shadow-xl"
              >
                🪶 Sign the Manifesto
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1008px] mx-auto py-12 relative" style={{
        minHeight: 'calc(100vh - 200px)'
      }}>
        <div className="space-y-10">

          {/* Manifesto Text - scrollable container */}
          <div className="overflow-x-auto">
            <ManifestoDisplay metadata={metadata} loading={loadingContract && !metadata} darkMode={darkMode} />
          </div>

          {/* Cards below manifesto */}
          <div className="space-y-8 px-6">

            {/* Stats & Sign Button */}
            <div id="sign-card" className="bg-white/40 backdrop-blur-sm rounded-2xl border border-[#D4C4AC] p-8">
              <h3 className="text-2xl font-medium text-gray-900 mb-4 text-center" style={{ lineHeight: '1.1em' }}>
                🪶 Sign the Manifesto
              </h3>

              <p className="text-center text-gray-800 mb-8 text-base font-normal" style={{ lineHeight: '1.5em' }}>
                If you agree with these principles and refuse to be a spectator, add your signature and join us!
              </p>

              <div className="text-center mb-8">
                <p className="text-6xl font-medium text-gray-900 mb-3" style={{ lineHeight: '1em' }}>
                  {totalPledges.toLocaleString()}
                </p>
                <p className="text-gray-700 text-sm font-normal" style={{ lineHeight: '1.1em' }}>
                  {totalPledges === 1 ? 'signature' : 'signatures'}
                </p>
              </div>

              <SignatureButton
                pledgeStatus={pledgeStatus}
                onSign={handleSign}
                onConnect={connectWallet}
                loading={pledging}
                connected={!!account}
              />
            </div>

            {/* Address Checker */}
            <AddressChecker onCheck={handleCheckAddress} onResolveENS={handleResolveENS} />

            {/* Census Info */}
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-[#D4C4AC] p-8">
              <h3 className="text-2xl font-medium text-gray-900 mb-4 text-center" style={{ lineHeight: '1.1em' }}>
                🌳 Cryptographic Census
              </h3>

              {/* Explanation */}
              <div className="mb-8">
                <p className="text-center text-gray-800 font-normal text-base" style={{ lineHeight: '1.5em' }}>
                  Each new address is added to an on-chain <strong className="font-medium">zk-friendly Merkle tree</strong>, creating a
                  cryptographic structure that groups all signers. This census can be used by voting applications
                  as a <strong className="font-medium">trustless authentication mechanism</strong>, allowing manifesto
                  signers to participate in governance.
                </p>
              </div>

              {/* Census Details */}
              <div className="space-y-5">
                {/* Network */}
                <div className="bg-white/60 rounded-xl p-5 border border-[#D4C4AC]">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Network</span>
                  </div>
                  <p className="text-base text-gray-900 font-medium">
                    {(() => {
                      const networks: Record<number, string> = {
                        1: 'Ethereum Mainnet',
                        11155111: 'Sepolia Testnet',
                        8453: 'Base',
                        42161: 'Arbitrum One',
                        10: 'Optimism',
                        137: 'Polygon'
                      }
                      return networks[CHAIN_ID] || `Chain ${CHAIN_ID}`
                    })()}
                  </p>
                </div>

                {/* Contract Address */}
                <div className="bg-white/60 rounded-xl p-5 border border-[#D4C4AC]">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Contract Address</span>
                  </div>
                  <a
                    href={(() => {
                      const explorers: Record<number, string> = {
                        1: 'etherscan.io',
                        11155111: 'sepolia.etherscan.io',
                        8453: 'basescan.org',
                        42161: 'arbiscan.io',
                        10: 'optimistic.etherscan.io',
                        137: 'polygonscan.com'
                      }
                      const explorer = explorers[CHAIN_ID] || 'etherscan.io'
                      return `https://${explorer}/address/${CONTRACT_ADDRESS}`
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-gray-900 hover:text-gray-700 break-all block transition-colors group"
                  >
                    <span className="group-hover:underline">{CONTRACT_ADDRESS}</span>
                    <svg className="w-3 h-3 inline-block ml-1 opacity-60 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                {/* Root Hash */}
                <div className="bg-white/60 rounded-xl p-5 border border-[#D4C4AC]">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Current Root Hash</span>
                  </div>
                  <p className="font-mono text-xs text-gray-900 break-all leading-relaxed">
                    {censusRoot !== '0' ? `0x${BigInt(censusRoot).toString(16).padStart(64, '0')}` : (
                      <span className="text-gray-600 italic">Not yet initialized</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`mt-16 py-12 border-t transition-colors duration-300 ${darkMode ? 'bg-[#1a1410] border-[#3a3530]' : 'bg-[#dbc2a5] border-[#D4C4AC]'}`}>
        <div className="max-w-[1008px] mx-auto px-6">
          <div className={`text-center space-y-3 ${darkMode ? 'text-[#dbc2a5]' : 'text-gray-800'}`}>
            <p className="text-base italic font-normal" style={{ lineHeight: '1.1em' }}>
              Made with love by <a href="https://vocdoni.io" target="_blank" rel="noopener noreferrer" className={`underline ${darkMode ? 'hover:text-[#f5e6d3]' : 'hover:text-gray-900'}`}>Vocdoni</a>
            </p>
            <p className={`text-xs font-normal ${darkMode ? 'text-[#c4a57b]' : 'text-gray-600'}`} style={{ lineHeight: '1.1em' }}>
              <a href="https://github.com/vocdoni/davinci-onchain-census/tree/manifesto" target="_blank" rel="noopener noreferrer" className={`underline ${darkMode ? 'hover:text-[#dbc2a5]' : 'hover:text-gray-800'}`}>Source Code</a>
              {' · '}
              License AGPLv3
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
