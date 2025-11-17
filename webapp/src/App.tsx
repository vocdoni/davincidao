import { useCallback, useEffect, useMemo, useState } from 'react'
import { JsonRpcProvider, Wallet, toUtf8String } from 'ethers'
import { toast, Toaster } from 'sonner'
import { ManifestoContract } from '~/lib/manifesto-contract'
import { initSubgraphClient, getSigner } from '~/lib/subgraph-client'
import { ManifestoDisplay } from '~/components/manifesto/ManifestoDisplay'
import type { ManifestoMetadata, PledgeStatus } from '~/types'
import { SelfQR } from '~/self/SelfQR'
import { buildSelfApp, getUniversalLink, type EndpointType, type SelfApp } from '~/self/builder'

const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS || '').trim()
const RPC_URL = (import.meta.env.VITE_RPC_URL || 'https://forno.celo.org').trim()
const SUBGRAPH_ENDPOINT = (import.meta.env.VITE_SUBGRAPH_ENDPOINT || '').trim()
const BLOCK_EXPLORER_URL = import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://celoscan.io'

const SELF_ENDPOINT_TYPE = import.meta.env.VITE_SELF_ENDPOINT_TYPE || 'celo'
const SELF_APP_NAME = import.meta.env.VITE_SELF_APP_NAME || 'Self Manifesto'
const SELF_LOGO_URL = import.meta.env.VITE_SELF_LOGO_URL || '/self-logo.png'
const SELF_DEEPLINK_CALLBACK = import.meta.env.VITE_SELF_DEEPLINK_CALLBACK || ''
const SELF_USER_DATA = import.meta.env.VITE_SELF_USER_DATA || 'manifesto:clean-streets'
const DEBUG_LOGS = (import.meta.env.VITE_DEBUG_LOGS || 'false').toLowerCase() === 'true'
const debugLog = (...args: unknown[]) => {
  if (DEBUG_LOGS) {
    console.debug('[ManifestoApp]', ...args)
  }
}

const ATTESTATION_LABELS: Record<number, string> = {
  1: 'Passport',
  2: 'National ID card',
  3: 'Aadhaar card'
}

const getAllowedDocumentLabels = (attestationIds: string[]): string[] => {
  const seen = new Set<string>()
  const labels: string[] = []

  for (const id of attestationIds) {
    try {
      const numeric = Number(BigInt(id))
      const label = ATTESTATION_LABELS[numeric] || `Document #${numeric}`
      if (!seen.has(label)) {
        seen.add(label)
        labels.push(label)
      }
    } catch {
      if (!seen.has(id)) {
        seen.add(id)
        labels.push(id)
      }
    }
  }

  return labels
}

const RPC_FALLBACKS = Array.from(new Set([
  RPC_URL,
  'https://forno.celo.org',
  'https://1rpc.io/celo',
  'https://rpc.ankr.com/celo'
])).filter(Boolean)

const SELF_DOWNLOAD_URL = 'https://self.xyz'
const SELF_DOCS_URL = 'https://docs.self.xyz'

type LocalWalletInfo = {
  address: string
  mnemonic: string
  privateKey: string
}

type VerificationPolicyState = {
  minAge: number
  minAgeEnabled: boolean
  ofacEnabled: boolean
  excludedCountries: string[]
  requiredNationality: string
  attestationIds: string[]
}

type RequirementSection = {
  key: string
  title: string
  description?: string
  bullets?: string[]
  chips?: string[]
}

function formatDate(timestamp: number) {
  if (!timestamp) return ''
  return new Date(timestamp * 1000).toLocaleString()
}

export default function App() {
  const [metadata, setMetadata] = useState<ManifestoMetadata | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [totalPledges, setTotalPledges] = useState<number>(0)
  const [censusRoot, setCensusRoot] = useState<string>('0')
  const [ , ] = useState('')
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<PledgeStatus | null>(null)
  const [ , ] = useState(false)
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null)
  const [universalLink, setUniversalLink] = useState('')
  const [selfStatus, setSelfStatus] = useState<'idle' | 'preparing' | 'awaiting' | 'verifying' | 'polling' | 'success' | 'error'>(
    'idle'
  )
  const [selfError, setSelfError] = useState<string | null>(null)
  const [generatedWallet, setGeneratedWallet] = useState<LocalWalletInfo | null>(null)
  const [showRecovery, setShowRecovery] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('manifesto-dark-mode')
    if (saved) {
      return JSON.parse(saved)
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true
    }
    return false
  })
  const [verificationPolicy, setVerificationPolicy] = useState<VerificationPolicyState | null>(null)
  const [scopeSeed, setScopeSeed] = useState('')
  const allowedDocumentLabels = useMemo(
    () => (verificationPolicy ? getAllowedDocumentLabels(verificationPolicy.attestationIds) : []),
    [verificationPolicy]
  )
  const requirementSections = useMemo<RequirementSection[]>(() => {
    if (!verificationPolicy) {
      return [
        {
          key: 'automatic',
          title: 'Automated checks',
          bullets: ['Self verifies every requirement privately on your device.']
        }
      ]
    }

    const sections: RequirementSection[] = []
    const documentSection: RequirementSection = {
      key: 'documents',
      title: 'Documents',
      description: allowedDocumentLabels.length
        ? 'Scan any of the verified IDs shown below.'
        : 'Self will guide you to the right document to scan.'
    }
    if (allowedDocumentLabels.length) {
      documentSection.chips = allowedDocumentLabels
    } else {
      documentSection.bullets = ['Compatible documents are selected dynamically.']
    }
    sections.push(documentSection)

    const eligibilityBullets: string[] = []
    if (verificationPolicy.minAgeEnabled && verificationPolicy.minAge > 0) {
      eligibilityBullets.push(`Minimum age: ${verificationPolicy.minAge}+`)
    } else {
      eligibilityBullets.push('No minimum age requirement')
    }

    if (verificationPolicy.requiredNationality) {
      eligibilityBullets.push(`Documents issued by ${verificationPolicy.requiredNationality} only`)
    } else if (verificationPolicy.excludedCountries.length) {
      eligibilityBullets.push(`Excluded countries: ${verificationPolicy.excludedCountries.join(', ')}`)
    } else {
      eligibilityBullets.push('Open to all supported countries')
    }

    sections.push({
      key: 'eligibility',
      title: 'Eligibility',
      bullets: eligibilityBullets
    })

    sections.push({
      key: 'compliance',
      title: 'Compliance',
      bullets: verificationPolicy.ofacEnabled
        ? ['OFAC sanctions screening is enforced.']
        : ['No sanctions screening required.']
    })

    return sections
  }, [verificationPolicy, allowedDocumentLabels])

  const rpcProviders = useMemo(
    () => RPC_FALLBACKS.map((rpc) => ({ rpc, provider: new JsonRpcProvider(rpc) })),
    []
  )

  const fetchPledgeStatus = useCallback(async (address: string): Promise<PledgeStatus> => {
    let baseStatus: PledgeStatus | null = null

    for (const { rpc, provider } of rpcProviders) {
      try {
        debugLog('Checking pledge status via RPC', { address, rpc })
        const readContract = new ManifestoContract(provider, CONTRACT_ADDRESS)
        baseStatus = await readContract.getPledgeStatus(address)
        break
      } catch (error) {
        console.warn('Status check failed on provider', rpc, error)
      }
    }

    if (!baseStatus) {
      debugLog('All RPC endpoints failed for pledge status', address)
      throw new Error('All RPC endpoints failed to respond')
    }

    if (baseStatus.hasPledged && SUBGRAPH_ENDPOINT) {
      try {
        const signerData = await getSigner(address)
        if (signerData) {
          debugLog('Subgraph signer data', signerData)
          baseStatus = {
            ...baseStatus,
            treeIndex: parseInt(signerData.treeIndex),
            transactionHash: signerData.transactionHash
          }
        }
      } catch (error) {
        console.warn('Subgraph lookup failed for signer info:', error)
      }
    }

    return baseStatus
  }, [rpcProviders])

  useEffect(() => {
    // Apply dark mode class to document root
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    // Save to localStorage
    localStorage.setItem('manifesto-dark-mode', JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    const key = 'manifesto-generated-wallet'
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LocalWalletInfo
        if (parsed.address && parsed.mnemonic && parsed.privateKey) {
          setGeneratedWallet(parsed)
          return
        }
      } catch (error) {
        console.warn('Failed to parse stored wallet:', error)
      }
    }

    const wallet = Wallet.createRandom()
    const info: LocalWalletInfo = {
      address: wallet.address,
      mnemonic: wallet.mnemonic?.phrase || '',
      privateKey: wallet.privateKey
    }
    localStorage.setItem(key, JSON.stringify(info))
    setGeneratedWallet(info)
  }, [])

  useEffect(() => {
    if (generatedWallet && !selectedAddress) {
      setSelectedAddress(generatedWallet.address)
      setSelectedLabel('Auto-generated wallet')
      debugLog('Auto wallet selected on mount', generatedWallet.address)
    }
  }, [generatedWallet, selectedAddress])

  useEffect(() => {
    if (selfStatus !== 'success') {
      setShowRecovery(false)
    }
  }, [selfStatus])

  useEffect(() => {
    if (SUBGRAPH_ENDPOINT) {
      initSubgraphClient(SUBGRAPH_ENDPOINT)
      debugLog('Initialized subgraph client', SUBGRAPH_ENDPOINT)
    }
    loadCensusData()
    const interval = setInterval(() => loadCensusData(), 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    loadManifestoMetadata()
    debugLog('App bootstrap', {
      contract: CONTRACT_ADDRESS,
      endpointType: SELF_ENDPOINT_TYPE,
      subgraph: SUBGRAPH_ENDPOINT,
      rpcFallbacks: RPC_FALLBACKS
    })
  }, [])

  useEffect(() => {
    const loadPolicy = async () => {
      for (const rpc of RPC_FALLBACKS) {
        try {
          const provider = new JsonRpcProvider(rpc)
          const readOnlyContract = new ManifestoContract(provider, CONTRACT_ADDRESS)
          const params = await readOnlyContract.getVerificationParameters()
          const scopeLabel = await readOnlyContract.getScopeLabel()
          const nationalityHex = params.requiredNationalityHex as string
          const nationality =
            nationalityHex === '0x000000'
              ? ''
              : toUtf8String(nationalityHex).split('\u0000').join('').toUpperCase()

          setVerificationPolicy({
            minAge: params.minAge,
            minAgeEnabled: params.minAgeEnabled,
            ofacEnabled: params.ofacEnabled,
            excludedCountries: params.forbiddenCountries,
            requiredNationality: nationality,
            attestationIds: params.attestationIds
          })

          if (scopeLabel && scopeLabel.length > 0) {
            setScopeSeed(scopeLabel)
          } else {
            debugLog('Scope label missing on contract; waiting...', { rpc })
          }

          debugLog('Loaded verification policy from chain', { params, scopeLabel, rpc })
          return
        } catch (error) {
          console.warn(`Policy load failed from ${rpc}:`, error)
        }
      }
    }

    loadPolicy()
  }, [])

  useEffect(() => {
    if (!selectedAddress) {
      setSelectedStatus(null)
      setSelfApp(null)
      setUniversalLink('')
      setSelfStatus('idle')
      setSelfError(null)
      return
    }

    if (!verificationPolicy || !scopeSeed) {
      debugLog('Waiting for verification policy or scope', {
        hasPolicy: !!verificationPolicy,
        scopeSeed,
        selectedAddress
      })
      return
    }

    debugLog('Selected address updated', selectedAddress)
    setSelfStatus('preparing')
    setSelfError(null)

    const fetchStatus = async () => {
      try {
        const status = await fetchPledgeStatus(selectedAddress)
        setSelectedStatus(status)
        debugLog('Fetched pledge status', { selectedAddress, status })
        if (status.hasPledged) {
          setSelfStatus('success')
        }
      } catch (error) {
        console.error('Failed to load pledge status:', error)
      }
    }

    fetchStatus()

    try {
      const endpointType = (SELF_ENDPOINT_TYPE as EndpointType) || 'celo'
      const disclosures: Record<string, unknown> = {
        minimumAge: verificationPolicy.minAgeEnabled ? verificationPolicy.minAge : undefined,
        nationality: true,
        date_of_birth: true,
        ofac: verificationPolicy.ofacEnabled
      }
      if (verificationPolicy.excludedCountries.length) {
        disclosures.excludedCountries = verificationPolicy.excludedCountries
      }

      debugLog('Building Self app payload', {
        selectedAddress,
        endpointType,
        scope: scopeSeed,
        disclosures
      })

      const app = buildSelfApp({
        appName: SELF_APP_NAME,
        scope: scopeSeed,
        endpoint: CONTRACT_ADDRESS.toLowerCase(),
        endpointType,
        userIdType: 'hex',
        userId: selectedAddress,
        logoBase64: SELF_LOGO_URL,
        userDefinedData: SELF_USER_DATA,
        deeplinkCallback: SELF_DEEPLINK_CALLBACK || undefined,
        disclosures
      })

      setSelfApp(app)
      debugLog('Self app built', app)
      setUniversalLink(getUniversalLink(app))
      setSelfStatus((prev) => (prev === 'success' ? 'success' : 'awaiting'))
    } catch (error) {
      console.error('Failed to build Self app payload:', error)
      setSelfStatus('error')
      setSelfError('We could not prepare the QR code. Please reload and try again.')
    }
  }, [selectedAddress, fetchPledgeStatus, verificationPolicy, scopeSeed])

  async function loadManifestoMetadata() {
    const cacheKey = `manifesto_metadata_${CONTRACT_ADDRESS}`
    const cached = localStorage.getItem(cacheKey)

    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setMetadata(parsed)
        debugLog('Loaded manifesto metadata from cache', { title: parsed?.title })
        setInitialLoading(false)
        return
      } catch (error) {
        console.warn('Failed to parse cached metadata:', error)
        localStorage.removeItem(cacheKey)
      }
    }

    for (const rpc of RPC_FALLBACKS) {
      try {
        const provider = new JsonRpcProvider(rpc)
        const readOnlyContract = new ManifestoContract(provider, CONTRACT_ADDRESS)
        const meta = await readOnlyContract.getMetadata()
        setMetadata(meta)
        debugLog('Loaded manifesto metadata from RPC', { rpc, title: meta.title })
        localStorage.setItem(cacheKey, JSON.stringify(meta))
        setInitialLoading(false)
        return
      } catch (error) {
        console.warn(`Metadata load failed from ${rpc}:`, error)
      }
    }

    setInitialLoading(false)
    toast.error('Unable to load manifesto metadata. Please refresh the page.')
  }

  async function loadCensusData() {
    for (const rpc of RPC_FALLBACKS) {
      try {
        const provider = new JsonRpcProvider(rpc)
        const readOnlyContract = new ManifestoContract(provider, CONTRACT_ADDRESS)
        const info = await readOnlyContract.getCensusInfo()
        setCensusRoot(info.root)
        setTotalPledges(info.totalPledges)
        debugLog('Loaded census info', { rpc, root: info.root, totalPledges: info.totalPledges })
        return
      } catch (error) {
        console.warn(`Census data load failed from ${rpc}:`, error)
      }
    }
  }

  const handleSelfSuccess = async () => {
    if (!selectedAddress) return
    setSelfStatus('verifying')
    setSelfError(null)
    debugLog('Self verification success received', selectedAddress)

    try {
      const status = await waitForOnchainConfirmation(selectedAddress)
      setSelectedStatus(status)
      debugLog('On-chain confirmation detected', status)
      setSelfStatus('success')
      loadCensusData()
      toast.success('Manifesto signed! Thank you for taking part.')
    } catch (error) {
      console.error('Polling error:', error)
      setSelfStatus('error')
      setSelfError(error instanceof Error ? error.message : 'Verification timed out. Please try again.')
    }
  }

  const waitForOnchainConfirmation = async (address: string) => {
    const maxAttempts = 20
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      debugLog('Polling for on-chain confirmation', { address, attempt })
      const status = await fetchPledgeStatus(address)
      if (status.hasPledged) {
        return status
      }
      setSelfStatus('polling')
      await new Promise((resolve) => setTimeout(resolve, 4000))
    }
    throw new Error('We did not see the pledge on-chain yet. Please refresh and try again in a minute.')
  }

  const downloadRecoveryFile = (wallet: LocalWalletInfo) => {
    const content = `Self Manifesto Wallet\n\nAddress: ${wallet.address}\nMnemonic: ${wallet.mnemonic}\nPrivate Key: ${wallet.privateKey}\n`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'manifesto-wallet.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleSelfError = (data?: { error_code?: string; reason?: string }) => {
    console.error('Self verification error:', data)
    debugLog('Self verification error payload', data)
    setSelfStatus('error')
    const message = data?.reason || data?.error_code || 'Verification failed. Please retry.'
    setSelfError(message)
    toast.error(message)
  }

  const selectedAlreadySigned = selectedStatus?.hasPledged

  return (
    <div className={darkMode ? 'bg-[#0c0a09] text-white min-h-screen' : 'bg-[#f8f1e6] text-gray-900 min-h-screen'}>
      <Toaster position="top-center" richColors closeButton />
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <header className="mb-10 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="uppercase tracking-[0.3em] text-sm text-gray-500 dark:text-gray-300">Manifesto</p>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Collective Freedom</h1>
            </div>
            <button
              onClick={() => setDarkMode((prev: boolean) => !prev)}
              className="px-4 py-2 rounded-full border border-gray-300 dark:border-white/30 text-sm"
            >
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
          <p className="text-base text-gray-700 dark:text-gray-300 max-w-3xl">
            Sign privately with Self using your official documents. Your information never leaves your device and only an anonymous proof reaches Celo, keeping every signer untraceable while the community can still verify the pledge count on-chain.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,620px)_minmax(0,1fr)]">
          <ManifestoDisplay metadata={metadata} loading={initialLoading} darkMode={darkMode} totalPledges={totalPledges} />

          <div className="space-y-6">
            <section className="bg-white dark:bg-[#151515] rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-lg">
              <div className="space-y-4">

                {!selectedAlreadySigned && selfApp && selectedAddress && (
                  <div className="rounded-2xl border border-gray-200 dark:border-white/10 p-5 bg-white dark:bg-[#111111] flex flex-col items-center text-center gap-4">
                    <SelfQR selfApp={selfApp} onSuccess={handleSelfSuccess} onError={handleSelfError} darkMode={darkMode} />
                    <button
                      onClick={() => window.open(universalLink, '_blank')}
                      className="text-xs px-4 py-2 rounded-full border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-200"
                    >
                      Open Self on this device
                    </button>
                    <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600 dark:text-gray-300">
                      <a href={SELF_DOWNLOAD_URL} target="_blank" rel="noreferrer" className="underline">
                        Download Self
                      </a>
                      <span className="hidden sm:inline">•</span>
                      <a href={SELF_DOCS_URL} target="_blank" rel="noreferrer" className="underline">
                        Official docs
                      </a>
                    </div>
                    {selfError && (
                      <div className="text-sm">
                        <p className="text-xs text-red-600 dark:text-red-400">{selfError}</p>
                      </div>
                    )}
                  </div>
                )}

                {generatedWallet && (
                  <div className="rounded-2xl border border-blue-200 dark:border-blue-500/40 bg-blue-50 p-4 text-sm space-y-4 dark:bg-[#0d1b2a]">
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-200">Your manifesto wallet</p>
                      <p className="text-xs text-blue-900/80 dark:text-blue-100 font-mono break-all">{generatedWallet.address}</p>
                      <p className="text-xs text-blue-900/70 dark:text-blue-200 mt-2">
                        This wallet stays on your device. After signing, we will guide you through storing the recovery phrase securely.
                      </p>
                    </div>
                    <div className="rounded-xl border border-blue-200 dark:border-blue-400/40 bg-white dark:bg-[#0b1220] p-4">
                      <p className="text-xs uppercase tracking-wide text-blue-900/70 dark:text-blue-200">Currently signing as</p>
                      {selectedAddress ? (
                        <>
                          <p className="font-mono text-xs break-all text-blue-900 dark:text-blue-100 mt-1">{selectedAddress}</p>
                          {selectedLabel && (
                            <p className="text-xs text-blue-900/70 dark:text-blue-200 mt-1">{selectedLabel}</p>
                          )}
                          {selectedStatus?.hasPledged && (
                            <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-2">
                              Already signed on {formatDate(selectedStatus.timestamp)}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-blue-900/70 dark:text-blue-200 mt-1">
                          No address selected yet. Select the auto-generated wallet to continue.
                        </p>
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => {
                          setSelectedAddress(generatedWallet.address)
                          setSelectedLabel('Auto-generated wallet')
                          toast.success('Auto-generated wallet selected.')
                        }}
                        className="px-3 py-1.5 rounded-full border border-blue-300 dark:border-blue-400 text-xs disabled:opacity-50 text-blue-900 dark:text-blue-100"
                        disabled={selectedAddress === generatedWallet.address}
                      >
                        Use auto wallet
                      </button>
                    </div>
                  </div>
                )}

                {!selectedAlreadySigned && selectedAddress && (
                  <div className="rounded-2xl border border-purple-200 dark:border-purple-500/40 bg-purple-50 p-4 text-sm space-y-4 dark:bg-[#1b1025]">
                    <div>
                      <p className="font-semibold text-purple-900 dark:text-purple-100">Requirements verified by Self</p>
                      <p className="text-xs text-purple-900/70 dark:text-purple-200">
                        These checks run locally on your phone so no raw data ever touches Celo.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {requirementSections.map((section) => (
                        <div
                          key={section.key}
                          className="rounded-xl border border-purple-200/70 dark:border-purple-500/30 bg-white/80 dark:bg-white/5 p-4 space-y-2"
                        >
                          <p className="text-xs uppercase tracking-[0.25em] text-purple-600 dark:text-purple-200">
                            {section.title}
                          </p>
                          {section.description && (
                            <p className="text-sm text-purple-900/80 dark:text-purple-100/80">{section.description}</p>
                          )}
                          {section.chips && (
                            <div className="flex flex-wrap gap-2">
                              {section.chips.map((chip) => (
                                <span
                                  key={chip}
                                  className="px-3 py-1 rounded-full bg-purple-600/10 text-xs font-semibold text-purple-800 dark:text-purple-100 border border-purple-500/20"
                                >
                                  {chip}
                                </span>
                              ))}
                            </div>
                          )}
                          {section.bullets && (
                            <ul className="space-y-1 text-purple-900/80 dark:text-purple-100/80">
                              {section.bullets.map((item, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-400 dark:bg-purple-300" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAlreadySigned && selectedStatus && (
                  <div className="rounded-2xl border border-emerald-600/30 bg-emerald-50/80 dark:bg-emerald-500/10 p-4 text-sm">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-200">You already signed the manifesto</p>
                    <p className="text-gray-700 dark:text-gray-200">Signature date: {formatDate(selectedStatus.timestamp)}</p>
                    <a
                      href={
                        selectedStatus.transactionHash
                          ? `${BLOCK_EXPLORER_URL}/tx/${selectedStatus.transactionHash}`
                          : `${BLOCK_EXPLORER_URL}/address/${CONTRACT_ADDRESS}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline text-emerald-800 dark:text-emerald-200"
                    >
                      View pledge on explorer
                    </a>
                  </div>
                )}

                {selectedAlreadySigned && generatedWallet && selectedAddress === generatedWallet.address && (
                  <div className="rounded-2xl border border-amber-400/60 bg-amber-50/90 dark:bg-amber-500/10 p-4 text-sm space-y-3">
                    <p className="font-semibold text-amber-900 dark:text-amber-200">
                      Important: save this wallet’s recovery phrase
                    </p>
                    <p className="text-amber-900/80 dark:text-amber-200">
                      This address now represents your signature. Write down the phrase below or download a backup file to keep it safe.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowRecovery((prev) => !prev)}
                        className="px-3 py-1.5 rounded-full border border-amber-600/60 text-xs"
                      >
                        {showRecovery ? 'Hide recovery phrase' : 'Reveal recovery phrase'}
                      </button>
                      <button
                        onClick={() => downloadRecoveryFile(generatedWallet)}
                        className="px-3 py-1.5 rounded-full border border-amber-600/60 text-xs"
                      >
                        Download backup file
                      </button>
                    </div>
                    {showRecovery && (
                      <div className="bg-white/90 dark:bg-black/40 rounded-xl border border-amber-500/40 p-3 space-y-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-200">Recovery phrase</p>
                          <p className="font-mono text-xs break-words text-gray-900 dark:text-white">{generatedWallet.mnemonic}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-200">Private key</p>
                          <p className="font-mono text-xs break-all text-gray-900 dark:text-white">{generatedWallet.privateKey}</p>
                        </div>
                        <button
                          onClick={() => navigator.clipboard.writeText(`${generatedWallet.mnemonic}\n${generatedWallet.privateKey}`)}
                          className="text-xs underline text-amber-800 dark:text-amber-200"
                        >
                          Copy to clipboard
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white dark:bg-[#151515] rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-lg space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Verification data</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Live Merkle root and contract reference</p>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-gray-50 to-white dark:from-[#1a1a1a] dark:to-[#111111] p-4 space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Current Merkle root</p>
                  <p className="font-mono text-xs break-all text-gray-900 dark:text-white">{censusRoot}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Used to verify every pledge on-chain.</p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-gray-50 to-white dark:from-[#1a1a1a] dark:to-[#111111] p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Contract address</p>
                    <a
                      className="px-3 py-1 rounded-full border border-gray-200 dark:border-white/20 text-xs text-gray-700 dark:text-gray-200"
                      href={`${BLOCK_EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                  </div>
                  <a
                    className="font-mono text-xs break-all text-blue-700 dark:text-blue-300 underline block"
                    href={`${BLOCK_EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {CONTRACT_ADDRESS}
                  </a>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Runs on Celo mainnet with Self verification.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
