import { useState } from 'react'
import { Button } from '~/components/common/Button'
import { toast } from 'sonner'

interface ValidateCensusRootModalProps {
  isOpen: boolean
  onClose: () => void
  onValidate: (root: string) => Promise<bigint>
}

export const ValidateCensusRootModal = ({
  isOpen,
  onClose,
  onValidate
}: ValidateCensusRootModalProps) => {
  const [rootInput, setRootInput] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    blockNumber: bigint
    isValid: boolean
  } | null>(null)

  if (!isOpen) return null

  const handleValidate = async () => {
    if (!rootInput.trim()) {
      toast.error('Please enter a census root')
      return
    }

    // Validate input format
    if (!rootInput.match(/^(0x)?[0-9a-fA-F]+$/)) {
      toast.error('Invalid format. Please enter a valid hexadecimal census root')
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      // Add 0x prefix if not present
      const formattedRoot = rootInput.startsWith('0x') ? rootInput : `0x${rootInput}`
      const blockNumber = await onValidate(formattedRoot)

      setValidationResult({
        blockNumber,
        isValid: blockNumber > 0n
      })

      if (blockNumber === 0n) {
        toast.info('This census root was never valid')
      } else {
        toast.success(`Census root was valid at block ${blockNumber.toString()}`)
      }
    } catch (error) {
      console.error('Validation error:', error)
      toast.error('Failed to validate census root')
      setValidationResult(null)
    } finally {
      setIsValidating(false)
    }
  }

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value)
    toast.success('Copied to clipboard')
  }

  const handleClose = () => {
    setRootInput('')
    setValidationResult(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Validate Census Root</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Census Root (hex)
            </label>
            <input
              type="text"
              value={rootInput}
              onChange={(e) => setRootInput(e.target.value)}
              placeholder="0x1234... or 1234..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              disabled={isValidating}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter a census root to check if it was ever valid and at which block number
            </p>
          </div>

          <Button
            onClick={handleValidate}
            disabled={isValidating || !rootInput.trim()}
            className="w-full"
          >
            {isValidating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Validating...
              </>
            ) : (
              'Validate'
            )}
          </Button>

          {/* Validation Result */}
          {validationResult && (
            <div className={`p-4 rounded-lg ${validationResult.isValid ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {validationResult.isValid ? (
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`text-sm font-medium ${validationResult.isValid ? 'text-green-800' : 'text-gray-800'}`}>
                    {validationResult.isValid ? 'Valid Census Root' : 'Invalid Census Root'}
                  </h3>
                  <div className="mt-2 text-sm text-gray-700">
                    {validationResult.isValid ? (
                      <>
                        <p>This census root was set at:</p>
                        <div className="mt-2 flex items-center gap-2 font-mono text-xs bg-white p-2 rounded border">
                          <span className="font-medium">Block #{validationResult.blockNumber.toString()}</span>
                          <button
                            onClick={() => handleCopy(validationResult.blockNumber.toString())}
                            className="ml-auto p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Copy block number"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </>
                    ) : (
                      <p>This census root was never valid or has not been set on-chain.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button onClick={handleClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
