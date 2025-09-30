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
