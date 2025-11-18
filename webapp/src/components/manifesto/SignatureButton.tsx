import { PledgeStatus } from '~/types'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'

interface SignatureButtonProps {
  pledgeStatus: PledgeStatus | null
  onSign: () => void
  loading?: boolean
  connected: boolean
}

export function SignatureButton({ pledgeStatus, onSign, loading, connected }: SignatureButtonProps) {
  const { open } = useAppKit()
  const { isConnected } = useAppKitAccount()

  if (pledgeStatus?.hasPledged) {
    return (
      <div className="bg-white/60 border border-green-700/30 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center">
        <div className="flex items-center justify-center mb-2 sm:mb-3">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-900 font-medium text-sm sm:text-base">You signed this manifesto</p>
        </div>
        <p className="text-xs sm:text-sm text-gray-700 font-light">
          {new Date(pledgeStatus.timestamp * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>
    )
  }

  // Not connected - show custom connect button that opens AppKit modal
  if (!isConnected && !connected) {
    return (
      <div className="flex justify-center">
        <button
          onClick={() => open()}
          className="inline-flex items-center justify-center py-2 sm:py-2.5 px-5 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 text-xs sm:text-sm whitespace-nowrap shadow-md hover:shadow-lg"
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  // Connected - show sign button
  return (
    <div className="flex justify-center">
      <button
        onClick={onSign}
        disabled={!connected || loading}
        className="inline-flex items-center justify-center py-2 sm:py-2.5 px-5 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-xs sm:text-sm whitespace-nowrap shadow-md hover:shadow-lg"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing...
          </>
        ) : (
          'Sign the Manifesto'
        )}
      </button>
    </div>
  )
}
