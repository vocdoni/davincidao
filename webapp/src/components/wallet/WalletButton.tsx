import { useState, useEffect } from 'react'
import { Wallet, AlertCircle, Loader2 } from 'lucide-react'
import { useWallet } from '~/hooks/useWallet'
import { formatAddress } from '~/lib/utils'
import { Button } from '~/components/common/Button'
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
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <Wallet className="w-4 h-4 text-green-700" />
          <span className="text-sm font-medium text-green-700">
            <span className="hidden sm:inline">{formatAddress(address)}</span>
            <span className="sm:hidden">{formatAddress(address, 4, 4)}</span>
          </span>
        </div>
        {isWalletConnectAvailable ? (
          <w3m-button />
        ) : (
          <Button size="sm" variant="outline" onClick={disconnect}>
            Disconnect
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Connection Error */}
      {connectionError && (
        <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">{connectionError}</span>
          </div>
        </div>
      )}

      {isWalletConnectAvailable ? (
        // Use AppKit button when available
        <div className="flex items-center gap-2">
          <w3m-button />
          {!isConnected && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs">
              <AlertCircle className="w-3 h-3 text-blue-600" />
              <span className="text-blue-700">Full wallet support</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          {/* Traditional Wallet Connection */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={handleConnectWallet}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>Connect Wallet</span>
                </>
              )}
            </Button>
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 border border-orange-200 rounded text-xs">
              <AlertCircle className="w-3 h-3 text-orange-600" />
              <span className="text-orange-700">MetaMask only</span>
            </div>
          </div>
          
          {/* Divider */}
          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-200" />
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