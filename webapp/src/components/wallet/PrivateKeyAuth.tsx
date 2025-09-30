import React, { useState } from 'react'
import { Key, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { Button } from '~/components/common/Button'

interface PrivateKeyAuthProps {
  onConnect: (privateKey: string) => Promise<void>
  isConnecting: boolean
  error?: string
}

export function PrivateKeyAuth({ onConnect, isConnecting, error }: PrivateKeyAuthProps) {
  const [privateKey, setPrivateKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!privateKey.trim()) return
    
    try {
      await onConnect(privateKey.trim())
    } catch (error) {
      console.error('Private key connection failed:', error)
    }
  }

  const isValidPrivateKey = (key: string): boolean => {
    // Remove 0x prefix if present
    const cleanKey = key.startsWith('0x') ? key.slice(2) : key
    // Check if it's a valid 64-character hex string
    return /^[a-fA-F0-9]{64}$/.test(cleanKey)
  }

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => setIsExpanded(true)}
      >
        <Key className="w-4 h-4" />
        <span>Connect with Private Key</span>
      </Button>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Security Warning */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-yellow-800 mb-1">Security Warning</div>
            <div className="text-yellow-700">
              Only use this for testing purposes. Never enter your main wallet's private key on any website.
              This is intended for development and testing with test accounts only.
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Private Key (for testing only)
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="0x1234567890abcdef... or without 0x prefix"
              className={`w-full px-3 py-2 pr-10 text-sm border rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              disabled={isConnecting}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isConnecting}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          {privateKey && !isValidPrivateKey(privateKey) && (
            <div className="mt-1 text-xs text-red-600">
              Invalid private key format. Must be 64 hex characters (with or without 0x prefix).
            </div>
          )}
          
          {error && (
            <div className="mt-1 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={!privateKey.trim() || !isValidPrivateKey(privateKey) || isConnecting}
            className="flex-1"
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsExpanded(false)
              setPrivateKey('')
              setShowKey(false)
            }}
            disabled={isConnecting}
          >
            Cancel
          </Button>
        </div>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <div className="font-medium mb-1">For testing, you can:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>Use a test account private key from your development environment</li>
          <li>Generate a new test account with tools like Hardhat or Foundry</li>
          <li>Use testnet faucets to fund your test account</li>
        </ul>
      </div>
    </div>
  )
}
