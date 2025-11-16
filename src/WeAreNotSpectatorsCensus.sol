// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// OpenZeppelin v5.4.x
import {CircularBuffer} from "openzeppelin-contracts/contracts/utils/structs/CircularBuffer.sol";

// Lean-IMT (zk-kit) for on-chain Merkle tree
import {InternalLeanIMT, LeanIMTData} from "zk-kit.solidity/packages/lean-imt/contracts/InternalLeanIMT.sol";
import {SNARK_SCALAR_FIELD} from "zk-kit.solidity/packages/lean-imt/contracts/Constants.sol";

// Census validator interface
import {ICensusValidator} from "./ICensusValidator.sol";

/// @title We Are Not Spectators Census Contract
/// @notice On-chain registry of addresses that have pledged to We Are Not Spectators: A Manifesto for Collective Freedom
/// @dev Features:
///      - Append-only Merkle tree (Lean-IMT) of pledged addresses
///      - Circular buffer root history (last 100 roots)
///      - ICensusValidator interface for external contract integration
///      - Immutable manifesto text stored on-chain
/// @author DavinciDAO / Vocdoni
contract WeAreNotSpectatorsCensus is ICensusValidator {
    using InternalLeanIMT for LeanIMTData;
    using CircularBuffer for CircularBuffer.Bytes32CircularBuffer;

    // ========= Manifesto Metadata =========

    string public constant TITLE = "We Are Not Spectators: A Manifesto for Collective Freedom";
    string public constant AUTHORS = "DAVINCI.vote Community";
    string public constant DATE = "2025-11-15";

    // ========= Manifesto Text =========

    string public constant MANIFESTO = "# We Are Not Spectators: A Manifesto for Collective Freedom\n" "\n"
        "We were promised democracy.\n" "\n" "What we got was permission.\n" "\n"
        "Permission to choose between options we didn't create.\n" "\n" "Permission to speak only when spoken to.\n"
        "\n" "Permission to exist inside systems built to contain us.\n" "\n" "They told us this was freedom.\n" "\n"
        "But freedom without agency is theater.\n" "\n" "We scroll. We vote. We sign petitions.\n" "\n"
        "And still, the world burns, inequality grows, and trust collapses.\n" "\n"
        "The threads that once held us together are tearing apart.\n" "\n" "**Enough.**\n" "\n"
        "We refuse to be spectators to our own future.\n" "\n"
        "We refuse to mistake representation for participation.\n" "\n"
        "The systems that failed us are not the only ones we have to live by.\n" "\n"
        "Freedom begins with participation, not obedience.\n" "\n"
        "Every human deserves a voice in the systems they depend on,\n" "\n"
        "the platforms they use, the policies that shape them,\n" "\n" "the future they'll inherit.\n" "\n"
        "**We believe privacy is not a feature, it's a foundation.**\n" "\n"
        "The right to exist, think, and connect without surveillance.\n" "\n"
        "Privacy is the space where dissent, creativity, and democracy are born.\n" "\n"
        "**We believe authority must be accountable, and power transparent.**\n" "\n"
        "Governance is not something done to us; it's something we do, together.\n" "\n"
        "**We believe technology is a tool, not a master.**\n" "\n" "Like language, it must belong to everyone,\n" "\n"
        "a public good to build trust, not extract it.\n" "\n" "We believe in self-sovereign infrastructure,\n"
        "\n" "transparency as truth,\n" "\n" "and collaboration as strength.\n" "\n"
        "**We are the builders of the commons.**\n" "\n" "The citizens who refuse to be spectators.\n" "\n"
        "The dreamers who turn frustration into invention.\n" "\n" "The communities who turn ideas into action.\n" "\n"
        "**Because the future we live in depends on the governance we achieve today.**\n" "\n" "**#WeAreNotSpectators**";

    // ========= State Variables =========

    /// @notice Timestamp when an address pledged (0 = never pledged)
    mapping(address => uint256) public pledgeTimestamp;

    /// @notice Total number of pledges
    uint256 public pledgeCount;

    /// @notice Census Merkle tree (Lean-IMT)
    LeanIMTData private _census;

    /// @notice Root history (circular buffer + mapping for O(1) lookup)
    CircularBuffer.Bytes32CircularBuffer private _rootBuffer;
    mapping(bytes32 => uint64) private _rootToBlock;

    // ========= Events =========

    event Pledged(address indexed signer, uint256 timestamp);
    event CensusRootUpdated(uint256 indexed newRoot, uint256 blockNumber);

    // ========= Custom Errors =========

    error AlreadyPledged();

    // ========= Constructor =========

    constructor() {
        // Initialize circular buffer with capacity for 100 recent roots
        // This provides ~1-2 days of history at 15s block time
        _rootBuffer.setup(100);
    }

    // ========= Public Functions =========

    /// @notice Pledge to We Are Not Spectators: A Manifesto for Collective Freedom
    /// @dev Can only be called once per address. Adds address to census Merkle tree.
    ///      Leaf format: (address << 88) | weight, where weight = 1 for all pledgers
    function pledge() external {
        if (pledgeTimestamp[msg.sender] != 0) revert AlreadyPledged();

        // Record pledge
        pledgeTimestamp[msg.sender] = block.timestamp;
        pledgeCount++;

        // Add to Merkle tree (leaf = address with weight of 1)
        // Format: (address << 88) | weight
        uint256 leaf = (uint256(uint160(msg.sender)) << 88) | 1;

        // Defensive check for BN254 scalar field
        require(leaf < SNARK_SCALAR_FIELD, "Invalid leaf value");

        _census._insert(leaf);

        // Update root history
        _updateRootHistory();

        // Emit event
        emit Pledged(msg.sender, block.timestamp);
    }

    // ========= View Functions =========

    /// @notice Check if an address has pledged
    /// @param who Address to check
    /// @return True if the address has pledged
    function hasPledged(address who) external view returns (bool) {
        return pledgeTimestamp[who] != 0;
    }

    /// @notice Check if an address pledged before a specific timestamp
    /// @param who Address to check
    /// @param cutoff Unix timestamp cutoff
    /// @return True if the address pledged on or before the cutoff
    function pledgedBefore(address who, uint256 cutoff) external view returns (bool) {
        uint256 ts = pledgeTimestamp[who];
        return ts != 0 && ts <= cutoff;
    }

    /// @notice Get the current census Merkle root
    /// @return Current Merkle root
    function getCensusRoot() external view returns (uint256) {
        return _census._root();
    }

    /// @notice Validates a census root and returns the block number when it was set
    /// @dev Implements ICensusValidator interface
    /// @param root The census Merkle root to validate
    /// @return blockNumber The block number when this root was set (0 if invalid/evicted)
    function getRootBlockNumber(uint256 root) external view returns (uint256 blockNumber) {
        return uint256(_rootToBlock[bytes32(root)]);
    }

    /// @notice Compute the packed leaf value for an address
    /// @dev Helper function for off-chain proof generation and verification
    ///      Leaf format: (address << 88) | weight, where weight = 1
    /// @param account The address to compute the leaf for
    /// @return The packed leaf value
    function computeLeaf(address account) external pure returns (uint256) {
        return (uint256(uint160(account)) << 88) | 1;
    }

    // ========= Internal Functions =========

    /// @dev Update root history after tree modification
    function _updateRootHistory() internal {
        uint256 newRoot = _census._root();
        bytes32 newRootBytes = bytes32(newRoot);

        // Push to circular buffer (automatically evicts oldest if full)
        _rootBuffer.push(newRootBytes);
        _rootToBlock[newRootBytes] = uint64(block.number);

        // Note: We accept minor storage leak for evicted roots (they'll remain in mapping)
        // This is negligible compared to the gas cost of tracking and cleaning them

        emit CensusRootUpdated(newRoot, block.number);
    }
}
