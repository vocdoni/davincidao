# DAVINCI Manifesto - Web Interface

Web application for signing the DAVINCI Manifesto on-chain with cryptographic proof via Merkle trees.

## How It Works

The `WeAreNotSpectatorsManifestoCensus` smart contract stores the full manifesto text on-chain and maintains an append-only Merkle tree of all signers. When you sign:

1. Contract verifies you haven't signed before
2. Your address is added to a Lean-IMT Merkle tree
3. A new census root is generated
4. The root can be used by external contracts for trustless voting

**Key Contract Functions:**
- `pledge()` - Sign the manifesto (one-time action)
- `hasPledged(address)` - Check if address has signed
- `getCensusRoot()` - Get current Merkle root of all signers
- `getRootBlockNumber(uint256)` - Validate a census root (ICensusValidator interface)

## Full Deployment Guide

### 1. Deploy Smart Contract

```bash
cd /path/to/davincidao
forge build
forge test

# Deploy to your target network
forge script deployments/manifesto/deploy.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY

# Note the deployed contract address
```

### 2. Deploy Subgraph (Optional)

The subgraph indexes pledge events for efficient querying.

```bash
cd subgraph
npm install

# Update subgraph.yaml with contract address and startBlock
nano subgraph.yaml

# Build and deploy
npx graph codegen
npx graph build
npx graph auth --studio $DEPLOY_KEY
npx graph deploy --studio we-are-not-spectators
```

### 3. Configure Webapp

```bash
cd webapp
npm install

# Create environment configuration
cat > .env << 'EOF'
VITE_CHAIN_ID=8453  # Base=8453, Arbitrum=42161, Optimism=10, Polygon=137, Ethereum=1, Sepolia=11155111
VITE_CONTRACT_ADDRESS=0x...  # Your deployed contract
VITE_SUBGRAPH_ENDPOINT=https://api.studio.thegraph.com/query/.../...  # Optional
VITE_BLOCK_EXPLORER_URL=https://basescan.org  # Network block explorer
EOF
```

**Supported Networks:**
- Base (8453) - 4 RPC endpoints with automatic failover
- Arbitrum (42161)
- Optimism (10)
- Polygon (137)
- Ethereum Mainnet (1)
- Sepolia Testnet (11155111)

### 4. Build and Deploy Webapp

```bash
# Development server
npm run dev

# Production build
npm run build

# Deploy dist/ to your hosting service
```

**Deployment Options:**
- **Vercel:** `vercel --prod`
- **Netlify:** `netlify deploy --prod --dir=dist`
- **IPFS:** `ipfs add -r dist/`
- **Any static hosting:** Upload `dist/` folder

## Using the Interface

### For Signers

1. **Connect Wallet** - Click "Connect Wallet" button (MetaMask, WalletConnect, etc.)
2. **Review Manifesto** - Read the full manifesto text displayed in parchment style
3. **Sign** - Click "Sign the Manifesto" button to send transaction
4. **Confirm** - Approve the transaction in your wallet (costs gas)
5. **Done** - Your address is now permanently recorded in the census

### For Verifiers

**Check if an address has signed:**
1. Scroll to "Check Address" card
2. Enter Ethereum address or ENS name
3. See pledge status and timestamp

**View Census Info:**
- Current Merkle root (for voting contracts)
- Total number of pledges
- Latest update block number

### For Developers

**Query contract directly:**
```javascript
import { ethers } from 'ethers'

const contract = new ethers.Contract(
  '0x...', // Contract address
  ['function hasPledged(address) view returns (bool)',
   'function getCensusRoot() view returns (uint256)',
   'function pledgeTimestamp(address) view returns (uint256)'],
  provider
)

const hasSigned = await contract.hasPledged('0x...')
const root = await contract.getCensusRoot()
```

**Query subgraph:**
```graphql
query {
  globalStats(id: "global") {
    totalPledges
    currentRoot
  }
  signer(id: "0x...") {
    address
    pledgeTimestamp
    treeIndex
  }
}
```

## Technical Stack

- **React** + **TypeScript** - Type-safe UI
- **ethers.js v6** - Blockchain interactions
- **Vite** - Fast builds and dev server
- **Tailwind CSS** - Styling
- **Multi-RPC Failover** - 99.9%+ uptime on Base network

## License

MIT License

---

**Made with ❤️ for collective freedom**

#WeAreNotSpectators
