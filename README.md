# DavinciDAO Census Contract

A gas-optimized smart contract system for managing decentralized voting power through NFT delegation using cryptographic Merkle trees.

## Overview

DavinciDAO Census Contract enables ERC-721 NFT holders to delegate their voting power to representatives. The contract uses Lean Incremental Merkle Trees (Lean-IMT) to maintain a verifiable census of voting weights on-chain, with automatic root updates and event emission for off-chain indexing.

### Key Features

- **On-chain Merkle tree** using Lean-IMT with automatic root calculation
- **Gas-optimized operations** with transient storage caching (EIP-1153)
- **Batch operations** for delegating multiple tokens in a single transaction
- **Proof-based security** preventing unauthorized weight manipulation
- **Root history** via circular buffer for historical verification
- **Event-driven architecture** for off-chain indexing via The Graph

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DavinciDAO Contract                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Delegation Mapping                Lean-IMT Census Tree         │
│  ┌──────────────────┐             ┌──────────────────┐         │
│  │ TokenID → Delegate│────────────▶│ Address │ Weight │         │
│  └──────────────────┘             └──────────────────┘         │
│                                           │                     │
│                                           ▼                     │
│                                    Merkle Root ────┐            │
│                                                    │            │
│  Root History (Circular Buffer)                   │            │
│  ┌──────────────────────────────────────┐         │            │
│  │ Root₁ → Block₁                        │◀────────┘            │
│  │ Root₂ → Block₂                        │                     │
│  │ ...                                   │                     │
│  └──────────────────────────────────────┘                     │
│                                                                 │
│  Events ─────▶ The Graph Subgraph ─────▶ Client Queries        │
└─────────────────────────────────────────────────────────────────┘
```

## Smart Contract Deployment

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) - Ethereum development toolkit
- An Ethereum RPC endpoint (Alchemy, Infura, or local node)
- Deployment wallet with ETH for gas fees

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd davincidao
   ```

2. **Install dependencies**
   ```bash
   forge install
   ```

3. **Configure environment variables**

   Create a `.env` file in the project root:
   ```bash
   PRIVATE_KEY=your_private_key_without_0x_prefix
   RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
   ETHERSCAN_API_KEY=your_etherscan_api_key  # Optional, for verification
   ```

4. **Configure your NFT collections**

   Edit `script/DeployDavinciDao.s.sol` to specify your NFT contracts:
   ```solidity
   // Example: Deploy with your NFT collections
   address[] memory nftContracts = new address[](2);
   nftContracts[0] = 0xYourNFTContract1;  // Your first ERC-721 collection
   nftContracts[1] = 0xYourNFTContract2;  // Your second ERC-721 collection
   ```

5. **Deploy the contract**
   ```bash
   source .env
   forge script script/DeployDavinciDao.s.sol \
       --rpc-url $RPC_URL \
       --private-key $PRIVATE_KEY \
       --broadcast \
       --verify
   ```

6. **Save the deployed contract address**

   The deployment script will output the contract address. Save this for configuring the webapp and subgraph.

### Build & Test

```bash
# Build contracts
forge build

# Run tests
forge test

# Run tests with gas reporting
forge test --gas-report

# Run specific test
forge test --match-test testDelegate
```

### Contract Verification

If you didn't use `--verify` during deployment, you can verify later:

```bash
forge verify-contract \
    --chain-id 1 \
    --compiler-version v0.8.24 \
    <DEPLOYED_CONTRACT_ADDRESS> \
    src/DavinciDao.sol:DavinciDao \
    --constructor-args $(cast abi-encode "constructor(address[])" "[0xNFT1,0xNFT2]")
```

## Contract Usage

### Delegating Voting Power

```solidity
// Delegate tokens to a representative
uint256[] memory tokenIds = [1, 2, 3];
uint88 currentWeight = 0;  // Obtain from subgraph or events
uint256[] memory proof = []; // Empty if first delegation

census.delegate(
    representativeAddress,
    collectionIndex,  // 0 for first collection, 1 for second, etc.
    tokenIds,
    currentWeight,
    proof
);
```

### Removing Delegation

```solidity
// Undelegate tokens (must be token owner)
uint256[] memory tokenIds = [1, 2];
ProofInput[] memory proofs = [...]; // Proofs for affected delegates

census.undelegate(collectionIndex, tokenIds, proofs);
```

### Querying Contract State

```solidity
// Get current census root
uint256 root = census.getCensusRoot();

// Verify a historical root
uint256 blockNumber = census.getRootBlockNumber(historicalRoot);

// Check token delegations
uint256[] memory tokenIds = [1, 2, 3];
address[] memory delegates = census.getTokenDelegations(collectionIndex, tokenIds);

// Get your delegated tokens that you still own
uint256[] memory candidates = [1, 2, 3, 4, 5];
uint256[] memory delegated = census.getNFTids(collectionIndex, candidates);
```

### Events

Monitor these events for off-chain indexing:

```solidity
event DelegatedBatch(address indexed owner, address indexed to, uint256 indexed nftIndex, uint256[] tokenIds);
event UndelegatedBatch(address indexed owner, address indexed from, uint256 indexed nftIndex, uint256[] tokenIds);
event WeightChanged(address indexed account, uint88 previousWeight, uint88 newWeight);
event CensusRootUpdated(uint256 indexed newRoot, uint256 blockNumber);
```

## Gas Costs

Approximate gas costs for common operations:

| Operation | Cold | Warm | Notes |
|-----------|------|------|-------|
| `delegate()` (1 token) | ~140k | ~120k | First delegation to an address |
| `delegate()` (5 tokens) | ~200k | ~160k | Batch delegation savings |
| `undelegate()` (1 token) | ~150k | ~130k | Includes tree update |
| `updateDelegation()` (1 token) | ~180k | ~150k | Moving delegation between addresses |
| `getCensusRoot()` | ~2.5k | ~100 | View function |
| `getTokenDelegations()` | ~3k per token | ~500 per token | View function |

*Costs vary based on tree size and number of unique delegates affected*

## Supporting Components

### The Graph Subgraph

The subgraph indexes all delegation events and maintains a queryable database of:
- Current delegations per account
- Historical weight changes
- Token delegation history
- Complete Merkle tree reconstruction data

See [`subgraph/README.md`](subgraph/README.md) for deployment instructions.

### Web Application

A React-based web interface for:
- Connecting wallets (MetaMask, WalletConnect)
- Viewing your NFT holdings
- Delegating voting power to representatives
- Managing delegations
- Visualizing the Merkle tree

See [`webapp/README.md`](webapp/README.md) for setup and deployment.

### Delegation CLI Tool

A Go-based command-line tool for:
- Batch delegation operations
- Tree reconstruction and verification
- Integration testing
- Automated delegation workflows

See [`delegation-tool/README.md`](delegation-tool/README.md) for usage.

## External Contract Integration

The DavinciDAO contract implements the `ICensusValidator` interface, allowing external contracts (such as voting systems, governance contracts, or token-gated applications) to validate census roots on-chain.

### ICensusValidator Interface

```solidity
interface ICensusValidator {
    /// @notice Validates a census root and returns the block number when it was set
    /// @param root The census Merkle root to validate
    /// @return blockNumber The block number when this root was set (0 if invalid/evicted)
    function getRootBlockNumber(uint256 root) external view returns (uint256 blockNumber);
}
```

### Usage in External Contracts

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ICensusValidator.sol";

contract VotingContract {
    ICensusValidator public census;

    constructor(address _censusContract) {
        census = ICensusValidator(_censusContract);
    }

    function createProposal(uint256 censusRoot) external {
        // Validate that the census root is valid and recent
        uint256 rootBlock = census.getRootBlockNumber(censusRoot);
        require(rootBlock > 0, "Invalid census root");
        require(block.number - rootBlock < 100, "Census root too old");

        // Create proposal with validated census...
    }
}
```

### Integration Benefits

1. **On-chain Verification**: External contracts can verify census roots without trusting off-chain data
2. **Historical Validation**: Check when a specific census state existed (useful for time-locked voting)
3. **Standard Interface**: Consistent API across different census implementations
4. **Gas Efficient**: Single view function call (~2.5k gas)

### Root History Limitations

- The contract maintains a circular buffer of the **last 100 roots**
- Roots older than 100 updates will return `blockNumber = 0` (evicted from history)
- At 15s block time, this provides ~1-2 days of history
- For longer history, use off-chain indexing via The Graph subgraph

### Example Implementation

See [`src/examples/VotingExample.sol`](src/examples/VotingExample.sol) for a complete reference implementation showing how to:
- Validate census roots before using them
- Create proposals with census snapshots
- Check root age to ensure recent data
- Integrate with the ICensusValidator interface

## API Reference

### Core Functions

**`delegate(address to, uint256 nftIndex, uint256[] calldata ids, uint88 currentWeightOfTo, uint256[] calldata toProof)`**
- Delegate voting power from owned NFTs to a representative
- Reverts if tokens are already delegated (use `updateDelegation` instead)
- Requires Merkle proof if recipient already has voting weight

**`undelegate(uint256 nftIndex, uint256[] calldata ids, ProofInput[] calldata proofs)`**
- Remove delegation from tokens (caller must be current owner)
- Requires proofs for all affected delegates
- Emits `UndelegatedBatch` and `WeightChanged` events

**`updateDelegation(address to, uint256 nftIndex, uint256[] calldata ids, uint88 currentWeightOfTo, ProofInput[] calldata fromProofs, uint256[] calldata toProof)`**
- Move delegation from current delegate(s) to a new delegate
- More gas efficient than undelegate + delegate
- Requires proofs for both old and new delegates

### View Functions

**`getCensusRoot() → uint256`**
- Returns current Merkle root of the census tree

**`getRootBlockNumber(uint256 root) → uint256`**
- Returns block number when a specific root was set (0 if never set or evicted from buffer)

**`computeLeafWithWeight(address account, uint88 weight) → uint256`**
- Pure helper function to compute packed leaf value for an account
- Useful for client-side proof generation

**`getTokenDelegations(uint256 nftIndex, uint256[] calldata ids) → address[]`**
- Batch query for delegation status of multiple tokens
- Returns array of delegate addresses (address(0) if not delegated)

**`getNFTids(uint256 nftIndex, uint256[] calldata candidateIds) → uint256[]`**
- Returns token IDs that are delegated AND currently owned by caller
- Gas-optimized single-pass filter

## Security Considerations

1. **Proof Requirements**: All weight modifications require valid Merkle proofs to prevent unauthorized manipulation
2. **Ownership Verification**: Transient storage caching (EIP-1153) provides gas-efficient, secure ownership checks
3. **Root History**: Circular buffer maintains last 100 roots for historical verification (~1-2 days at 15s blocks)
4. **Event Integrity**: All state changes emit events for off-chain verification and reconstruction

## Development

### Project Structure

```
davincidao/
├── src/
│   ├── DavinciDao.sol          # Main census contract
│   ├── ICensusValidator.sol    # Standard interface for external contracts
│   ├── examples/               # Example implementations
│   │   └── VotingExample.sol   # Reference voting contract
│   └── mocks/                  # Test mocks
├── script/
│   └── DeployDavinciDao.s.sol  # Deployment script
├── test/                       # Foundry tests
├── subgraph/                   # The Graph subgraph
├── webapp/                     # React web interface
├── delegation-tool/            # Go CLI tool
└── foundry.toml               # Foundry configuration
```

### Running Tests

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test file
forge test --match-path test/DavinciDaoMultiCollection.t.sol

# Generate coverage report
forge coverage
```

## License

MIT License - see LICENSE file for details

## Off-Chain Tree Reconstruction Algorithm

The DavinciDAO contract uses LeanIMT (Lean Incremental Merkle Tree) to maintain the census of voting weights. To verify transactions or generate proofs off-chain, you must reconstruct the tree in a way that **exactly matches** the contract's tree state.

### Why Simple Approaches Fail

**❌ WRONG: Querying current accounts and rebuilding**
```typescript
// This will NOT work!
const accounts = await subgraph.getAccounts() // accounts with weight > 0
const tree = new LeanIMT()
for (const acc of accounts) {
  tree.insert(packLeaf(acc.address, acc.weight))
}
// ❌ Root will not match! Missing historical operations
```

**Problem**: This approach ignores the tree's history. When an account's weight goes to 0, the contract **removes** that leaf from the tree using `LeanIMT._remove()`. This causes the tree to rebalance, changing the structure and indices of remaining leaves. Simply inserting current accounts creates a different tree structure.

**Example**:
```
Contract operations:
1. INSERT Alice weight=3  → tree = [Alice]         (index 0)
2. INSERT Bob weight=1    → tree = [Alice, Bob]    (indices 0, 1)
3. INSERT Charlie weight=2 → tree = [Alice, Bob, Charlie]    (indices 0, 1, 2)
4. REMOVE Bob (weight→0)   → tree = [Alice, EMPTY, Charlie]  (indices 0, 1, 2)
                             ↑ CRITICAL: Bob's slot stays but becomes 0!
5. INSERT Dave weight=1    → tree = [Alice, EMPTY, Charlie, Dave]  (indices 0, 1, 2, 3)

If you query current accounts and rebuild:
1. INSERT Alice weight=3   → tree = [Alice]         (index 0)
2. INSERT Charlie weight=2 → tree = [Alice, Charlie] (indices 0, 1)
3. INSERT Dave weight=1    → tree = [Alice, Charlie, Dave] (indices 0, 1, 2)
                             ↑ WRONG! Dave is at index 2, not 3

The trees have different structures and sizes:
- Contract tree: size=4, indices=[0, EMPTY, 2, 3]
- Rebuilt tree:  size=3, indices=[0, 1, 2]

This causes:
1. Different Merkle roots (tree structure mismatch)
2. Invalid proofs (indices don't match contract's tree)
3. ARRAY_RANGE_ERROR when submitting transactions
```

### ✅ CORRECT: Event Replay Algorithm

The **only** way to reconstruct the tree correctly is to **replay all `WeightChanged` events in chronological order**, performing the exact same operations the contract performed:

```typescript
// 1. Fetch ALL WeightChanged events in order
const events = await subgraph.getAllWeightChangeEvents() // Ordered by blockNumber, logIndex

// 2. Create empty tree
const tree = new LeanIMT((a, b) => poseidon2([a, b]))

// 3. Replay each event
for (const event of events) {
  const account = event.account.id
  const prevWeight = parseInt(event.previousWeight)
  const newWeight = parseInt(event.newWeight)
  
  // Pack leaf: (address << 88) | weight
  const addr = BigInt(account)
  const oldLeaf = (addr << 88n) | BigInt(prevWeight)
  const newLeaf = (addr << 88n) | BigInt(newWeight)
  
  if (prevWeight === 0 && newWeight > 0) {
    // INSERT: New account getting weight
    tree.insert(newLeaf)
    
  } else if (newWeight === 0 && prevWeight > 0) {
    // REMOVE: Account weight going to 0
    // IMPORTANT: tree.update(index, 0n) sets the leaf to 0 but KEEPS the slot
    // The tree size doesn't decrease - it maintains an empty slot at that index
    const index = tree.indexOf(oldLeaf)
    tree.update(index, 0n) // Sets to 0, but slot remains (tree size unchanged)
    
  } else if (prevWeight > 0 && newWeight > 0) {
    // UPDATE: Weight change (still > 0)
    const index = tree.indexOf(oldLeaf)
    tree.update(index, newLeaf)
  }
}

// 4. Tree root now matches contract
console.log('Tree root:', tree.root)
```

### Key Requirements

1. **Chronological Order**: Events MUST be processed in the exact order they were emitted
   - Order by: `blockNumber ASC, logIndex ASC`
   - The `logIndex` is critical for intra-block ordering

2. **Complete History**: You need ALL `WeightChanged` events, not just current state
   - The subgraph tracks these in the `WeightChangeEvent` entity
   - Includes insertions, updates, AND removals

3. **Exact Operations**: Match the contract's operations:
   - `0 → >0`: INSERT (new leaf)
   - `>0 → 0`: REMOVE (update to 0, tree rebalances)  
   - `>0 → >0`: UPDATE (modify existing leaf)

4. **Leaf Packing**: Must match contract's format
   ```solidity
   // Contract: (address << 88) | weight
   uint256 leaf = (uint256(uint160(account)) << 88) | uint256(weight);
   ```

### Subgraph Schema

The subgraph provides two ways to reconstruct:

```graphql
# Option 1: Query all weight change events (RECOMMENDED)
query GetWeightChangeEvents {
  weightChangeEvents(
    first: 1000
    orderBy: blockNumber
    orderDirection: asc
  ) {
    account { id address }
    previousWeight
    newWeight
    blockNumber
    logIndex
  }
}

# Option 2: Query current accounts (ONLY for display, NOT for tree building)
query GetCurrentAccounts {
  accounts(where: { weight_gt: "0" }) {
    id
    address
    weight
  }
}
```

### Critical Implementation Details

**Proof Generation**: When generating Merkle proofs, you MUST use the actual replayed tree object, not rebuild from the list of active accounts. The tree object contains the correct structure with empty slots.

```typescript
// ❌ WRONG: Rebuilding tree from nodes for proof generation
const tree = new LeanIMT()
for (const node of activeNodes) {
  tree.insert(node.leaf)  // This loses empty slots!
}
const proof = tree.generateProof(index)  // Invalid proof!

// ✅ CORRECT: Use the tree from event replay
const tree = await replayEventsToRebuildTree()  // Includes empty slots
const proof = tree.generateProof(index)  // Valid proof!
```

**Why**: The tree may have empty slots from removed accounts. When you rebuild from only active accounts, you lose these gaps, creating a different tree structure with wrong indices.

### Implementation Reference

See `webapp/src/hooks/useDelegation.ts` for the complete implementation:
- `validateCensusRootBeforeTransaction()` - Validates tree reconstruction with event replay
- `fetchCensusDataFromSubgraph()` - Returns the replayed tree object for proof generation
- `generateProofs()` in `webapp/src/lib/merkle.ts` - Takes the actual tree as parameter

### Why This Matters

**Security**: Before executing any transaction that requires Merkle proofs (like updating delegations), the webapp MUST verify that its reconstructed tree matches the contract's root. If the roots don't match, the transaction would fail because the proofs would be invalid.

**Correctness**: The entire delegation system relies on accurate Merkle proofs. Using the wrong tree reconstruction method would make it impossible to generate valid proofs, breaking all delegation operations.

### Debugging Mismatches

If you encounter root mismatches:

1. **Check event order**: Ensure events are sorted by `blockNumber`, then `logIndex`
2. **Verify completeness**: Confirm you're fetching ALL events, not just recent ones
3. **Log operations**: Print each INSERT/UPDATE/REMOVE to trace tree changes
4. **Compare sizes**: Contract tree size should match reconstructed tree size
5. **Check leaf packing**: Verify `(address << 88) | weight` format is correct

The webapp includes detailed console logging when `validateCensusRootBeforeTransaction()` runs - check browser console for debugging information.
