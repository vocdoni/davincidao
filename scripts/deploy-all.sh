#!/bin/bash
# Complete deployment pipeline: test, deploy contract, update configs, prepare subgraph

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "==========================================="
echo "  DavinciDao Complete Deployment Pipeline"
echo "==========================================="
echo

# Step 1: Check tools
echo -e "${BLUE}[1/5]${NC} Checking required tools..."
bash "$SCRIPT_DIR/check-tools.sh"

echo
echo -e "${BLUE}[2/5]${NC} Running Solidity tests..."
cd "$ROOT_DIR"
forge test

echo
echo -e "${GREEN}✓${NC} All tests passed!"

# Step 3: Deploy contract
echo
echo -e "${BLUE}[3/5]${NC} Deploying smart contract..."
bash "$SCRIPT_DIR/deploy-contract.sh"

# Get deployed contract address
if [ ! -f "$ROOT_DIR/.last_deployed_contract" ]; then
    echo -e "${RED}Error: Contract deployment failed${NC}"
    exit 1
fi

CONTRACT_ADDRESS=$(cat "$ROOT_DIR/.last_deployed_contract")
echo -e "${GREEN}✓${NC} Contract deployed: $CONTRACT_ADDRESS"

# Step 4: Update webapp configuration
echo
echo -e "${BLUE}[4/5]${NC} Updating webapp configuration..."
bash "$SCRIPT_DIR/update-webapp-env.sh" "$CONTRACT_ADDRESS"

# Step 5: Prepare subgraph
echo
echo -e "${BLUE}[5/5]${NC} Preparing subgraph..."
bash "$SCRIPT_DIR/deploy-subgraph.sh" "$CONTRACT_ADDRESS"

echo
echo "==========================================="
echo -e "${GREEN}  Deployment Pipeline Complete!${NC}"
echo "==========================================="
echo
echo "Summary:"
echo "  Contract Address: $CONTRACT_ADDRESS"
echo "  Webapp Config: ✓ Updated"
echo "  Subgraph: ✓ Built and ready"
echo
echo "Next steps:"
echo "  1. Deploy subgraph to The Graph Studio:"
echo "     cd subgraph"
echo "     graph auth --studio <DEPLOY_KEY>"
echo "     graph deploy --studio <SUBGRAPH_NAME>"
echo
echo "  2. Update webapp/.env with subgraph endpoint:"
echo "     VITE_SUBGRAPH_ENDPOINT=<your-subgraph-endpoint>"
echo
echo "  3. Start webapp:"
echo "     cd webapp"
echo "     pnpm install"
echo "     pnpm dev"
echo
