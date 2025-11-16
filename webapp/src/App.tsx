import { useState, useEffect } from 'react'
import { BrowserProvider, JsonRpcProvider } from 'ethers'
import { toast, Toaster } from 'sonner'
import { ManifestoContract } from '~/lib/manifesto-contract'
import { initSubgraphClient, getTotalPledges, getSigner } from '~/lib/subgraph-client'
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

  // Initialize subgraph on mount
  useEffect(() => {
    if (SUBGRAPH_ENDPOINT) {
      initSubgraphClient(SUBGRAPH_ENDPOINT)
      loadSubgraphData()
    }
    // Always load census data from contract
    loadCensusData()
  }, [])

  // Periodic updates for census data and signature count (every 15 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      // Update census root and total pledges
      loadCensusData()
      if (SUBGRAPH_ENDPOINT) {
        loadSubgraphData()
      }
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
        1: ['https://ethereum-rpc.publicnode.com'],
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

      const rpcs = rpcEndpoints[CHAIN_ID] || ['https://ethereum-rpc.publicnode.com']

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

  // Load census data from contract
  const loadCensusData = async () => {
    const rpcEndpoints: Record<number, string[]> = {
      1: ['https://ethereum-rpc.publicnode.com'],
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

    const rpcs = rpcEndpoints[CHAIN_ID] || ['https://ethereum-rpc.publicnode.com']

    for (const rpcUrl of rpcs) {
      try {
        const provider = new JsonRpcProvider(rpcUrl)
        const readOnlyContract = new ManifestoContract(provider, CONTRACT_ADDRESS)
        const info = await readOnlyContract.getCensusInfo()
        setCensusRoot(info.root)
        console.log('✅ Census data loaded from', rpcUrl)
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

  // Load subgraph data
  const loadSubgraphData = async () => {
    try {
      const total = await getTotalPledges()
      setTotalPledges(total)
    } catch (error) {
      console.error('Error loading subgraph data:', error)
      toast.error('Failed to load census data')
    }
  }

  // Resolve ENS name to address
  const handleResolveENS = async (ensName: string): Promise<string | null> => {
    try {
      // ENS is only available on Mainnet, always use Mainnet for resolution
      const mainnetRpcUrl = 'https://ethereum-rpc.publicnode.com'
      const provider = new JsonRpcProvider(mainnetRpcUrl)

      // Resolve ENS name
      const resolved = await provider.resolveName(ensName)
      return resolved
    } catch (error) {
      console.error('Error resolving ENS:', error)
      return null
    }
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
      1: ['https://ethereum-rpc.publicnode.com'],
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

    const rpcs = rpcEndpoints[CHAIN_ID] || ['https://ethereum-rpc.publicnode.com']

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
        rpcUrls: ['https://mainnet.infura.io/v3/'],
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

          // Check subgraph for signer status
          if (SUBGRAPH_ENDPOINT) {
            const signerData = await getSigner(address)
            if (signerData && !status.hasPledged) {
              console.warn('Subgraph/contract sync issue detected')
            }
          }

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

      // Check subgraph for signer status
      if (SUBGRAPH_ENDPOINT) {
        const signerData = await getSigner(address)
        if (signerData && !status.hasPledged) {
          // Sync issue - subgraph says they pledged but contract doesn't
          // Trust the contract
          console.warn('Subgraph/contract sync issue detected')
        }
      }

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

      // Reload stats after a delay (wait for blockchain)
      setTimeout(() => {
        loadSubgraphData()
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
            Connecting to Base network
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#dbc2a5]">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-[#dbc2a5] border-b border-[#D4C4AC]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo and Title */}
            <a href="https://davinci.vote" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src="/davinci-logo.svg" alt="DAVINCI" className="w-8 h-8" />
              <span className="text-sm font-medium text-gray-900 uppercase tracking-wider">DAVINCI</span>
            </a>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const signCard = document.getElementById('sign-card')
                  if (signCard) {
                    signCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                }}
                className="px-6 py-2.5 bg-white/60 text-gray-900 rounded-full hover:bg-white/80 transition-colors text-sm font-medium border border-[#D4C4AC]"
              >
                Sign the Manifesto
              </button>

              <button
                onClick={connectWallet}
                disabled={loadingContract}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {loadingContract ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </span>
                ) : account ? (
                  `${account.slice(0, 6)}...${account.slice(-4)}`
                ) : (
                  'Connect Wallet'
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Background */}
      <main className="max-w-[1008px] mx-auto px-6 py-12 relative" style={{
        backgroundImage: 'url(/background.avif)',
        backgroundSize: 'contain',
        backgroundPosition: 'center 80px',
        backgroundRepeat: 'no-repeat',
        minHeight: 'calc(100vh - 200px)'
      }}>
        <div className="space-y-10">

          {/* Manifesto Text */}
          <div>
            <ManifestoDisplay metadata={metadata} loading={loadingContract && !metadata} />
          </div>

          {/* Cards below manifesto */}
          <div className="space-y-8">

            {/* Stats & Sign Button */}
            <div id="sign-card" className="bg-white/40 backdrop-blur-sm rounded-2xl border border-[#D4C4AC] p-8">
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
                loading={pledging}
                connected={!!account}
              />
            </div>

            {/* Address Checker */}
            <AddressChecker onCheck={handleCheckAddress} onResolveENS={handleResolveENS} />

            {/* Census Info */}
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-[#D4C4AC] p-8">
              <h3 className="text-xl font-medium text-gray-900 mb-6 flex items-center gap-2" style={{ lineHeight: '1.1em' }}>
                <span>🌳</span> Cryptographic Census
              </h3>

              {/* Explanation */}
              <div className="mb-6">
                <p className="text-sm text-gray-800 font-normal" style={{ lineHeight: '1.1em' }}>
                  Each new address is added to an on-chain <strong className="font-medium">zk-friendly Merkle tree</strong>, creating a
                  cryptographic structure that groups all signers. This census can be used by voting applications
                  as a <strong className="font-medium">trustless authentication mechanism</strong>, allowing manifesto
                  signers to participate in governance.
                </p>
              </div>

              {/* Stats */}
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-700 mb-2 font-medium">Current Root Hash</p>
                  <p className="font-mono text-xs text-gray-800 break-all bg-white/60 p-3 rounded-lg border border-[#D4C4AC]">
                    {censusRoot !== '0' ? `0x${BigInt(censusRoot).toString(16).padStart(64, '0')}` : 'Not yet initialized'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-700 mb-2 font-medium">Contract Address</p>
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
                    className="font-mono text-xs text-blue-600 hover:text-blue-800 underline break-all block"
                  >
                    {CONTRACT_ADDRESS}
                  </a>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Network</p>
                  <p className="text-gray-800">
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
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#dbc2a5] border-t border-[#D4C4AC] mt-16 py-12">
        <div className="max-w-[1008px] mx-auto px-6">
          <div className="text-center text-gray-800 space-y-3">
            <p className="text-base italic font-normal" style={{ lineHeight: '1.1em' }}>
              Made with love by <a href="https://vocdoni.io" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900">Vocdoni</a>
            </p>
            <p className="text-xs text-gray-600 font-normal" style={{ lineHeight: '1.1em' }}>
              <a href="https://github.com/vocdoni/davinci-onchain-census/tree/manifesto" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-800">Source Code</a>
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
