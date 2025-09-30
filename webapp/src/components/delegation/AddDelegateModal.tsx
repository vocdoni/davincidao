import { useState } from 'react'
import { Button } from '~/components/common/Button'

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
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')

  const validateAddress = (addr: string): boolean => {
    // Basic Ethereum address validation
    if (!addr.startsWith('0x')) return false
    if (addr.length !== 42) return false
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) return false
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedAddress = address.trim()

    if (!trimmedAddress) {
      setError('Please enter an address')
      return
    }

    if (!validateAddress(trimmedAddress)) {
      setError('Please enter a valid Ethereum address')
      return
    }

    if (existingDelegates.some(existing => existing.toLowerCase() === trimmedAddress.toLowerCase())) {
      setError('This address is already in your delegates list')
      return
    }

    onAdd(trimmedAddress)
  }

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
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Ethereum Address
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="text-sm text-gray-600 mb-6">
              <p>Enter the Ethereum address you want to delegate your NFTs to. This address will receive voting power based on the number of NFTs you delegate.</p>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={!address.trim()}
              >
                Add Delegate
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
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
