// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {CircularBuffer} from "openzeppelin-contracts/contracts/utils/structs/CircularBuffer.sol";
import {InternalLeanIMT, LeanIMTData} from "zk-kit.solidity/packages/lean-imt/contracts/InternalLeanIMT.sol";
import {SNARK_SCALAR_FIELD} from "zk-kit.solidity/packages/lean-imt/contracts/Constants.sol";
import {ICensusValidator} from "./ICensusValidator.sol";
import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {SelfStructs} from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";
import {SelfUtils} from "@selfxyz/contracts/contracts/libraries/SelfUtils.sol";
import {IIdentityVerificationHubV2} from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";

/// @title Manifesto Census Contract
/// @notice Self-gated registry of addresses that have pledged to the manifesto
/// @dev Verification is enforced through the Self IdentityVerificationHub V2 contracts on Celo
contract ManifestoCensus is ICensusValidator, SelfVerificationRoot {
    using InternalLeanIMT for LeanIMTData;
    using CircularBuffer for CircularBuffer.Bytes32CircularBuffer;

    // ========= Manifesto Metadata =========

    struct ManifestoMetadata {
        string title;
        string authors;
        string date;
        string manifestoText;
    }

    string public TITLE;
    string public AUTHORS;
    string public DATE;
    string public MANIFESTO;

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

    /// @notice Verification configuration stored on-chain for transparency
    SelfStructs.VerificationConfigV2 public verificationConfig;

    /// @notice Config identifier registered in the Self hub
    bytes32 public verificationConfigId;

    /// @notice Tracks used nullifiers to guard against replay attempts
    mapping(uint256 => bool) public nullifierUsed;

    /// @notice Allowed document types (attestation identifiers)
    mapping(bytes32 => bool) public allowedAttestation;
    bytes32[] private _attestationAllowListValues;

    /// @notice Stores forbidden country codes for inspection
    string[] private _forbiddenCountries;

    /// @notice Human-readable scope string used during deployment
    string public scopeLabel;

    /// @notice Optional nationality restriction (ISO Alpha-3 uppercase)
    bytes3 public requiredNationality;

    // ========= Events =========

    event Pledged(address indexed signer, uint256 timestamp);
    event CensusRootUpdated(uint256 indexed newRoot, uint256 blockNumber);
    event IdentityVerified(address indexed signer, uint256 nullifier, bytes32 attestationId);

    // ========= Custom Errors =========

    error AlreadyPledged();
    error NullifierAlreadyUsed();
    error InvalidSigner();
    error UnsupportedAttestation(bytes32 attestationId);
    error SelfVerificationOnly();
    error NationalityMismatch(bytes3 required, bytes3 provided);
    error InvalidNationalityString();
    error NoAttestationTypesProvided();

    // ========= Constructor =========

    /**
     * @param identityVerificationHubV2Address Address of the Self IdentityVerificationHub V2
     * @param scopeSeed Scope seed used to derive the scope inside SelfVerificationRoot
     * @param unformattedVerificationConfig Unformatted verification config (min age, forbidden countries, ofac)
     * @param attestationAllowList List of allowed attestation IDs (document types)
     */
    constructor(
        address identityVerificationHubV2Address,
        string memory scopeSeed,
        SelfUtils.UnformattedVerificationConfigV2 memory unformattedVerificationConfig,
        bytes32[] memory attestationAllowList,
        string memory requiredNationalityInput,
        ManifestoMetadata memory metadata
    ) SelfVerificationRoot(identityVerificationHubV2Address, scopeSeed) {
        if (attestationAllowList.length == 0) {
            revert NoAttestationTypesProvided();
        }

        // Initialize circular buffer with capacity for 100 recent roots
        _rootBuffer.setup(100);

        scopeLabel = scopeSeed;
        verificationConfig = SelfUtils.formatVerificationConfigV2(unformattedVerificationConfig);
        verificationConfigId = IIdentityVerificationHubV2(identityVerificationHubV2Address).setVerificationConfigV2(
            verificationConfig
        );

        for (uint256 i = 0; i < attestationAllowList.length; i++) {
            bytes32 attestationId = attestationAllowList[i];
            allowedAttestation[attestationId] = true;
            _attestationAllowListValues.push(attestationId);
        }

        if (unformattedVerificationConfig.forbiddenCountries.length > 0) {
            for (uint256 i = 0; i < unformattedVerificationConfig.forbiddenCountries.length; i++) {
                _forbiddenCountries.push(unformattedVerificationConfig.forbiddenCountries[i]);
            }
        }

        if (bytes(requiredNationalityInput).length == 0) {
            requiredNationality = bytes3(0);
        } else {
            requiredNationality = _normalizeCountryCode(requiredNationalityInput);
        }

        TITLE = metadata.title;
        AUTHORS = metadata.authors;
        DATE = metadata.date;
        MANIFESTO = metadata.manifestoText;
    }

    // ========= Public Functions =========

    /// @notice External pledge function is disabled; all pledges must go through Self verification
    function pledge() external pure {
        revert SelfVerificationOnly();
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

    /// @notice View helper exposing whether an attestation ID is allowed
    function isAttestationAllowed(bytes32 attestationId) external view returns (bool) {
        return allowedAttestation[attestationId];
    }

    /// @notice Exposes the hub address for off-chain tooling
    function identityVerificationHub() external view returns (address) {
        return address(_identityVerificationHubV2);
    }

    /// @notice Returns the verification rules enforced by this deployment
    function getVerificationParameters()
        external
        view
        returns (
            uint256 minAge,
            bool minAgeEnabled,
            bool ofacEnabled,
            string[] memory forbiddenCountries,
            bytes3 nationality,
            bytes32[] memory attestationTypes
        )
    {
        SelfStructs.VerificationConfigV2 memory config = verificationConfig;
        minAge = config.olderThan;
        minAgeEnabled = config.olderThanEnabled;
        ofacEnabled = config.ofacEnabled[0];
        nationality = requiredNationality;

        forbiddenCountries = new string[](_forbiddenCountries.length);
        for (uint256 i = 0; i < _forbiddenCountries.length; i++) {
            forbiddenCountries[i] = _forbiddenCountries[i];
        }

        attestationTypes = new bytes32[](_attestationAllowListValues.length);
        for (uint256 i = 0; i < _attestationAllowListValues.length; i++) {
            attestationTypes[i] = _attestationAllowListValues[i];
        }
    }

    // ========= Self Integration Overrides =========

    /// @inheritdoc SelfVerificationRoot
    function getConfigId(
        bytes32,
        bytes32,
        bytes memory
    ) public view override returns (bytes32) {
        return verificationConfigId;
    }

    /// @inheritdoc SelfVerificationRoot
    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
        bytes memory /* userData */
    ) internal override {
        if (!allowedAttestation[output.attestationId]) {
            revert UnsupportedAttestation(output.attestationId);
        }

        uint256 nullifier = output.nullifier;
        if (nullifierUsed[nullifier]) {
            revert NullifierAlreadyUsed();
        }

        address signer = address(uint160(output.userIdentifier));
        if (signer == address(0)) {
            revert InvalidSigner();
        }

        if (requiredNationality != bytes3(0)) {
            bytes3 providedNationality = _normalizeCountryCode(output.nationality);
            if (providedNationality != requiredNationality) {
                revert NationalityMismatch(requiredNationality, providedNationality);
            }
        }

        if (pledgeTimestamp[signer] != 0) {
            revert AlreadyPledged();
        }

        nullifierUsed[nullifier] = true;
        pledgeTimestamp[signer] = block.timestamp;
        pledgeCount++;

        uint256 leaf = (uint256(uint160(signer)) << 88) | 1;
        require(leaf < SNARK_SCALAR_FIELD, "Invalid leaf value");

        _census._insert(leaf);
        _updateRootHistory();

        emit IdentityVerified(signer, nullifier, output.attestationId);
        emit Pledged(signer, block.timestamp);
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

    /// @dev Normalizes a 3-letter country code to uppercase bytes3 representation
    function _normalizeCountryCode(string memory code) internal pure returns (bytes3 result) {
        bytes memory raw = bytes(code);
        if (raw.length != 3) revert InvalidNationalityString();

        bytes memory normalized = new bytes(3);
        for (uint256 i = 0; i < 3; i++) {
            uint8 charCode = uint8(raw[i]);
            if (charCode >= 97 && charCode <= 122) {
                charCode -= 32;
            }
            if (charCode < 65 || charCode > 90) revert InvalidNationalityString();
            normalized[i] = bytes1(charCode);
        }

        assembly {
            result := mload(add(normalized, 32))
        }
    }
}
