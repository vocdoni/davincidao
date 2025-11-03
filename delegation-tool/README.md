# DavinciDAO Delegation Tool

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
import "github.com/vocdoni/davincidao/delegation-tool/census"

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

See [census/README.md](census/README.md) for detailed API documentation.

### subgraph

GraphQL client for querying The Graph subgraph that indexes DavinciDAO events. Used internally by the census package, but also provides query methods for account and statistics lookups.

```go
import "github.com/vocdoni/davincidao/delegation-tool/subgraph"

client := subgraph.NewClient(subgraphURL)
account, err := client.GetAccount(ctx, address)
stats, err := client.GetGlobalStats(ctx)
```

### nft

NFT discovery utilities for finding owned NFTs across collections, with support for ERC-721 and Alchemy API integration.

```go
import "github.com/vocdoni/davincidao/delegation-tool/nft"
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

See [cmd/README.md](cmd/README.md) for all available commands.

### delegate

Automated tool for delegating NFTs to delegates.

```bash
./bin/delegate \
  --contract <CONTRACT_ADDRESS> \
  --rpc <RPC_URL> \
  --subgraph-url <SUBGRAPH_URL> \
  --private-key <KEY> \
  --delegates <COUNT>
```

## Quick Start

Verify your census tree matches the on-chain contract:

```bash
# Clone the repository
git clone https://github.com/vocdoni/davincidao
cd davincidao/delegation-tool

# Install dependencies
go mod tidy

# Build verify-tree command
go build -o bin/verify-tree cmd/verify-tree/main.go

# Run verification (Base mainnet example)
./bin/verify-tree \
  --subgraph "https://api.studio.thegraph.com/query/1704875/davinci-base-haberdashery/v0.0.1" \
  --rpc "https://w3.ch4in.net/base" \
  --contract "0x269dD41Bd98696A7c8fDD3cBE4e7ef1aC29d7218" \
  --show-tree \
  --verbose
```

Output:
```
✅ Root matches perfectly!
Root: 0x1930ccf0edce5ccdad7a9a0dad17ec415d0448206a086a01c53e28653efe9239
Tree size: 5 leaves
Active accounts: 3
Empty slots: 2
```

## Prerequisites

- Go 1.21 or later
- `abigen` (from go-ethereum) - for generating contract bindings
- Access to an Ethereum RPC endpoint
- Private key with NFT ownership and ETH for gas (for delegation tool)

## Installation

### 1. Generate Contract Bindings

```bash
cd delegation-tool
./scripts/generate-bindings.sh
```

### 2. Install Dependencies

```bash
go mod tidy
```

### 3. Build

Build all commands:

```bash
# Build verify-tree command
go build -o bin/verify-tree cmd/verify-tree/main.go

# Build delegate command
go build -o bin/delegate cmd/delegate/main.go
```

Or use the provided script to build all:

```bash
./scripts/build-all.sh
```

## Usage

### Basic Delegation

```bash
./bin/delegate \
  --contract 0x... \
  --rpc https://eth-mainnet.g.alchemy.com/v2/... \
  --subgraph-url https://api.studio.thegraph.com/query/... \
  --private-key YOUR_PRIVATE_KEY \
  --delegates 5
```

### Command-Line Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--contract` | Yes | - | DavinciDAO contract address |
| `--rpc` | Yes | - | Ethereum RPC endpoint |
| `--subgraph-url` | Yes | - | The Graph subgraph endpoint |
| `--private-key` | Yes | - | Private key (hex, no 0x prefix) |
| `--delegates` | No | 1 | Number of random delegates |
| `--collection` | No | 0 | Collection index (0-based) |
| `--tokens-per-tx` | No | 10 | Tokens per transaction |
| `--gas-multiplier` | No | 1.2 | Gas price multiplier |
| `--dry-run` | No | false | Test without transactions |

### Examples

#### Dry Run Test

```bash
./bin/delegate \
  --contract 0x... \
  --rpc https://sepolia.infura.io/v3/... \
  --subgraph-url https://... \
  --private-key YOUR_KEY \
  --delegates 3 \
  --dry-run
```

#### Production Delegation

```bash
./bin/delegate \
  --contract 0x... \
  --rpc https://eth-mainnet.g.alchemy.com/v2/... \
  --subgraph-url https://... \
  --private-key YOUR_KEY \
  --delegates 10 \
  --tokens-per-tx 5 \
  --gas-multiplier 1.5
```

## Output

The tool provides detailed output including:
- NFT discovery results
- Generated delegate addresses
- Transaction hashes
- Gas costs
- Census root updates
- Proof generation details

Example output:
```
🚀 Starting DavinciDAO Delegation Tool
✓ Contract verified at 0x...
✓ Found 50 owned NFTs in collection 0
✓ Generated 10 random delegate addresses
⛽ Delegating 50 NFTs in 5 transactions...
✓ Transaction 1/5: 0x... (gas: 250,000)
✓ Transaction 2/5: 0x... (gas: 248,500)
...
✅ Delegation complete!
   Total gas used: 1,245,000
   New census root: 0x...
```

## Development

### Project Structure

```
delegation-tool/
├── cmd/
│   ├── delegate/          # Delegation CLI tool
│   └── verify-tree/       # Tree verification tool
├── census/                # Census tree reconstruction (exportable)
│   ├── reconstruct.go     # Event replay algorithm
│   ├── subgraph_adapter.go
│   ├── example_test.go
│   ├── README.md
│   └── USAGE.md
├── subgraph/              # Subgraph GraphQL client (exportable)
│   └── client.go
├── nft/                   # NFT discovery utilities (exportable)
│   ├── discovery.go       # NFT discovery logic
│   └── alchemy.go         # Alchemy API integration
├── bindings/              # Generated contract bindings
│   └── go/census/
└── scripts/               # Build and utility scripts
    ├── generate-bindings.sh
    └── build-all.sh
```

### Exportable Packages

All packages (`census`, `subgraph`, and `nft`) are designed to be imported by external Go programs. They are located at the root level of the repository for easy external access:

```go
import (
    "github.com/vocdoni/davincidao/delegation-tool/census"
    "github.com/vocdoni/davincidao/delegation-tool/subgraph"
    "github.com/vocdoni/davincidao/delegation-tool/nft"
)
```

The packages follow Go best practices by placing all externally importable code at the repository root level, avoiding `internal/` or `pkg/` directory patterns.

### Running Tests

```bash
go test ./...
```

### Generating New Bindings

After updating the smart contract:

```bash
./scripts/generate-bindings.sh
```

## Troubleshooting

### Binding Generation Fails
- Ensure `abigen` is installed: `go install github.com/ethereum/go-ethereum/cmd/abigen@latest`
- Verify contract ABI exists in `../out/DavinciDao.sol/DavinciDao.json`
- Check Go environment variables

### Transaction Failures
- Verify sufficient ETH balance for gas
- Check NFT ownership
- Ensure RPC endpoint is accessible
- Try increasing `--gas-multiplier`

### Subgraph Errors
- Verify subgraph endpoint URL
- Check subgraph is deployed and synced
- Ensure contract events are indexed

## License

MIT License
