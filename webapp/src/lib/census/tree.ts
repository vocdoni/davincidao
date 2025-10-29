import { LeanIMT } from '@zk-kit/lean-imt';
import { poseidon2 } from 'poseidon-lite';
import { Account } from './graphql';

// BN254 scalar field modulus
const SNARK_SCALAR_FIELD = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

/**
 * Pack address and weight into a single BigInt leaf value
 * Format: (address << 88) | weight
 * - Top 160 bits: address
 * - Bottom 88 bits: weight
 */
export function packLeaf(address: string, weight: bigint): bigint {
  const addr = BigInt(address);
  const packed = (addr << 88n) | weight;

  // Ensure packed value is within BN254 scalar field
  if (packed >= SNARK_SCALAR_FIELD) {
    throw new Error(`Packed leaf value exceeds SNARK scalar field: ${packed}`);
  }

  return packed;
}

/**
 * Unpack a leaf value into address and weight
 */
export function unpackLeaf(leaf: bigint): { address: string; weight: bigint } {
  const weight = leaf & ((1n << 88n) - 1n); // Bottom 88 bits
  const address = leaf >> 88n; // Top 160 bits

  return {
    address: '0x' + address.toString(16).padStart(40, '0'),
    weight,
  };
}

export interface CensusTree {
  tree: LeanIMT;
  root: bigint;
  size: number;
  leaves: Map<string, bigint>; // address -> packed leaf
}

/**
 * Poseidon hash function for Lean-IMT
 * Takes two BigInts and returns their Poseidon hash
 */
function poseidonHash(a: bigint, b: bigint): bigint {
  return poseidon2([a, b]);
}

/**
 * Build a Lean-IMT tree from accounts fetched from The Graph
 * @param accounts Array of accounts with addresses and weights
 * @returns CensusTree object with tree, root, and metadata
 */
export function buildCensusTree(accounts: Account[]): CensusTree {
  // Create empty tree with Poseidon hash function
  const tree = new LeanIMT(poseidonHash);

  const leaves = new Map<string, bigint>();

  // Sort accounts by address for deterministic ordering
  // This matches the on-chain behavior where accounts are inserted in order
  const sortedAccounts = [...accounts].sort((a, b) => {
    const addrA = BigInt(a.address.toLowerCase());
    const addrB = BigInt(b.address.toLowerCase());
    return addrA < addrB ? -1 : addrA > addrB ? 1 : 0;
  });

  // Pack and insert each account as a leaf
  for (const account of sortedAccounts) {
    const weight = BigInt(account.weight);

    // Skip accounts with zero weight
    if (weight === 0n) {
      continue;
    }

    const packedLeaf = packLeaf(account.address.toLowerCase(), weight);
    leaves.set(account.address.toLowerCase(), packedLeaf);
    tree.insert(packedLeaf);
  }

  return {
    tree,
    root: tree.root,
    size: tree.size,
    leaves,
  };
}

/**
 * Generate a Merkle proof for a specific account
 * @param censusTree The built census tree
 * @param address The address to generate proof for
 * @returns Merkle proof (array of sibling hashes) or null if address not in tree
 */
export function generateProof(
  censusTree: CensusTree,
  address: string
): bigint[] | null {
  const normalizedAddress = address.toLowerCase();
  const leaf = censusTree.leaves.get(normalizedAddress);

  if (!leaf) {
    return null;
  }

  const index = censusTree.tree.indexOf(leaf);
  if (index === -1) {
    return null;
  }

  // Generate proof using Lean-IMT
  const proof = censusTree.tree.generateProof(index);

  // Return siblings array (Merkle path)
  // Lean-IMT returns siblings as an array of bigints
  return proof.siblings as bigint[];
}

/**
 * Verify a Merkle proof for an account
 * @param root The Merkle root
 * @param address Account address
 * @param weight Account weight
 * @param proof Merkle proof (array of sibling hashes)
 * @returns true if proof is valid
 */
export function verifyProof(
  root: bigint,
  address: string,
  weight: bigint,
  proof: bigint[]
): boolean {
  try {
    const leaf = packLeaf(address.toLowerCase(), weight);

    // Reconstruct root from leaf and proof
    let computedHash = leaf;

    for (const sibling of proof) {
      // Lean-IMT uses sorted hashing: hash(min, max)
      if (computedHash < sibling) {
        computedHash = poseidonHash(computedHash, sibling);
      } else {
        computedHash = poseidonHash(sibling, computedHash);
      }
    }

    return computedHash === root;
  } catch {
    return false;
  }
}

/**
 * Get account info from tree
 */
export function getAccountFromTree(
  censusTree: CensusTree,
  address: string
): { address: string; weight: bigint; index: number } | null {
  const normalizedAddress = address.toLowerCase();
  const leaf = censusTree.leaves.get(normalizedAddress);

  if (!leaf) {
    return null;
  }

  const index = censusTree.tree.indexOf(leaf);
  const { weight } = unpackLeaf(leaf);

  return {
    address: normalizedAddress,
    weight,
    index,
  };
}
