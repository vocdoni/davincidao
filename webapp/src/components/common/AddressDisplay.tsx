import { useState, useEffect } from 'react'
import { formatAddress } from '~/lib/utils'
import { lookupENSName } from '~/lib/ens'

interface AddressDisplayProps {
  address: string
  type?: 'address' | 'hash' | 'tx'
  label?: string
  showFull?: boolean
  className?: string
  copyable?: boolean
  linkable?: boolean
  showENS?: boolean // New prop to enable ENS lookup
}

export const AddressDisplay = ({
  address,
  type = 'address',
  label,
  showFull = false,
  className = '',
  copyable = true,
  linkable = true,
  showENS = false
}: AddressDisplayProps) => {
  const [copied, setCopied] = useState(false)
  const [ensName, setEnsName] = useState<string | null>(null)
  const [ensLoading, setEnsLoading] = useState(false)

  // Perform ENS reverse lookup if enabled
  useEffect(() => {
    if (!showENS || type !== 'address') return

    let cancelled = false
    setEnsLoading(true)

    const fetchENS = async () => {
      try {
        const name = await lookupENSName(address)
        if (!cancelled) {
          setEnsName(name)
        }
      } catch (error) {
        console.warn('Failed to lookup ENS for', address, error)
      } finally {
        if (!cancelled) {
          setEnsLoading(false)
        }
      }
    }

    fetchENS()

    return () => {
      cancelled = true
    }
  }, [address, showENS, type])

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  const getExplorerUrl = () => {
    const baseUrl = import.meta.env.VITE_BLOCK_EXPLORER_URL
    if (!baseUrl) return null

    switch (type) {
      case 'address':
        return `${baseUrl}/address/${address}`
      case 'hash':
        return `${baseUrl}/tx/${address}`
      case 'tx':
        return `${baseUrl}/tx/${address}`
      default:
        return `${baseUrl}/address/${address}`
    }
  }

  const handleExplorerClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const url = getExplorerUrl()
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const explorerUrl = getExplorerUrl()

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {label && (
        <span className="text-sm text-gray-600 mr-1">{label}:</span>
      )}

      <code className={`bg-gray-100 px-2 py-1 rounded text-xs break-all ${
        ensName ? 'font-medium' : 'font-mono'
      }`}>
        {ensLoading && showENS ? (
          <span className="flex items-center gap-1">
            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {formatAddress(address)}
          </span>
        ) : (
          <>
            {ensName && <span className="text-purple-600">{ensName}</span>}
            {ensName && ' '}
            {ensName ? (
              <span className="font-mono text-gray-500">({formatAddress(address)})</span>
            ) : (
              <span className="font-mono">{showFull ? address : formatAddress(address)}</span>
            )}
          </>
        )}
      </code>
      
      <div className="flex items-center gap-1 ml-1">
        {copyable && (
          <button
            onClick={handleCopy}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            {copied ? (
              <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}
        
        {linkable && explorerUrl && (
          <button
            onClick={handleExplorerClick}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="View on block explorer"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// Specialized components for common use cases
export const ContractAddress = ({ address, className }: { address: string, className?: string }) => (
  <AddressDisplay 
    address={address} 
    type="address" 
    label="Contract"
    className={className}
  />
)

export const WalletAddress = ({ address, className, showENS = true }: { address: string, className?: string, showENS?: boolean }) => (
  <AddressDisplay
    address={address}
    type="address"
    className={className}
    showENS={showENS}
  />
)

export const CollectionAddress = ({ address, className }: { address: string, className?: string }) => (
  <AddressDisplay 
    address={address} 
    type="address"
    className={className}
  />
)

export const TransactionHash = ({ hash, className }: { hash: string, className?: string }) => (
  <AddressDisplay 
    address={hash} 
    type="tx"
    label="Tx"
    className={className}
  />
)

export const CensusRoot = ({ root, className }: { root: string, className?: string }) => (
  <AddressDisplay 
    address={root} 
    type="hash"
    label="Root"
    linkable={false} // Census roots don't have explorer pages
    className={className}
  />
)
