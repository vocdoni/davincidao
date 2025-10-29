#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Generating Go Bindings ===${NC}"

# Check if abigen is installed
if ! command -v abigen &> /dev/null; then
    echo -e "${RED}Error: abigen not found. Install it with:${NC}"
    echo "go install github.com/ethereum/go-ethereum/cmd/abigen@latest"
    exit 1
fi

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BINDINGS_DIR="$PROJECT_ROOT/bindings/go"

# Path to compiled contracts
CONTRACTS_DIR="$PROJECT_ROOT/../out"

# Ensure bindings directory exists
mkdir -p "$BINDINGS_DIR"

echo -e "${BLUE}Generating DavinciDao bindings...${NC}"

# Extract ABI and Bytecode from Foundry output
jq -r '.abi' "$CONTRACTS_DIR/DavinciDao.sol/DavinciDao.json" > /tmp/DavinciDao.abi
jq -r '.bytecode.object' "$CONTRACTS_DIR/DavinciDao.sol/DavinciDao.json" > /tmp/DavinciDao.bin

# Generate Go bindings
mkdir -p "$BINDINGS_DIR/census"

abigen \
    --abi /tmp/DavinciDao.abi \
    --bin /tmp/DavinciDao.bin \
    --pkg census \
    --type DavinciDao \
    --out "$BINDINGS_DIR/census/davincidao.go"

echo -e "${GREEN}✓ DavinciDao bindings generated${NC}"

# Generate ERC721 bindings for NFT interaction
echo -e "${BLUE}Generating ERC721 bindings...${NC}"

# Create a minimal ERC721 ABI for the functions we need
cat > /tmp/ERC721.abi << 'EOF'
[
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes4", "name": "interfaceId", "type": "bytes4"}],
    "name": "supportsInterface",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "uint256", "name": "index", "type": "uint256"}
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]
EOF

mkdir -p "$BINDINGS_DIR/erc721"

abigen \
    --abi /tmp/ERC721.abi \
    --pkg erc721 \
    --type ERC721 \
    --out "$BINDINGS_DIR/erc721/erc721.go"

echo -e "${GREEN}✓ ERC721 bindings generated${NC}"

# Cleanup
rm -f /tmp/DavinciDao.abi /tmp/DavinciDao.bin /tmp/ERC721.abi

echo -e "${GREEN}=== Bindings generation complete ===${NC}"
echo -e "Bindings location: ${BLUE}$BINDINGS_DIR${NC}"
