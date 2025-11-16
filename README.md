# We Are Not Spectators Manifesto Census

On-chain registry of addresses that have pledged to The We Are Not Spectators Manifesto with cryptographic proof via Merkle trees.

## Quick Start

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) - Solidity development
- [Node.js & npm](https://nodejs.org/) - For subgraph and webapp
- [The Graph CLI](https://thegraph.com/docs/en/quick-start/) - For subgraph deployment (optional)

### 1. Clone and Install

```bash
git clone https://github.com/vocdoni/davincidao
cd davincidao
```

### 2. Deploy Smart Contract

```bash
# Build contract
forge build

# Run tests
forge test

# Deploy to testnet (Sepolia)
forge script deployments/manifesto/deploy.sol --rpc-url $RPC_URL --broadcast --verify

# Note the deployed contract address
```

### 3. Deploy Subgraph

```bash
cd subgraph

# Install dependencies
npm install

# Update subgraph.yaml with contract address and startBlock
# Then generate code and build
npx graph codegen
npx graph build

# Deploy to The Graph Studio
npx graph auth --studio $DEPLOY_KEY
npx graph deploy --studio we-are-not-spectators-manifesto
```

### 4. Run Web App

```bash
cd webapp

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
VITE_CONTRACT_ADDRESS=0x...  # Your deployed contract
VITE_CHAIN_ID=11155111        # Sepolia testnet
VITE_SUBGRAPH_ENDPOINT=https://api.studio.thegraph.com/query/.../we-are-not-spectators-manifesto/v1.0.0
VITE_WALLET_CONNECT_PROJECT_ID=...  # Optional: WalletConnect
EOF

# Run dev server
npm run dev
```

Visit http://localhost:5173

## Smart Contract API

### Core Functions

**`pledge()`**
- Sign the manifesto (can only be done once per address)
- Adds your address to the census Merkle tree
- Emits `Pledged(address signer, uint256 timestamp)` event

**`hasPledged(address who) → bool`**
- Check if an address has signed

**`getCensusRoot() → uint256`**
- Get current Merkle root of all signers

**`getRootBlockNumber(uint256 root) → uint256`**
- Validate a census root and get its block number
- Returns 0 if root is invalid or evicted from history
- Implements ICensusValidator interface

### View Functions

- `TITLE() → string` - Title of the manifesto
- `AUTHORS() → string` - "Yoav Weiss, Vitalik Buterin, Marissa Posner"
- `DATE() → string` - "2025-11-12"
- `MANIFESTO() → string` - Full manifesto text (9000 chars)
- `pledgeTimestamp(address) → uint256` - When an address pledged
- `pledgeCount() → uint256` - Total number of signers
- `pledgedBefore(address, uint256 cutoff) → bool` - Check if pledged before timestamp
- `computeLeaf(address) → uint256` - Compute Merkle leaf value for an address

## Leaf Format

Each signer is represented as a packed leaf in the Merkle tree:

```solidity
uint256 leaf = (uint256(uint160(address)) << 88) | 1
```

- Top 160 bits: Ethereum address
- Bottom 88 bits: Weight (always 1 for all signers)

This format maintains compatibility with the original delegation system while simplifying the logic.

## Root History

The contract maintains a **circular buffer of the last 100 roots**:

- At 15s block time, this provides ~1-2 days of history
- Roots older than 100 updates are evicted
- External contracts can validate recent roots via `ICensusValidator`
- For longer history, use The Graph subgraph

## External Contract Integration

Other contracts can validate census roots:

```solidity
import "./ICensusValidator.sol";

contract VotingContract {
    ICensusValidator public census;

    constructor(address _census) {
        census = ICensusValidator(_census);
    }

    function createProposal(uint256 censusRoot) external {
        uint256 rootBlock = census.getRootBlockNumber(censusRoot);
        require(rootBlock > 0, "Invalid census root");
        require(block.number - rootBlock < 100, "Census too old");

        // Proposal creation logic...
    }
}
```

See `src/examples/VotingExample.sol` for a complete reference implementation.

## Subgraph Queries

### Get total signers

```graphql
query {
  globalStats(id: "global") {
    totalPledges
    currentRoot
    lastPledgeAt
  }
}
```

### Get signer by address

```graphql
query GetSigner($address: ID!) {
  signer(id: $address) {
    address
    pledgeTimestamp
    pledgeBlock
    treeIndex
  }
}
```

### Get recent signers

```graphql
query {
  pledgeEvents(first: 20, orderBy: blockNumber, orderDirection: desc) {
    signer {
      address
      pledgeTimestamp
    }
    timestamp
    transactionHash
  }
}
```

### Get all signers (with pagination)

```graphql
query GetAllSigners($first: Int!, $skip: Int!) {
  signers(first: $first, skip: $skip, orderBy: pledgeTimestamp, orderDirection: desc) {
    address
    pledgeTimestamp
    pledgeBlock
    treeIndex
  }
}
```

## Security Considerations

1. **Append-only**: Tree only grows, no deletions or updates
2. **One pledge per address**: Cannot sign multiple times
3. **No admin functions**: Contract is fully permissionless after deployment
4. **Immutable manifesto**: Text cannot be changed after deployment
5. **BN254 field checks**: All leaves validated to be within bn254 scalar field
