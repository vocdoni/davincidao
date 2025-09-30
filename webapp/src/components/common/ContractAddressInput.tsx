import React, { useState } from 'react'
import { Button } from './Button'
import { isValidAddress, formatAddress, navigateToContract, getShareableUrl } from '~/lib/url'

interface ContractAddressInputProps {
  currentAddress: string
  onAddressChange?: (address: string) => void
  className?: string
}

export function ContractAddressInput({ 
  currentAddress, 
  onAddressChange,
  className = '' 
}: ContractAddressInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputValue.trim()) {
      setError('Please enter a contract address')
      return
    }

    if (!isValidAddress(inputValue.trim())) {
      setError('Invalid Ethereum address format')
      return
    }

    const address = inputValue.trim()
    setError(null)
    
    // Navigate to the new contract address
    navigateToContract(address)
    
    // Call the callback if provided
    if (onAddressChange) {
      onAddressChange(address)
    }
    
    // Reset form
    setInputValue('')
    setIsExpanded(false)
  }

  const handleCopyUrl = async () => {
    try {
      const shareableUrl = getShareableUrl(currentAddress)
      await navigator.clipboard.writeText(shareableUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  const handleCancel = () => {
    setInputValue('')
    setError(null)
    setIsExpanded(false)
  }

  if (!isExpanded) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Contract Address</label>
            <div className="text-xs text-gray-600 font-mono break-all">
              {formatAddress(currentAddress)}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyUrl}
              className="text-xs"
            >
              {copied ? '✓ Copied' : 'Copy URL'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded(true)}
              className="text-xs"
            >
              Change
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label className="text-sm font-medium text-gray-700">Contract Address</label>
        <div className="text-xs text-gray-500 mb-2">
          Enter a new contract address to connect to
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setError(null)
            }}
            placeholder="0x1234567890123456789012345678901234567890"
            className={`w-full px-3 py-2 text-sm border rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            autoFocus
          />
          {error && (
            <div className="mt-1 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={!inputValue.trim()}
          >
            Connect
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
      </form>
      
      <div className="text-xs text-gray-500">
        <div className="font-medium mb-1">Current:</div>
        <div className="font-mono break-all">{currentAddress}</div>
      </div>
    </div>
  )
}
