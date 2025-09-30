import { Button } from './Button'

interface MintingButtonProps {
  className?: string
  size?: 'sm' | 'lg' | 'default' | 'icon'
  variant?: 'outline' | 'link' | 'default' | 'destructive' | 'secondary' | 'ghost'
}

export const MintingButton = ({ 
  className = '', 
  size = 'default',
  variant = 'default'
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
    <Button
      onClick={handleMintClick}
      size={size}
      variant={variant}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Mint NFTs
    </Button>
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
    <div className={`text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 ${className}`}>
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Need NFTs to Delegate?
      </h3>
      <p className="text-gray-600 mb-4">
        You don't have any NFTs from supported collections yet. Mint some NFTs to start participating in governance!
      </p>
      <Button
        onClick={handleMintClick}
        size="lg"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Mint NFTs Now
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </Button>
    </div>
  )
}
