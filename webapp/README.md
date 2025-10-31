# DavinciDAO Census Manager - Web Application

A React-based web application for managing NFT delegations in the DavinciDAO Census system.

## Features

- Connect wallets (MetaMask, WalletConnect)
- View your ERC-721 NFT holdings
- Delegate voting power to representatives
- Manage and update existing delegations
- Visualize the Merkle tree census
- Real-time weight and root tracking

## Quick Start

### 1. Install Dependencies

```bash
cd webapp
npm install
```

### 2. Configure Environment

Create a `.env` file:

```env
VITE_CONTRACT_ADDRESS=0x...                            # Your deployed contract address
VITE_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/... # RPC endpoint
VITE_CHAIN_ID=1                                       # Network chain ID
VITE_ALCHEMY_API_KEY=...                               # Alchemy API key for NFT discovery
VITE_SUBGRAPH_ENDPOINT=https://api.studio.thegraph.com/query/...  # Subgraph endpoint
VITE_BLOCK_EXPLORER_URL=https://etherscan.io          # Block explorer URL
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Configuration

### Required Environment Variables

- `VITE_CONTRACT_ADDRESS` - Deployed DavinciDAO contract address
- `VITE_RPC_URL` - Ethereum RPC endpoint
- `VITE_CHAIN_ID` - Network chain ID (1 for mainnet, 11155111 for Sepolia)
- `VITE_ALCHEMY_API_KEY` - Alchemy API key for NFT discovery
- `VITE_SUBGRAPH_ENDPOINT` - The Graph subgraph endpoint for delegation queries

### Optional Environment Variables

- `VITE_BLOCK_EXPLORER_URL` - Block explorer URL (default: etherscan.io)
- `VITE_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID
- `VITE_MINTING_PAGE_URL` - Link to NFT minting page (if available)

## Usage

1. **Connect Wallet** - Click "Connect Wallet" and select your wallet provider
2. **View NFTs** - Your owned NFTs will be displayed, grouped by delegation status
3. **Delegate** - Select NFTs and delegate them to a representative address
4. **Update Delegation** - Move existing delegations to a different representative
5. **Undelegate** - Remove delegation and reclaim voting power

## Technology Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **ethers.js** - Ethereum library
- **TailwindCSS** - Styling
- **React Query** - Data fetching
- **WalletConnect** - Multi-wallet support

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Troubleshooting

### Wallet Connection Issues
- Ensure you're on the correct network (check `VITE_CHAIN_ID`)
- Try refreshing the page
- Clear browser cache and reload

### NFTs Not Appearing
- Verify `VITE_ALCHEMY_API_KEY` is correctly set
- Check that you own NFTs from the configured collections
- Wait a few seconds for NFT discovery to complete

### Transaction Failures
- Ensure you have enough ETH for gas fees
- Verify you own the NFTs you're trying to delegate
- Check that the subgraph is properly indexed

### Contract Errors
- Verify the contract address in `VITE_CONTRACT_ADDRESS`
- Ensure the contract is deployed on the network specified by `VITE_CHAIN_ID`
- Check RPC endpoint is accessible

## License

MIT License
