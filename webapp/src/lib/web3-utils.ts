/**
 * Truncates an Ethereum address to a shorter format
 * @param address The full Ethereum address
 * @param startLength Number of characters to show at start (default: 6)
 * @param endLength Number of characters to show at end (default: 4)
 * @returns Truncated address string
 */
export function truncateAddress(address: string, startLength = 6, endLength = 4): string {
  if (!address) return ''
  if (address.length < startLength + endLength) return address

  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

/**
 * Formats a chain ID to a network name
 * @param chainId The chain ID in hex format (e.g., "0x1") or number format
 * @returns Network name string
 */
export function getNetworkName(chainId: string | number): string {
  const chainIdHex = typeof chainId === 'number' ? `0x${chainId.toString(16)}` : chainId
  
  const networks: { [key: string]: string } = {
    '0x1': 'Ethereum',
    '0x5': 'Goerli',
    '0xaa36a7': 'Sepolia',
    '0x89': 'Polygon',
    '0x13881': 'Mumbai',
  }

  return networks[chainIdHex] || 'Unknown Network'
}

/**
 * Validates if a string is a valid Ethereum address
 * @param address The address to validate
 * @returns boolean indicating if address is valid
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Formats a large number with commas for better readability
 * @param num The number to format
 * @returns Formatted string
 */
export function formatNumber(num: number | string): string {
  return Number(num).toLocaleString()
}