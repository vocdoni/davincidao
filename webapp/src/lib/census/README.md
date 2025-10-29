# Census Tree Reconstruction

This module provides tree reconstruction capabilities from The Graph subgraph data.

## Usage

```typescript
import { createCensusReconstructor } from './census';

// Create reconstructor with subgraph endpoint
const reconstructor = createCensusReconstructor(
  'https://api.studio.thegraph.com/query/1704875/davincidao-test-2/v0.2.0'
);

// Get global statistics
const stats = await reconstructor.getGlobalStats();
console.log(`Total accounts: ${stats?.totalAccounts}`);
console.log(`Total weight: ${stats?.totalWeight}`);

// Build complete census tree
const tree = await reconstructor.buildTree();
console.log(`Tree root: 0x${tree.root.toString(16)}`);
console.log(`Tree size: ${tree.size} leaves`);

// Get account weight
const weight = await reconstructor.getAccountWeight('0x...');
console.log(`Weight: ${weight}`);

// Generate Merkle proof for an account
const proof = await reconstructor.getProof('0x...');
if (proof) {
  console.log(`Address: ${proof.address}`);
  console.log(`Weight: ${proof.weight}`);
  console.log(`Proof siblings: ${proof.proof.length}`);
  console.log(`Root: 0x${proof.root.toString(16)}`);
}
```

## Features

- **Fetch data from subgraph**: Query all delegations and account weights
- **Build Merkle tree**: Reconstruct the exact tree using Lean-IMT + Poseidon hash
- **Generate proofs**: Get Merkle proofs for any account to verify voting power
- **Export tree**: Access all leaves with addresses and weights
- **Verify root**: Computed root matches on-chain census root

## Tree Structure

The tree uses:
- **Lean-IMT**: Incremental Merkle Tree implementation
- **Poseidon hash**: ZK-friendly hash function
- **Packed leaves**: `(address << 88) | weight` format (160 bits address + 88 bits weight)
