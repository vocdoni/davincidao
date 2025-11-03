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
│                     Onchain Census Contract                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Delegation Mapping                Lean-IMT Census Tree         │
│  ┌──────────────────┐             ┌──────────────────┐          │
│  │TokenID → Delegate│───────────▶│ Address │ Weight │          │
│  └──────────────────┘             └──────────────────┘          │
│                                           │                     │
│                                           ▼                     │
│                                    Merkle Root ────┐            │
│                                                    │            │
│  Root History (Circular Buffer)                    │            │
│  ┌──────────────────────────────────────┐          │            │
│  │ Root₁ → Block₁                       │◀────────┘            │
│  │ Root₂ → Block₂                       │                       │
│  │ ...                                  │                       │
│  └──────────────────────────────────────┘                       │
│                                                                 │
│  Events ─────▶ The Graph Subgraph ─────▶ Client Queries       │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

The easiest way to deploy and configure everything is using the automated deployment pipeline:

```bash
# View available commands and deployments
make help

# Deploy a configuration
make deploy <deployment-name>
```

Example:
```bash
make deploy haberdashery    # Deploy haberdashery configuration
make deploy test-sepolia    # Deploy test configuration on Sepolia
```

### What This Does

The `make deploy` command automatically:
1. Compiles and deploys the smart contract using Forge
2. Updates subgraph configuration with the new contract address
3. Deploys the subgraph to The Graph (if credentials provided)
4. Configures `webapp/.env` with deployment details

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) - Ethereum development toolkit
- [Node.js & pnpm](https://pnpm.io/) - For webapp and subgraph
- [The Graph CLI](https://thegraph.com/docs/en/quick-start/) - For subgraph deployment (optional)
- An Ethereum RPC endpoint (Alchemy, Infura, or local node)
- Deployment wallet with ETH for gas fees

### Setup

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd davincidao
   make install
   ```

2. **Configure environment** (optional)

   Create a `.env` file in the project root with your credentials:
   ```bash
   PRIVATE_KEY=0x...                           # Deployer private key
   RPC_URL=https://ethereum-rpc-endpoint       # RPC endpoint
   ETHERSCAN_API_KEY=...                       # For contract verification
   GRAPH_DEPLOY_KEY=...                        # The Graph deploy key
   GRAPH_SLUG=davinci-sepolia-test             # Subgraph slug
   ```

   If not provided, the deployment script will prompt you interactively.

3. **Create a deployment configuration**

   Deployments are defined in `deployments/<name>/deploy.sol`.

   Example `deploy.sol`:
   
   ```solidity
   // SPDX-License-Identifier: MIT
   pragma solidity ^0.8.24;

   import {Script, console2} from "forge-std/Script.sol";
   import "../../src/DavinciDao.sol";

   contract DeployDavinciDao is Script {
       function run() external {
           address[] memory collections = new address[](1);
           collections[0] = address(0x7c61Ae9629664D1CEEc8Abc0fD17CB0866d86d89);

           uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
           vm.startBroadcast(deployerPrivateKey);

           DavinciDao census = new DavinciDao(collections);
           console2.log("  Contract deployed at: %s", address(census));

           vm.stopBroadcast();
       }
   }
   ```

5. **Deploy**
   ```bash
   make deploy your-deployment
   ```

   The deployment will:
   - Prompt for any missing configuration
   - Deploy the contract
   - Update subgraph.yaml with the contract address and start block
   - Deploy subgraph (if Graph credentials provided)
   - Update webapp/.env with all configuration

6. **Verify contract**
   ```bash
   make verify-contract CONTRACT=0x... CHAIN_ID=11155111
   ```

### Development Workflow

```bash
make test          # Run Solidity tests
make run           # Start webapp dev server
make build         # Build smart contracts
make clean         # Clean build artifacts
```

### Example: Test Deployment on Sepolia

```bash
# Using environment variables from .env
make deploy test-sepolia

# Or provide interactively when prompted:
# - Private key: 0x551c8ae18ba84d8279d2e8090c379520af28d9a3f62b94ae80e9c78cc8cb5520
# - RPC URL: https://ethereum-rpc-endpoint
# - Graph slug: test
```

After deployment, start the webapp:
```bash
make run
```
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

See [`go-tool/README.md`](go-tool/README.md) for usage.

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
