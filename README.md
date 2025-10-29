# DavinciDAO Census Contract

A smart contract system for managing decentralized voting power through NFT delegation using cryptographic Merkle trees.

## Overview

The DavinciDAO Census Contract enables NFT holders to delegate their voting power to representatives. The contract uses Lean Incremental Merkle Trees (Lean-IMT) to create a verifiable census of voting weights, supporting both ERC-721 and ERC-1155 token standards.

## Architecture

### Core Components

1. **Census Tree**: Lean-IMT storing `(address || weight)` leaves
2. **Delegation Mapping**: Tracks which tokens are delegated to whom
3. **Reverse Index**: Maps tree positions to addresses
4. **Weight Tracking**: Maintains voting power for each address

### Data Structures

```solidity
struct Collection {
    address token;         // ERC-721 or ERC-1155 contract
    TokenStandard standard; // Which interface to use
}

struct ProofInput {
    address account;       // Account being updated
    uint256[] siblings;    // Merkle proof siblings
}
```

## Usage Guide

#### 1. Delegate Voting Power

```solidity
// Delegate tokens to a representative
uint256[] memory tokenIds = [1, 2, 3];
uint256[] memory proof = []; // Empty for first delegation
census.delegate(representative, collectionIndex, tokenIds, proof);
```

#### 2. Update Delegation

```solidity
// Move delegation from one address to another
uint256[] memory tokenIds = [1];
ProofInput[] memory fromProofs = [...]; // Proofs for old delegates
uint256[] memory toProof = [...];       // Proof for new delegate
census.updateDelegation(newDelegate, collectionIndex, tokenIds, fromProofs, toProof);
```

#### 3. Remove Delegation

```solidity
// Undelegate tokens
uint256[] memory tokenIds = [1, 2];
ProofInput[] memory proofs = [...]; // Proofs for affected delegates
census.undelegate(collectionIndex, tokenIds, proofs);
```

### Query Functions

#### Check Voting Power

```solidity
// Get current weight and leaf value for an address
(uint88 weight, uint256 leaf) = census.getDelegations(account);
```

#### Enumerate Participants

```solidity
// Get address at specific tree position
address participant = census.getAccountAt(index);

// Iterate through all positions
for (uint256 i = 0; i < treeSize; i++) {
    address addr = census.getAccountAt(i);
    if (addr != address(0)) {
        // This position has an active participant
    }
}
```

#### Query Token Delegations

```solidity
// Check which addresses tokens are delegated to
uint256[] memory tokenIds = [1, 2, 3];
address[] memory delegates = census.getTokenDelegations(collectionIndex, tokenIds);
```

#### Get Owned Delegated Tokens

```solidity
// Get tokens you've delegated and still own
uint256[] memory candidates = [1, 2, 3, 4, 5];
uint256[] memory delegated = census.getNFTids(collectionIndex, candidates);
```

#### Event Monitoring

Monitor key events for real-time updates:

```solidity
event Delegated(address indexed owner, address indexed to, uint256 indexed nftIndex, uint256 tokenId);
event Undelegated(address indexed owner, address indexed from, uint256 indexed nftIndex, uint256 tokenId);
event WeightChanged(address indexed account, uint88 previousWeight, uint88 newWeight);
event CensusRootUpdated(uint256 newRoot);
```

## Development Setup

### Quick Start with Makefile

This project includes a comprehensive Makefile for easy development and deployment:

```bash
# Show all available commands
make help

# Check if all required tools are installed
make check-tools

# Install all dependencies (contract, subgraph, webapp)
make install

# Build contracts
make build

# Run tests
make test

# Deploy everything (test, deploy contract, configure webapp, prepare subgraph)
make deploy-all
```

For detailed information about available scripts and deployment options, see [scripts/README.md](scripts/README.md).

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Node.js](https://nodejs.org/) (v16 or higher)
- [pnpm](https://pnpm.io/)
- [Graph CLI](https://thegraph.com/docs/en/developing/creating-a-subgraph/) (for subgraph deployment)

### Manual Installation

```bash
# Clone the repository
git clone <repository-url>
cd davincidao

# Install Foundry dependencies
forge install

# Set up test data generator
cd ../test-helper
npm install
```

### Build & Testing

```bash
# Using Makefile (recommended)
make build
make test

# Or using Foundry directly
forge build
forge test
```

## Smart Contract Deployment

### Using Makefile (Recommended)

The easiest way to deploy is using the provided Makefile and scripts:

```bash
# Complete deployment pipeline (tests, deploys, configures everything)
make deploy-all

# Or deploy just the contract
make deploy-contract

# Update webapp configuration with deployed contract
make update-webapp-env

# Prepare subgraph for deployment
make deploy-subgraph
```

See [scripts/README.md](scripts/README.md) for detailed information about deployment scripts.

### Manual Deployment

#### 1. Configure Your NFT Collections

Edit the deployment script at `script/DeployDavinciDao.s.sol` to include your specific NFT contract addresses:

```solidity
// Replace these example addresses with your actual NFT contracts
address[] memory nftContracts = new address[](3);
DavinciDaoCensus.TokenStandard[] memory standards = new DavinciDaoCensus.TokenStandard[](3);

// Example: Popular NFT collections
nftContracts[0] = 0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D; // Bored Ape Yacht Club (ERC-721)
standards[0] = DavinciDaoCensus.TokenStandard.ERC721;

nftContracts[1] = 0x60E4d786628Fea6478F785A6d7e704777c86a7c6; // Mutant Ape Yacht Club (ERC-721)
standards[1] = DavinciDaoCensus.TokenStandard.ERC721;
```

**Note**: The deployment script includes the necessary imports:
```solidity
import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {DavinciDaoCensus} from "../src/Davincidao.sol";
```

#### 2. Set Environment Variables

Create a `.env` file in the project root:

```bash
# .env file
PRIVATE_KEY=0x1234567890abcdef... # Your deployer private key (without 0x prefix)
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key # Your RPC endpoint
ETHERSCAN_API_KEY=your-etherscan-api-key # For contract verification (optional)
```

#### 3. Deploy the Contract

```bash
# Load environment variables
source .env

# Deploy to mainnet
forge script script/DeployDavinciDao.s.sol \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify
```

#### 4. Alternative: Deploy with Specific Collections

You can also deploy directly with custom parameters using `forge create`:

```bash
# Deploy with specific NFT addresses
forge create src/Davincidao.sol:DavinciDaoCensus \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --constructor-args \
    "[0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D,0x60E4d786628Fea6478F785A6d7e704777c86a7c6]" \
    "[0,0]" \
    --verify
```

### Post-Deployment Verification

After deployment, verify your contract is working correctly:

```bash
# Check the deployed contract
cast call <DEPLOYED_CONTRACT_ADDRESS> "getCensusRoot()" --rpc-url $RPC_URL

# Check configured collections
cast call <DEPLOYED_CONTRACT_ADDRESS> "collections(uint256)" 0 --rpc-url $RPC_URL
```

## API Reference

### Core Functions

| Function | Description | Gas Cost |
|----------|-------------|----------|
| `delegate()` | Delegate tokens to an address | ~200k-600k |
| `undelegate()` | Remove delegation from tokens | ~300k-700k |
| `updateDelegation()` | Move delegation between addresses | ~400k-800k |
| `getAccountAt()` | Get address at tree index | ~2k |
| `getDelegations()` | Get weight and leaf for address | ~3k |
| `getCensusRoot()` | Get current Merkle root | ~2k |

### View Functions

- `getTokenDelegations(nftIndex, ids)` - Check delegation status of tokens
- `getNFTids(nftIndex, candidates)` - Get delegated tokens you still own
- `computeLeaf(account)` - Calculate leaf value for address
- `collections(index)` - Access collection configuration
- `weightOf(account)` - Get voting weight of address
- `tokenDelegate(key)` - Check delegation of specific token

