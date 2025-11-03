# Census Package Usage Guide

This guide shows how to use the `census` package to reconstruct the DavinciDAO census tree correctly.

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Advanced Usage](#advanced-usage)
- [Integration Examples](#integration-examples)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Quick Start

```go
package main

import (
    "context"
    "fmt"
    "math/big"

    "github.com/vocdoni/davincidao/delegation-tool/internal/subgraph"
    "github.com/vocdoni/davincidao/delegation-tool/pkg/census"
)

func main() {
    ctx := context.Background()

    // 1. Create subgraph client
    client := subgraph.NewClient("https://api.studio.thegraph.com/query/...")

    // 2. Reconstruct tree
    adapter := census.NewSubgraphAdapter(client)
    reconstructor := census.NewTreeReconstructor(adapter)
    tree, root, size, err := reconstructor.ReconstructTree(ctx)
    if err != nil {
        panic(err)
    }

    fmt.Printf("✓ Root: 0x%x, Size: %d\n", root, size)
}
```

## Installation

### Add Dependencies

```bash
go get github.com/vocdoni/davincidao/delegation-tool/pkg/census
go get github.com/vocdoni/lean-imt-go
```

### Update go.mod

```go
require (
    github.com/vocdoni/davincidao/delegation-tool v0.1.0
    github.com/vocdoni/lean-imt-go v0.1.0
)
```

## Basic Usage

### 1. Tree Reconstruction

```go
package main

import (
    "context"
    "fmt"

    "github.com/vocdoni/davincidao/delegation-tool/internal/subgraph"
    "github.com/vocdoni/davincidao/delegation-tool/pkg/census"
)

func reconstructTree() error {
    ctx := context.Background()

    // Create client
    client := subgraph.NewClient("YOUR_SUBGRAPH_URL")
    adapter := census.NewSubgraphAdapter(client)
    reconstructor := census.NewTreeReconstructor(adapter)

    // Reconstruct
    tree, root, size, err := reconstructor.ReconstructTree(ctx)
    if err != nil {
        return fmt.Errorf("reconstruction failed: %w", err)
    }

    fmt.Printf("Tree reconstructed:\n")
    fmt.Printf("  Root: 0x%x\n", root)
    fmt.Printf("  Size: %d leaves\n", size)
    fmt.Printf("  Depth: %d levels\n", tree.Depth())

    return nil
}
```

### 2. Root Validation

```go
import (
    "math/big"

    "github.com/vocdoni/davincidao/delegation-tool/bindings/go/census"
)

func validateTreeRoot(contractAddr string, rpcURL string) error {
    ctx := context.Background()

    // Get contract root
    client, _ := ethclient.Dial(rpcURL)
    contract, _ := census.NewDavinciDao(common.HexToAddress(contractAddr), client)
    expectedRoot, _ := contract.GetCensusRoot(nil)

    // Reconstruct tree
    subgraphClient := subgraph.NewClient("...")
    adapter := census.NewSubgraphAdapter(subgraphClient)
    reconstructor := census.NewTreeReconstructor(adapter)
    tree, _, _, err := reconstructor.ReconstructTree(ctx)
    if err != nil {
        return err
    }

    // Validate
    if err := census.ValidateRoot(tree, expectedRoot); err != nil {
        return fmt.Errorf("❌ Root mismatch: %w", err)
    }

    fmt.Println("✅ Root validation passed!")
    return nil
}
```

### 3. Generating Merkle Proofs

```go
func generateProof(address common.Address, weight uint64) error {
    ctx := context.Background()

    // Reconstruct tree
    client := subgraph.NewClient("...")
    adapter := census.NewSubgraphAdapter(client)
    reconstructor := census.NewTreeReconstructor(adapter)
    tree, _, _, err := reconstructor.ReconstructTree(ctx)
    if err != nil {
        return err
    }

    // Pack leaf
    leaf := census.PackLeaf(address, weight)

    // Find index
    index := tree.IndexOf(leaf)
    if index == -1 {
        return fmt.Errorf("address not in tree")
    }

    // Generate proof
    proof, err := tree.GenerateProof(index)
    if err != nil {
        return err
    }

    fmt.Printf("✓ Proof generated for %s\n", address.Hex())
    fmt.Printf("  Index: %d\n", index)
    fmt.Printf("  Siblings: %d\n", len(proof.Siblings))

    // Convert siblings to contract format
    siblings := make([]*big.Int, len(proof.Siblings))
    for i, sib := range proof.Siblings {
        siblings[i] = sib
    }

    return nil
}
```

## Advanced Usage

### Custom Subgraph Client

```go
package mypackage

import (
    "context"
    "github.com/vocdoni/davincidao/delegation-tool/pkg/census"
)

// MyGraphQLClient implements census.SubgraphClient
type MyGraphQLClient struct {
    endpoint string
    apiKey   string
}

func (c *MyGraphQLClient) GetWeightChangeEvents(ctx context.Context, first int, skip int) ([]census.WeightChangeEvent, error) {
    // Your custom GraphQL implementation
    query := `
        query GetEvents($first: Int!, $skip: Int!) {
            weightChangeEvents(
                first: $first
                skip: $skip
                orderBy: blockNumber
                orderDirection: asc
            ) {
                id
                account { id address }
                previousWeight
                newWeight
                blockNumber
                logIndex
            }
        }
    `

    // Execute query with your HTTP client
    result, err := c.executeQuery(query, map[string]interface{}{
        "first": first,
        "skip":  skip,
    })
    if err != nil {
        return nil, err
    }

    return parseEvents(result), nil
}

// Use custom client
func main() {
    client := &MyGraphQLClient{
        endpoint: "https://my-subgraph.example.com",
        apiKey:   "secret",
    }

    reconstructor := census.NewTreeReconstructor(client)
    tree, root, size, _ := reconstructor.ReconstructTree(context.Background())
    // ...
}
```

### Batch Proof Generation

```go
func generateBatchProofs(addresses []common.Address, weights []uint64) (map[common.Address][][]*big.Int, error) {
    ctx := context.Background()

    // Reconstruct tree once
    client := subgraph.NewClient("...")
    adapter := census.NewSubgraphAdapter(client)
    reconstructor := census.NewTreeReconstructor(adapter)
    tree, _, _, err := reconstructor.ReconstructTree(ctx)
    if err != nil {
        return nil, err
    }

    // Generate proofs for all addresses
    proofs := make(map[common.Address][][]*big.Int)
    for i, addr := range addresses {
        leaf := census.PackLeaf(addr, weights[i])
        index := tree.IndexOf(leaf)

        if index == -1 {
            continue // Skip addresses not in tree
        }

        proof, err := tree.GenerateProof(index)
        if err != nil {
            return nil, fmt.Errorf("proof generation failed for %s: %w", addr.Hex(), err)
        }

        proofs[addr] = proof.Siblings
    }

    return proofs, nil
}
```

### Monitoring Tree Changes

```go
func monitorTreeChanges(ctx context.Context, interval time.Duration) {
    client := subgraph.NewClient("...")
    adapter := census.NewSubgraphAdapter(client)
    reconstructor := census.NewTreeReconstructor(adapter)

    var lastRoot *big.Int

    ticker := time.NewTicker(interval)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            tree, root, size, err := reconstructor.ReconstructTree(ctx)
            if err != nil {
                fmt.Printf("❌ Reconstruction failed: %v\n", err)
                continue
            }

            if lastRoot == nil || root.Cmp(lastRoot) != 0 {
                fmt.Printf("🔄 Tree changed!\n")
                fmt.Printf("  New root: 0x%x\n", root)
                fmt.Printf("  Size: %d\n", size)
                fmt.Printf("  Depth: %d\n", tree.Depth())
                lastRoot = root
            }
        }
    }
}
```

## Integration Examples

### Integration with Contract Interaction

```go
package main

import (
    "context"
    "fmt"
    "math/big"

    "github.com/ethereum/go-ethereum/accounts/abi/bind"
    "github.com/ethereum/go-ethereum/common"
    "github.com/ethereum/go-ethereum/ethclient"

    "github.com/vocdoni/davincidao/delegation-tool/bindings/go/census"
    "github.com/vocdoni/davincidao/delegation-tool/internal/subgraph"
    censuspkg "github.com/vocdoni/davincidao/delegation-tool/pkg/census"
)

func delegateTokens(
    contractAddr common.Address,
    rpcURL string,
    subgraphURL string,
    delegateTo common.Address,
    nftIndex *big.Int,
    tokenIDs []*big.Int,
) error {
    ctx := context.Background()

    // 1. Connect to contract
    ethClient, _ := ethclient.Dial(rpcURL)
    contract, _ := census.NewDavinciDao(contractAddr, ethClient)

    // 2. Reconstruct tree
    sgClient := subgraph.NewClient(subgraphURL)
    adapter := censuspkg.NewSubgraphAdapter(sgClient)
    reconstructor := censuspkg.NewTreeReconstructor(adapter)
    tree, _, _, err := reconstructor.ReconstructTree(ctx)
    if err != nil {
        return fmt.Errorf("failed to reconstruct tree: %w", err)
    }

    // 3. Get current weight of delegate
    currentWeight, _ := contract.GetWeightOf(&bind.CallOpts{}, delegateTo)

    // 4. Generate proof if delegate already has weight
    var proof []*big.Int
    if currentWeight.Uint64() > 0 {
        leaf := censuspkg.PackLeaf(delegateTo, currentWeight.Uint64())
        index := tree.IndexOf(leaf)
        if index != -1 {
            p, _ := tree.GenerateProof(index)
            proof = p.Siblings
        }
    }

    // 5. Execute delegation transaction
    auth, _ := bind.NewKeyedTransactorWithChainID(privateKey, chainID)
    tx, err := contract.Delegate(auth, delegateTo, nftIndex, tokenIDs, proof)
    if err != nil {
        return fmt.Errorf("delegation failed: %w", err)
    }

    fmt.Printf("✅ Delegation successful! Tx: %s\n", tx.Hash().Hex())
    return nil
}
```

### CLI Tool Integration

```go
package main

import (
    "context"
    "flag"
    "fmt"
    "os"

    "github.com/vocdoni/davincidao/delegation-tool/internal/subgraph"
    "github.com/vocdoni/davincidao/delegation-tool/pkg/census"
)

func main() {
    subgraphURL := flag.String("subgraph", "", "Subgraph URL")
    showTree := flag.Bool("tree", false, "Show tree structure")
    flag.Parse()

    if *subgraphURL == "" {
        fmt.Println("Error: --subgraph required")
        os.Exit(1)
    }

    ctx := context.Background()

    // Reconstruct tree
    client := subgraph.NewClient(*subgraphURL)
    adapter := census.NewSubgraphAdapter(client)
    reconstructor := census.NewTreeReconstructor(adapter)

    fmt.Println("🔄 Reconstructing tree...")
    tree, root, size, err := reconstructor.ReconstructTree(ctx)
    if err != nil {
        fmt.Printf("❌ Error: %v\n", err)
        os.Exit(1)
    }

    // Display results
    fmt.Printf("\n✅ Tree Reconstructed\n")
    fmt.Printf("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    fmt.Printf("Root:  0x%x\n", root)
    fmt.Printf("Size:  %d leaves\n", size)
    fmt.Printf("Depth: %d levels\n", tree.Depth())

    if *showTree {
        fmt.Printf("\nTree Structure:\n")
        leaves := tree.Leaves()
        for i, leaf := range leaves {
            if leaf.Cmp(big.NewInt(0)) == 0 {
                fmt.Printf("  [%d] EMPTY\n", i)
            } else {
                addr, weight := census.UnpackLeaf(leaf)
                fmt.Printf("  [%d] %s (weight: %d)\n", i, addr.Hex(), weight)
            }
        }
    }
}
```

## Common Patterns

### Pattern 1: Tree Reconstruction with Caching

```go
type CachedReconstructor struct {
    reconstructor *census.TreeReconstructor
    cache         *TreeCache
    cacheTTL      time.Duration
}

func (cr *CachedReconstructor) GetTree(ctx context.Context) (*leanimt.LeanIMT[*big.Int], error) {
    // Check cache
    if cached := cr.cache.Get(); cached != nil && !cached.IsExpired(cr.cacheTTL) {
        return cached.Tree, nil
    }

    // Reconstruct
    tree, _, _, err := cr.reconstructor.ReconstructTree(ctx)
    if err != nil {
        return nil, err
    }

    // Update cache
    cr.cache.Set(tree, time.Now())

    return tree, nil
}
```

### Pattern 2: Concurrent Proof Generation

```go
func generateProofsConcurrently(addresses []common.Address, weights []uint64) error {
    ctx := context.Background()

    // Reconstruct tree
    tree, err := reconstructTree(ctx)
    if err != nil {
        return err
    }

    // Use worker pool
    results := make(chan ProofResult, len(addresses))
    semaphore := make(chan struct{}, 10) // Max 10 concurrent

    var wg sync.WaitGroup
    for i, addr := range addresses {
        wg.Add(1)
        go func(addr common.Address, weight uint64) {
            defer wg.Done()
            semaphore <- struct{}{}
            defer func() { <-semaphore }()

            proof, err := generateProofForAddress(tree, addr, weight)
            results <- ProofResult{Address: addr, Proof: proof, Error: err}
        }(addr, weights[i])
    }

    wg.Wait()
    close(results)

    // Process results
    for result := range results {
        if result.Error != nil {
            fmt.Printf("❌ %s: %v\n", result.Address.Hex(), result.Error)
        } else {
            fmt.Printf("✅ %s: %d siblings\n", result.Address.Hex(), len(result.Proof))
        }
    }

    return nil
}
```

## Troubleshooting

### Issue: "Root mismatch" error

**Problem**: Reconstructed tree root doesn't match contract root.

**Solutions**:
1. Ensure subgraph is fully synced:
   ```go
   meta, _ := subgraphClient.GetMeta(ctx)
   fmt.Printf("Subgraph at block: %d\n", meta.Block.Number)
   ```

2. Check event completeness:
   ```go
   events, _ := subgraphClient.GetWeightChangeEvents(ctx, 1000, 0)
   fmt.Printf("Found %d events\n", len(events))
   ```

3. Verify leaf packing format matches contract

### Issue: "Leaf not found" during proof generation

**Problem**: Address not found in tree.

**Solutions**:
1. Verify address has weight > 0
2. Check if weight value is current
3. Use tree from reconstruction, don't rebuild

### Issue: Slow reconstruction

**Problem**: Tree reconstruction takes too long.

**Solutions**:
1. Implement caching
2. Use pagination efficiently
3. Consider local subgraph deployment for faster queries

### Issue: Out of memory

**Problem**: Large tree causes memory issues.

**Solutions**:
1. Stream events instead of loading all at once
2. Use persistent storage with lean-imt-go
3. Implement checkpointing

## Best Practices

1. **Always reconstruct from events** - Never try to rebuild from current state
2. **Validate roots** - Always validate before using tree for proofs
3. **Cache wisely** - Tree reconstruction is expensive, cache when possible
4. **Handle errors gracefully** - Network issues are common with subgraph queries
5. **Use the actual tree** - Don't rebuild for proof generation
6. **Monitor sync status** - Ensure subgraph is up-to-date before critical operations
7. **Test with mainnet data** - Use production subgraph for testing

## Further Reading

- [Census Package README](./README.md)
- [DavinciDAO Documentation](../../../README.md)
- [lean-imt-go Documentation](https://github.com/vocdoni/lean-imt-go)
- [The Graph Documentation](https://thegraph.com/docs/)
