# DAVINCI onchain census Golang tool

A Go-based toolkit for managing NFT delegations in the DavinciDAO Census Contract. Includes both command-line tools and reusable Go packages for tree reconstruction and delegation management.

## Features

- ✅ **Census tree reconstruction** from The Graph subgraph using event replay
- ✅ **Root verification** to ensure off-chain tree matches on-chain contract
- ✅ **Merkle proof generation** with correct tree structure (including empty slots)
- ✅ **Automated batch delegation** of NFTs
- ✅ **NFT discovery** from owned collections
- ✅ **Gas cost optimization**
- ✅ **Exportable Go packages** for external integration
- ✅ **Transaction reporting** and logging

## Packages

All packages are designed to be imported and used by external Go programs. They are located at the root level of the repository for easy external access.

### census

Core package for reconstructing the census tree from subgraph events using the event replay algorithm. Simple API - just provide a subgraph URL.

```go
import "github.com/vocdoni/davinci-onchain-census/go-tool/census"

// Reconstruct tree from subgraph
tree, root, err := census.ReconstructTree(ctx, subgraphURL)

// Validate against on-chain root
err = census.ValidateRoot(tree, onChainRoot)
```

**Key Functions:**
- `ReconstructTree(ctx, subgraphURL)` - Reconstructs the census tree by replaying all events
- `ValidateRoot(tree, expectedRoot)` - Verifies tree root matches on-chain root
- `PackLeaf(address, weight)` - Packs address and weight into leaf value
- `UnpackLeaf(leaf)` - Unpacks leaf into address and weight

### subgraph

GraphQL client for querying The Graph subgraph that indexes DavinciDAO events. Used internally by the census package, but also provides query methods for account and statistics lookups.

```go
import "github.com/vocdoni/davinci-onchain-census/go-tool/subgraph"

client := subgraph.NewClient(subgraphURL)
account, err := client.GetAccount(ctx, address)
stats, err := client.GetGlobalStats(ctx)
```

### nft

NFT discovery utilities for finding owned NFTs across collections, with support for ERC-721 and Alchemy API integration.

```go
import "github.com/vocdoni/davinci-onchain-census/go-tool/nft"
```

## Command-Line Tools

### verify-tree

Verifies that the reconstructed census tree matches the on-chain contract root.

```bash
./bin/verify-tree \
  --subgraph <SUBGRAPH_URL> \
  --rpc <RPC_URL> \
  --contract <CONTRACT_ADDRESS>
```

### delegate

Automated tool for delegating NFTs to delegates (testing).


# Run verification (Base mainnet example)
```
go run ./cmd/verify-tree
  --subgraph "https://api.studio.thegraph.com/query/1704875/davinci-base-haberdashery/v0.0.1" \
  --rpc "https://base.llamarpc.com" \
  --contract "0x269dD41Bd98696A7c8fDD3cBE4e7ef1aC29d7218" \
  --show-tree \
```

Output:
```
✅ Root matches perfectly!
Root: 0x1930ccf0edce5ccdad7a9a0dad17ec415d0448206a086a01c53e28653efe9239
Tree size: 5 leaves
Active accounts: 3
Empty slots: 2
```
