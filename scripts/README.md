# DavinciDao Deployment Scripts

This directory contains utility scripts for deploying and managing the DavinciDao project.

## Available Scripts

### check-tools.sh
Validates that all required development tools are installed.

**Usage:**
```bash
./scripts/check-tools.sh
# or
make check-tools
```

**Checks for:**
- Foundry (forge, cast)
- Node.js & npm
- pnpm
- Graph CLI
- jq
- sed

### deploy-contract.sh
Deploys the DavinciDao smart contract to the configured network.

**Prerequisites:**
- `.env` file with `PRIVATE_KEY`, `RPC_URL`, and `ETHERSCAN_API_KEY`
- All tests passing

**Usage:**
```bash
./scripts/deploy-contract.sh
# or
make deploy-contract
```

**What it does:**
1. Runs all contract tests
2. Deploys contract using Foundry
3. Verifies contract on Etherscan (if API key provided)
4. Saves deployment log to `deploy.log`
5. Saves contract address to `.last_deployed_contract`

### update-webapp-env.sh
Updates the webapp's `.env` file with the deployed contract address.

**Usage:**
```bash
./scripts/update-webapp-env.sh <contract-address>
# or
make update-webapp-env CONTRACT=0x...
```

**What it does:**
1. Updates `VITE_CONTRACT_ADDRESS` in `webapp/.env`
2. Creates `webapp/.env` from template if it doesn't exist
3. Preserves other configuration values

### deploy-subgraph.sh
Prepares and builds the subgraph for deployment to The Graph.

**Usage:**
```bash
./scripts/deploy-subgraph.sh [contract-address] [start-block]
# or
make deploy-subgraph
```

**What it does:**
1. Updates `subgraph.yaml` with new contract address
2. Copies contract ABI from build artifacts
3. Generates subgraph types
4. Builds subgraph

**Manual deployment steps:**
```bash
cd subgraph
graph auth --studio <DEPLOY_KEY>
graph deploy --studio <SUBGRAPH_NAME>
```

### deploy-all.sh
Complete deployment pipeline that runs all steps in sequence.

**Usage:**
```bash
./scripts/deploy-all.sh
# or
make deploy-all
```

**Pipeline steps:**
1. Check required tools
2. Run Solidity tests
3. Deploy smart contract
4. Update webapp configuration
5. Prepare subgraph

## Environment Configuration

Create a `.env` file in the project root with:

```bash
# Required
PRIVATE_KEY=0x...
RPC_URL=https://...
ETHERSCAN_API_KEY=...

# Optional (for webapp)
ALCHEMY_API_KEY=...
SUBGRAPH_ENDPOINT=...
MINTING_PAGE_URL=...
```

## Common Workflows

### Fresh Deployment
```bash
make deploy-all
```

### Redeploy Only Contract
```bash
make deploy-contract
make update-webapp-env
```

### Update Subgraph Only
```bash
make deploy-subgraph
cd subgraph
graph deploy --studio davincidao
```

### Development
```bash
# Watch and rebuild on changes
make watch

# Run tests
make test

# Run tests with verbose output
make test-verbose

# Check gas usage
make test-gas
```

### Webapp Development
```bash
# Install dependencies
make webapp-install

# Start dev server
make webapp-dev

# Build for production
make webapp-build
```

## Troubleshooting

### "Tool not found" errors
Run `make check-tools` to see which tools need to be installed.

### Deployment fails
Check:
1. `.env` file exists and has correct values
2. Deployer account has sufficient funds
3. RPC URL is accessible
4. Tests pass with `make test`

### Subgraph deployment fails
Ensure:
1. Contract is deployed and verified
2. ABI is up to date (`make build`)
3. You're authenticated with The Graph (`graph auth`)

## Script Locations

All scripts are in the `scripts/` directory:
- `scripts/check-tools.sh`
- `scripts/deploy-contract.sh`
- `scripts/update-webapp-env.sh`
- `scripts/deploy-subgraph.sh`
- `scripts/deploy-all.sh`

## Integration with Makefile

All scripts can be run through the Makefile. Run `make help` to see all available targets.
