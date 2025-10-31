# DavinciDAO Census Subgraph

A Graph Protocol subgraph for indexing DavinciDAO delegation events and maintaining queryable delegation state.

## Overview

This subgraph indexes all delegation-related events from the DavinciDAO Census contract, providing:
- Real-time delegation state
- Historical weight changes
- Token delegation tracking
- Account voting power queries
- Complete event history

## Quick Start

### Prerequisites

- [Graph CLI](https://thegraph.com/docs/en/developing/creating-a-subgraph/)
- Node.js 16+
- Deployed DavinciDAO contract

### Installation

```bash
cd subgraph
npm install
```

### Configuration

1. **Update `subgraph.yaml`** with your contract details:

```yaml
dataSources:
  - kind: ethereum/contract
    name: DavinciDao
    network: mainnet  # or sepolia, polygon, etc.
    source:
      address: "0xYourContractAddress"
      abi: DavinciDao
      startBlock: 12345678  # Block where contract was deployed
```

2. **Prepare the subgraph**:

```bash
graph codegen
graph build
```

### Deployment

#### Deploy to The Graph Studio

```bash
# Authenticate
graph auth --studio <DEPLOY_KEY>

# Deploy
graph deploy --studio davincidao-census
```

#### Deploy to Self-Hosted Graph Node

```bash
# Create subgraph
graph create davincidao-census --node http://localhost:8020

# Deploy
graph deploy davincidao-census \
  --ipfs http://localhost:5001 \
  --node http://localhost:8020
```

## Schema

### Entities

**Account**
- `id`: Address
- `weight`: Current voting weight
- `delegatedTokens`: Array of delegated token IDs
- `receivedDelegations`: Delegations received
- `sentDelegations`: Delegations made

**Delegation**
- `id`: Unique delegation ID
- `owner`: Token owner
- `delegate`: Current delegate
- `collectionIndex`: NFT collection index
- `tokenId`: Token ID
- `active`: Boolean status

**WeightChange**
- `id`: Event ID
- `account`: Affected account
- `previousWeight`: Weight before change
- `newWeight`: Weight after change
- `timestamp`: Block timestamp
- `blockNumber`: Block number

**CensusRootUpdate**
- `id`: Event ID
- `root`: New census root
- `blockNumber`: Block number when set
- `timestamp`: Timestamp

## Queries

### Get Account Weight

```graphql
{
  account(id: "0x...") {
    weight
    delegatedTokens {
      tokenId
      collectionIndex
      delegate {
        id
      }
    }
  }
}
```

### Get Active Delegations

```graphql
{
  delegations(where: { active: true, owner: "0x..." }) {
    tokenId
    collectionIndex
    delegate {
      id
      weight
    }
  }
}
```

### Get Weight History

```graphql
{
  weightChanges(
    where: { account: "0x..." }
    orderBy: timestamp
    orderDirection: desc
  ) {
    previousWeight
    newWeight
    timestamp
    blockNumber
  }
}
```

### Get Census Roots

```graphql
{
  censusRootUpdates(orderBy: blockNumber, orderDirection: desc, first: 10) {
    root
    blockNumber
    timestamp
  }
}
```

## Development

```bash
# Generate types
graph codegen

# Build subgraph
graph build

# Run tests (if configured)
graph test
```

## Troubleshooting

### Deployment Fails
- Verify contract address and network match
- Check `startBlock` is correct
- Ensure Graph CLI is authenticated

### Missing Data
- Wait for indexing to complete
- Verify contract events are being emitted
- Check subgraph logs for errors

### Query Timeouts
- Reduce query complexity
- Add pagination (first/skip parameters)
- Use specific filters

## License

MIT License
