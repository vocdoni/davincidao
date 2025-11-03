#!/bin/bash

set -e

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

DEPLOYMENT_NAME=$1

if [ -z "$DEPLOYMENT_NAME" ]; then
    echo -e "${RED}Error: Deployment name required${NC}"
    exit 1
fi

DEPLOYMENT_DIR="deployments/$DEPLOYMENT_NAME"
DEPLOY_SCRIPT="$DEPLOYMENT_DIR/deploy.sol"

if [ ! -f "$DEPLOY_SCRIPT" ]; then
    echo -e "${RED}Error: Deploy script not found: $DEPLOY_SCRIPT${NC}"
    exit 1
fi

# Load .env if exists
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Function to prompt for value
prompt_value() {
    local var_name=$1
    local prompt_msg=$2
    local default_value=$3
    local current_value="${!var_name}"

    if [ -n "$current_value" ]; then
        echo -e "${GREEN}Using $var_name from .env: $current_value${NC}"
        echo "$current_value"
    else
        if [ -n "$default_value" ]; then
            read -p "$(echo -e ${YELLOW}$prompt_msg [default: $default_value]: ${NC})" value
            echo "${value:-$default_value}"
        else
            read -p "$(echo -e ${YELLOW}$prompt_msg: ${NC})" value
            echo "$value"
        fi
    fi
}

# Function to detect network from RPC URL
detect_network() {
    local rpc_url=$1
    if [[ $rpc_url == *"sepolia"* ]]; then
        echo "sepolia"
    elif [[ $rpc_url == *"base"* ]]; then
        echo "base"
    elif [[ $rpc_url == *"mainnet"* ]] || [[ $rpc_url == *"ethereum"* ]]; then
        echo "mainnet"
    else
        echo "unknown"
    fi
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 1: Gathering Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get configuration
PRIVATE_KEY=$(prompt_value "PRIVATE_KEY" "Enter private key (with 0x prefix)" "")
RPC_URL=$(prompt_value "RPC_URL" "Enter RPC URL" "https://w3.ch4in.net/sepolia")
ETHERSCAN_API_KEY=$(prompt_value "ETHERSCAN_API_KEY" "Enter Etherscan API key (optional for verification)" "")

# Detect network
NETWORK=$(detect_network "$RPC_URL")
echo -e "${GREEN}Detected network: $NETWORK${NC}"

# Get subgraph configuration if needed
GRAPH_DEPLOY_KEY=$(prompt_value "GRAPH_DEPLOY_KEY" "Enter Graph deploy key (for subgraph deployment)" "")
GRAPH_SLUG=$(prompt_value "GRAPH_SLUG" "Enter Graph subgraph slug" "$DEPLOYMENT_NAME")

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 2: Building Smart Contract${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

forge build

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 3: Deploying Smart Contract${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Deploy contract and capture output
DEPLOY_OUTPUT=$(forge script "$DEPLOY_SCRIPT" \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --broadcast 2>&1)

echo "$DEPLOY_OUTPUT"

# Extract contract address from deployment output
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP "Contract deployed at: \K(0x[a-fA-F0-9]{40})" | head -1)

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo -e "${RED}Error: Failed to extract contract address from deployment${NC}"
    echo -e "${YELLOW}Trying alternative extraction method...${NC}"
    CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP "0x[a-fA-F0-9]{40}" | head -1)
fi

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo -e "${RED}Error: Could not determine contract address${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Contract deployed at: $CONTRACT_ADDRESS${NC}"

# Save deployment info
echo "DEPLOYMENT_NAME=$DEPLOYMENT_NAME" > ".deployment-$DEPLOYMENT_NAME.env"
echo "CONTRACT_ADDRESS=$CONTRACT_ADDRESS" >> ".deployment-$DEPLOYMENT_NAME.env"
echo "NETWORK=$NETWORK" >> ".deployment-$DEPLOYMENT_NAME.env"
echo "RPC_URL=$RPC_URL" >> ".deployment-$DEPLOYMENT_NAME.env"
echo "DEPLOYED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> ".deployment-$DEPLOYMENT_NAME.env"

# Get deployment block number
BLOCK_NUMBER=$(cast block-number --rpc-url "$RPC_URL" 2>/dev/null || echo "")
if [ -n "$BLOCK_NUMBER" ]; then
    echo "START_BLOCK=$BLOCK_NUMBER" >> ".deployment-$DEPLOYMENT_NAME.env"
    echo -e "${GREEN}Deployment block: $BLOCK_NUMBER${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 4: Updating Subgraph Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Update subgraph.yaml with new contract address
SUBGRAPH_YAML="subgraph/subgraph.yaml"

if [ -f "$SUBGRAPH_YAML" ]; then
    # Backup original
    cp "$SUBGRAPH_YAML" "$SUBGRAPH_YAML.bak"

    # Update contract address (convert to lowercase for subgraph)
    CONTRACT_LOWER=$(echo "$CONTRACT_ADDRESS" | tr '[:upper:]' '[:lower:]')
    sed -i "s/address: \"0x[a-fA-F0-9]\{40\}\"/address: \"$CONTRACT_LOWER\"/" "$SUBGRAPH_YAML"

    # Update network if needed
    sed -i "s/network: .*/network: $NETWORK/" "$SUBGRAPH_YAML"

    # Update start block if we have it
    if [ -n "$BLOCK_NUMBER" ]; then
        sed -i "s/startBlock: [0-9]*/startBlock: $BLOCK_NUMBER/" "$SUBGRAPH_YAML"
    fi

    echo -e "${GREEN}✓ Updated subgraph.yaml${NC}"
    echo -e "  Network: $NETWORK"
    echo -e "  Contract: $CONTRACT_LOWER"
    [ -n "$BLOCK_NUMBER" ] && echo -e "  Start block: $BLOCK_NUMBER"
else
    echo -e "${YELLOW}Warning: subgraph.yaml not found, skipping${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 5: Deploying Subgraph${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -n "$GRAPH_DEPLOY_KEY" ] && [ -n "$GRAPH_SLUG" ]; then
    cd subgraph

    # Generate code
    echo -e "${YELLOW}Generating subgraph code...${NC}"
    graph codegen

    # Build
    echo -e "${YELLOW}Building subgraph...${NC}"
    graph build

    # Deploy
    echo -e "${YELLOW}Deploying to The Graph...${NC}"
    graph deploy --studio "$GRAPH_SLUG" --deploy-key "$GRAPH_DEPLOY_KEY"

    cd ..

    SUBGRAPH_URL="https://api.studio.thegraph.com/query/YOUR_ID/$GRAPH_SLUG/version/latest"
    echo "SUBGRAPH_URL=$SUBGRAPH_URL" >> ".deployment-$DEPLOYMENT_NAME.env"

    echo -e "${GREEN}✓ Subgraph deployed${NC}"
    echo -e "${YELLOW}Note: Update the subgraph URL in .deployment-$DEPLOYMENT_NAME.env with your actual URL${NC}"
else
    echo -e "${YELLOW}Skipping subgraph deployment (no Graph deploy key or slug provided)${NC}"
    echo -e "${YELLOW}You can deploy later with:${NC}"
    echo -e "  cd subgraph && graph deploy --studio $GRAPH_SLUG"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 6: Configuring Webapp${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

WEBAPP_ENV="webapp/.env"

# Backup existing .env if it exists
if [ -f "$WEBAPP_ENV" ]; then
    cp "$WEBAPP_ENV" "$WEBAPP_ENV.bak.$(date +%s)"
    echo -e "${YELLOW}Backed up existing webapp/.env${NC}"
fi

# Create/update webapp/.env
cat > "$WEBAPP_ENV" << EOF
# Generated by deployment script on $(date)
# Deployment: $DEPLOYMENT_NAME
# Network: $NETWORK

VITE_CONTRACT_ADDRESS=$CONTRACT_ADDRESS
VITE_CHAIN_ID=$(case $NETWORK in sepolia) echo "11155111";; base) echo "8453";; *) echo "1";; esac)
VITE_RPC_URL=$RPC_URL
EOF

# Add subgraph URL if we have it
if [ -n "$SUBGRAPH_URL" ]; then
    echo "VITE_SUBGRAPH_URL=$SUBGRAPH_URL" >> "$WEBAPP_ENV"
elif [ -f ".deployment-$DEPLOYMENT_NAME.env" ]; then
    source ".deployment-$DEPLOYMENT_NAME.env"
    if [ -n "$SUBGRAPH_URL" ]; then
        echo "VITE_SUBGRAPH_URL=$SUBGRAPH_URL" >> "$WEBAPP_ENV"
    fi
fi

echo -e "${GREEN}✓ Updated webapp/.env${NC}"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}Summary:${NC}"
echo -e "  Deployment:    $DEPLOYMENT_NAME"
echo -e "  Network:       $NETWORK"
echo -e "  Contract:      $CONTRACT_ADDRESS"
[ -n "$BLOCK_NUMBER" ] && echo -e "  Block:         $BLOCK_NUMBER"
echo ""
echo -e "${GREEN}Configuration saved to:${NC}"
echo -e "  .deployment-$DEPLOYMENT_NAME.env"
echo -e "  webapp/.env"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo -e "  1. Verify contract (optional):"
echo -e "     make verify-contract CONTRACT=$CONTRACT_ADDRESS CHAIN_ID=$(case $NETWORK in sepolia) echo "11155111";; base) echo "8453";; *) echo "1";; esac)"
echo ""
echo -e "  2. Start webapp:"
echo -e "     make run"
echo ""
if [ -z "$GRAPH_DEPLOY_KEY" ]; then
    echo -e "  3. Deploy subgraph manually:"
    echo -e "     cd subgraph && graph deploy --studio YOUR_SLUG"
    echo ""
fi
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
