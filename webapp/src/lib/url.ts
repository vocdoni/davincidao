import { isAddress } from 'ethers'

/**
 * Extract contract address from URL path
 * Supports formats like:
 * - /0x1234567890123456789012345678901234567890
 * - /#/0x1234567890123456789012345678901234567890
 */
export function getContractAddressFromUrl(): string | null {
  const path = window.location.pathname
  const hash = window.location.hash
  
  // Try to extract from path first
  const pathMatch = path.match(/\/0x[a-fA-F0-9]{40}/)
  if (pathMatch) {
    const address = pathMatch[0].substring(1) // Remove leading slash
    return isValidAddress(address) ? address : null
  }
  
  // Try to extract from hash
  const hashMatch = hash.match(/#?\/?0x[a-fA-F0-9]{40}/)
  if (hashMatch) {
    const address = hashMatch[0].replace(/^#?\/?/, '') // Remove hash and slashes
    return isValidAddress(address) ? address : null
  }
  
  return null
}

/**
 * Update URL with contract address
 */
export function updateUrlWithContractAddress(address: string): void {
  if (!isValidAddress(address)) {
    throw new Error('Invalid contract address')
  }
  
  const newUrl = `/${address}`
  window.history.pushState({ contractAddress: address }, '', newUrl)
}

/**
 * Navigate to contract address
 */
export function navigateToContract(address: string): void {
  if (!isValidAddress(address)) {
    throw new Error('Invalid contract address')
  }
  
  const newUrl = `/${address}`
  window.location.href = newUrl
}

/**
 * Get current URL without contract address
 */
export function getBaseUrl(): string {
  const origin = window.location.origin
  return origin
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  try {
    return isAddress(address)
  } catch {
    return false
  }
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Listen for browser navigation events
 */
export function onUrlChange(callback: (address: string | null) => void): () => void {
  const handlePopState = () => {
    const address = getContractAddressFromUrl()
    callback(address)
  }
  
  window.addEventListener('popstate', handlePopState)
  
  // Return cleanup function
  return () => {
    window.removeEventListener('popstate', handlePopState)
  }
}

/**
 * Get shareable URL for current contract
 */
export function getShareableUrl(contractAddress: string): string {
  if (!isValidAddress(contractAddress)) {
    throw new Error('Invalid contract address')
  }
  
  return `${getBaseUrl()}/${contractAddress}`
}
