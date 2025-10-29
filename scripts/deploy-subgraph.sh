#!/bin/bash
# Deploy or update the subgraph to The Graph

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SUBGRAPH_DIR="$ROOT_DIR/subgraph"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get contract address from argument or from .last_deployed_contract file
if [ -n "$1" ]; then
    CONTRACT_ADDRESS="$1"
elif [ -f "$ROOT_DIR/.last_deployed_contract" ]; then
    CONTRACT_ADDRESS=$(cat "$ROOT_DIR/.last_deployed_contract")
else
    echo -e "${YELLOW}Warning: No contract address provided${NC}"
    echo "Using address from existing subgraph.yaml"
    CONTRACT_ADDRESS=$(grep -oP 'address: "\K0x[a-fA-F0-9]{40}' "$SUBGRAPH_DIR/subgraph.yaml" | head -1)
fi

# Get start block from argument or detect from chain
START_BLOCK="${2:-}"

echo "==========================================="
echo "  Subgraph Deployment"
echo "==========================================="
echo

# Check if subgraph directory exists
if [ ! -d "$SUBGRAPH_DIR" ]; then
    echo -e "${RED}Error: Subgraph directory not found at $SUBGRAPH_DIR${NC}"
    exit 1
fi

cd "$SUBGRAPH_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing subgraph dependencies...${NC}"
    npm install
fi

# Update subgraph.yaml with new contract address if provided
if [ -n "$CONTRACT_ADDRESS" ]; then
    echo "Updating subgraph.yaml with contract address: $CONTRACT_ADDRESS"

    # Load root .env for RPC_URL if available
    if [ -f "$ROOT_DIR/.env" ]; then
        set -a
        source "$ROOT_DIR/.env"
        set +a
    fi

    # Detect start block if not provided
    if [ -z "$START_BLOCK" ] && [ -n "$RPC_URL" ]; then
        echo -e "${YELLOW}Detecting deployment block...${NC}"
        START_BLOCK=$(cast block latest --rpc-url "$RPC_URL" | grep -oP 'number\s+\K\d+')
        echo "Using block: $START_BLOCK"
    fi

    # Update contract address in subgraph.yaml
    sed -i.bak "s/address: \"0x[a-fA-F0-9]\{40\}\"/address: \"$CONTRACT_ADDRESS\"/" subgraph.yaml

    # Update start block if provided
    if [ -n "$START_BLOCK" ]; then
        sed -i.bak "s/startBlock: [0-9]*/startBlock: $START_BLOCK/" subgraph.yaml
    fi

    rm -f subgraph.yaml.bak
    echo -e "${GREEN}✓${NC} Updated subgraph.yaml"
fi

# Copy ABI from contract build
echo -e "${YELLOW}Copying contract ABI...${NC}"
if [ -f "$ROOT_DIR/out/DavinciDao.sol/DavinciDao.json" ]; then
    mkdir -p abis
    jq '.abi' "$ROOT_DIR/out/DavinciDao.sol/DavinciDao.json" > abis/DavinciDao.json
    echo -e "${GREEN}✓${NC} ABI copied"
else
    echo -e "${RED}Error: Contract ABI not found. Run 'forge build' first.${NC}"
    exit 1
fi

# Generate types
echo -e "${YELLOW}Generating subgraph types...${NC}"
graph codegen

# Build subgraph
echo -e "${YELLOW}Building subgraph...${NC}"
graph build

echo
echo -e "${GREEN}Subgraph built successfully!${NC}"
echo
echo "To deploy to The Graph Studio:"
echo "  1. Create a subgraph at: https://thegraph.com/studio/"
echo "  2. Get your deploy key"
echo "  3. Run: cd subgraph && graph auth --studio <DEPLOY_KEY>"
echo "  4. Run: graph deploy --studio <SUBGRAPH_NAME>"
echo
echo "Or for hosted service:"
echo "  graph auth --product hosted-service <ACCESS_TOKEN>"
echo "  graph deploy --product hosted-service <GITHUB_USER>/<SUBGRAPH_NAME>"
echo
