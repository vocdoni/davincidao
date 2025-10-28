# DavinciDAO Delegation Tool

An automated command-line tool for managing NFT delegations in the DavinciDAO Census Contract. This tool enables batch delegation of NFTs to multiple addresses with comprehensive logging, gas cost reporting, and Merkle proof generation.

## Features

- 🎯 **Automated Batch Delegation**: Delegate NFTs to multiple random addresses in a single run
- 🔍 **NFT Discovery**: Automatically discovers owned NFTs from configured collections
- 🌳 **Merkle Proof Generation**: Client-side proof generation using Poseidon hash and Lean-IMT
- ⛽ **Gas Optimization**: Configurable gas price multiplier and batch processing
- 📊 **Detailed Reporting**: Real-time progress updates and comprehensive transaction summaries
- 🔒 **Safety Features**: Pre-flight checks for NFT ownership and dry-run mode
- 🚀 **Production Ready**: Built with Go 1.25+ and latest go-ethereum

## Prerequisites

- Go 1.25 or later
- `abigen` (from go-ethereum) - for generating contract bindings
- `jq` - for JSON processing
- Access to an Ethereum RPC endpoint (e.g., Alchemy, Infura, or local node)
- Private key with:
  - Ownership of NFTs in the configured collection
  - Sufficient ETH for gas fees

## Installation

### 1. Clone and Navigate

```bash
cd delegation-tool
```

### 2. Generate Contract Bindings

The tool requires Go bindings for the DavinciDAO Census contract:

```bash
./scripts/generate-bindings.sh
```

This script:
- Extracts ABI and bytecode from compiled Solidity contracts
- Generates Go bindings for DavinciDaoCensus contract
- Generates Go bindings for ERC721 interface
- Organizes bindings in `bindings/go/` directory

### 3. Install Dependencies

```bash
go mod tidy
```

### 4. Build the Tool

```bash
go build -o bin/delegate ./cmd/delegate
```

The binary will be created at `bin/delegate` (approximately 15MB).

## Usage

### Basic Usage

```bash
./bin/delegate \
  --contract 0x1234567890abcdef1234567890abcdef12345678 \
  --rpc https://sepolia.infura.io/v3/YOUR_API_KEY \
  --private-key YOUR_PRIVATE_KEY_HEX \
  --delegates 5
```

### Command-Line Flags

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--contract` | string | Yes | - | DavinciDAO census contract address |
| `--rpc` | string | Yes | - | Ethereum RPC endpoint URL |
| `--private-key` | string | Yes | - | Private key (64-character hex, without 0x prefix) |
| `--delegates` | int | No | 1 | Number of random delegate addresses to create |
| `--collection` | int | No | 0 | Collection index to use (0-based) |
| `--max-scan` | int | No | 10000 | Maximum token ID to scan when discovering NFTs |
| `--tokens-per-tx` | int | No | 10 | Number of tokens to delegate per transaction |
| `--confirmations` | int | No | 1 | Number of block confirmations to wait |
| `--gas-multiplier` | float | No | 1.2 | Gas price multiplier (e.g., 1.5 = 150% of suggested price) |
| `--dry-run` | bool | No | false | Simulate without sending transactions |

### Example Workflows

#### Test on Sepolia Testnet

```bash
./bin/delegate \
  --contract 0xYourContractAddress \
  --rpc https://sepolia.infura.io/v3/YOUR_API_KEY \
  --private-key YOUR_TEST_PRIVATE_KEY \
  --delegates 3 \
  --tokens-per-tx 5 \
  --dry-run
```

Remove `--dry-run` to execute actual transactions.

#### Production Delegation

```bash
./bin/delegate \
  --contract 0xProductionContractAddress \
  --rpc https://mainnet.infura.io/v3/YOUR_API_KEY \
  --private-key YOUR_PRIVATE_KEY \
  --delegates 10 \
  --tokens-per-tx 10 \
  --gas-multiplier 1.3 \
  --confirmations 2
```

#### Large-Scale Delegation

For delegating to many addresses:

```bash
./bin/delegate \
  --contract 0xContractAddress \
  --rpc https://sepolia.infura.io/v3/YOUR_API_KEY \
  --private-key YOUR_PRIVATE_KEY \
  --delegates 50 \
  --tokens-per-tx 20 \
  --max-scan 50000
```

## How It Works

### Execution Flow

1. **Connection Initialization**
   - Connects to Ethereum RPC endpoint
   - Validates chain ID and account balance
   - Loads private key and derives account address

2. **Contract Verification**
   - Instantiates DavinciDAO Census contract
   - Verifies contract is accessible (queries census root)
   - Loads collection configurations

3. **NFT Discovery**
   - Scans for NFTs owned by the account
   - Attempts ERC721Enumerable interface first (fastest)
   - Falls back to manual scanning if enumerable not supported
   - Filters for undelegated NFTs only

4. **Pre-flight Validation**
   - Checks sufficient NFTs available: `required = delegates × tokens-per-tx`
   - Validates account has ETH for gas fees
   - Generates random delegate addresses

5. **Merkle Tree Reconstruction**
   - Queries contract to enumerate all current participants
   - Fetches weight and leaf value for each participant
   - Builds local Merkle tree using Poseidon hash function
   - Used for generating cryptographic proofs

6. **Delegation Execution**
   - For each delegate address:
     - Selects batch of undelegated tokens
     - Generates Merkle proof for the delegate
     - Estimates gas and applies multiplier
     - Sends delegation transaction
     - Waits for confirmations
     - Reports gas usage and cost
     - Updates local tree state

7. **Summary Report**
   - Total transactions sent
   - Cumulative gas used
   - Total cost in ETH
   - Average cost per transaction

### Gas Cost Estimation

Typical gas costs on Ethereum mainnet (values may vary):

| Operation | Gas Cost | Est. Cost @ 50 Gwei |
|-----------|----------|---------------------|
| First delegation (tree insertion) | ~200,000 | ~0.01 ETH |
| Weight update (with proof) | ~300,000-600,000 | ~0.015-0.03 ETH |
| Batch of 10 tokens | ~400,000-700,000 | ~0.02-0.035 ETH |

**Note**: Sepolia testnet gas is free (testnet ETH has no value).

## Output Example

```
╔═══════════════════════════════════════════════════════════╗
║         DavinciDAO Delegation Tool v1.0                   ║
║         Automated NFT Delegation Manager                  ║
╚═══════════════════════════════════════════════════════════╝

🔌 Connecting to Ethereum node...
   RPC: https://sepolia.infura.io/v3/***
   ✓ Connected to chain ID: 11155111
   ✓ Loaded account: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0
   ✓ Account balance: 1.234567 ETH

📜 Loading DavinciDAO contract...
   Contract: 0x1234567890abcdef1234567890abcdef12345678
   ✓ Current census root: 123456789...

🔍 Discovering NFTs...
   Found 1 collections
   📦 Collection 0: 0xabcdefabcdefabcdefabcdefabcdefabcdef
      ✓ Found 50 NFTs
   ✓ Total NFTs discovered: 50

🎲 Generating 5 random delegate addresses...
   Delegate 1: 0x1111111111111111111111111111111111111111
   Delegate 2: 0x2222222222222222222222222222222222222222
   Delegate 3: 0x3333333333333333333333333333333333333333
   Delegate 4: 0x4444444444444444444444444444444444444444
   Delegate 5: 0x5555555555555555555555555555555555555555

🌳 Reconstructing Merkle tree...
📊 Reconstructing census tree from contract...
   ℹ️  Tree is empty (root = 0)
   ✓ Tree reconstruction complete: 0 participants

🚀 Starting delegation process...

📤 Delegate 1/5: 0x1111111111111111111111111111111111111111
   Tokens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
   Proof size: 0 siblings
   Gas price: 2.40 Gwei (multiplier: 1.2x)
   ⏳ Sending transaction...
   📝 Transaction hash: 0xabc123...
   ⏳ Waiting for 1 confirmation(s)...
   ✅ Confirmed in block 4567890
   ⛽ Gas used: 456,789
   💰 Cost: 0.001096 ETH

[... continues for each delegate ...]

════════════════════════════════════════════════════════════
📊 TRANSACTION SUMMARY
════════════════════════════════════════════════════════════
Total transactions:  5
Total gas used:      2,283,945
Total cost:          0.005481 ETH
Average cost/tx:     0.001096 ETH
════════════════════════════════════════════════════════════

✅ Delegation process completed successfully!
```

## Architecture

### Project Structure

```
delegation-tool/
├── cmd/
│   └── delegate/
│       └── main.go              # CLI application entry point
├── internal/
│   ├── merkle/
│   │   └── tree.go              # Merkle tree reconstruction and proof generation
│   └── nft/
│       └── discovery.go         # NFT ownership discovery logic
├── bindings/
│   └── go/
│       ├── census/
│       │   └── census.go        # DavinciDaoCensus contract bindings
│       └── erc721/
│           └── erc721.go        # ERC721 interface bindings
├── scripts/
│   └── generate-bindings.sh     # Script to regenerate contract bindings
├── bin/
│   └── delegate                 # Compiled binary (after build)
├── go.mod                       # Go module dependencies
├── go.sum                       # Dependency checksums
└── README.md                    # This file
```

### Key Components

#### Merkle Tree (`internal/merkle/tree.go`)

- **ReconstructTree**: Fetches all participants from the census contract and rebuilds the Merkle tree locally
- **GenerateProof**: Creates sibling array for Merkle proof using Poseidon hash function
- **PackLeaf**: Packs address and weight into uint256 leaf value (address << 88 | weight)

Uses `github.com/iden3/go-iden3-crypto/poseidon` for cryptographic hashing.

#### NFT Discovery (`internal/nft/discovery.go`)

- **DiscoverUndelegatedNFTs**: Main entry point for finding owned, undelegated NFTs
- **checkEnumerableSupport**: Checks if contract implements ERC721Enumerable interface
- **discoverViaEnumerable**: Uses tokenOfOwnerByIndex for efficient discovery
- **scanForOwnedTokens**: Fallback method that scans token IDs sequentially
- **getTokenDelegation**: Checks delegation status using contract's tokenDelegate mapping

#### Main Application (`cmd/delegate/main.go`)

- **Flag Parsing**: Uses `spf13/pflag` for POSIX-style command-line arguments
- **Transaction Management**: Nonce tracking, gas estimation, transaction sending
- **Progress Reporting**: Real-time console output with status indicators
- **Error Handling**: Comprehensive error messages and graceful failure handling

## Development

### Regenerating Bindings

If you modify the Solidity contracts:

```bash
# 1. Rebuild contracts with Foundry
cd ..
forge build

# 2. Regenerate Go bindings
cd delegation-tool
./scripts/generate-bindings.sh

# 3. Rebuild the tool
go build -o bin/delegate ./cmd/delegate
```

### Adding New Features

The codebase is organized for extensibility:

- **New contract interactions**: Add methods to generated bindings in `bindings/go/`
- **NFT discovery strategies**: Implement new discovery methods in `internal/nft/discovery.go`
- **Proof generation algorithms**: Extend `internal/merkle/tree.go`
- **CLI features**: Add flags and logic in `cmd/delegate/main.go`

### Dependencies

Core dependencies (automatically managed by `go mod`):

- `github.com/ethereum/go-ethereum` v1.16.5+ - Ethereum client and utilities
- `github.com/spf13/pflag` v1.0.10+ - POSIX-style CLI flags
- `github.com/iden3/go-iden3-crypto` v0.0.17+ - Poseidon hash implementation

## Security Considerations

### Private Key Handling

⚠️ **NEVER commit private keys to version control**

Best practices:
- Use environment variables: `export PRIVATE_KEY=...`
- Use key files with restricted permissions: `chmod 600 keyfile`
- Use hardware wallets or key management systems for production
- Consider using encrypted keystores with go-ethereum's accounts package

Example using environment variable:

```bash
export PRIVATE_KEY="1234567890abcdef..."
export CONTRACT_ADDR="0x1234..."
export RPC_URL="https://sepolia.infura.io/v3/..."

./bin/delegate \
  --contract $CONTRACT_ADDR \
  --rpc $RPC_URL \
  --private-key $PRIVATE_KEY \
  --delegates 5
```

### Transaction Safety

The tool includes safety mechanisms:

1. **Dry-run mode**: Test logic without sending transactions
2. **Pre-flight checks**: Validates NFT ownership before execution
3. **Confirmation waiting**: Ensures transactions are mined before proceeding
4. **Revert detection**: Checks receipt status and reports failures

### Gas Price Management

- Default multiplier (1.2x) provides reasonable priority
- Monitor gas prices during execution
- Adjust `--gas-multiplier` based on network congestion
- Consider using EIP-1559 gas estimation for compatible networks

## Troubleshooting

### Common Issues

#### "No contract deployed at this address"

**Cause**: Invalid contract address or wrong network
**Solution**: Verify contract address and ensure RPC endpoint matches deployment network

```bash
# Verify contract code exists
cast code 0xYourContractAddress --rpc-url $RPC_URL
```

#### "Insufficient NFTs"

**Cause**: Account doesn't own enough undelegated NFTs
**Solution**: Check required amount: `delegates × tokens-per-tx`

```bash
# Check NFT balance
cast call 0xNFTContract "balanceOf(address)" $YOUR_ADDRESS --rpc-url $RPC_URL
```

#### "Transaction reverted"

**Cause**: Various contract-level errors (already delegated, not owner, invalid proof)
**Solution**: Check contract events and error messages

Enable verbose logging for detailed error information.

#### "Rate limit exceeded"

**Cause**: RPC provider rate limits
**Solution**:
- Use paid RPC endpoint with higher limits
- Add delays between operations
- Use local Ethereum node

### Debug Mode

For verbose output during tree reconstruction:

```go
// In internal/merkle/tree.go, add debug logging:
fmt.Printf("DEBUG: Fetching account at index %d\n", index)
```

## Testing on Sepolia

### Setup

1. Get Sepolia testnet ETH from faucets:
   - https://sepoliafaucet.com/
   - https://www.alchemy.com/faucets/ethereum-sepolia

2. Deploy test contract or use existing deployment

3. Mint test NFTs to your address

### Test Run

```bash
./bin/delegate \
  --contract 0xYourSepoliaContract \
  --rpc https://sepolia.infura.io/v3/YOUR_KEY \
  --private-key YOUR_TEST_KEY \
  --delegates 3 \
  --tokens-per-tx 5 \
  --confirmations 1 \
  --dry-run  # Remove after verifying parameters
```

### Verify Results

Check delegations on Etherscan:
- View contract state: `https://sepolia.etherscan.io/address/0xYourContract#readContract`
- View transactions: `https://sepolia.etherscan.io/address/0xYourAddress`
- Query `weightOf(address)` to verify delegation weights

## Performance

### Benchmarks

Typical execution times on Sepolia testnet:

| Operation | Time |
|-----------|------|
| Connection and contract loading | ~1-2 seconds |
| NFT discovery (100 tokens, enumerable) | ~5-10 seconds |
| NFT discovery (100 tokens, scan) | ~30-60 seconds |
| Merkle tree reconstruction (100 participants) | ~15-30 seconds |
| Transaction submission | ~1-2 seconds |
| Confirmation wait (1 confirmation) | ~12-15 seconds |

**Full execution (5 delegates, 10 tokens each)**: ~2-3 minutes on Sepolia

### Optimization Tips

1. **Use enumerable collections**: ~10x faster NFT discovery
2. **Increase batch size**: `--tokens-per-tx 20` reduces transaction count
3. **Parallel-compatible RPC**: Some endpoints support higher concurrency
4. **Local tree caching**: Consider implementing persistent cache for large trees

## License

This tool is part of the DavinciDAO project. See parent repository for license information.

## Support

For issues, questions, or contributions:
- Open an issue in the main repository
- Check existing documentation at `/claude.md`
- Review Solidity contracts in `/src/Davincidao.sol`

## Changelog

### v1.0 (Initial Release)

- ✅ Automated batch delegation to multiple addresses
- ✅ NFT discovery with enumerable and scan fallback
- ✅ Merkle proof generation using Poseidon hash
- ✅ Comprehensive gas cost reporting
- ✅ Dry-run mode for testing
- ✅ Configurable gas price multiplier
- ✅ Transaction confirmation tracking
- ✅ Detailed progress logging
