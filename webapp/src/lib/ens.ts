import { ethers } from 'ethers'

// Cache for ENS resolutions to avoid repeated lookups
const ensCache = new Map<string, string>()
const reverseCache = new Map<string, string | null>()

/**
 * Get an Ethereum mainnet provider for ENS lookups
 * ENS is only available on Ethereum mainnet
 */
function getMainnetProvider(): ethers.JsonRpcProvider {
  const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY
  if (!alchemyKey) {
    throw new Error('VITE_ALCHEMY_API_KEY not configured')
  }
  return new ethers.JsonRpcProvider(
    `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`
  )
}

/**
 * Check if a string is a valid ENS name
 */
export function isENSName(input: string): boolean {
  // ENS names must end with .eth and contain valid characters
  return /^[a-z0-9-]+\.eth$/i.test(input.trim())
}

/**
 * Resolve an ENS name to an Ethereum address
 * @param ensName - The ENS name (e.g., "vitalik.eth")
 * @returns The resolved Ethereum address
 * @throws Error if the ENS name cannot be resolved
 */
export async function resolveENSName(ensName: string): Promise<string> {
  const normalized = ensName.trim().toLowerCase()

  if (!isENSName(normalized)) {
    throw new Error('Invalid ENS name format')
  }

  // Check cache first
  if (ensCache.has(normalized)) {
    return ensCache.get(normalized)!
  }

  try {
    const provider = getMainnetProvider()
    const address = await provider.resolveName(normalized)

    if (!address) {
      throw new Error(`ENS name "${ensName}" could not be resolved`)
    }

    // Store in cache
    ensCache.set(normalized, address)

    return address
  } catch (error) {
    if (error instanceof Error && error.message.includes('could not be resolved')) {
      throw error
    }
    throw new Error(`Failed to resolve ENS name "${ensName}": ${error}`)
  }
}

/**
 * Reverse lookup: resolve an Ethereum address to its primary ENS name
 * @param address - The Ethereum address
 * @returns The ENS name if found, null otherwise
 */
export async function lookupENSName(address: string): Promise<string | null> {
  const normalized = address.toLowerCase()

  // Check cache first
  if (reverseCache.has(normalized)) {
    return reverseCache.get(normalized)!
  }

  try {
    const provider = getMainnetProvider()
    const ensName = await provider.lookupAddress(address)

    // Store in cache (even if null)
    reverseCache.set(normalized, ensName)

    return ensName
  } catch (error) {
    console.warn(`Failed to lookup ENS name for ${address}:`, error)
    reverseCache.set(normalized, null)
    return null
  }
}

/**
 * Resolve an input string that could be either an ENS name or Ethereum address
 * @param input - ENS name or Ethereum address
 * @returns The resolved Ethereum address in checksum format
 * @throws Error if input is invalid or cannot be resolved
 */
export async function resolveAddressOrENS(input: string): Promise<string> {
  const trimmed = input.trim()

  // If it's already a valid Ethereum address
  if (ethers.isAddress(trimmed)) {
    return ethers.getAddress(trimmed) // Return checksum format
  }

  // If it looks like an ENS name
  if (isENSName(trimmed)) {
    const resolved = await resolveENSName(trimmed)
    return ethers.getAddress(resolved) // Return checksum format
  }

  throw new Error('Input must be a valid Ethereum address or ENS name (e.g., name.eth)')
}

/**
 * Format an address with its ENS name if available
 * @param address - The Ethereum address
 * @returns Formatted string like "vitalik.eth (0xd8dA...6045)" or just the address if no ENS
 */
export async function formatAddressWithENS(address: string): Promise<string> {
  const ensName = await lookupENSName(address)
  if (ensName) {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
    return `${ensName} (${shortAddress})`
  }
  return address
}

/**
 * Clear the ENS cache (useful for testing or forced refresh)
 */
export function clearENSCache(): void {
  ensCache.clear()
  reverseCache.clear()
}
