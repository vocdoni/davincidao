# DavinciDAO Webapp V2 Migration Guide

## Overview

The webapp has been updated to support DavinciDAO Census V2, which achieves **94% gas savings** by moving expensive Merkle tree operations off-chain.

## Key Changes

### Gas Optimization
- **V1**: ~1.5M gas per delegation at 200 participants
- **V2**: ~92k gas per delegation (any scale)
- **Savings**: 94% reduction in gas costs

### Architecture Changes
- **No Merkle Proofs Required**: V2 delegations don't need proofs - just call `delegate(address, nftIndex, tokenIds[])`
- **The Graph Integration**: Account weights and delegation data are now queried from The Graph subgraph
- **Minimal On-Chain State**: Only security-critical `tokenDelegate` mapping stored on-chain
- **Event-Driven**: All state reconstructable from blockchain events

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# V2 Contract Address (Sepolia example)
VITE_CONTRACT_ADDRESS=0x4c34C940F1bD4339DfBAf2a91B91B3C4305C2925

# The Graph Subgraph Endpoint (REQUIRED for V2)
VITE_SUBGRAPH_ENDPOINT=https://api.studio.thegraph.com/query/1704875/davincidao-test-1/v0.1.0

# RPC and Alchemy (unchanged)
VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
VITE_ALCHEMY_API_KEY=YOUR_ALCHEMY_KEY
VITE_CHAIN_ID=11155111
```

## What's Different for Users

### Simpler Transactions
- **V1**: Required complex Merkle proofs to delegate
- **V2**: Simple delegation - no proofs needed!

### Faster UI
- **Weight Queries**: Fetched from The Graph (fast indexed data)
- **Delegation Status**: Tracked in subgraph with real-time updates
- **No More Tree Waiting**: Tree updates happen off-chain

## Code Changes

### Contract Class (`lib/contract.ts`)
- Removed all V1-specific code
- Simplified delegation methods (no proof parameters)
- Added subgraph client integration for weight queries
- Updated ABI to V2 contract

### New Files
- `lib/subgraph-client.ts` - The Graph integration for querying account data
- `constants.ts` - Updated with V2 ABI and configuration

### Delegation Flow
```typescript
// OLD (V1): Required proofs
await contract.delegate(
  delegateAddress,
  collectionIndex,
  tokenIds,
  toProof,        // Merkle proof required!
  fromProofs      // More proofs!
)

// NEW (V2): No proofs!
await contract.delegate(
  delegateAddress,
  collectionIndex,
  tokenIds
)
```

## Development

### Running Locally

1. Copy `.env.example` to `.env`
2. Update with your V2 contract address and subgraph endpoint
3. Install dependencies: `npm install`
4. Run dev server: `npm run dev`

### Testing with V2 Contract

Use the deployed Sepolia V2 contract:
- **Address**: `0x4c34C940F1bD4339DfBAf2a91B91B3C4305C2925`
- **Subgraph**: `https://api.studio.thegraph.com/query/1704875/davincidao-test-1/v0.1.0`
- **Explorer**: https://sepolia.etherscan.io/address/0x4c34c940f1bd4339dfbaf2a91b91b3c4305c2925

## API Reference

### Subgraph Queries

The webapp uses The Graph to query delegation data:

```typescript
import { getSubgraphClient } from '~/lib/subgraph-client'

const subgraph = getSubgraphClient()

// Get account weight
const weight = await subgraph.getAccountWeight(address)

// Get all delegations for an address
const delegations = await subgraph.getDelegationsForAddress(address)

// Get global statistics
const stats = await subgraph.getGlobalStats()
```

### Contract Methods

Simplified V2 contract methods:

```typescript
import { DavinciDaoContract } from '~/lib/contract'

// Initialize contract
const contract = new DavinciDaoContract(provider, contractAddress)

// Delegate (no proofs!)
await contract.delegate(to, collectionIndex, tokenIds)

// Undelegate (no proofs!)
await contract.undelegate(collectionIndex, tokenIds)

// Update delegation (no proofs!)
await contract.updateDelegation(newDelegate, collectionIndex, tokenIds)

// Get weight (from subgraph)
const weight = await contract.getWeightOf(address)
```

## Troubleshooting

### Subgraph Not Responding
- Check `VITE_SUBGRAPH_ENDPOINT` is correctly set
- Verify subgraph is deployed and indexing
- Check subgraph health at The Graph Studio

### Weights Showing as Zero
- Wait 1-2 minutes for subgraph to index new delegations
- Check delegations were successful on Etherscan
- Verify events were emitted from contract

### Transaction Failures
- Ensure you own the NFTs you're trying to delegate
- Check you have enough ETH for gas
- Verify contract address is correct

## Deployment

See `DEPLOYMENT_V2.md` in the root directory for:
- Contract deployment instructions
- Subgraph deployment guide
- Complete V2 architecture documentation

## Benefits Summary

✅ **94% gas savings** - Dramatically lower transaction costs
✅ **Simpler UX** - No complex proof generation
✅ **Better scalability** - Performance doesn't degrade with more users
✅ **Faster queries** - The Graph provides instant indexed data
✅ **Same security** - Critical delegation mapping still on-chain

## Migration Checklist

- [ ] Deploy V2 contract
- [ ] Deploy subgraph to The Graph
- [ ] Update `.env` with V2 contract address
- [ ] Update `.env` with subgraph endpoint
- [ ] Test delegation flow
- [ ] Verify weights display correctly
- [ ] Check transaction history

## Support

For issues or questions:
- Check `DEPLOYMENT_V2.md` for deployment details
- Review contract code in `src/DavinciDaoCensusV2.sol`
- Check subgraph mappings in `subgraph/src/mapping.ts`
