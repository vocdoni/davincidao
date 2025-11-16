import { PledgeStatus } from '~/types'

interface SignatureButtonProps {
  pledgeStatus: PledgeStatus | null
  onSign: () => void
  onConnect?: () => void
  loading?: boolean
  connected: boolean
}

export function SignatureButton({ pledgeStatus, onSign, onConnect, loading, connected }: SignatureButtonProps) {
  if (pledgeStatus?.hasPledged) {
    return (
      <div className="bg-white/60 border border-green-700/30 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-green-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-900 font-medium">You signed this manifesto</p>
        </div>
        <p className="text-sm text-gray-700 font-light">
          {new Date(pledgeStatus.timestamp * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>
    )
  }

  // Not connected - show connect button
  if (!connected && onConnect) {
    return (
      <button
        onClick={onConnect}
        className="w-full py-3.5 px-6 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors text-base"
      >
        Connect Wallet to Sign
      </button>
    )
  }

  // Connected - show sign button
  return (
    <button
      onClick={onSign}
      disabled={!connected || loading}
      className="w-full py-3.5 px-6 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Signing...
        </span>
      ) : (
        'Sign the Manifesto'
      )}
    </button>
  )
}
