# Self Manifesto Census

Trustless registry of manifesto signers gated by Self zk verification. Each deployment can carry its own manifesto copy, requirements, and Self scope.

## Live deployments

| Manifesto | Network | Contract | Start Block | Self Scope | Verification Config | Subgraph |
| --- | --- | --- | --- | --- | --- | --- |
| Civic Alliance for Streets Without Dog Shit | Celo mainnet | `0x80603971AE1097fB9A5c0aEd6f3fcCE5d42EF578` | `51489323` | `manifesto-clean-streets` | `0xc8de7aa840ecfaccfedf1f7f3517006c1b90e192ab00cc8733b56fdbadbefbde` | `https://api.studio.thegraph.com/query/1704875/self-manifesto/v0.0.3` |
| Collective Freedom (legacy) | Celo mainnet | `0x28640CE15B4C2B7BF847F81c01F952ef538578E8` | `51471863` | `manifesto-v1` | `0xc8de7aa840ecfaccfedf1f7f3517006c1b90e192ab00cc8733b56fdbadbefbde` | `https://api.studio.thegraph.com/query/1704875/self-manifesto/v0` |

`deployments/manifesto/deploy.sol` reads metadata from files in `manifests/`. Define new campaigns by providing:

- Manifesto text file (`MANIFESTO_FILE`)
- Title, authors, and publication date env vars
- Unique `SELF_SCOPE_SEED` so Self nullifiers stay isolated

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

# Deploy to Celo mainnet with custom metadata
source .env
MANIFESTO_FILE=manifests/civic-alliance.md \
MANIFESTO_TITLE="Manifesto of the Civic Alliance for Streets Without Dog Shit" \
MANIFESTO_AUTHORS="Civic Alliance" \
MANIFESTO_DATE="2025-02-05" \
SELF_SCOPE_SEED="manifesto-clean-streets" \
forge script deployments/manifesto/deploy.sol --rpc-url $RPC_URL --broadcast --verify

# Note the deployed contract address + start block printed by the script
```

### 3. Deploy Subgraph

```bash
cd subgraph

# Install dependencies
pnpm install

# Generate types and build
pnpm run codegen
pnpm run build

# Deploy to The Graph Studio (requires deploy key)
GRAPH_ACCESS_TOKEN=<deploy-key> \
graph deploy self-manifesto \
  --node https://api.studio.thegraph.com/deploy/ \
  --ipfs https://api.thegraph.com/ipfs/ \
  --version-label v0.0.3 \
  --skip-migrations
```

### 4. Run Web App

```bash
cd webapp

# Install dependencies
pnpm install

# Update webapp/.env with your deployment coordinates, e.g.
cat > webapp/.env <<'EOF'
VITE_CONTRACT_ADDRESS=0x80603971AE1097fB9A5c0aEd6f3fcCE5d42EF578
VITE_RPC_URL=https://forno.celo.org
VITE_CHAIN_ID=42220
VITE_SUBGRAPH_ENDPOINT=https://api.studio.thegraph.com/query/1704875/self-manifesto/v0.0.3
VITE_BLOCK_EXPLORER_URL=https://celoscan.io
VITE_SELF_ENDPOINT_TYPE=celo
VITE_SELF_APP_NAME=Self Manifesto
VITE_SELF_USER_DATA=manifesto:clean-streets
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

- `TITLE() → string` - Title of the manifesto (set at deployment)
- `AUTHORS() → string` - Author credits
- `DATE() → string` - Publication date
- `MANIFESTO() → string` - Full manifesto text stored on-chain
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

This format maintains compatibility with the DAVINCI delegation system.

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
