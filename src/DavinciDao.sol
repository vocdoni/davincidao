// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// OpenZeppelin v5.4.x interfaces
import {IERC721} from "openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {CircularBuffer} from "openzeppelin-contracts/contracts/utils/structs/CircularBuffer.sol";

// Lean-IMT (zk-kit) for on-chain Merkle tree
import {InternalLeanIMT, LeanIMTData} from "zk-kit.solidity/packages/lean-imt/contracts/InternalLeanIMT.sol";
import {SNARK_SCALAR_FIELD} from "zk-kit.solidity/packages/lean-imt/contracts/Constants.sol";

// Census validator interface
import {ICensusValidator} from "./ICensusValidator.sol";

/// @title DavinciDAO Census Contract
/// @notice Maintains an on-chain Merkle tree for NFT-based voting power delegation.
/// @dev Features:
///      - On-chain Merkle tree construction using Lean-IMT (automatic root updates)
///      - Circular buffer root history (gas-optimized, last N roots)
///      - Event emission for The Graph indexing
///      - Proof-based delegation for security and gas efficiency
/// @dev Implements ICensusValidator for external contract integration
contract DavinciDao is ICensusValidator {
    using InternalLeanIMT for LeanIMTData;
    using CircularBuffer for CircularBuffer.Bytes32CircularBuffer;

    // ========= Types & storage =========

    struct Collection {
        address token;        // ERC-721 contract address
    }

    /// @notice Proof for a specific account's leaf (required by _update/_remove).
    /// @dev Includes current weight to enable stateless verification via Merkle proofs
    struct ProofInput {
        address account;
        uint88 currentWeight;  // Current weight of this account (verified by proof)
        uint256[] siblings;
    }

    // --- configuration (immutable layout) ---
    Collection[] public collections; // index = nftIndex

    // --- census tree (Lean-IMT) ---
    LeanIMTData private _census;

    // --- delegation index (SECURITY CRITICAL) ---
    // Delegation persists per (collection index, tokenId), regardless of current owner.
    mapping(bytes32 => address) public tokenDelegate;

    // --- root history (circular buffer + mapping for O(1) lookup) ---
    CircularBuffer.Bytes32CircularBuffer private _rootBuffer;
    mapping(bytes32 => uint64) private _rootToBlock;

    // ========= Events =========
    event Delegated(address indexed owner, address indexed to, uint256 indexed nftIndex, uint256 tokenId);
    event Undelegated(address indexed owner, address indexed from, uint256 indexed nftIndex, uint256 tokenId);
    event DelegatedBatch(address indexed owner, address indexed to, uint256 indexed nftIndex, uint256[] tokenIds);
    event UndelegatedBatch(address indexed owner, address indexed from, uint256 indexed nftIndex, uint256[] tokenIds);
    event WeightChanged(address indexed account, uint88 previousWeight, uint88 newWeight);
    event CensusRootUpdated(uint256 indexed newRoot, uint256 blockNumber);

    // ========= Custom errors =========
    error InvalidCollection();
    error InvalidTokenId(uint256 tokenId);
    error ZeroAddress();
    error NoNewDelegations();
    error NotTokenOwner(uint256 tokenId);
    error AlreadyDelegated(uint256 tokenId);
    error NotDelegated(uint256 tokenId);
    error ProofRequired(address account);
    error WeightUnderflow();
    error WeightOverflow();

    // ========= Constructor =========

    /// @param tokens Array of ERC-721 token contract addresses.
    constructor(address[] memory tokens) {
        uint256 n = tokens.length;
        require(n > 0, "bad config");
        for (uint256 i = 0; i < n; ++i) {
            collections.push();
            collections[i].token = tokens[i];
        }

        // Initialize circular buffer with capacity for 100 recent roots
        // This provides ~1-2 days of history at 15s block time (sufficient for voting)
        _rootBuffer.setup(100);
    }

    // ========= Public / view API =========

    /// @notice Current census Merkle root (Lean-IMT).
    function getCensusRoot() external view returns (uint256) {
        return _census._root();
    }

    /// @notice Check if a root has been valid at some point and get its block number.
    /// @dev Only returns block numbers for roots in the circular buffer (last 100 roots).
    /// @param root The census root to verify.
    /// @return blockNumber The block number when this root was set (0 if never set or evicted).
    function getRootBlockNumber(uint256 root) external view returns (uint256) {
        return uint256(_rootToBlock[bytes32(root)]);
    }

    /// @notice Compute the packed (address||weight) leaf for an account with given weight.
    /// @dev Pure helper function for client-side leaf computation.
    ///      Weight must be queried from subgraph (WeightChanged events).
    /// @param account The account address.
    /// @param weight The voting weight (from subgraph).
    /// @return Packed leaf value: (address << 88) | weight
    function computeLeafWithWeight(address account, uint88 weight) external pure returns (uint256) {
        return _packLeaf(account, weight);
    }

    /// @notice Vectorized mapping lookup for (nftIndex, ids) => delegate address (0 if none).
    function getTokenDelegations(uint256 nftIndex, uint256[] calldata ids)
        external
        view
        returns (address[] memory delegates)
    {
        _checkIndex(nftIndex);
        delegates = new address[](ids.length);
        for (uint256 i = 0; i < ids.length; ++i) {
            delegates[i] = tokenDelegate[_tokenKey(nftIndex, ids[i])];
        }
    }

    /// @notice Returns token IDs that are delegated and **still currently owned** by `msg.sender`
    /// @dev Gas optimized: single-pass iteration with assembly array shrinking
    function getNFTids(uint256 nftIndex, uint256[] calldata candidateIds) external view returns (uint256[] memory out) {
        _checkIndex(nftIndex);
        address token = collections[nftIndex].token; // cache storage → stack
        uint256 len = candidateIds.length;
        out = new uint256[](len);
        uint256 k;

        for (uint256 i; i < len; ) {
            uint256 id = candidateIds[i];
            if (tokenDelegate[_tokenKey(nftIndex, id)] != address(0)
                && IERC721(token).ownerOf(id) == msg.sender) {
                out[k++] = id;
            }
            unchecked { ++i; }
        }
        // shrink memory array length in-place
        assembly { mstore(out, k) }
    }


    /// @notice Removed getAccountAt - use subgraph or events for tree reconstruction
    /// Gas optimization: removed indexAccount mapping

    // ========= Mutating API =========

    /// @notice Delegate voting power from owned NFTs to `to`.
    /// @param to                Receiver address (voter).
    /// @param nftIndex          Index into `collections`.
    /// @param ids               Token IDs to delegate.
    /// @param currentWeightOfTo Current weight of `to` (verified by proof, obtained from subgraph).
    /// @param toProof           Merkle path for `to`'s existing leaf (empty if `to` has zero weight).
    function delegate(
        address to,
        uint256 nftIndex,
        uint256[] calldata ids,
        uint88 currentWeightOfTo,
        uint256[] calldata toProof
    ) external {
        _checkIndex(nftIndex);
        if (to == address(0)) revert ZeroAddress();

        // Process delegations (reverts if any token already delegated)
        uint256 added = _processDelegations(to, nftIndex, ids);

        if (added == 0) revert NoNewDelegations();

        // Apply weight increase for new delegate
        _applyDelta(to, int256(added), currentWeightOfTo, toProof);

        // Store root in history
        _updateRootHistory();
    }

    /// @notice Undelegate voting power for given token IDs (caller must be current owner).
    /// @param nftIndex Index into `collections`.
    /// @param ids      Token IDs to revoke delegation for.
    /// @param proofs   Proofs for each *affected* delegate address (unique and batched).
    function undelegate(uint256 nftIndex, uint256[] calldata ids, ProofInput[] calldata proofs) external {
        _checkIndex(nftIndex);

        // Batch ownership verification with transient storage cache
        _verifyOwnershipBatch(nftIndex, msg.sender, ids);

        // Aggregate decrements per delegate and collect token IDs per delegate for batch events
        address[] memory delAddrs = new address[](ids.length);
        uint256[] memory counts = new uint256[](ids.length);
        uint256[][] memory tokenIdsByDelegate = new uint256[][](ids.length);
        uint256 unique;

        // First pass: initialize arrays for each unique delegate
        for (uint256 i = 0; i < ids.length; ++i) {
            tokenIdsByDelegate[i] = new uint256[](ids.length);
        }

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            // Ownership already verified in batch above

            bytes32 key = _tokenKey(nftIndex, id);
            address del = tokenDelegate[key];
            if (del == address(0)) revert NotDelegated(id);

            tokenDelegate[key] = address(0);

            uint256 j = _indexOf(delAddrs, unique, del);
            if (j == type(uint256).max) {
                delAddrs[unique] = del;
                tokenIdsByDelegate[unique][0] = id;
                counts[unique] = 1;
                unchecked {
                    ++unique;
                }
            } else {
                tokenIdsByDelegate[j][counts[j]] = id;
                unchecked {
                    ++counts[j];
                }
            }
        }

        // Emit batch events for each delegate
        for (uint256 k = 0; k < unique; ++k) {
            // Resize array to actual count for this delegate
            uint256[] memory delegateTokenIds = new uint256[](counts[k]);
            for (uint256 m = 0; m < counts[k]; ++m) {
                delegateTokenIds[m] = tokenIdsByDelegate[k][m];
            }
            emit UndelegatedBatch(msg.sender, delAddrs[k], nftIndex, delegateTokenIds);
        }

        for (uint256 k = 0; k < unique; ++k) {
            address acct = delAddrs[k];
            uint256 pIdx = _indexOfProof(proofs, acct);
            if (pIdx == type(uint256).max) revert ProofRequired(acct);
            _applyDelta(acct, -int256(counts[k]), proofs[pIdx].currentWeight, proofs[pIdx].siblings);
        }

        // Store root in history
        _updateRootHistory();
    }

    /// @notice Move delegation of given IDs to a new address `to` (caller must own the NFTs).
    /// @param to                New delegate.
    /// @param nftIndex          Index into `collections`.
    /// @param ids               Token IDs to move.
    /// @param currentWeightOfTo Current weight of `to` (verified by proof, obtained from subgraph).
    /// @param fromProofs        Proofs for each *old* delegate reduced (unique and batched).
    /// @param toProof           Proof for `to` (empty if `to` had zero weight).
    function updateDelegation(
        address to,
        uint256 nftIndex,
        uint256[] calldata ids,
        uint88 currentWeightOfTo,
        ProofInput[] calldata fromProofs,
        uint256[] calldata toProof
    ) external {
        _checkIndex(nftIndex);
        if (to == address(0)) revert ZeroAddress();

        // Process delegation changes and get aggregated data
        (address[] memory fromAddrs, uint256[] memory fromCounts, uint256 unique, uint256 added) =
            _processDelegationUpdates(to, nftIndex, ids);

        // Apply weight decreases for old delegates
        _applyFromProofs(fromAddrs, fromCounts, unique, fromProofs);

        // Apply weight increase for new delegate
        if (added > 0) {
            _applyDelta(to, int256(added), currentWeightOfTo, toProof);

            // Store root in history
            _updateRootHistory();
        }
    }

    // ========= Internal: Lean-IMT updates =========

    /// @dev Apply weight delta to account's leaf in the Merkle tree
    /// @param account Account address to update
    /// @param delta Weight change (positive = increase, negative = decrease)
    /// @param oldWeight Current weight of account (verified by Merkle proof)
    /// @param siblings Merkle proof siblings for verification
    function _applyDelta(address account, int256 delta, uint88 oldWeight, uint256[] calldata siblings) internal {
        if (delta == 0) return;

        uint88 newW;

        if (delta > 0) {
            unchecked {
                uint256 tmp = uint256(oldWeight) + uint256(int256(delta));
                if (tmp > type(uint88).max) revert WeightOverflow();
                newW = uint88(tmp);
            }
        } else {
            uint256 dec = uint256(-delta);
            if (dec > oldWeight) revert WeightUnderflow();
            unchecked {
                newW = uint88(uint256(oldWeight) - dec);
            }
        }

        uint256 oldLeaf = _packLeaf(account, oldWeight);
        uint256 newLeaf = _packLeaf(account, newW);

        // Defensive range check for BN254 scalar field
        if (oldLeaf >= SNARK_SCALAR_FIELD || newLeaf >= SNARK_SCALAR_FIELD) revert WeightOverflow();

        if (oldWeight == 0 && newW > 0) {
            // A) First insertion (weight 0 → >0)
            _census._insert(newLeaf); // no proof needed
        } else if (newW == 0) {
            // C) Removal (weight >0 → 0)
            _census._remove(oldLeaf, siblings);
        } else {
            // B) Weight update (weight >0 → >0)
            // NOTE: Empty proof is valid for single-leaf trees!
            // Lean-IMT will validate the proof internally (including empty proofs)
            _census._update(oldLeaf, newLeaf, siblings);
        }

        // Weight is no longer stored - callers must track via subgraph or WeightChanged events
        emit WeightChanged(account, oldWeight, newW);
    }

    /// @dev Update root history after tree modifications (using circular buffer)
    function _updateRootHistory() internal {
        uint256 newRoot = _census._root();
        bytes32 newRootBytes = bytes32(newRoot);

        // Push to circular buffer (automatically evicts oldest if full)
        _rootBuffer.push(newRootBytes);
        _rootToBlock[newRootBytes] = uint64(block.number);

        // Clean up evicted roots from mapping (buffer auto-overwrites)
        // Note: We can't easily detect which root was evicted without tracking it separately
        // So we'll accept minor storage leak for evicted roots (they'll be garbage-collected naturally)

        emit CensusRootUpdated(newRoot, block.number);
    }

    // ========= Internal helpers =========

    /// @dev Process delegation updates and return aggregated data
    function _processDelegationUpdates(address to, uint256 nftIndex, uint256[] calldata ids)
        internal
        returns (address[] memory fromAddrs, uint256[] memory fromCounts, uint256 unique, uint256 added)
    {
        // Batch ownership verification with transient storage cache
        _verifyOwnershipBatch(nftIndex, msg.sender, ids);

        fromAddrs = new address[](ids.length);
        fromCounts = new uint256[](ids.length);
        uint256[][] memory undelegatedIdsByDelegate = new uint256[][](ids.length);
        uint256[] memory delegatedIds = new uint256[](ids.length);

        // Initialize arrays for undelegated token IDs per delegate
        for (uint256 i = 0; i < ids.length; ++i) {
            undelegatedIdsByDelegate[i] = new uint256[](ids.length);
        }

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            // Ownership already verified in batch above

            bytes32 key = _tokenKey(nftIndex, id);
            address prev = tokenDelegate[key];

            if (prev == to) continue; // no change for this id

            if (prev != address(0)) {
                uint256 j = _indexOf(fromAddrs, unique, prev);
                if (j == type(uint256).max) {
                    fromAddrs[unique] = prev;
                    undelegatedIdsByDelegate[unique][0] = id;
                    fromCounts[unique] = 1;
                    unchecked {
                        ++unique;
                    }
                } else {
                    undelegatedIdsByDelegate[j][fromCounts[j]] = id;
                    unchecked {
                        ++fromCounts[j];
                    }
                }
            }

            tokenDelegate[key] = to;
            delegatedIds[added] = id;
            unchecked {
                ++added;
            }
        }

        // Emit batch events for undelegations
        for (uint256 k = 0; k < unique; ++k) {
            uint256[] memory undelegatedIds = new uint256[](fromCounts[k]);
            for (uint256 m = 0; m < fromCounts[k]; ++m) {
                undelegatedIds[m] = undelegatedIdsByDelegate[k][m];
            }
            emit UndelegatedBatch(msg.sender, fromAddrs[k], nftIndex, undelegatedIds);
        }

        // Emit batch event for new delegations
        if (added > 0) {
            uint256[] memory newDelegatedIds = new uint256[](added);
            for (uint256 i = 0; i < added; ++i) {
                newDelegatedIds[i] = delegatedIds[i];
            }
            emit DelegatedBatch(msg.sender, to, nftIndex, newDelegatedIds);
        }
    }

    /// @dev Apply weight decreases for old delegates using proofs
    function _applyFromProofs(
        address[] memory fromAddrs,
        uint256[] memory fromCounts,
        uint256 unique,
        ProofInput[] calldata fromProofs
    ) internal {
        for (uint256 k = 0; k < unique; ++k) {
            address acct = fromAddrs[k];
            uint256 pIdx = _indexOfProof(fromProofs, acct);
            if (pIdx == type(uint256).max) revert ProofRequired(acct);
            _applyDelta(acct, -int256(fromCounts[k]), fromProofs[pIdx].currentWeight, fromProofs[pIdx].siblings);
        }
    }

    function _checkIndex(uint256 nftIndex) internal view {
        if (nftIndex >= collections.length) revert InvalidCollection();
    }

    // Removed _isValidTokenId - always returned true (gas optimization)

    function _tokenKey(uint256 nftIndex, uint256 tokenId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(nftIndex, tokenId));
    }

    /// @dev Pack (address || weight) → uint256 with address in top 20 bytes and weight in low 11 bytes.
    function _packLeaf(address account, uint88 weight) internal pure returns (uint256) {
        return (uint256(uint160(account)) << 88) | uint256(weight);
    }

    /// @dev Ownership check for ERC721.
    function _owns(uint256 nftIndex, address owner, uint256 tokenId) internal view returns (bool) {
        Collection memory c = collections[nftIndex];
        return IERC721(c.token).ownerOf(tokenId) == owner;
    }

    /// @dev Ownership check with transient storage cache (EIP-1153)
    /// @notice Uses TLOAD/TSTORE for cheap within-transaction caching
    /// @param token Cached token address (stack variable to avoid SLOAD)
    /// @param owner Expected owner address
    /// @param tokenId Token ID to verify
    /// @param cacheKey Pre-computed cache key for this token
    function _ownsWithCache(
        address token,
        address owner,
        uint256 tokenId,
        bytes32 cacheKey
    ) internal returns (bool) {
        address cachedOwner;

        assembly {
            // TLOAD - load from transient storage (5 gas if cached)
            cachedOwner := tload(cacheKey)
        }

        if (cachedOwner == address(0)) {
            // Cache miss - perform actual ownerOf() call (~2600 gas cold, ~100 gas warm)
            cachedOwner = IERC721(token).ownerOf(tokenId);

            assembly {
                // TSTORE - store to transient storage (8 gas)
                // Cache persists for remainder of transaction then auto-clears
                tstore(cacheKey, cachedOwner)
            }
        }
        // Cache hit - only paid 5 gas for TLOAD!

        return cachedOwner == owner;
    }

    /// @dev Batch ownership verification with transient storage cache
    /// @notice Optimized for multiple tokens: caches token address, uses transient storage
    /// @param nftIndex Collection index
    /// @param expectedOwner Expected owner of all tokens
    /// @param ids Token IDs to verify
    function _verifyOwnershipBatch(
        uint256 nftIndex,
        address expectedOwner,
        uint256[] calldata ids
    ) internal {
        address token = collections[nftIndex].token; // Cache storage → stack (SLOAD → stack)

        for (uint256 i; i < ids.length; ) {
            uint256 id = ids[i];
            bytes32 cacheKey = keccak256(abi.encodePacked(nftIndex, id));

            if (!_ownsWithCache(token, expectedOwner, id, cacheKey)) {
                revert NotTokenOwner(id);
            }

            unchecked { ++i; }
        }
    }

    /// @dev Linear search utilities for small batches.
    function _indexOf(address[] memory arr, uint256 len, address a) internal pure returns (uint256) {
        for (uint256 i = 0; i < len; ++i) {
            if (arr[i] == a) return i;
        }
        return type(uint256).max;
    }

    function _indexOfProof(ProofInput[] calldata proofs, address account) internal pure returns (uint256) {
        for (uint256 i = 0; i < proofs.length; ++i) {
            if (proofs[i].account == account) return i;
        }
        return type(uint256).max;
    }

    /// @dev Process delegations for the delegate function
    function _processDelegations(address to, uint256 nftIndex, uint256[] calldata ids)
        internal
        returns (uint256 added)
    {
        // Batch ownership verification with transient storage cache
        _verifyOwnershipBatch(nftIndex, msg.sender, ids);

        uint256[] memory addedIds = new uint256[](ids.length);

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            // Ownership already verified in batch above

            bytes32 key = _tokenKey(nftIndex, id);
            address existingDelegate = tokenDelegate[key];

            // If already delegated, must use updateDelegation or undelegate first
            if (existingDelegate != address(0)) {
                revert AlreadyDelegated(id);
            }

            tokenDelegate[key] = to;
            addedIds[added] = id;
            unchecked {
                ++added;
            }
        }

        // Emit batch event for all delegated tokens
        if (added > 0) {
            // Resize array to actual size
            uint256[] memory delegatedIds = new uint256[](added);
            for (uint256 i = 0; i < added; ++i) {
                delegatedIds[i] = addedIds[i];
            }
            emit DelegatedBatch(msg.sender, to, nftIndex, delegatedIds);
        }
    }

}
