// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// OpenZeppelin v5.4.x interfaces
import {IERC721} from "openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";

// Lean-IMT (zk-kit) for on-chain Merkle tree
import {InternalLeanIMT, LeanIMTData} from "zk-kit.solidity/packages/lean-imt/contracts/InternalLeanIMT.sol";
import {SNARK_SCALAR_FIELD} from "zk-kit.solidity/packages/lean-imt/contracts/Constants.sol";

/// @title DavinciDAO Census Contract
/// @notice Maintains an on-chain Merkle tree for NFT-based voting power delegation.
/// @dev Features:
///      - On-chain Merkle tree construction using Lean-IMT (automatic root updates)
///      - Map-based root history (root => blockNumber) for unlimited storage
///      - Event emission for The Graph indexing
///      - Proof-based delegation for security and gas efficiency
contract DavinciDao {
    using InternalLeanIMT for LeanIMTData;

    // ========= Types & storage =========

    struct Collection {
        address token; // ERC-721 contract
    }

    /// @notice Proof for a specific account's leaf (required by _update/_remove).
    struct ProofInput {
        address account;
        uint256[] siblings;
    }

    // --- configuration (immutable layout) ---
    Collection[] public collections; // index = nftIndex

    // --- census tree (Lean-IMT) ---
    LeanIMTData private _census;
    mapping(address => uint88) public weightOf; // 11-byte weights

    // --- delegation index (SECURITY CRITICAL) ---
    // Delegation persists per (collection index, tokenId), regardless of current owner.
    mapping(bytes32 => address) public tokenDelegate;

    // Removed _ownerDelegated mapping - gas optimization (use tokenDelegate instead)

    // --- root history (map-based) ---
    // Mapping of root => block number (for verification)
    mapping(uint256 => uint256) public rootBlockNumbers;

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
    }

    // ========= Public / view API =========

    /// @notice Current census Merkle root (Lean-IMT).
    function getCensusRoot() external view returns (uint256) {
        return _census._root();
    }

    /// @notice Check if a root has been valid at some point and get its block number.
    /// @param root The census root to verify.
    /// @return blockNumber The block number when this root was set (0 if never set).
    function getRootBlockNumber(uint256 root) external view returns (uint256) {
        return rootBlockNumbers[root];
    }

    /// @notice Convenience accessor: current weight and packed leaf value for `account`.
    function getDelegations(address account) external view returns (uint88 weight, uint256 leaf) {
        weight = weightOf[account];
        leaf = _packLeaf(account, weight);
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
    /// @dev Gas optimized: uses tokenDelegate mapping instead of _ownerDelegated
    function getNFTids(uint256 nftIndex, uint256[] calldata candidateIds) external view returns (uint256[] memory) {
        _checkIndex(nftIndex);
        uint256 count;
        for (uint256 i = 0; i < candidateIds.length; ++i) {
            uint256 id = candidateIds[i];
            bytes32 key = _tokenKey(nftIndex, id);
            // Token is delegated (to anyone) AND owned by caller
            if (tokenDelegate[key] != address(0) && _owns(nftIndex, msg.sender, id)) {
                unchecked {
                    ++count;
                }
            }
        }
        uint256[] memory out = new uint256[](count);
        uint256 k;
        for (uint256 i = 0; i < candidateIds.length; ++i) {
            uint256 id = candidateIds[i];
            bytes32 key = _tokenKey(nftIndex, id);
            if (tokenDelegate[key] != address(0) && _owns(nftIndex, msg.sender, id)) {
                out[k++] = id;
            }
        }
        return out;
    }

    /// @notice Helper to compute the packed `(address||weight)` leaf for `account`.
    function computeLeaf(address account) external view returns (uint256) {
        return _packLeaf(account, weightOf[account]);
    }

    /// @notice Removed getAccountAt - use subgraph or events for tree reconstruction
    /// Gas optimization: removed indexAccount mapping

    // ========= Mutating API =========

    /// @notice Delegate voting power from owned NFTs to `to`.
    /// @param to         Receiver address (voter).
    /// @param nftIndex   Index into `collections`.
    /// @param ids        Token IDs to delegate.
    /// @param toProof    Merkle path for `to`'s existing leaf (empty if `to` has zero weight).
    /// @param fromProofs Proofs for clearing inherited delegations (if any tokens were previously delegated by another owner).
    function delegate(
        address to,
        uint256 nftIndex,
        uint256[] calldata ids,
        uint256[] calldata toProof,
        ProofInput[] calldata fromProofs
    ) external {
        _checkIndex(nftIndex);
        if (to == address(0)) revert ZeroAddress();

        // Process delegations and get inherited delegation info
        (address[] memory inheritedDelegates, uint256[] memory inheritedCounts, uint256 uniqueInherited, uint256 added)
        = _processDelegations(to, nftIndex, ids);

        if (added == 0) revert NoNewDelegations();

        // Clear inherited delegations first (decrease weights of previous delegates)
        _applyInheritedProofs(inheritedDelegates, inheritedCounts, uniqueInherited, fromProofs);

        // Apply weight increase for new delegate
        _applyDelta(to, int256(added), toProof);

        // Store root in history
        _updateRootHistory();
    }

    /// @notice Undelegate voting power for given token IDs (caller must be current owner).
    /// @param nftIndex Index into `collections`.
    /// @param ids      Token IDs to revoke delegation for.
    /// @param proofs   Proofs for each *affected* delegate address (unique and batched).
    function undelegate(uint256 nftIndex, uint256[] calldata ids, ProofInput[] calldata proofs) external {
        _checkIndex(nftIndex);

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
            if (!_owns(nftIndex, msg.sender, id)) revert NotTokenOwner(id);

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
            _applyDelta(acct, -int256(counts[k]), proofs[pIdx].siblings);
        }

        // Store root in history
        _updateRootHistory();
    }

    /// @notice Move delegation of given IDs to a new address `to` (caller must own the NFTs).
    /// @param to          New delegate.
    /// @param nftIndex    Index into `collections`.
    /// @param ids         Token IDs to move.
    /// @param fromProofs  Proofs for each *old* delegate reduced (unique and batched).
    /// @param toProof     Proof for `to` (empty if `to` had zero weight).
    function updateDelegation(
        address to,
        uint256 nftIndex,
        uint256[] calldata ids,
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
            _applyDelta(to, int256(added), toProof);

            // Store root in history
            _updateRootHistory();
        }
    }

    // ========= Internal: Lean-IMT updates =========

    function _applyDelta(address account, int256 delta, uint256[] calldata siblings) internal {
        if (delta == 0) return;

        uint88 oldW = weightOf[account];
        uint88 newW;

        if (delta > 0) {
            unchecked {
                uint256 tmp = uint256(oldW) + uint256(int256(delta));
                if (tmp > type(uint88).max) revert WeightOverflow();
                newW = uint88(tmp);
            }
        } else {
            uint256 dec = uint256(-delta);
            if (dec > oldW) revert WeightUnderflow();
            unchecked {
                newW = uint88(uint256(oldW) - dec);
            }
        }

        uint256 oldLeaf = _packLeaf(account, oldW);
        uint256 newLeaf = _packLeaf(account, newW);

        // Defensive range check for BN254 scalar field
        if (oldLeaf >= SNARK_SCALAR_FIELD || newLeaf >= SNARK_SCALAR_FIELD) revert WeightOverflow();

        if (oldW == 0 && newW > 0) {
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

        weightOf[account] = newW;
        emit WeightChanged(account, oldW, newW);
    }

    /// @dev Update root history after tree modifications
    function _updateRootHistory() internal {
        uint256 newRoot = _census._root();
        rootBlockNumbers[newRoot] = block.number;
        emit CensusRootUpdated(newRoot, block.number);
    }

    // ========= Internal helpers =========

    /// @dev Process delegation updates and return aggregated data
    function _processDelegationUpdates(address to, uint256 nftIndex, uint256[] calldata ids)
        internal
        returns (address[] memory fromAddrs, uint256[] memory fromCounts, uint256 unique, uint256 added)
    {
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
            if (!_owns(nftIndex, msg.sender, id)) revert NotTokenOwner(id);

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
            _applyDelta(acct, -int256(fromCounts[k]), fromProofs[pIdx].siblings);
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

    /// @dev Process delegations for the delegate function, handling inherited delegations
    function _processDelegations(address to, uint256 nftIndex, uint256[] calldata ids)
        internal
        returns (
            address[] memory inheritedDelegates,
            uint256[] memory inheritedCounts,
            uint256 uniqueInherited,
            uint256 added
        )
    {
        inheritedDelegates = new address[](ids.length);
        inheritedCounts = new uint256[](ids.length);
        uint256[] memory addedIds = new uint256[](ids.length);

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            if (!_owns(nftIndex, msg.sender, id)) revert NotTokenOwner(id);

            bytes32 key = _tokenKey(nftIndex, id);
            address existingDelegate = tokenDelegate[key];

            // If already delegated, must use updateDelegation or undelegate first
            if (existingDelegate != address(0)) {
                // Simplified: treat all existing delegations the same
                // Owner must undelegate first before re-delegating
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

    /// @dev Apply weight decreases for inherited delegations using proofs
    function _applyInheritedProofs(
        address[] memory inheritedDelegates,
        uint256[] memory inheritedCounts,
        uint256 uniqueInherited,
        ProofInput[] calldata fromProofs
    ) internal {
        for (uint256 k = 0; k < uniqueInherited; ++k) {
            address acct = inheritedDelegates[k];
            uint256 pIdx = _indexOfProof(fromProofs, acct);
            if (pIdx == type(uint256).max) revert ProofRequired(acct);
            _applyDelta(acct, -int256(inheritedCounts[k]), fromProofs[pIdx].siblings);
        }
    }
}
