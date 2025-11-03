# DavinciDAO Delegation Tool Commands

This directory contains command-line tools for interacting with the DavinciDAO census system.

## Available Commands

### verify-tree

Verifies that the census tree reconstructed from The Graph subgraph matches the on-chain contract's census root. This tool demonstrates the correct way to reconstruct the tree using event replay.

**Usage:**

```bash
./bin/verify-tree \
  --subgraph <SUBGRAPH_URL> \
  --rpc <RPC_URL> \
  --contract <CONTRACT_ADDRESS> \
  [--show-tree] \
  [--verbose]
```

**Flags:**

- `--subgraph, -s` (required): The Graph subgraph endpoint URL
- `--rpc, -r` (required): Ethereum RPC endpoint URL
- `--contract, -c` (required): DavinciDao contract address
- `--show-tree, -t`: Display the complete tree structure with all leaves
- `--verbose, -v`: Show additional information including latest root updates and global stats

**Example:**

```bash
# Basic verification
./bin/verify-tree \
  --subgraph "https://api.studio.thegraph.com/query/1704875/davinci-base-haberdashery/v0.0.1" \
  --rpc "https://w3.ch4in.net/base" \
  --contract "0x269dD41Bd98696A7c8fDD3cBE4e7ef1aC29d7218"

# With tree visualization
./bin/verify-tree \
  --subgraph "https://api.studio.thegraph.com/query/1704875/davinci-base-haberdashery/v0.0.1" \
  --rpc "https://w3.ch4in.net/base" \
  --contract "0x269dD41Bd98696A7c8fDD3cBE4e7ef1aC29d7218" \
  --show-tree

# Verbose output
./bin/verify-tree \
  --subgraph "https://api.studio.thegraph.com/query/1704875/davinci-base-haberdashery/v0.0.1" \
  --rpc "https://w3.ch4in.net/base" \
  --contract "0x269dD41Bd98696A7c8fDD3cBE4e7ef1aC29d7218" \
  --verbose
```

**Output:**

The tool will:
1. Connect to the Ethereum RPC and fetch the on-chain census root
2. Reconstruct the tree from subgraph events using event replay algorithm
3. Display tree statistics (size, depth, active accounts, empty slots)
4. Validate that the reconstructed root matches the on-chain root
5. Show success/failure status

**Example Output:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DavinciDAO Census Tree Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Connecting to contract...
   RPC:      https://w3.ch4in.net/base
   Contract: 0x269dD41Bd98696A7c8fDD3cBE4e7ef1aC29d7218
   ✓ Connected
   On-chain root: 0x1930ccf...

🔄 Reconstructing tree from subgraph...
   ├─ Fetched 13 WeightChanged events
   ├─ Replaying events to reconstruct tree...
   ├─ Tree reconstruction complete
   └─ Root: 0x1930ccf...

📊 Tree Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Reconstructed root:  0x1930ccf...
   Tree size:           5 leaves
   Tree depth:          3 levels
   Reconstruction time: 698ms
   Active accounts:     3
   Empty slots:         2

🔍 Validating Root
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ Root matches perfectly!

✅ Verification successful!
```

**Understanding Empty Slots:**

The tree may contain empty slots (shown as "EMPTY (removed account)") when accounts are removed (weight goes to 0). This is normal and expected behavior:

- When using `--show-tree`, empty slots will be displayed
- The tree size includes both active accounts and empty slots
- Empty slots affect subsequent account indices
- This is why event replay is essential for correct reconstruction

**Exit Codes:**

- `0`: Verification successful (roots match)
- `1`: Verification failed (roots don't match or error occurred)

### delegate

Tool for delegating NFTs to a delegate address.

**Usage:**

```bash
./bin/delegate [flags]
```

See `./bin/delegate --help` for detailed usage.

## Building

Build all commands:

```bash
make build
```

Or build individual commands:

```bash
go build -o bin/verify-tree cmd/verify-tree/main.go
go build -o bin/delegate cmd/delegate/main.go
```

## Development

### Adding New Commands

1. Create a new directory under `cmd/`:
   ```bash
   mkdir cmd/mycommand
   ```

2. Create `main.go`:
   ```go
   package main

   import (
       "github.com/vocdoni/davincidao/delegation-tool/census"
       "github.com/vocdoni/davincidao/delegation-tool/subgraph"
   )

   func main() {
       // Your command logic
   }
   ```

3. Build:
   ```bash
   go build -o bin/mycommand cmd/mycommand/main.go
   ```

### Using the Census Package

All commands can use the `census` package for tree reconstruction:

```go
import (
    "github.com/vocdoni/davincidao/delegation-tool/census"
    "github.com/vocdoni/davincidao/delegation-tool/subgraph"
)

func main() {
    // Create client
    client := subgraph.NewClient(subgraphURL)
    adapter := census.NewSubgraphAdapter(client)
    reconstructor := census.NewTreeReconstructor(adapter)

    // Reconstruct tree
    tree, root, size, err := reconstructor.ReconstructTree(ctx)

    // Generate proofs
    leaf := census.PackLeaf(address, weight)
    index := tree.IndexOf(leaf)
    proof, _ := tree.GenerateProof(index)
}
```

## Testing

Run verification against production:

```bash
# Base mainnet (current production)
./bin/verify-tree \
  --subgraph "https://api.studio.thegraph.com/query/1704875/davinci-base-haberdashery/v0.0.1" \
  --rpc "https://w3.ch4in.net/base" \
  --contract "0x269dD41Bd98696A7c8fDD3cBE4e7ef1aC29d7218" \
  --verbose
```

## Troubleshooting

### "Root mismatch" Error

If verification fails with root mismatch:

1. **Check subgraph sync status**: Ensure the subgraph is fully synced past the latest root update block
2. **Verify RPC connectivity**: Make sure the RPC endpoint is working correctly
3. **Check contract address**: Ensure you're using the correct deployed contract address
4. **Review event logs**: Use `--verbose` to see detailed event replay information

### Slow Performance

If tree reconstruction is slow:

1. **Use local RPC**: Set up a local node for faster RPC calls
2. **Deploy local subgraph**: Run The Graph node locally for faster queries
3. **Increase timeout**: Adjust the timeout in the HTTP client if needed

### Connection Errors

If you get connection errors:

1. **Check network**: Verify internet connectivity
2. **Test endpoints**: Try accessing the RPC and subgraph URLs directly
3. **Check rate limits**: Some RPC providers have rate limits
4. **Verify firewall**: Ensure no firewall is blocking connections

## See Also

- [Census Package Documentation](../census/README.md)
- [Subgraph Package Documentation](../subgraph/)
- [Main README](../README.md)
