#!/bin/bash
# Check for required tools and provide installation instructions

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

MISSING_TOOLS=()

# Function to check if a command exists
check_command() {
    local cmd=$1
    local install_msg=$2

    if command -v "$cmd" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $cmd is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $cmd is not installed"
        MISSING_TOOLS+=("$install_msg")
        return 1
    fi
}

echo "Checking required tools..."
echo

# Check Foundry tools
check_command "forge" "Foundry (forge): curl -L https://foundry.paradigm.xyz | bash && foundryup"
check_command "cast" "Foundry (cast): included with forge installation"

# Check Node.js tools
check_command "node" "Node.js: https://nodejs.org/ or use nvm: https://github.com/nvm-sh/nvm"
check_command "npm" "npm: comes with Node.js"
check_command "pnpm" "pnpm: npm install -g pnpm"

# Check Graph CLI
check_command "graph" "Graph CLI: npm install -g @graphprotocol/graph-cli"

# Check other tools
check_command "jq" "jq: https://stedolan.github.io/jq/download/ or apt-get install jq / brew install jq"
check_command "sed" "sed: should be pre-installed on most systems"

echo

if [ ${#MISSING_TOOLS[@]} -eq 0 ]; then
    echo -e "${GREEN}All required tools are installed!${NC}"
    exit 0
else
    echo -e "${RED}Missing tools detected. Please install:${NC}"
    echo
    for tool in "${MISSING_TOOLS[@]}"; do
        echo -e "  ${YELLOW}•${NC} $tool"
    done
    echo
    exit 1
fi
