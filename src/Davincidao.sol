// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// OpenZeppelin v5.4.x interfaces
import {IERC721} from "openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";

// Lean-IMT (zk-kit)
import {InternalLeanIMT, LeanIMTData} from "zk-kit.solidity/packages/lean-imt/contracts/InternalLeanIMT.sol";
import {SNARK_SCALAR_FIELD} from "zk-kit.solidity/packages/lean-imt/contracts/Constants.sol";

/// @title DavinciDaoCensus
/// @notice Maintains a Merkle-root ("censusRoot") over (address||weight) leaves where
///         weight accumulates delegated NFTs across ERC-721 collections.
/// @dev    Uses Lean-IMT. _insert requires no proof; _update/_remove require Merkle "siblings".
contract DavinciDaoCensus {
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

    // --- census tree ---
    LeanIMTData private _census;
    mapping(address => uint88) public weightOf; // 11-byte weights

    // --- reverse index: IMT index → address ---
    mapping(uint256 => address) public indexAccount; // index → account (0 if empty)

    // --- delegation index ---
    // Delegation persists per (collection index, tokenId), regardless of current owner.
    mapping(bytes32 => address) public tokenDelegate;

    // Track which tokenIds a given owner has delegated for a specific collection.
    // We keep this for UX (getNFTids); it is NOT a source of truth for eligibility.
    mapping(address => mapping(uint256 => mapping(uint256 => bool))) private _ownerDelegated; // owner => nftIndex => tokenId => delegated

    // ========= Events =========
    event Delegated(address indexed owner, address indexed to, uint256 indexed nftIndex, uint256 tokenId);
    event Undelegated(address indexed owner, address indexed from, uint256 indexed nftIndex, uint256 tokenId);
    event WeightChanged(address indexed account, uint88 previousWeight, uint88 newWeight);
    event CensusRootUpdated(uint256 newRoot);

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

    /// @notice Returns token IDs that `msg.sender` has delegated for `nftIndex`
    ///         and **still currently owns** (i.e., ERC-721 `ownerOf`).
    function getNFTids(uint256 nftIndex, uint256[] calldata candidateIds) external view returns (uint256[] memory) {
        _checkIndex(nftIndex);
        // Filter the provided candidates (client can cache their list to avoid storage-heavy on-chain sets).
        uint256 count;
        for (uint256 i = 0; i < candidateIds.length; ++i) {
            uint256 id = candidateIds[i];
            if (_ownerDelegated[msg.sender][nftIndex][id] && _owns(nftIndex, msg.sender, id)) {
                unchecked {
                    ++count;
                }
            }
        }
        uint256[] memory out = new uint256[](count);
        uint256 k;
        for (uint256 i = 0; i < candidateIds.length; ++i) {
            uint256 id = candidateIds[i];
            if (_ownerDelegated[msg.sender][nftIndex][id] && _owns(nftIndex, msg.sender, id)) {
                out[k++] = id;
            }
        }
        return out;
    }

    /// @notice Helper to compute the packed `(address||weight)` leaf for `account`.
    function computeLeaf(address account) external view returns (uint256) {
        return _packLeaf(account, weightOf[account]);
    }

    /// @notice Returns the account at the given IMT index, or address(0) if empty.
    /// @param index The 0-based index in the IMT tree.
    /// @return The address occupying that position, or address(0) if the position is empty.
    function getAccountAt(uint256 index) external view returns (address) {
        return indexAccount[index];
    }

    // ========= Mutating API =========
    // As with Lean-IMT: first insertion needs no proof; updates/removals need Merkle siblings. :contentReference[oaicite:3]{index=3}

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
        emit CensusRootUpdated(_census._root());
    }

    /// @notice Undelegate voting power for given token IDs (caller must be current owner).
    /// @param nftIndex Index into `collections`.
    /// @param ids      Token IDs to revoke delegation for.
    /// @param proofs   Proofs for each *affected* delegate address (unique and batched).
    function undelegate(uint256 nftIndex, uint256[] calldata ids, ProofInput[] calldata proofs) external {
        _checkIndex(nftIndex);

        // Aggregate decrements per delegate.
        address[] memory delAddrs = new address[](ids.length);
        uint256[] memory counts = new uint256[](ids.length);
        uint256 unique;

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            if (!_owns(nftIndex, msg.sender, id)) revert NotTokenOwner(id);

            bytes32 key = _tokenKey(nftIndex, id);
            address del = tokenDelegate[key];
            if (del == address(0)) revert NotDelegated(id);

            tokenDelegate[key] = address(0);
            _ownerDelegated[msg.sender][nftIndex][id] = false;

            uint256 j = _indexOf(delAddrs, unique, del);
            if (j == type(uint256).max) {
                delAddrs[unique] = del;
                counts[unique] = 1;
                unchecked {
                    ++unique;
                }
            } else {
                unchecked {
                    ++counts[j];
                }
            }
            emit Undelegated(msg.sender, del, nftIndex, id);
        }

        for (uint256 k = 0; k < unique; ++k) {
            address acct = delAddrs[k];
            uint256 pIdx = _indexOfProof(proofs, acct);
            if (pIdx == type(uint256).max) revert ProofRequired(acct);
            _applyDelta(acct, -int256(counts[k]), proofs[pIdx].siblings);
        }

        emit CensusRootUpdated(_census._root());
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
            emit CensusRootUpdated(_census._root());
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

        // Defensive range check for BN254 scalar field (Lean-IMT also enforces this invariant).
        if (oldLeaf >= SNARK_SCALAR_FIELD || newLeaf >= SNARK_SCALAR_FIELD) revert WeightOverflow();

        if (oldW == 0 && newW > 0) {
            // A) First insertion (weight 0 → >0)
            _census._insert(newLeaf); // no proof needed
            uint256 idx = _census._indexOf(newLeaf); // get the 0-based index
            indexAccount[idx] = account; // set reverse index
        } else if (newW == 0) {
            // C) Removal (weight >0 → 0)
            // Note: For single-node tree, siblings can be empty
            uint256 idx = _census._indexOf(oldLeaf); // capture index before removal
            _census._remove(oldLeaf, siblings);
            indexAccount[idx] = address(0); // clear reverse index
        } else {
            // B) Weight update (weight >0 → >0)
            if (siblings.length == 0) revert ProofRequired(account);
            _census._update(oldLeaf, newLeaf, siblings);
            // Do not touch indexAccount - position unchanged by design
        }

        weightOf[account] = newW;
        emit WeightChanged(account, oldW, newW);
    }

    // ========= Internal helpers =========

    /// @dev Process delegation updates and return aggregated data
    function _processDelegationUpdates(address to, uint256 nftIndex, uint256[] calldata ids)
        internal
        returns (address[] memory fromAddrs, uint256[] memory fromCounts, uint256 unique, uint256 added)
    {
        fromAddrs = new address[](ids.length);
        fromCounts = new uint256[](ids.length);

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            if (!_isValidTokenId(nftIndex, id)) revert InvalidTokenId(id);
            if (!_owns(nftIndex, msg.sender, id)) revert NotTokenOwner(id);

            bytes32 key = _tokenKey(nftIndex, id);
            address prev = tokenDelegate[key];

            if (prev == to) continue; // no change for this id

            if (prev != address(0)) {
                uint256 j = _indexOf(fromAddrs, unique, prev);
                if (j == type(uint256).max) {
                    fromAddrs[unique] = prev;
                    fromCounts[unique] = 1;
                    unchecked {
                        ++unique;
                    }
                } else {
                    unchecked {
                        ++fromCounts[j];
                    }
                }
                emit Undelegated(msg.sender, prev, nftIndex, id);
            }

            tokenDelegate[key] = to;
            _ownerDelegated[msg.sender][nftIndex][id] = true;
            unchecked {
                ++added;
            }

            emit Delegated(msg.sender, to, nftIndex, id);
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

    /// @dev Validates that a token ID is valid for the given collection.
    ///      For ERC721: always returns true (any token ID can be delegated if owned).
    function _isValidTokenId(uint256, /* nftIndex */ uint256 /* tokenId */ ) internal pure returns (bool) {
        // For ERC721, any token ID is valid if it exists (ownership check handles existence)
        return true;
    }

    function _tokenKey(uint256 nftIndex, uint256 tokenId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(nftIndex, tokenId));
    }

    /// @dev Pack (address || weight) → uint256 with address in top 20 bytes and weight in low 11 bytes.
    function _packLeaf(address account, uint88 weight) internal pure returns (uint256) {
        return (uint256(uint160(account)) << 88) | uint256(weight);
    }

    /// @dev Ownership check for ERC721 (NFT semantics).
    function _owns(uint256 nftIndex, address owner, uint256 tokenId) internal view returns (bool) {
        Collection memory c = collections[nftIndex];
        return IERC721(c.token).ownerOf(tokenId) == owner; // reverts if tokenId doesn't exist
    }

    /// @dev Linear search utilities for small batches (keeps storage light).
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

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            if (!_isValidTokenId(nftIndex, id)) revert InvalidTokenId(id);
            if (!_owns(nftIndex, msg.sender, id)) revert NotTokenOwner(id);

            bytes32 key = _tokenKey(nftIndex, id);
            address existingDelegate = tokenDelegate[key];

            // Check if this is an inherited delegation (token was delegated by previous owner)
            if (existingDelegate != address(0)) {
                // If the current owner previously delegated this token, it's a double delegation error
                if (_ownerDelegated[msg.sender][nftIndex][id]) {
                    revert AlreadyDelegated(id);
                }

                // This is an inherited delegation - track it for clearing
                uint256 j = _indexOf(inheritedDelegates, uniqueInherited, existingDelegate);
                if (j == type(uint256).max) {
                    inheritedDelegates[uniqueInherited] = existingDelegate;
                    inheritedCounts[uniqueInherited] = 1;
                    unchecked {
                        ++uniqueInherited;
                    }
                } else {
                    unchecked {
                        ++inheritedCounts[j];
                    }
                }

                // Emit undelegation event for the inherited delegation
                emit Undelegated(msg.sender, existingDelegate, nftIndex, id);
            }

            tokenDelegate[key] = to;
            _ownerDelegated[msg.sender][nftIndex][id] = true;
            unchecked {
                ++added;
            }

            emit Delegated(msg.sender, to, nftIndex, id);
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
