# DavinciDAO Census Contract - Technical Overview

## Project Summary

DavinciDAO Census Contract is a decentralized voting power management system that enables NFT holders to delegate their voting rights to representative addresses. The system uses cryptographic Merkle trees (specifically Lean Incremental Merkle Trees with Poseidon hash function) to maintain a verifiable, immutable census of voting weights. This creates a transparent and efficient mechanism for DAO governance where NFT ownership translates to delegatable voting power.

## Architecture Overview

### Smart Contract Layer

The core contract `DavinciDaoCensus` is written in Solidity 0.8.24 and implements a sophisticated delegation system using zero-knowledge cryptography primitives. The contract maintains:

1. **Lean-IMT Census Tree**: A Lean Incremental Merkle Tree that stores packed leaf values representing participant addresses and their accumulated voting weights. Each leaf contains 160 bits for the address (shifted left by 88 bits) and 88 bits for the weight, supporting up to 309,485,009,821,345,068,724,781,055 voting power per address.

2. **Delegation Registry**: A mapping that permanently tracks which specific NFTs (identified by collection index and token ID) are delegated to which addresses. This registry persists even when NFTs are transferred between owners.

3. **Reverse Index System**: A bidirectional mapping between Merkle tree indices and participant addresses, enabling efficient enumeration of all census participants without requiring off-chain indexing.

4. **Weight Accumulation**: Real-time tracking of each address's total voting weight, calculated as the sum of all NFTs delegated to that address across all configured collections.

### Client Application Layer

The TypeScript/React web application provides a user-friendly interface for delegation management. Built with modern web technologies including Vite, React Query, and Ethers.js v6, it implements:

1. **Merkle Tree Reconstruction Engine**: A sophisticated client-side system that reconstructs the on-chain Merkle tree by querying contract state. Features include progressive fetching with batch processing, exponential backoff retry logic for rate limiting, integrity verification via checksums, and a multi-tier caching system using browser localStorage.

2. **Proof Generation System**: Utilizes the official zk-kit Lean-IMT library with Poseidon-lite hash function to generate cryptographic proofs locally. This eliminates the need for centralized proof generation services.

3. **NFT Discovery Service**: Multi-strategy approach for finding user-owned NFTs: first attempts ERC721Enumerable interface (if supported), then falls back to Alchemy API integration for comprehensive NFT discovery across any ERC-721 contract.

4. **Wallet Integration**: Supports multiple connection methods including browser wallets via Reown AppKit, WalletConnect protocol, and private key authentication for programmatic access.

## Transaction Types and Mechanisms

### 1. Delegation Transaction

The delegation transaction allows NFT owners to assign their voting power to a representative address.

**Function Signature**: `delegate(address to, uint256 nftIndex, uint256[] ids, uint256[] toProof, ProofInput[] fromProofs)`

**Parameters**:
- `to`: The address receiving the delegated voting power
- `nftIndex`: Index identifying which NFT collection in the contract's collections array
- `ids`: Array of token IDs being delegated
- `toProof`: Merkle siblings path for the recipient's current leaf (empty array if first delegation to this address)
- `fromProofs`: Array of proof inputs for clearing inherited delegations from previous owners

**Process Flow**:
1. Validates all token IDs exist and caller owns them
2. Checks for inherited delegations (tokens delegated by previous owners)
3. Decreases weight for inherited delegates using their Merkle proofs
4. Updates delegation registry to point tokens to new delegate
5. Increases weight for new delegate, inserting new leaf if weight was zero
6. Emits Delegated events and CensusRootUpdated event with new Merkle root

**Example Scenario**: Alice owns NFT tokens 1, 2, and 3 from collection 0. She wants to delegate all three to Bob. If Bob has never received delegations before, Alice calls `delegate(bobAddress, 0, [1,2,3], [], [])` with empty proofs. The contract creates a new leaf for Bob with weight 3 and updates the census root. If Bob already has weight 5 from other delegations, Alice must provide Bob's current Merkle proof siblings, and Bob's leaf updates from weight 5 to weight 8.

**Gas Costs**: First delegation (insertion) approximately 200,000 gas. Weight update with proof approximately 300,000-600,000 gas depending on tree depth and number of inherited delegations.

### 2. Undelegation Transaction

The undelegation transaction revokes previously delegated voting power, returning tokens to undelegated state.

**Function Signature**: `undelegate(uint256 nftIndex, uint256[] ids, ProofInput[] proofs)`

**Parameters**:
- `nftIndex`: Collection index
- `ids`: Array of token IDs to undelegate
- `proofs`: Merkle proofs for all affected delegate addresses (must be unique and complete)

**Process Flow**:
1. Verifies caller owns all specified tokens
2. Aggregates decrements per delegate address (batching for gas efficiency)
3. Clears delegation registry entries for each token
4. Decreases weight for each affected delegate using provided proofs
5. Removes delegates from tree if weight reaches zero
6. Emits Undelegated and WeightChanged events

**Example Scenario**: Alice previously delegated tokens 1 and 2 to Bob, and token 3 to Charlie. To undelegate all three, she calls `undelegate(0, [1,2,3], [bobProof, charlieProof])`. The contract decreases Bob's weight by 2 and Charlie's weight by 1. If Bob's total weight becomes zero, his leaf is removed from the Merkle tree and his index is cleared.

**Gas Costs**: Approximately 300,000-700,000 gas depending on number of unique delegates and tree depth.

### 3. Update Delegation Transaction

The update delegation transaction atomically moves delegation from one address to another without undelegating first.

**Function Signature**: `updateDelegation(address to, uint256 nftIndex, uint256[] ids, ProofInput[] fromProofs, uint256[] toProof)`

**Parameters**:
- `to`: New delegate address
- `nftIndex`: Collection index
- `ids`: Token IDs to move
- `fromProofs`: Proofs for all old delegates losing weight
- `toProof`: Proof for new delegate gaining weight

**Process Flow**:
1. Validates caller owns all tokens
2. Aggregates old delegates and their weight decreases
3. Applies weight decreases to old delegates using fromProofs
4. Updates delegation registry to point to new delegate
5. Increases weight for new delegate using toProof
6. Emits appropriate Delegated/Undelegated events

**Example Scenario**: Alice delegated tokens 1 and 2 to Bob. She wants to move them to Charlie. She calls `updateDelegation(charlieAddress, 0, [1,2], [bobProof], charlieProof)`. Bob's weight decreases by 2, Charlie's weight increases by 2, all in a single atomic transaction.

**Gas Costs**: Approximately 400,000-800,000 gas depending on number of affected delegates and tree complexity.

## Merkle Proof System

### Proof Requirements

The contract implements a zero-knowledge-friendly proof system based on Lean-IMT with Poseidon hash:

- **First Insertion**: When an address receives its first delegation (weight 0 to weight N), no proof is required. The Lean-IMT library supports proof-less insertion.

- **Weight Updates**: When increasing or decreasing weight for existing participants (weight N to weight M, both non-zero), a Merkle proof consisting of sibling nodes from leaf to root is required.

- **Removals**: When weight decreases to zero (weight N to weight 0), a Merkle proof is required. The contract removes the leaf and clears the reverse index mapping.

### Proof Generation Process

The client-side proof generation follows these steps:

1. **Tree Reconstruction**: Query `getAccountAt(index)` for all indices until consecutive failures indicate tree end. For each address found, call `getDelegations(address)` to get weight and packed leaf value.

2. **Cache Management**: Store reconstructed tree in browser localStorage with metadata including census root, timestamp, contract address, and integrity checksum. Cache expires after configured duration.

3. **LeanIMT Construction**: Create local Lean-IMT instance using Poseidon hash function. Insert all leaves in order matching on-chain tree structure.

4. **Proof Extraction**: For each address needing a proof, find its leaf in the tree, get its index, and call `tree.generateProof(index)` to extract sibling nodes from leaf to root.

5. **Proof Validation**: Siblings array contains bigints representing Poseidon hash outputs of sibling nodes at each tree level.

### Inherited Delegation Handling

A unique feature handles NFT transfers: when an NFT is transferred to a new owner while still delegated by the previous owner, the delegation persists in the registry. The new owner can delegate the token, which triggers inherited delegation clearing:

1. Contract detects token is already delegated but not by current owner
2. Decreases weight for inherited delegate using provided fromProof
3. Establishes new delegation to chosen address
4. Emits both Undelegated (for inherited) and Delegated (for new) events

**Example Scenario**: Alice delegated token 1 to Bob. Alice transfers token 1 to Charlie. Token 1 is still registered as delegated to Bob (inherited delegation). Charlie delegates token 1 to Dave by calling `delegate(dave, 0, [1], daveProof, [bobProof])`. The contract decreases Bob's weight by 1 using bobProof, then increases Dave's weight by 1 using daveProof.

## Query Operations

### Participant Enumeration

**Function**: `getAccountAt(uint256 index)`

Returns the address at a specific Merkle tree index, or zero address if the position is empty or beyond tree bounds. This enables iterating through all census participants:

Iterate from index 0 upward, querying each position. Non-zero addresses are active participants. Empty positions (address zero) may exist due to removals. The client typically scans until finding multiple consecutive empty positions indicating tree end.

### Voting Weight Lookup

**Function**: `getDelegations(address account)`

Returns a tuple containing the address's current voting weight (88-bit unsigned integer) and the packed leaf value (256-bit unsigned integer combining address and weight). This is used for:
- Displaying current voting power in UI
- Verifying delegation success
- Generating correct leaf values for proof construction

### Token Delegation Status

**Function**: `getTokenDelegations(uint256 nftIndex, uint256[] ids)`

Batch query that returns delegate addresses for multiple token IDs. Returns zero address for undelegated tokens. This enables efficient checking of delegation status for all user-owned NFTs in a single call.

**Internal Implementation**: Generates keccak256 hash of (nftIndex, tokenId) for each token and looks up in tokenDelegate mapping.

### Owned Delegated Tokens

**Function**: `getNFTids(uint256 nftIndex, uint256[] candidates)`

Returns subset of candidate token IDs that the caller has delegated and still owns. Performs dual verification:
1. Check _ownerDelegated mapping confirms caller delegated this token
2. Call ERC721.ownerOf to verify caller still owns the token

This handles NFT transfers gracefully - transferred tokens are excluded from results even if delegation registry still shows them.

### Census Root Retrieval

**Function**: `getCensusRoot()`

Returns current Merkle tree root as a 256-bit unsigned integer. This root represents the cryptographic commitment to the entire census state. External systems can use this root for:
- Snapshot-based voting (snapshot census at specific block)
- Merkle proof verification
- State change detection (root changes when any weight changes)

## Web Application Features

### Contract Address Management

The application supports multiple contract instances through URL-based addressing. Users can:
- Access default contract configured in environment variables
- Navigate to specific contract by appending address to URL path
- Input custom contract addresses via UI
- Share direct links to specific contract instances

Contract verification performed before loading: checks bytecode exists at address and contract responds to `getCensusRoot()` call correctly.

### Delegation Management Interface

The UI provides comprehensive delegation controls:

**Token Overview**: Displays all NFTs owned by connected wallet across all configured collections. Shows delegation status (delegated to whom, or undelegated) and provides quick actions.

**Delegate List**: Shows all addresses user has delegated to, with total weight per delegate. Supports adding tokens to existing delegates or creating new delegations.

**Pending Changes**: Before transaction submission, shows preview of weight changes: which delegates will gain/lose weight, new census state, and estimated gas costs.

**Transaction Execution**: Generates required Merkle proofs client-side, constructs transaction with proper parameters, estimates gas, submits to network, and monitors confirmation.

### Merkle Tree Visualization

Advanced feature for developers and power users:
- Displays reconstructed Merkle tree structure
- Shows each node's hash value and position
- Highlights proof paths for selected addresses
- Visualizes tree depth and balance

### Cache Statistics

The cache management UI shows:
- Number of cached trees (by census root)
- Total cached nodes across all trees
- Cache age (oldest and newest entries)
- Storage usage estimation
- Manual cache clearing controls

## Network and RPC Considerations

### Rate Limiting Handling

The application implements sophisticated rate limit mitigation:

**Detection**: Monitors for error codes -32005 (RPC rate limit), 429 (HTTP too many requests), and error messages containing "rate limit" or "too many requests".

**Retry Strategy**: Exponential backoff with configurable base delay (default 2 seconds) and maximum delay (default 32 seconds). Retries up to 3 times per operation.

**Batch Management**: Breaks large operations into smaller batches. Default batch size 10 for tree reconstruction, 50 for token operations.

**Progress Saving**: During long tree reconstructions, saves intermediate progress to cache every 5 batches, enabling resume from failure point.

### Multi-Network Support

Configured networks include:
- Ethereum Mainnet
- Ethereum Sepolia Testnet
- Polygon Mainnet
- Polygon Mumbai Testnet
- Gnosis Chain

Each network has specific RPC endpoints, chain IDs, and block explorer configurations. The application validates connected network matches contract deployment and prompts network switching if mismatched.

## Security Considerations

### Access Control

The contract implements ownership-based access control for delegation operations:
- Only current NFT owner can delegate their tokens
- Undelegation requires ownership verification
- Update delegation validates ownership before processing

No administrative privileges exist - the contract is fully decentralized after deployment. Constructor sets immutable collection list; no owner can modify collections or pause operations.

### Proof Verification

All Merkle proofs are verified by the Lean-IMT library:
- Proof siblings must correctly hash to current census root
- Leaf values must match current on-chain state
- Invalid proofs cause transaction reversion with ProofRequired error

This prevents unauthorized weight modifications - attackers cannot decrease competitors' weights or increase their own without valid cryptographic proofs.

### Integer Overflow Protection

Solidity 0.8.24 provides built-in overflow/underflow protection. The contract additionally implements:
- Explicit checks for weight overflow (exceeding uint88 maximum)
- Underflow detection for weight decreases
- Custom errors (WeightOverflow, WeightUnderflow) with reversion

Maximum weight per address: 309,485,009,821,345,068,724,781,055 (2^88 - 1)

### Delegation Persistence

The delegation registry uses content-addressed keys (keccak256 hash of nftIndex and tokenId) making it impossible to create hash collisions or manipulate delegation mappings through malicious inputs.

## Gas Optimization Strategies

### Batch Processing

All delegation functions accept arrays of token IDs, enabling batching:
- Delegate 10 tokens in one transaction instead of 10 separate transactions
- Shared proof verification overhead across multiple tokens
- Single Merkle root update regardless of batch size

Aggregation of weight changes per delegate further optimizes gas:
- When undelegating tokens from multiple delegates, proofs required only once per unique delegate
- Internal batching combines weight updates before applying to tree

### Packed Storage

Leaf values pack address (160 bits) and weight (88 bits) into single uint256, reducing storage slots from 2 to 1 per participant. This saves approximately 20,000 gas per insertion.

### Minimal Storage Writes

The reverse index (indexAccount mapping) only updates during insertions and removals, not during weight updates. This saves 5,000 gas per weight modification.

### View Function Optimization

Query functions use view or pure modifiers enabling:
- Free local calls (no gas cost when called off-chain)
- Potential for aggressive compiler optimization
- Safe parallelization of read operations

## Deployment Configuration

### Collection Setup

Constructor accepts array of ERC-721 contract addresses. Each address becomes an entry in the collections array, identified by its index (0-based). This index is used in all delegation operations.

Immutable after deployment - collections cannot be added, removed, or modified. To add collections, deploy new census contract instance.

### Recommended Deployment Flow

1. Identify NFT collections for governance (ERC-721 contracts)
2. Configure deployment script with collection addresses
3. Set deployer private key and RPC endpoint in environment
4. Deploy contract using Foundry with verification
5. Verify contract on block explorer
6. Configure web application with deployed contract address
7. Test with small delegation before announcing to community

### Post-Deployment Verification

Essential checks after deployment:
- Call `getCensusRoot()` to verify contract is responsive (should return 0 for empty tree)
- Call `collections(0)` to verify first collection address matches expected
- Attempt test delegation with owned NFT from configured collection
- Verify events emitted correctly and census root updates
- Confirm web application can connect and display contract state

## Testing Infrastructure

### Foundry Test Suite

Comprehensive test coverage includes:

**Basic Operations**: First insertion, weight updates, removals, all with valid Merkle proofs generated from known tree states.

**Edge Cases**: Zero address delegation (should revert), non-owned token delegation (should revert), double delegation (should revert), empty token arrays.

**Multi-Collection**: Simultaneous delegations across different collections, cross-collection weight accumulation, collection index validation.

**Delegation Updates**: Moving tokens between delegates, partial delegation updates, complete delegation transfers.

**Reverse Index Consistency**: Index-to-address mapping correctness after insertions, updates, removals, and complex operation sequences.

**Inherited Delegations**: NFT transfers with active delegations, new owner delegation with inherited clearing, proof requirements for inherited delegation removal.

All tests use MockERC721Mintable for controlled NFT creation and transfer scenarios.

### Test Data Generation

The testdata-node directory contains utilities for generating valid Merkle proofs for test scenarios:
- Creates specific tree states with known participants and weights
- Calculates expected census roots using Poseidon hash
- Generates sibling arrays for proof construction
- Exports test data as JSON for import into Solidity tests

## Integration Patterns

### Voting System Integration

External voting systems can integrate DavinciDAO census:

1. **Snapshot Census**: At voting start block, record current census root. This root represents voting power distribution.

2. **Proof-Based Voting**: Voters submit their vote along with Merkle proof of their weight at snapshot root. Voting contract verifies proof against stored root.

3. **Weight-Based Tallying**: Each valid vote counts for voter's proven weight. Final tally is weighted sum of all votes.

4. **Delegation Transparency**: On-chain events (Delegated, Undelegated) enable real-time delegation tracking and visualization.

### Governance Dashboard Integration

Dashboards can query census state for analytics:

**Participation Rate**: Count of unique delegates (non-zero addresses in tree) versus total potential participants (NFT holders in collections).

**Concentration Analysis**: Weight distribution among delegates to detect centralization (Gini coefficient, top N holders percentage).

**Delegation Flow**: Track Delegated/Undelegated events over time to visualize delegation trends, loyalty, and volatility.

**Representative Rankings**: Enumerate all delegates via getAccountAt, retrieve weights, sort by voting power for leaderboards.

### NFT Platform Integration

NFT marketplaces and platforms can display delegation info:

Query `getTokenDelegations` for token IDs being listed to show buyers whether token is delegated and to whom. This transparency affects NFT value as delegated tokens contribute to governance participation.

Provide delegation interface within NFT view pages, enabling users to manage delegation without leaving marketplace platform.

## Performance Characteristics

### Tree Reconstruction Performance

Full tree reconstruction time scales with participant count:
- 10 participants: approximately 2-5 seconds
- 100 participants: approximately 15-30 seconds
- 1000 participants: approximately 2-5 minutes
- 10000 participants: approximately 20-50 minutes

Caching reduces subsequent operations to milliseconds. Progressive fetching with batch size 10 balances RPC load with reconstruction speed.

### Proof Generation Performance

Local proof generation using zk-kit Lean-IMT:
- Tree depth 10 (up to 1024 leaves): under 100ms
- Tree depth 15 (up to 32768 leaves): under 200ms
- Tree depth 20 (up to 1048576 leaves): under 500ms

Poseidon hash computation is the primary bottleneck. The poseidon-lite library provides optimized JavaScript implementation suitable for browser environments.

### Contract Query Performance

View functions execute in constant or logarithmic time:
- `getAccountAt`: O(1) - single mapping lookup
- `getDelegations`: O(1) - single mapping lookup
- `getCensusRoot`: O(1) - single storage read
- `getTokenDelegations`: O(n) where n is array length, but batched in single RPC call

State-modifying functions:
- `delegate`: O(log n) for Merkle proof verification plus O(m) for inherited delegation handling where n is tree size and m is number of inherited delegates
- `undelegate`: O(log n * k) where k is number of unique delegates affected
- `updateDelegation`: O(log n * (j + 1)) where j is number of old delegates

## Future Enhancement Possibilities

While the current implementation is complete and production-ready, potential enhancements include:

**Multi-Token Weight Multipliers**: Support different weights per collection (e.g., Collection A tokens worth 1 vote each, Collection B tokens worth 5 votes each).

**Delegation Caps**: Implement maximum weight per delegate to prevent excessive centralization.

**Timelock Delegations**: Add minimum delegation duration to prevent vote buying via temporary delegations.

**Delegation Metadata**: Attach messages or reasons to delegations for transparency and accountability.

**Batch Proof Aggregation**: Use recursive SNARK proofs to verify multiple state changes with single proof, reducing gas costs for complex operations.

**Delegation Rewards**: Integrate with token distribution systems to reward active delegates and delegators.

**Cross-Chain Census**: Bridge census state to multiple chains enabling multi-chain governance with unified voting power.

These enhancements would require careful consideration of gas costs, security implications, and upgrade strategies while maintaining the core guarantees of decentralization and verifiability.
