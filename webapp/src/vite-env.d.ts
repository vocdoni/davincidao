/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS: string
  readonly VITE_RPC_URL: string
  readonly VITE_CHAIN_ID: string
  readonly WALLETCONNECT_PROJECT_ID: string
  readonly VITE_BLOCK_EXPLORER_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Ethereum provider types
interface Window {
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    on: (event: string, handler: (...args: unknown[]) => void) => void
    removeListener: (event: string, handler: (...args: unknown[]) => void) => void
    isMetaMask?: boolean
  }
}
