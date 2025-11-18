import { useState } from 'react'
import { toast } from 'sonner'

interface AddressCheckerProps {
  onCheck: (address: string) => Promise<{
    hasPledged: boolean
    timestamp?: number
    blockNumber?: number
    treeIndex?: number
  } | null>
  onResolveENS: (ensName: string) => Promise<string | null>
  darkMode?: boolean
}

export function AddressChecker({ onCheck, onResolveENS, darkMode = false }: AddressCheckerProps) {
  const [input, setInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<{
    hasPledged: boolean
    timestamp?: number
    blockNumber?: number
    treeIndex?: number
    resolvedAddress?: string
    ensName?: string
  } | null>(null)

  const handleCheck = async () => {
    if (!input) {
      toast.error('Please enter an address or ENS name')
      return
    }

    setChecking(true)
    try {
      let addressToCheck = input.trim()
      let ensName: string | undefined

      // Check if input is ENS name (ends with .eth or contains dots)
      const isENS = input.includes('.') && !input.startsWith('0x')

      if (isENS) {
        toast.info('Resolving ENS name...')
        const resolved = await onResolveENS(input)

        if (!resolved) {
          toast.error('ENS name not found or invalid')
          setResult(null)
          setChecking(false)
          return
        }

        addressToCheck = resolved
        ensName = input
        toast.success(`Resolved to ${resolved.slice(0, 10)}...`)
      } else {
        // Validate Ethereum address format
        if (!addressToCheck.match(/^0x[a-fA-F0-9]{40}$/)) {
          toast.error('Invalid Ethereum address format')
          setResult(null)
          setChecking(false)
          return
        }
      }

      const pledgeInfo = await onCheck(addressToCheck)

      if (!pledgeInfo) {
        toast.error('Failed to check address')
        setResult(null)
        setChecking(false)
        return
      }

      setResult({
        hasPledged: pledgeInfo.hasPledged,
        timestamp: pledgeInfo.timestamp,
        blockNumber: pledgeInfo.blockNumber,
        treeIndex: pledgeInfo.treeIndex,
        resolvedAddress: addressToCheck,
        ensName
      })

      if (pledgeInfo.hasPledged) {
        toast.success('Address has signed the manifesto!')
      } else {
        toast.info('Address has not signed yet')
      }
    } catch (error) {
      console.error('Error checking address:', error)
      toast.error('Failed to check address')
      setResult(null)
    } finally {
      setChecking(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  return (
    <div className={`rounded-lg sm:rounded-xl border p-5 sm:p-6 ${darkMode ? 'bg-[#2a2520]/40 border-[#3a3530]/60' : 'bg-[#c8bfb0] border-[#b8a896]'}`}>
      <h3 className={`text-lg sm:text-xl font-medium mb-3 text-center ${darkMode ? 'text-[#d8d8d8]' : 'text-gray-900'}`} style={{ lineHeight: '1.1em' }}>
        🔍 Check Address Status
      </h3>

      <p className={`text-center mb-5 sm:mb-6 text-xs sm:text-sm font-normal px-2 ${darkMode ? 'text-[#c8c8c8]' : 'text-gray-800'}`} style={{ lineHeight: '1.5em' }}>
        Verify if an address or ENS name has signed the manifesto.
      </p>

      <div className="space-y-3 sm:space-y-4">
        {/* Input */}
        <div>
          <label htmlFor="address" className={`block text-xs font-medium mb-2 ${darkMode ? 'text-[#b8b8b8]' : 'text-gray-700'}`}>
            Ethereum Address or ENS Name
          </label>
          <input
            type="text"
            id="address"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0x... or vitalik.eth"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono text-xs ${darkMode ? 'bg-[#2a2a2a]/60 border-[#4a4a4a] text-[#e8e8e8] placeholder-[#888888]' : 'bg-white/60 border-[#c4bfb4] text-gray-900'}`}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          />
        </div>

        {/* Check Button */}
        <div className="flex justify-center">
          <button
            onClick={handleCheck}
            disabled={checking || !input}
            className="inline-flex items-center justify-center px-5 py-2 sm:py-2.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-medium text-xs sm:text-sm whitespace-nowrap shadow-md hover:shadow-lg"
          >
            {checking ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking...
              </>
            ) : (
              'Check Address'
            )}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={`p-3 sm:p-4 rounded-lg border ${
            result.hasPledged
              ? darkMode ? 'bg-[#2a2a2a]/60 border-green-600/50' : 'bg-white/50 border-green-700/40'
              : darkMode ? 'bg-[#2a2a2a]/60 border-[#4a4a4a]' : 'bg-white/40 border-[#c4bfb4]'
          }`}>
            <div className="flex items-start gap-2 sm:gap-3">
              {result.hasPledged ? (
                <svg className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm sm:text-base ${result.hasPledged ? 'text-green-900' : 'text-gray-700'}`}>
                  {result.hasPledged ? '✓ Signed' : 'Not signed'}
                </p>
                <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                  {result.ensName && (
                    <p>
                      <span className="font-medium">ENS:</span>{' '}
                      <span className="font-mono break-all">{result.ensName}</span>
                    </p>
                  )}
                  {result.resolvedAddress && (
                    <p>
                      <span className="font-medium">Address:</span>{' '}
                      <span className="font-mono text-[10px] sm:text-xs break-all">{result.resolvedAddress}</span>
                    </p>
                  )}
                  {result.hasPledged && result.timestamp && (
                    <>
                      <p>
                        <span className="font-medium">Signed on:</span>{' '}
                        <span className="break-all">{formatDate(result.timestamp)}</span>
                      </p>
                      {result.blockNumber && (
                        <p>
                          <span className="font-medium">Block:</span>{' '}
                          {result.blockNumber.toLocaleString()}
                        </p>
                      )}
                      {result.treeIndex !== undefined && (
                        <p>
                          <span className="font-medium">Tree Index:</span>{' '}
                          #{result.treeIndex}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Helper text */}
        <p className="text-[10px] sm:text-xs text-gray-600 font-light">
          Enter any Ethereum address or ENS name (e.g., vitalik.eth) to check if it has signed the manifesto.
        </p>
      </div>
    </div>
  )
}
