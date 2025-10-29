#!/bin/bash
# Update webapp .env file with contract address and other configuration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
WEBAPP_ENV="$ROOT_DIR/webapp/.env"

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
    echo -e "${RED}Error: No contract address provided and .last_deployed_contract not found${NC}"
    echo "Usage: $0 <contract_address>"
    exit 1
fi

# Validate contract address format
if [[ ! "$CONTRACT_ADDRESS" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo -e "${RED}Error: Invalid contract address format: $CONTRACT_ADDRESS${NC}"
    exit 1
fi

# Load root .env for configuration
if [ -f "$ROOT_DIR/.env" ]; then
    set -a
    source "$ROOT_DIR/.env"
    set +a
fi

echo "==========================================="
echo "  Updating Webapp Configuration"
echo "==========================================="
echo
echo "Contract Address: $CONTRACT_ADDRESS"
echo "Webapp .env: $WEBAPP_ENV"
echo

# Check if webapp/.env exists
if [ ! -f "$WEBAPP_ENV" ]; then
    echo -e "${YELLOW}Warning: webapp/.env not found, creating from template...${NC}"

    # Create webapp/.env with default values
    cat > "$WEBAPP_ENV" <<EOF
# DavinciDAO Census Contract Configuration
VITE_RPC_URL=${RPC_URL:-https://w3.ch4in.net/sepolia}
VITE_CHAIN_ID=11155111
VITE_ALCHEMY_API_KEY=${ALCHEMY_API_KEY:-}

VITE_CONTRACT_ADDRESS=$CONTRACT_ADDRESS
VITE_SUBGRAPH_ENDPOINT=${SUBGRAPH_ENDPOINT:-}

# Optional: Block Explorer
VITE_BLOCK_EXPLORER_URL=https://sepolia.etherscan.io

# Optional: NFT Minting Page
VITE_MINTING_PAGE_URL=${MINTING_PAGE_URL:-}

WEBAPP_PORT=8080
EOF
    echo -e "${GREEN}✓${NC} Created webapp/.env"
else
    # Update existing contract address
    if grep -q "^VITE_CONTRACT_ADDRESS=" "$WEBAPP_ENV"; then
        sed -i.bak "s/^VITE_CONTRACT_ADDRESS=.*/VITE_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" "$WEBAPP_ENV"
        echo -e "${GREEN}✓${NC} Updated VITE_CONTRACT_ADDRESS in webapp/.env"
    else
        echo "VITE_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" >> "$WEBAPP_ENV"
        echo -e "${GREEN}✓${NC} Added VITE_CONTRACT_ADDRESS to webapp/.env"
    fi

    # Backup
    rm -f "$WEBAPP_ENV.bak"
fi

echo
echo -e "${GREEN}Webapp configuration updated successfully!${NC}"
echo
echo "Current webapp configuration:"
grep -E "^VITE_(CONTRACT_ADDRESS|RPC_URL|SUBGRAPH_ENDPOINT)" "$WEBAPP_ENV" || true
echo
