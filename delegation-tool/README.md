# DavinciDAO Delegation Tool

A Go-based command-line tool for managing NFT delegations in the DavinciDAO Census Contract.

## Features

- Automated batch delegation of NFTs
- NFT discovery from owned collections
- Merkle proof generation for delegation operations
- Gas cost optimization
- Transaction reporting and logging
- Dry-run mode for testing

## Prerequisites

- Go 1.21 or later
- `abigen` (from go-ethereum)
- Access to an Ethereum RPC endpoint
- Private key with NFT ownership and ETH for gas

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

```bash
go build -o bin/delegate ./cmd/delegate
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
│   └── delegate/      # Main CLI application
├── internal/
│   ├── client/        # Ethereum client
│   ├── delegation/    # Delegation logic
│   └── merkle/        # Merkle proof generation
├── bindings/          # Generated contract bindings
└── scripts/           # Build scripts
```

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
