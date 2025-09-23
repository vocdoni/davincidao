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

### Deployment

Deploy the contract with your NFT collections:

```solidity
address[] memory tokens = [nftContract1, nftContract2];
TokenStandard[] memory standards = [TokenStandard.ERC721, TokenStandard.ERC1155];
DavinciDaoCensus census = new DavinciDaoCensus(tokens, standards);
```

### Basic Operations

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

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### Installation

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

### Testing

```bash
cd ../davincidao
forge test
```

### Build and Deploy

```bash
# Build the contracts
forge build

# Deploy (example)
forge script script/Deploy.s.sol --rpc-url <your_rpc_url> --private-key <your_private_key>
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


## Integration Examples

### Frontend Integration

```javascript
// Check if user has delegated tokens
const delegatedTokens = await contract.getNFTids(collectionIndex, userTokens);

// Get current voting power
const [weight, leaf] = await contract.getDelegations(userAddress);

// Enumerate all participants
const participants = [];
for (let i = 0; i < treeSize; i++) {
    const addr = await contract.getAccountAt(i);
    if (addr !== '0x0000000000000000000000000000000000000000') {
        participants.push(addr);
    }
}
```

