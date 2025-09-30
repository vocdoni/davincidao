interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on(event: 'accountsChanged', handler: (accounts: string[]) => void): void
  on(event: 'chainChanged', handler: (chainId: string) => void): void
  on(event: string, handler: (...args: unknown[]) => void): void
  removeListener(event: 'accountsChanged', handler: (accounts: string[]) => void): void
  removeListener(event: 'chainChanged', handler: (chainId: string) => void): void
  removeListener(event: string, handler: (...args: unknown[]) => void): void
  isMetaMask?: boolean
}

interface Window {
  ethereum?: EthereumProvider
}
