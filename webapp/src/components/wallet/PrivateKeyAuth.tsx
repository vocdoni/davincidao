import React, { useState } from 'react'
import { Key, Eye, EyeOff, AlertTriangle } from 'lucide-react'

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
      <button
        className="btn-minimal text-xs flex items-center gap-2"
        onClick={() => setIsExpanded(true)}
      >
        <Key className="w-4 h-4" />
        <span>CONNECT WITH PRIVATE KEY</span>
      </button>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Security Warning */}
      <div className="mb-4 p-3 bg-gray-100 border border-black text-gray-900">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-700" />
          <div className="text-xs font-mono">
            <div className="font-bold mb-1">Security Warning</div>
            <div>
              Only use this for testing purposes. Never enter your main wallet's private key on any website.
              This is intended for development and testing with test accounts only.
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-mono font-bold mb-2 uppercase text-gray-900">
            Private Key (for testing only)
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="0x1234567890abcdef... or without 0x prefix"
              className={`w-full px-3 py-2 pr-10 text-xs border font-mono focus:outline-none focus:ring-1 focus:ring-black text-gray-900 ${
                error ? 'border-black bg-gray-100' : 'border-black bg-white'
              }`}
              disabled={isConnecting}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black"
              disabled={isConnecting}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {privateKey && !isValidPrivateKey(privateKey) && (
            <div className="mt-1 text-xs font-mono text-red-600">
              Invalid private key format. Must be 64 hex characters (with or without 0x prefix).
            </div>
          )}

          {error && (
            <div className="mt-1 text-xs font-mono text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!privateKey.trim() || !isValidPrivateKey(privateKey) || isConnecting}
            className="flex-1 px-3 py-1.5 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors text-xs disabled:opacity-50"
          >
            {isConnecting ? 'CONNECTING...' : 'CONNECT'}
          </button>
          <button
            type="button"
            className="btn-minimal text-xs"
            onClick={() => {
              setIsExpanded(false)
              setPrivateKey('')
              setShowKey(false)
            }}
            disabled={isConnecting}
          >
            CANCEL
          </button>
        </div>
      </form>
    </div>
  )
}
