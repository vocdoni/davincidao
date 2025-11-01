interface MintingButtonProps {
  className?: string
}

export const MintingButton = ({
  className = ''
}: MintingButtonProps) => {
  const mintingUrl = import.meta.env.VITE_MINTING_PAGE_URL

  // Don't render if no minting URL is configured
  if (!mintingUrl) {
    return null
  }

  const handleMintClick = () => {
    window.open(mintingUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleMintClick}
      className={`btn-accent text-xs inline-flex items-center gap-2 ${className}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      MINT NFTs
    </button>
  )
}

// Specialized variants for different contexts
export const MintingCallToAction = ({ className }: { className?: string }) => {
  const mintingUrl = import.meta.env.VITE_MINTING_PAGE_URL

  if (!mintingUrl) {
    return null
  }

  const handleMintClick = () => {
    window.open(mintingUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="card-header text-center">
        <span className="text-sm uppercase tracking-wider">[ MINT NFTs ]</span>
      </div>
      <div className="p-6 text-center">
        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 border-2 border-black">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-sm font-mono font-bold mb-2 uppercase">
          Need NFTs to Delegate?
        </h3>
        <p className="text-xs text-gray-600 mb-4 font-mono">
          You don't have any NFTs from supported collections yet. Mint some NFTs to start participating in governance!
        </p>
        <button
          onClick={handleMintClick}
          className="btn-accent text-xs inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          MINT NFTs NOW
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
      </div>
    </div>
  )
}
