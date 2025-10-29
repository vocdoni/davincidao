#!/bin/bash
# Deploy the DavinciDao smart contract

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load environment variables
if [ -f "$ROOT_DIR/.env" ]; then
    set -a
    source "$ROOT_DIR/.env"
    set +a
    echo -e "${GREEN}✓${NC} Loaded environment from .env"
else
    echo -e "${RED}Error: .env file not found in $ROOT_DIR${NC}"
    exit 1
fi

# Validate required environment variables
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}Error: PRIVATE_KEY not set in .env${NC}"
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo -e "${RED}Error: RPC_URL not set in .env${NC}"
    exit 1
fi

if [ -z "$ETHERSCAN_API_KEY" ]; then
    echo -e "${YELLOW}Warning: ETHERSCAN_API_KEY not set. Contract verification will be skipped.${NC}"
    VERIFY_FLAG=""
else
    VERIFY_FLAG="--verify --etherscan-api-key $ETHERSCAN_API_KEY"
fi

echo "==========================================="
echo "  DavinciDao Contract Deployment"
echo "==========================================="
echo
echo "RPC URL: $RPC_URL"
echo "Deployer: $(cast wallet address $PRIVATE_KEY)"
echo

# Run tests first
echo -e "${YELLOW}Running tests before deployment...${NC}"
forge test

echo
echo -e "${GREEN}✓${NC} All tests passed!"
echo
echo -e "${YELLOW}Deploying contract...${NC}"

# Deploy the contract
cd "$ROOT_DIR"
forge script script/DeployDavinciDao.s.sol \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --broadcast \
    $VERIFY_FLAG \
    2>&1 | tee deploy.log

# Extract contract address from deployment log
CONTRACT_ADDRESS=$(grep -oP 'Contract deployed at: \K0x[a-fA-F0-9]{40}' deploy.log | head -1)

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo -e "${RED}Error: Failed to extract contract address from deployment log${NC}"
    exit 1
fi

echo
echo "==========================================="
echo -e "${GREEN}  Deployment Complete!${NC}"
echo "==========================================="
echo
echo "Contract Address: $CONTRACT_ADDRESS"
echo
echo "Next steps:"
echo "  1. Update webapp/.env with: VITE_CONTRACT_ADDRESS=$CONTRACT_ADDRESS"
echo "  2. Update subgraph/subgraph.yaml with the new contract address"
echo "  3. Deploy the subgraph: make deploy-subgraph"
echo

# Save contract address to a temp file for other scripts
echo "$CONTRACT_ADDRESS" > "$ROOT_DIR/.last_deployed_contract"
