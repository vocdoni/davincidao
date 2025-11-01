import { useState, useEffect } from 'react'
import { Wallet, AlertCircle, Loader2 } from 'lucide-react'
import { useWallet } from '~/hooks/useWallet'
import { formatAddress } from '~/lib/utils'
import { PrivateKeyAuth } from './PrivateKeyAuth'
import { isWalletConnectAvailable } from '~/lib/appkit'

export const WalletButton = () => {
  const { isConnected, address, connect, disconnect, connectWithPrivateKey } = useWallet()
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | undefined>()

  // Reset connecting state when connection state changes
  useEffect(() => {
    if (isConnected) {
      setIsConnecting(false)
      setConnectionError(undefined)
    }
  }, [isConnected])

  const handleConnectWallet = async () => {
    if (isConnected) {
      await disconnect()
    } else {
      setIsConnecting(true)
      setConnectionError(undefined)
      
      try {
        await connect()
      } catch (error) {
        console.error('Connection failed:', error)
        setConnectionError(error instanceof Error ? error.message : 'Connection failed')
      } finally {
        // Don't set isConnecting to false immediately for AppKit
        // as it handles its own connection state
        if (!isWalletConnectAvailable) {
          setIsConnecting(false)
        }
      }
    }
  }

  const handlePrivateKeyConnect = async (privateKey: string) => {
    setIsConnecting(true)
    setConnectionError(undefined)
    
    try {
      await connectWithPrivateKey(privateKey)
    } catch (error) {
      console.error('Private key connection failed:', error)
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect with private key')
    } finally {
      setIsConnecting(false)
    }
  }

  const loading = isConnecting && !isConnected

  // If connected, show connected state
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-black text-black">
          <div className="w-2 h-2 terminal-accent rounded-full" style={{ backgroundColor: 'hsl(var(--accent))' }} />
          <Wallet className="w-4 h-4" />
          <span className="text-xs font-mono font-medium">
            <span className="hidden sm:inline">{formatAddress(address)}</span>
            <span className="sm:hidden">{formatAddress(address, 4, 4)}</span>
          </span>
        </div>
        {isWalletConnectAvailable ? (
          <w3m-button />
        ) : (
          <button className="btn-minimal text-xs" onClick={disconnect}>
            DISCONNECT
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Connection Error */}
      {connectionError && (
        <div className="mb-2 p-3 bg-gray-100 border border-black">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-mono">{connectionError}</span>
          </div>
        </div>
      )}

      {isWalletConnectAvailable ? (
        // Use AppKit button when available
        <div className="flex items-center gap-2">
          <w3m-button />
          {!isConnected && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-300 text-xs font-mono">
              <AlertCircle className="w-3 h-3" />
              <span>Full wallet support</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          {/* Traditional Wallet Connection */}
          <div className="flex items-center gap-2">
            <button
              className="btn-minimal text-xs flex items-center gap-2"
              onClick={handleConnectWallet}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>CONNECTING...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>CONNECT WALLET</span>
                </>
              )}
            </button>
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-300 text-xs font-mono">
              <AlertCircle className="w-3 h-3" />
              <span>MetaMask only</span>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-xs text-gray-500 font-mono">or</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* Private Key Connection */}
          <PrivateKeyAuth
            onConnect={handlePrivateKeyConnect}
            isConnecting={loading}
            error={connectionError}
          />
        </div>
      )}
    </div>
  )
}