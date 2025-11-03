# Census Package

The `census` package provides functionality for reconstructing the DavinciDAO census Merkle tree off-chain using data from The Graph subgraph.

## Overview

The DavinciDAO contract uses a LeanIMT (Lean Incremental Merkle Tree) to maintain voting weights on-chain. To verify transactions or generate Merkle proofs off-chain, you must reconstruct the tree **exactly** as the contract built it, including all historical operations.

## Installation

```bash
go get github.com/vocdoni/davincidao/delegation-tool/census
go get github.com/vocdoni/lean-imt-go
```

## Quick Start

```go
package main

import (
    "context"
    "fmt"

    "github.com/vocdoni/davincidao/delegation-tool/census"
)

func main() {
    ctx := context.Background()
    subgraphURL := "https://api.studio.thegraph.com/query/1704875/davinci-base-haberdashery/v0.0.1"

    // Reconstruct tree - that's it!
    tree, root, err := census.ReconstructTree(ctx, subgraphURL)
    if err != nil {
        panic(err)
    }

    fmt.Printf("✓ Tree reconstructed: root=0x%x, size=%d\n", root, tree.Size())
}
```

## API

### ReconstructTree

```go
func ReconstructTree(ctx context.Context, subgraphURL string) (*leanimt.LeanIMT[*big.Int], *big.Int, error)
```

Reconstructs the census tree by replaying all WeightChanged events from the subgraph. This is the **only** correct way to reconstruct the tree with the exact same structure as the on-chain contract.

**Parameters:**
- `ctx`: Context for cancellation
- `subgraphURL`: The Graph subgraph endpoint URL

**Returns:**
- `tree`: The reconstructed LeanIMT tree
- `root`: The tree root as *big.Int
- `err`: Any error encountered

**Example:**
```go
tree, root, err := census.ReconstructTree(ctx, "https://api.studio.thegraph.com/...")
if err != nil {
    log.Fatal(err)
}
```

### ValidateRoot

```go
func ValidateRoot(tree *leanimt.LeanIMT[*big.Int], expectedRoot *big.Int) error
```

Verifies that the reconstructed tree root matches the expected on-chain root.

**Parameters:**
- `tree`: The reconstructed tree from ReconstructTree
- `expectedRoot`: The on-chain root as *big.Int (from contract.GetCensusRoot)

**Returns error if roots don't match**

**Example:**
```go
// Get on-chain root from contract
onChainRoot, _ := contract.GetCensusRoot(nil)

// Validate
if err := census.ValidateRoot(tree, onChainRoot); err != nil {
    log.Fatal("Root mismatch:", err)
}
```

### PackLeaf

```go
func PackLeaf(address common.Address, weight uint64) *big.Int
```

Packs an address and weight into a leaf value matching the contract's format: `(address << 88) | weight`

**Example:**
```go
leaf := census.PackLeaf(userAddr, weight)
index := tree.IndexOf(leaf)
```

### UnpackLeaf

```go
func UnpackLeaf(leaf *big.Int) (common.Address, uint64)
```

Unpacks a leaf value into address and weight.

**Example:**
```go
leaves := tree.Leaves()
for i, leaf := range leaves {
    addr, weight := census.UnpackLeaf(leaf)
    fmt.Printf("[%d] %s: %d\n", i, addr.Hex(), weight)
}
```

## Core Concepts

### Event Replay Algorithm

The **only** correct way to reconstruct the tree is by replaying all `WeightChanged` events in chronological order:

```go
tree, root, err := census.ReconstructTree(ctx, subgraphURL)
```

This function:
1. Fetches **all** `WeightChanged` events from the subgraph
2. Orders them by `blockNumber` and `logIndex`
3. Replays each event, performing the exact same operations as the contract:
   - `0 → >0`: **INSERT** - New account gets weight
   - `>0 → 0`: **REMOVE** - Account weight goes to 0 (updates leaf to 0, keeps slot)
   - `>0 → >0`: **UPDATE** - Weight changes but stays > 0

### Why Simple Approaches Fail

**❌ DON'T** query current accounts and rebuild:
```go
// WRONG! This creates a different tree structure
accounts := subgraph.GetAccounts()
tree := leanimt.New(...)
for _, acc := range accounts {
    tree.Insert(census.PackLeaf(acc.Address, acc.Weight))
}
// Tree root will NOT match contract!
```

**Problem:** When an account is removed (weight → 0), the contract calls `tree.Update(index, 0)`, which sets the leaf to 0 but **keeps the slot**. This creates gaps in the tree structure.

### Empty Slots

After replaying events, the tree contains empty slots (value = 0) where accounts were removed:

```go
// Example tree structure:
// Index 0: Alice (active)
// Index 1: EMPTY (Bob was removed)
// Index 2: Charlie (active)
// Index 3: Dave (active)
```

Empty slots affect subsequent insertions and the tree structure, which is why event replay is mandatory.

## Generating Proofs

Once you have the reconstructed tree, you can generate Merkle proofs:

```go
// Find leaf
leaf := census.PackLeaf(address, weight)
index := tree.IndexOf(leaf)
if index == -1 {
    log.Fatal("Leaf not found")
}

// Generate proof
proof, err := tree.GenerateProof(index)
if err != nil {
    log.Fatal(err)
}

// Use proof with contract
siblings := make([][32]byte, len(proof))
for i, p := range proof {
    copy(siblings[i][:], p.Bytes())
}
```

## Complete Example

```go
package main

import (
    "context"
    "fmt"
    "log"

    "github.com/ethereum/go-ethereum/common"
    "github.com/ethereum/go-ethereum/ethclient"
    "github.com/vocdoni/davincidao/delegation-tool/bindings/go/census"
    censuspkg "github.com/vocdoni/davincidao/delegation-tool/census"
)

func main() {
    ctx := context.Background()

    // Connect to contract
    ethClient, _ := ethclient.Dial("https://w3.ch4in.net/base")
    contract, _ := census.NewDavinciDao(common.HexToAddress("0x..."), ethClient)
    onChainRoot, _ := contract.GetCensusRoot(nil)

    // Reconstruct tree
    subgraphURL := "https://api.studio.thegraph.com/query/..."
    tree, reconstructedRoot, err := censuspkg.ReconstructTree(ctx, subgraphURL)
    if err != nil {
        log.Fatal(err)
    }

    // Validate
    if err := censuspkg.ValidateRoot(tree, onChainRoot); err != nil {
        log.Fatal("Root mismatch:", err)
    }

    fmt.Printf("✅ Validation successful!\n")
    fmt.Printf("   Root: 0x%x\n", onChainRoot)
    fmt.Printf("   Size: %d leaves\n", tree.Size())

    // Generate proof for an address
    userAddr := common.HexToAddress("0x123...")
    userWeight := uint64(5)
    leaf := censuspkg.PackLeaf(userAddr, userWeight)

    index := tree.IndexOf(leaf)
    if index == -1 {
        log.Fatal("User not found in tree")
    }

    proof, _ := tree.GenerateProof(index)
    fmt.Printf("   Proof for %s at index %d: %d siblings\n",
        userAddr.Hex(), index, len(proof))
}
```

## Troubleshooting

### Root Mismatch

If `ValidateRoot` fails:
1. **Check subgraph sync**: Ensure the subgraph has indexed all events up to the latest root update
2. **Verify RPC**: Make sure you're querying the correct chain
3. **Check contract address**: Ensure you're using the correct deployed contract

### Performance

Tree reconstruction fetches all events (pagination handled automatically). For large datasets:
- Use a local The Graph node for faster queries
- Consider caching the reconstructed tree
- The tree size affects proof generation time

## See Also

- [Main README](../README.md)
- [Command-Line Tools](../cmd/README.md)
- [LeanIMT Go Implementation](https://github.com/vocdoni/lean-imt-go)
