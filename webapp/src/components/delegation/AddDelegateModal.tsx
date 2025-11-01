import { useState } from 'react'
import { ethers } from 'ethers'
import { Button } from '~/components/common/Button'
import { resolveAddressOrENS, isENSName } from '~/lib/ens'

interface AddDelegateModalProps {
  onAdd: (address: string) => void
  onCancel: () => void
  existingDelegates: string[]
}

export const AddDelegateModal = ({
  onAdd,
  onCancel,
  existingDelegates
}: AddDelegateModalProps) => {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [isResolving, setIsResolving] = useState(false)
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)

  const handleInputChange = (value: string) => {
    setInput(value)
    setError('')
    setResolvedAddress(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsResolving(true)

    const trimmedInput = input.trim()

    if (!trimmedInput) {
      setError('Please enter an address or ENS name')
      setIsResolving(false)
      return
    }

    try {
      // Resolve ENS name or validate address
      const resolvedAddr = await resolveAddressOrENS(trimmedInput)

      // Check if already in delegates list
      if (existingDelegates.some(existing => existing.toLowerCase() === resolvedAddr.toLowerCase())) {
        setError('This address is already in your delegates list')
        setIsResolving(false)
        return
      }

      onAdd(resolvedAddr)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to resolve address or ENS name')
      }
    } finally {
      setIsResolving(false)
    }
  }

  // Detect input type for user feedback
  const inputType = input.trim() ? (
    isENSName(input.trim()) ? 'ENS name' :
    ethers.isAddress(input.trim()) ? 'Address' :
    'Invalid'
  ) : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Add New Delegate
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
              disabled={isResolving}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Ethereum Address or ENS Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="address"
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="0x... or vitalik.eth"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  autoFocus
                  disabled={isResolving}
                />
                {inputType && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      inputType === 'ENS name' ? 'bg-purple-100 text-purple-700' :
                      inputType === 'Address' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {inputType}
                    </span>
                  </div>
                )}
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
              {resolvedAddress && (
                <p className="mt-2 text-sm text-green-600">
                  Resolved to: {resolvedAddress}
                </p>
              )}
            </div>

            <div className="text-sm text-gray-600 mb-6 space-y-2">
              <p>Enter an Ethereum address or ENS name to delegate your NFTs to.</p>
              <div className="flex items-start gap-2 text-xs bg-purple-50 p-3 rounded-md">
                <svg className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-purple-700">
                  <strong>Examples:</strong><br />
                  Address: 0x1234...5678<br />
                  ENS: vitalik.eth
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={!input.trim() || isResolving}
              >
                {isResolving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resolving...
                  </>
                ) : (
                  'Add Delegate'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isResolving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
