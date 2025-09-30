# DavinciDAO Census Manager - Web Application

A React-based web application for managing NFT delegations in the DavinciDAO Census system with support for both ERC721 and ERC1155 tokens.

## Features

### ERC1155 Token ID Support
- **Explicit Token ID Declaration**: ERC1155 collections require specific token IDs to be declared at deployment
- **Token ID Discovery**: Automatically fetches valid token IDs from the contract for efficient NFT discovery
- **Client-side Validation**: Validates token IDs before attempting delegation to prevent failed transactions
- **UI Display**: Shows valid token IDs for each ERC1155 collection in the interface

### Core Functionality
- **Multi-Collection Support**: Handles both ERC721 and ERC1155 NFT collections
- **Smart NFT Discovery**: Efficiently discovers owned NFTs using multiple fallback methods
- **Delegation Management**: Delegate, update, and revoke NFT voting power
- **Merkle Tree Reconstruction**: Rebuild the complete census tree for proof generation
- **Real-time Updates**: Live census root and voting weight tracking

## Setup Instructions

### 1. Install Dependencies
```bash
cd webapp
npm install
# or
pnpm install
```

### 2. Configure Environment
Copy the example environment file and update it:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Default contract address (can be overridden via URL)
VITE_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
VITE_RPC_URL=https://sepolia.infura.io/v3/your-project-id
VITE_CHAIN_ID=11155111
VITE_BLOCK_EXPLORER_URL=https://sepolia.etherscan.io

# Optional: WalletConnect Project ID
WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
```

### 3. Deploy the Contract
Before running the webapp, you need to deploy the DavinciDAO contract:

```bash
# From the project root directory
forge script script/DeployDavinciDao.s.sol \
  --rpc-url https://sepolia.infura.io/v3/your-project-id \
  --private-key your-private-key \
  --broadcast
```

### 4. Run the Development Server
```bash
npm run dev
# or
pnpm dev
```

### 5. Connect to Different Contracts

You can connect to different contract addresses in several ways:

#### Method 1: URL-based (Recommended)
Navigate directly to a contract address via URL:
```
http://localhost:5173/0x1234567890123456789012345678901234567890
```

#### Method 2: UI Input
1. Open the webapp
2. In the sidebar, find the "Contract Configuration" section
3. Click "Change" next to the current contract address
4. Enter the new contract address and click "Connect"

#### Method 3: Copy Shareable URL
1. Click "Copy URL" in the Contract Configuration section
2. Share the URL with others to connect to the same contract

## Docker Deployment

### Prerequisites
- Docker and Docker Compose installed on your system
- Environment variables configured (see below)

### Quick Start with Docker Compose

1. **Copy the environment file**:
```bash
cd webapp
cp .env.docker.example .env
```

2. **Edit the `.env` file** with your configuration:
```bash
# Update these values in .env
VITE_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
VITE_RPC_URL=https://sepolia.infura.io/v3/your-project-id
VITE_ALCHEMY_API_KEY=your-alchemy-api-key-here
```

3. **Start the application**:
```bash
docker-compose up -d
```

4. **Access the application**:
Open your browser and navigate to `http://localhost:8080`

### Manual Docker Build

If you prefer to build and run manually:

```bash
# Build the image
docker build -t davincidao-webapp .

# Run with environment variables
docker run -p 8080:80 \
  -e VITE_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890 \
  -e VITE_RPC_URL=https://sepolia.infura.io/v3/your-project-id \
  -e VITE_ALCHEMY_API_KEY=your-alchemy-api-key \
  davincidao-webapp
```

### Development with Docker

For development with hot reload:

```bash
# Start development container
docker-compose --profile dev up webapp-dev

# Access at http://localhost:5173
```

### Environment Configuration

The Docker setup uses environment variables at runtime (not build time). Configure these in your `.env` file:

```bash
# Required
VITE_CONTRACT_ADDRESS=0x58A4a476d0990dE4F77f230Bc4ebFFD0803397C9
VITE_RPC_URL=https://w3.ch4in.net/sepolia
VITE_CHAIN_ID=11155111
VITE_ALCHEMY_API_KEY=your-alchemy-api-key-here

# Optional
WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
VITE_BLOCK_EXPLORER_URL=https://sepolia.etherscan.io
VITE_MINTING_PAGE_URL=https://your-minting-site.com
```

### Docker Features

The improved Docker setup includes:

- **Clean multi-stage build**: Dependencies → Build → Production
- **No .env copying**: Environment variables injected at runtime
- **Separate nginx config**: Easy to customize and maintain
- **Health checks**: Built-in health endpoint at `/health`
- **Security headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **Performance optimization**: Gzip compression and static asset caching
- **Development support**: Hot reload container for development
- **Production ready**: Optimized for deployment (~30MB final image)

### Docker Commands

```bash
# Production deployment
docker-compose up -d

# Development with hot reload
docker-compose --profile dev up webapp-dev

# View logs
docker-compose logs -f webapp

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build -d
```

### Health Check

The application includes a health check endpoint:
- **URL**: `http://localhost:8080/health`
- **Response**: `healthy`
- **Use**: Container orchestration and monitoring

## Contract Integration

### ERC1155 Token ID Configuration
When deploying the contract with ERC1155 collections, you must specify valid token IDs:

```solidity
// Example deployment with ERC1155 collection
address[] memory tokens = [erc1155Address];
TokenStandard[] memory standards = [TokenStandard.ERC1155];
uint256[][] memory tokenIds = [[100, 200, 300]]; // Valid token IDs

DavinciDaoCensus census = new DavinciDaoCensus(tokens, standards, tokenIds);
```

### Multi-Collection Setup
The contract supports multiple collections of different types:

```solidity
address[] memory tokens = [erc721Address, erc1155Address];
TokenStandard[] memory standards = [TokenStandard.ERC721, TokenStandard.ERC1155];
uint256[][] memory tokenIds = [
  [], // Empty for ERC721 (any owned token can be delegated)
  [100, 200, 300] // Specific token IDs for ERC1155
];
```

## Usage Guide

### 1. Connect Wallet
- Click "Connect Wallet" to connect your Web3 wallet
- The app will automatically enforce the network configured in your `.env` file
- If you're on the wrong network, you'll see a warning banner with a "Switch Network" button
- For WalletConnect users, only the configured network will be available for connection

### 2. View Collections
The sidebar displays all configured collections with:
- Collection index and type (ERC721/ERC1155)
- Contract address
- Valid token IDs (for ERC1155 collections)

### 3. Manage Delegations
- **View NFTs**: Your owned NFTs are grouped by collection and current delegation
- **Delegate**: Click "Delegate" to assign voting power to another address
- **Update**: Click "Update" to change existing delegations
- **Batch Operations**: Delegate multiple NFTs from the same collection at once

### 4. Monitor Census
- **Census Root**: View the current Merkle tree root
- **Voting Weight**: See your total delegated voting power
- **Tree Reconstruction**: Rebuild the complete census tree for advanced operations

## Key Improvements for ERC1155

### 1. Efficient Token Discovery
- **Primary Method**: Fetches valid token IDs directly from the DavinciDAO contract
- **Fallback Methods**: Uses contract enumeration and pattern matching if needed
- **Performance**: Only checks declared token IDs instead of scanning ranges

### 2. Enhanced Security
- **Token ID Validation**: Prevents delegation of undeclared ERC1155 tokens
- **Client-side Checks**: Validates token IDs before sending transactions
- **Clear Error Messages**: Provides specific feedback for invalid operations

### 3. Better User Experience
- **Transparent Configuration**: Shows valid token IDs for each collection
- **Smart Grouping**: Groups NFTs by collection and delegation status
- **Batch Operations**: Allows efficient management of multiple NFTs

## Network Configuration

### Automatic Network Enforcement
The webapp automatically enforces the network configured in your environment variables:

1. **WalletConnect (AppKit)**: Only the configured network is available in the connection modal
2. **Injected Wallets (MetaMask, etc.)**: Automatic network switching with user confirmation
3. **Private Key Connections**: Always use the configured network's RPC endpoint

### Network Switching
When connected to the wrong network:
- A yellow warning banner appears at the top of the page
- Click "Switch Network" to automatically switch (for compatible wallets)
- If automatic switching fails, manually switch in your wallet

### Supported Networks
The app dynamically supports any EVM-compatible network by configuring:
```env
VITE_CHAIN_ID=11155111        # Network chain ID
VITE_RPC_URL=https://...      # RPC endpoint
VITE_BLOCK_EXPLORER_URL=...   # Block explorer URL
```

Common networks are pre-configured:
- Ethereum Mainnet (1)
- Sepolia Testnet (11155111)
- Polygon (137)
- Base (8453)
- Arbitrum (42161)
- Optimism (10)

For custom networks, the app will create a network definition automatically using your ENV configuration.

## Troubleshooting

### Network Issues

#### Wrong Network Warning
If you see "You're connected to the wrong network":
1. **Click "Switch Network"**: The app will attempt to switch automatically
2. **Manual Switch**: If automatic switching fails, switch manually in your wallet
3. **Check Configuration**: Verify `VITE_CHAIN_ID` matches your intended network
4. **WalletConnect Users**: Disconnect and reconnect - only the correct network will be available

#### Network Not Added to Wallet
If your wallet doesn't have the configured network:
1. The app will attempt to add it automatically when you click "Switch Network"
2. Approve the "Add Network" request in your wallet
3. The network will be added with the RPC URL and block explorer from your ENV configuration

### Contract Not Found Error
If you see "No contract deployed at address [ADDRESS]":
1. **Verify Deployment**: Check that the contract is actually deployed at the specified address using a block explorer
2. **Network Mismatch**: Ensure you're connected to the correct network (check the warning banner)
3. **RPC Issues**: Verify the RPC URL is working correctly in your `.env` file
4. **Contract Address**: Double-check the contract address format (must be a valid 42-character hex string starting with 0x)

**Quick Fix**: Use the "Change" button in the Contract Configuration panel to enter a different contract address, or deploy a new contract using the deployment script.

### URL-Based Contract Loading
When using URL-based contract addresses (`localhost:3000/0x...`):
1. **Invalid Address Format**: The URL must contain a valid 42-character Ethereum address
2. **Contract Validation**: The webapp will automatically validate the address format before attempting to connect
3. **Browser Navigation**: Use browser back/forward buttons to navigate between different contracts
4. **Shareable URLs**: Copy the current URL to share specific contract instances with others

### NFT Discovery Issues
If NFTs aren't being discovered:
1. **Interface Support**: Check that the NFT contracts support the required ERC721/ERC1155 interfaces
2. **Token Ownership**: Verify token ownership using a block explorer like Etherscan
3. **ERC1155 Configuration**: For ERC1155, ensure token IDs are properly configured in the DavinciDAO contract
4. **Network Sync**: Wait for the blockchain to sync if you recently acquired NFTs

### Transaction Failures
If delegations fail:
1. **Token Ownership**: Ensure you own the NFTs you're trying to delegate
2. **Valid Token IDs**: For ERC1155, verify the token IDs are in the contract's valid list
3. **Gas Limits**: Check that you have sufficient ETH for gas fees
4. **Network Congestion**: Try increasing gas price during high network usage
5. **Contract State**: Ensure the contract is not paused or has other restrictions

### Common Error Messages

#### "missing revert data" or "CALL_EXCEPTION"
- **Cause**: Contract doesn't exist at the specified address
- **Solution**: Verify contract deployment and address

#### "Contract call failed"
- **Cause**: Contract exists but the specific function call failed
- **Solution**: Check contract state and function parameters

#### "Invalid Ethereum address format"
- **Cause**: The provided address is not a valid Ethereum address
- **Solution**: Ensure address is 42 characters long and starts with 0x

#### "ProofRequired" error during delegation
- **Cause**: The contract requires Merkle proofs for the operation
- **Solution**: Use the "Reconstruct Tree" feature first to generate proper proofs

## Development

### Project Structure
```
webapp/
├── src/
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility libraries
│   │   ├── contract.ts    # Contract interaction logic
│   │   ├── constants.ts   # Contract ABI and configuration
│   │   └── merkle.ts      # Merkle tree utilities
│   ├── types/         # TypeScript type definitions
│   └── styles/        # CSS styles
├── .env               # Environment configuration
└── package.json       # Dependencies and scripts
```

### Key Files
- **`lib/contract.ts`**: Main contract interaction class with ERC1155 support
- **`lib/constants.ts`**: Contract ABI including new `getCollectionTokenIds` function
- **`types/index.ts`**: TypeScript interfaces including updated Collection type
- **`App.tsx`**: Main application component with delegation management UI

## Contributing

When making changes to the contract interface:
1. Update the ABI in `lib/constants.ts`
2. Update TypeScript types in `types/index.ts`
3. Update contract interaction methods in `lib/contract.ts`
4. Test with both ERC721 and ERC1155 collections
