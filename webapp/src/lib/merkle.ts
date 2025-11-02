import { CensusData } from '~/types'
import { poseidon2 } from 'poseidon-lite'
import { LeanIMT } from '@zk-kit/lean-imt'

/**
 * Generate Merkle proofs for addresses in the census tree
 *
 * @param censusData - The complete census data with all nodes
 * @param addresses - Array of addresses to generate proofs for
 * @returns Object mapping addresses to their Merkle proof siblings
 */
export function generateProofs(censusData: CensusData, addresses: string[]): { [address: string]: string[] } {
  console.log('=== Generating proofs ===')
  console.log('Census data nodes:', censusData.nodes.length)
  console.log('Addresses to generate proofs for:', addresses)

  // Create LeanIMT with Poseidon hash function
  const tree = new LeanIMT((a, b) => poseidon2([a, b]))

  // Insert all leaves in order
  for (const node of censusData.nodes) {
    tree.insert(BigInt(node.leaf))
  }

  const proofs: { [address: string]: string[] } = {}
  for (const address of addresses) {
    console.log(`Looking for address: ${address}`)

    // Debug: show all addresses in the tree
    const allAddresses = censusData.nodes.map(n => n.address.toLowerCase())
    console.log('All addresses in tree:', allAddresses)

    const node = censusData.nodes.find(n => n.address.toLowerCase() === address.toLowerCase())
    console.log(`Found node for ${address}:`, node)

    if (node) {
      const leafBigInt = BigInt(node.leaf)
      const leafIndex = tree.indexOf(leafBigInt)
      console.log(`Leaf index for ${address}: ${leafIndex}`)
      console.log(`Node leaf: ${node.leaf}`)

      if (leafIndex !== -1) {
        const proof = tree.generateProof(leafIndex)
        // Convert siblings from bigint to string
        const siblings = proof.siblings.map(s => s.toString())
        proofs[address] = siblings

        console.log(`Generated ${siblings.length} proof elements for ${address}:`, siblings)
      } else {
        console.error(`Leaf not found in tree for ${address}`)
      }
    } else {
      console.error(`Node not found in census data for ${address}`)
    }
  }

  console.log('Final proofs:', proofs)
  return proofs
}

/**
 * Pack address and weight into a leaf value (matches contract implementation)
 *
 * @param address - Ethereum address
 * @param weight - Voting weight
 * @returns Packed leaf value as string
 */
export function packLeaf(address: string, weight: number): string {
  // Convert address to uint160 and weight to uint88, then pack
  const addressBN = BigInt(address)
  const weightBN = BigInt(weight)

  // Pack: (address << 88) | weight
  const packed = (addressBN << 88n) | weightBN
  return packed.toString()
}
